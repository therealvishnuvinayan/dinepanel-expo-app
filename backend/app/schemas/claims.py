from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.merchant import MerchantBillResponse
from app.schemas.restaurants import RestaurantResponse
from app.schemas.rewards import RewardTransactionResponse
from app.schemas.common import Money, Percentage


class ClaimTokenRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    token: str = Field(min_length=40, max_length=200)

    @field_validator("token")
    @classmethod
    def validate_token(cls, value: str) -> str:
        token = value.strip()
        if not token or any(character not in "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_" for character in token):
            raise ValueError("Claim token is invalid")
        return token


class ClaimPreviewResponse(BaseModel):
    bill: MerchantBillResponse
    restaurant: RestaurantResponse
    reward_percentage: Percentage
    reward_amount: Money
    expires_at: datetime


class TokenClaimResponse(BaseModel):
    reward_amount: Money
    transaction: RewardTransactionResponse
    updated_balance: Money
    restaurant: RestaurantResponse
    bill: MerchantBillResponse
