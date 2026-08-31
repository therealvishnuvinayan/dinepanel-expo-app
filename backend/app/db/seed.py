from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models import Restaurant, RestaurantStaff, StaffRole, User


GREEN_CHILLI_MANAGER_PHONE = "+971500000001"


RESTAURANTS = [
    {
        "name": "Green Chilli",
        "slug": "green-chilli",
        "description": "Contemporary Indian plates, warm hospitality and a dining room made for unhurried evenings.",
        "cuisine": "Indian",
        "reward_percentage": Decimal("2.00"),
        "image_url": None,
        "address": "Sheikh Mohammed bin Rashid Boulevard, Downtown Dubai",
        "area": "Downtown Dubai",
        "city": "Dubai",
        "latitude": Decimal("25.197197"),
        "longitude": Decimal("55.274376"),
        "active": True,
    },
    {
        "name": "Operation: Falafel",
        "slug": "operation-falafel",
        "description": "Freshly prepared street-food favourites with a modern, distinctly local point of view.",
        "cuisine": "Middle Eastern",
        "reward_percentage": Decimal("10.00"),
        "image_url": None,
        "address": "Bay Avenue, Business Bay",
        "area": "Business Bay",
        "city": "Dubai",
        "latitude": Decimal("25.185147"),
        "longitude": Decimal("55.263043"),
        "active": True,
    },
    {
        "name": "Brunch & Cake",
        "slug": "brunch-and-cake",
        "description": "Generous all-day brunch plates served in a bright, relaxed space with plenty of character.",
        "cuisine": "Cafe",
        "reward_percentage": Decimal("5.00"),
        "image_url": None,
        "address": "The Pointe, Palm Jumeirah",
        "area": "Palm Jumeirah",
        "city": "Dubai",
        "latitude": Decimal("25.140872"),
        "longitude": Decimal("55.122280"),
        "active": True,
    },
    {
        "name": "Reif Japanese Kushiyaki",
        "slug": "reif-japanese-kushiyaki",
        "description": "Inventive kushiyaki and Japanese comfort food in an intimate, understated setting.",
        "cuisine": "Japanese",
        "reward_percentage": Decimal("3.00"),
        "image_url": None,
        "address": "Dar Wasl Mall, Al Wasl Road",
        "area": "Al Wasl",
        "city": "Dubai",
        "latitude": Decimal("25.224841"),
        "longitude": Decimal("55.260395"),
        "active": True,
    },
]


def seed_restaurants(db: Session) -> int:
    changed = 0
    for values in RESTAURANTS:
        restaurant = db.scalar(select(Restaurant).where(Restaurant.slug == values["slug"]))
        if restaurant is None:
            db.add(Restaurant(**values))
        else:
            for key, value in values.items():
                setattr(restaurant, key, value)
        changed += 1
    db.commit()
    return changed


def seed_merchant_staff(db: Session) -> RestaurantStaff:
    restaurant = db.scalar(select(Restaurant).where(Restaurant.slug == "green-chilli"))
    if restaurant is None:
        raise RuntimeError("Seed Green Chilli before its merchant staff")

    user = db.scalar(select(User).where(User.phone == GREEN_CHILLI_MANAGER_PHONE))
    if user is None:
        user = User(phone=GREEN_CHILLI_MANAGER_PHONE, name="Green Chilli Manager")
        db.add(user)
        db.flush()
    else:
        user.name = "Green Chilli Manager"

    membership = db.scalar(
        select(RestaurantStaff).where(
            RestaurantStaff.user_id == user.id,
            RestaurantStaff.restaurant_id == restaurant.id,
        )
    )
    if membership is None:
        membership = RestaurantStaff(
            user_id=user.id,
            restaurant_id=restaurant.id,
            role=StaffRole.MANAGER,
            is_active=True,
        )
        db.add(membership)
    else:
        membership.role = StaffRole.MANAGER
        membership.is_active = True
    db.commit()
    db.refresh(membership)
    return membership


def main() -> None:
    with SessionLocal() as db:
        changed = seed_restaurants(db)
        membership = seed_merchant_staff(db)
    print(
        f"Seeded {changed} restaurants and merchant manager "
        f"{GREEN_CHILLI_MANAGER_PHONE} ({membership.role.value})"
    )


if __name__ == "__main__":
    main()
