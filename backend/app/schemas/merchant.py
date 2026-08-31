from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models import BillClaimStatus, BillSource, StaffRole
from app.schemas.common import Money, Percentage
from app.schemas.restaurants import RestaurantResponse
from app.schemas.users import UserResponse


class StaffMembershipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    role: StaffRole
    is_active: bool
    restaurant: RestaurantResponse


class MerchantMeResponse(BaseModel):
    user: UserResponse
    memberships: list[StaffMembershipResponse]


class MerchantBillCreateRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    bill_number: str = Field(min_length=2, max_length=80)
    bill_amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)

    @field_validator("bill_number")
    @classmethod
    def normalize_bill_number(cls, value: str) -> str:
        normalized = value.strip().upper()
        if not normalized:
            raise ValueError("Bill number is required")
        if any(character not in "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_" for character in normalized):
            raise ValueError("Bill number may contain letters, numbers, hyphens, and underscores")
        return normalized


class MerchantBillResponse(BaseModel):
    id: UUID
    restaurant: RestaurantResponse
    bill_number: str
    bill_amount: Money
    bill_date: date
    reward_percentage: Percentage
    reward_amount: Money
    source: BillSource
    claim_status: BillClaimStatus
    created_at: datetime
    claimed_at: datetime | None


class ClaimTokenResponse(BaseModel):
    token: str
    claim_url: str
    expires_at: datetime


class MerchantBillCreateResponse(BaseModel):
    bill: MerchantBillResponse
    claim: ClaimTokenResponse


class MerchantBillPageResponse(BaseModel):
    items: list[MerchantBillResponse]
    total: int
    limit: int
    offset: int


class MerchantDashboardResponse(BaseModel):
    today_bills: int
    today_claimed_bills: int
    today_unclaimed_bills: int
    today_sales_tracked: Money
    today_rewards_issued: Money
    recent_bills: list[MerchantBillResponse]
