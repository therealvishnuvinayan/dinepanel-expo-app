from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.api.dependencies import CurrentUser, DbSession
from app.models import RewardTransaction
from app.schemas.rewards import BalanceResponse, RewardTransactionResponse
from app.services.rewards import calculate_balance


router = APIRouter(prefix="/rewards", tags=["rewards"])


@router.get("/balance", response_model=BalanceResponse)
def get_balance(db: DbSession, current_user: CurrentUser) -> BalanceResponse:
    return BalanceResponse(balance=calculate_balance(db, current_user.id))


@router.get("/transactions", response_model=list[RewardTransactionResponse])
def list_transactions(db: DbSession, current_user: CurrentUser) -> list[RewardTransaction]:
    return list(
        db.scalars(
            select(RewardTransaction)
            .options(joinedload(RewardTransaction.restaurant))
            .where(RewardTransaction.user_id == current_user.id)
            .order_by(RewardTransaction.created_at.desc(), RewardTransaction.id.desc())
        ).all()
    )


@router.get("/transactions/{transaction_id}", response_model=RewardTransactionResponse)
def get_transaction(
    transaction_id: UUID, db: DbSession, current_user: CurrentUser
) -> RewardTransaction:
    transaction = db.scalar(
        select(RewardTransaction)
        .options(joinedload(RewardTransaction.restaurant))
        .where(
            RewardTransaction.id == transaction_id,
            RewardTransaction.user_id == current_user.id,
        )
    )
    if transaction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Reward transaction not found"
        )
    return transaction
