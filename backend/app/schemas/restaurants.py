from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.common import Percentage


class RestaurantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    description: str
    cuisine: str
    reward_percentage: Percentage
    image_url: str | None
    address: str
    area: str
    city: str
    latitude: Decimal | None
    longitude: Decimal | None
    active: bool
    created_at: datetime
    updated_at: datetime
