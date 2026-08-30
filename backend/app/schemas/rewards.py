from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models import TransactionStatus, TransactionType
from app.schemas.common import Money
from app.schemas.restaurants import RestaurantResponse


class BalanceResponse(BaseModel):
    balance: Money
    currency: str = "AED"


class RewardTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    restaurant: RestaurantResponse | None
    bill_id: UUID | None
    type: TransactionType
    amount: Money
    status: TransactionStatus
    description: str
    created_at: datetime
