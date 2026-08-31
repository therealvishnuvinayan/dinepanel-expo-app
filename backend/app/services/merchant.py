from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models import (
    Bill,
    BillClaimStatus,
    BillClaimToken,
    BillSource,
    BillStatus,
    RestaurantStaff,
    RewardClaim,
)
from app.schemas.merchant import MerchantBillResponse
from app.services.claim_tokens import IssuedClaimToken, ensure_aware, issue_claim_token, utc_now
from app.services.rewards import calculate_reward, quantize_money


class MerchantBillError(ValueError):
    pass


class DuplicateMerchantBillError(MerchantBillError):
    pass


class MerchantBillNotFoundError(MerchantBillError):
    pass


class MerchantAccessError(MerchantBillError):
    pass


class MerchantBillNotRefreshableError(MerchantBillError):
    pass


@dataclass(frozen=True)
class CreatedMerchantBill:
    bill: Bill
    claim: IssuedClaimToken


def _is_duplicate_bill_error(exc: IntegrityError) -> bool:
    constraint_name = getattr(getattr(exc.orig, "diag", None), "constraint_name", None)
    sqlite_message = str(exc.orig).lower()
    return constraint_name == "uq_bills_restaurant_bill_number" or (
        "unique constraint failed" in sqlite_message
        and "bills.restaurant_id" in sqlite_message
        and "bills.bill_number" in sqlite_message
    )


def create_merchant_bill(
    db: Session,
    *,
    membership: RestaurantStaff,
    bill_number: str,
    bill_amount: Decimal,
) -> CreatedMerchantBill:
    if not membership.restaurant.active:
        raise MerchantBillError("Restaurant is not currently active")
    try:
        bill = Bill(
            restaurant_id=membership.restaurant_id,
            restaurant=membership.restaurant,
            created_by_staff_id=membership.id,
            bill_number=bill_number,
            amount=quantize_money(bill_amount),
            bill_date=date.today(),
            status=BillStatus.CLAIMABLE,
            source=BillSource.MERCHANT,
            claim_status=BillClaimStatus.UNCLAIMED,
        )
        db.add(bill)
        db.flush()
        claim = issue_claim_token(
            db, bill=bill, created_by_staff_id=membership.id
        )
        db.commit()
        db.refresh(bill)
        return CreatedMerchantBill(bill=bill, claim=claim)
    except IntegrityError as exc:
        db.rollback()
        if _is_duplicate_bill_error(exc):
            raise DuplicateMerchantBillError(
                "This bill number has already been added."
            ) from exc
        raise
    except Exception:
        db.rollback()
        raise


def get_merchant_bill(
    db: Session, *, bill_id: UUID, user_id: UUID
) -> tuple[Bill, RestaurantStaff]:
    bill = db.scalar(
        select(Bill)
        .options(
            joinedload(Bill.restaurant, innerjoin=True),
            joinedload(Bill.reward_claim),
        )
        .where(Bill.id == bill_id, Bill.source == BillSource.MERCHANT)
    )
    if bill is None:
        raise MerchantBillNotFoundError("Merchant bill not found")
    membership = db.scalar(
        select(RestaurantStaff).where(
            RestaurantStaff.user_id == user_id,
            RestaurantStaff.restaurant_id == bill.restaurant_id,
            RestaurantStaff.is_active.is_(True),
        )
    )
    if membership is None:
        raise MerchantAccessError("You do not have access to this bill")
    return bill, membership


def sync_expired_claim_status(db: Session, bill: Bill) -> bool:
    if bill.claim_status != BillClaimStatus.UNCLAIMED:
        return False
    latest_token = db.scalar(
        select(BillClaimToken)
        .where(
            BillClaimToken.bill_id == bill.id,
            BillClaimToken.invalidated_at.is_(None),
            BillClaimToken.consumed_at.is_(None),
        )
        .order_by(BillClaimToken.created_at.desc())
        .limit(1)
    )
    if latest_token is not None and ensure_aware(latest_token.expires_at) <= utc_now():
        bill.claim_status = BillClaimStatus.EXPIRED
        db.flush()
        return True
    return False


def refresh_merchant_claim_token(
    db: Session, *, bill: Bill, membership: RestaurantStaff
) -> IssuedClaimToken:
    try:
        locked_bill = db.scalar(
            select(Bill).where(Bill.id == bill.id).with_for_update()
        )
        if locked_bill is None or locked_bill.claim_status in {
            BillClaimStatus.CLAIMED,
            BillClaimStatus.CANCELLED,
        }:
            raise MerchantBillNotRefreshableError(
                "A claim code cannot be generated for this bill"
            )
        claim = issue_claim_token(
            db, bill=locked_bill, created_by_staff_id=membership.id
        )
        db.commit()
        return claim
    except Exception:
        db.rollback()
        raise


def merchant_bill_response(db: Session, bill: Bill) -> MerchantBillResponse:
    claimed_at = (
        bill.reward_claim.claimed_at
        if bill.reward_claim is not None
        else db.scalar(select(RewardClaim.claimed_at).where(RewardClaim.bill_id == bill.id))
    )
    return MerchantBillResponse(
        id=bill.id,
        restaurant=bill.restaurant,
        bill_number=bill.bill_number,
        bill_amount=bill.amount,
        bill_date=bill.bill_date,
        reward_percentage=bill.restaurant.reward_percentage,
        reward_amount=calculate_reward(bill.amount, bill.restaurant.reward_percentage),
        source=bill.source,
        claim_status=bill.claim_status,
        created_at=bill.created_at,
        claimed_at=claimed_at,
    )
