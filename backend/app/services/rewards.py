from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import RewardTransaction, TransactionStatus


MONEY_QUANTUM = Decimal("0.01")


def quantize_money(value: Decimal) -> Decimal:
    return value.quantize(MONEY_QUANTUM, rounding=ROUND_HALF_UP)


def calculate_reward(bill_amount: Decimal, reward_percentage: Decimal) -> Decimal:
    return quantize_money(bill_amount * reward_percentage / Decimal("100"))


def calculate_balance(db: Session, user_id: UUID) -> Decimal:
    total = db.scalar(
        select(func.coalesce(func.sum(RewardTransaction.amount), Decimal("0.00"))).where(
            RewardTransaction.user_id == user_id,
            RewardTransaction.status == TransactionStatus.COMPLETED,
        )
    )
    return quantize_money(Decimal(total or 0))
