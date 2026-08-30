from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.dependencies import DbSession
from app.models import Restaurant
from app.schemas.restaurants import RestaurantResponse


router = APIRouter(prefix="/restaurants", tags=["restaurants"])


@router.get("", response_model=list[RestaurantResponse])
def list_restaurants(db: DbSession) -> list[Restaurant]:
    return list(
        db.scalars(
            select(Restaurant).where(Restaurant.active.is_(True)).order_by(Restaurant.name.asc())
        ).all()
    )


@router.get("/{restaurant_id}", response_model=RestaurantResponse)
def get_restaurant(restaurant_id: UUID, db: DbSession) -> Restaurant:
    restaurant = db.get(Restaurant, restaurant_id)
    if restaurant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
    return restaurant
