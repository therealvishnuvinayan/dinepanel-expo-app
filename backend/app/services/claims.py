from dataclasses import dataclass
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models import (
    Bill,
    BillClaimStatus,
    BillStatus,
    RewardClaim,
    RewardTransaction,
    TransactionStatus,
    TransactionType,
)
from app.services.rewards import calculate_balance, calculate_reward


class ClaimError(ValueError):
    pass


class BillNotFoundError(ClaimError):
    pass


class InactiveRestaurantError(ClaimError):
    pass


class BillAlreadyClaimedError(ClaimError):
    pass


class InvalidBillError(ClaimError):
    pass


@dataclass(frozen=True)
class ClaimResult:
    reward_amount: Decimal
    transaction: RewardTransaction
    updated_balance: Decimal
    bill: Bill


def _raise_duplicate_for_integrity_error(exc: IntegrityError) -> None:
    constraint_name = getattr(getattr(exc.orig, "diag", None), "constraint_name", None)
    sqlite_message = str(exc.orig).lower()
    if constraint_name in {
        "uq_reward_claims_bill_id",
        "uq_reward_transactions_bill_id",
    } or ("unique constraint failed" in sqlite_message and "bill_id" in sqlite_message):
        raise BillAlreadyClaimedError("Bill has already been claimed") from exc
    raise exc


def apply_claim_to_locked_bill(
    db: Session, *, bill: Bill, user_id: UUID
) -> tuple[Decimal, RewardTransaction]:
    if not bill.restaurant.active:
        raise InactiveRestaurantError("Restaurant is not currently active")

    existing_claim = db.scalar(select(RewardClaim.id).where(RewardClaim.bill_id == bill.id))
    if (
        existing_claim is not None
        or bill.status == BillStatus.CLAIMED
        or bill.claim_status == BillClaimStatus.CLAIMED
    ):
        raise BillAlreadyClaimedError("Bill has already been claimed")
    if bill.claim_status == BillClaimStatus.CANCELLED:
        raise InvalidBillError("Bill has been cancelled")

    reward_amount = calculate_reward(bill.amount, bill.restaurant.reward_percentage)
    if reward_amount <= 0:
        raise InvalidBillError("Bill does not produce a claimable reward")

    transaction = RewardTransaction(
        user_id=user_id,
        restaurant_id=bill.restaurant_id,
        bill_id=bill.id,
        type=TransactionType.EARN,
        amount=reward_amount,
        status=TransactionStatus.COMPLETED,
        description=f"Reward earned at {bill.restaurant.name}",
    )
    db.add(transaction)
    db.flush()
    db.add(
        RewardClaim(
            user_id=user_id,
            restaurant_id=bill.restaurant_id,
            bill_id=bill.id,
            reward_transaction_id=transaction.id,
        )
    )
    bill.status = BillStatus.CLAIMED
    bill.claim_status = BillClaimStatus.CLAIMED
    db.flush()
    return reward_amount, transaction


def claim_bill(db: Session, *, bill_id: UUID, user_id: UUID) -> ClaimResult:
    try:
        bill = db.scalar(
            select(Bill)
            .options(joinedload(Bill.restaurant, innerjoin=True))
            .where(Bill.id == bill_id)
            .with_for_update()
        )
        if bill is None:
            raise BillNotFoundError("Bill not found")
        reward_amount, transaction = apply_claim_to_locked_bill(
            db, bill=bill, user_id=user_id
        )
        updated_balance = calculate_balance(db, user_id)
        db.commit()
        db.refresh(transaction)
        return ClaimResult(
            reward_amount=reward_amount,
            transaction=transaction,
            updated_balance=updated_balance,
            bill=bill,
        )
    except (
        BillNotFoundError,
        InactiveRestaurantError,
        BillAlreadyClaimedError,
        InvalidBillError,
    ):
        db.rollback()
        raise
    except IntegrityError as exc:
        db.rollback()
        _raise_duplicate_for_integrity_error(exc)
    except Exception:
        db.rollback()
        raise
