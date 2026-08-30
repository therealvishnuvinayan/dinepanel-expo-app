from fastapi import APIRouter

from app.api.dependencies import CurrentUser
from app.schemas.users import UserResponse


router = APIRouter(tags=["user"])


@router.get("/me", response_model=UserResponse)
def get_me(current_user: CurrentUser) -> UserResponse:
    return UserResponse.model_validate(current_user)
