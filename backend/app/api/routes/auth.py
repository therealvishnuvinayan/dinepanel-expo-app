import logging

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.dependencies import DbSession
from app.core.config import get_settings
from app.core.security import create_access_token
from app.models import User
from app.schemas.auth import AuthTokenResponse, OtpRequest, OtpRequestResponse, OtpVerifyRequest


router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)


@router.post("/request-otp", response_model=OtpRequestResponse)
def request_otp(payload: OtpRequest) -> OtpRequestResponse:
    settings = get_settings()
    if settings.is_development or settings.environment == "test":
        logger.info("Development OTP for %s: %s", payload.phone, settings.dev_otp)
    return OtpRequestResponse(message="If the number is valid, a verification code has been sent")


@router.post("/verify-otp", response_model=AuthTokenResponse)
def verify_otp(payload: OtpVerifyRequest, db: DbSession) -> AuthTokenResponse:
    settings = get_settings()
    if settings.environment == "production":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OTP verification provider is not configured",
        )
    if payload.otp != settings.dev_otp:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid verification code")

    user = db.scalar(select(User).where(User.phone == payload.phone))
    if user is None:
        user = User(phone=payload.phone)
        db.add(user)
        db.commit()
        db.refresh(user)

    return AuthTokenResponse(access_token=create_access_token(user.id), user=user)
