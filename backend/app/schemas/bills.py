from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import Money, Percentage
from app.schemas.restaurants import RestaurantResponse
from app.schemas.rewards import RewardTransactionResponse


class DemoBillRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    restaurant_id: UUID
    bill_amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)


class DemoBillResponse(BaseModel):
    id: UUID
    restaurant: RestaurantResponse
    bill_number: str
    bill_amount: Money
    bill_date: date
    reward_percentage: Percentage
    reward_amount: Money
    claimable: bool


class ClaimResponse(BaseModel):
    reward_amount: Money
    transaction: RewardTransactionResponse
    updated_balance: Money
