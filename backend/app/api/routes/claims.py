from fastapi import APIRouter, HTTPException, status

from app.api.dependencies import CurrentUser, DbSession
from app.schemas.claims import ClaimPreviewResponse, ClaimTokenRequest, TokenClaimResponse
from app.services.claim_tokens import (
    ConsumedClaimTokenError,
    ExpiredClaimTokenError,
    InvalidatedClaimTokenError,
    InvalidClaimTokenError,
    claim_with_token,
    resolve_claim_token,
)
from app.services.claims import (
    BillAlreadyClaimedError,
    InactiveRestaurantError,
    InvalidBillError,
)
from app.services.merchant import merchant_bill_response
from app.services.rewards import calculate_reward


router = APIRouter(prefix="/claims", tags=["claims"])


def _raise_token_http_error(error: Exception) -> None:
    if isinstance(error, InvalidClaimTokenError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    if isinstance(error, ExpiredClaimTokenError):
        raise HTTPException(status_code=status.HTTP_410_GONE, detail=str(error)) from error
    if isinstance(error, (ConsumedClaimTokenError, InvalidatedClaimTokenError, BillAlreadyClaimedError)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    if isinstance(error, InactiveRestaurantError):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    if isinstance(error, InvalidBillError):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(error)
        ) from error
    raise error


@router.post("/preview", response_model=ClaimPreviewResponse)
def preview_claim(
    payload: ClaimTokenRequest, db: DbSession, current_user: CurrentUser
) -> ClaimPreviewResponse:
    del current_user
    try:
        preview = resolve_claim_token(db, token=payload.token)
    except Exception as exc:
        _raise_token_http_error(exc)
        raise
    reward_amount = calculate_reward(
        preview.bill.amount, preview.bill.restaurant.reward_percentage
    )
    return ClaimPreviewResponse(
        bill=merchant_bill_response(db, preview.bill),
        restaurant=preview.bill.restaurant,
        reward_percentage=preview.bill.restaurant.reward_percentage,
        reward_amount=reward_amount,
        expires_at=preview.token_record.expires_at,
    )


@router.post("/claim", response_model=TokenClaimResponse)
def claim_token(
    payload: ClaimTokenRequest, db: DbSession, current_user: CurrentUser
) -> TokenClaimResponse:
    try:
        result = claim_with_token(db, token=payload.token, user_id=current_user.id)
    except Exception as exc:
        _raise_token_http_error(exc)
        raise
    return TokenClaimResponse(
        reward_amount=result.reward_amount,
        transaction=result.transaction,
        updated_balance=result.updated_balance,
        restaurant=result.bill.restaurant,
        bill=merchant_bill_response(db, result.bill),
    )
