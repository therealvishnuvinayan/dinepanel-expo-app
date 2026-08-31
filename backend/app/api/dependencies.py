from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.security import TokenValidationError, decode_access_token
from app.db.session import get_db
from app.models import RestaurantStaff, User


DbSession = Annotated[Session, Depends(get_db)]
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise unauthorized
    try:
        user_id = decode_access_token(credentials.credentials)
    except TokenValidationError as exc:
        raise unauthorized from exc
    user = db.get(User, user_id)
    if user is None:
        raise unauthorized
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_current_staff_memberships(db: DbSession, current_user: CurrentUser) -> list[RestaurantStaff]:
    memberships = list(
        db.scalars(
            select(RestaurantStaff)
            .options(joinedload(RestaurantStaff.restaurant))
            .where(
                RestaurantStaff.user_id == current_user.id,
                RestaurantStaff.is_active.is_(True),
            )
            .order_by(RestaurantStaff.created_at.asc())
        ).all()
    )
    if not memberships:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Merchant access required",
        )
    return memberships


CurrentStaffMemberships = Annotated[
    list[RestaurantStaff], Depends(get_current_staff_memberships)
]


def require_restaurant_access(
    restaurant_id: UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> RestaurantStaff:
    membership = db.scalar(
        select(RestaurantStaff)
        .options(joinedload(RestaurantStaff.restaurant))
        .where(
            RestaurantStaff.user_id == current_user.id,
            RestaurantStaff.restaurant_id == restaurant_id,
            RestaurantStaff.is_active.is_(True),
        )
    )
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this restaurant",
        )
    return membership


RestaurantAccess = Annotated[RestaurantStaff, Depends(require_restaurant_access)]
