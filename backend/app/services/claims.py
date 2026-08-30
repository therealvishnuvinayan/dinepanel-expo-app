from dataclasses import dataclass
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models import (
    Bill,
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
        if not bill.restaurant.active:
            raise InactiveRestaurantError("Restaurant is not currently active")

        existing_claim = db.scalar(select(RewardClaim.id).where(RewardClaim.bill_id == bill.id))
        if existing_claim is not None or bill.status == BillStatus.CLAIMED:
            raise BillAlreadyClaimedError("Bill has already been claimed")

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
        db.flush()

        updated_balance = calculate_balance(db, user_id)
        db.commit()
        db.refresh(transaction)
        return ClaimResult(
            reward_amount=reward_amount,
            transaction=transaction,
            updated_balance=updated_balance,
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
        constraint_name = getattr(getattr(exc.orig, "diag", None), "constraint_name", None)
        sqlite_message = str(exc.orig).lower()
        if constraint_name in {
            "uq_reward_claims_bill_id",
            "uq_reward_transactions_bill_id",
        } or ("unique constraint failed" in sqlite_message and "bill_id" in sqlite_message):
            raise BillAlreadyClaimedError("Bill has already been claimed") from exc
        raise
    except Exception:
        db.rollback()
        raise
