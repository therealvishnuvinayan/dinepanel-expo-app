from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.api.dependencies import CurrentUser, DbSession
from app.models import BillStatus, Restaurant
from app.schemas.bills import ClaimResponse, DemoBillRequest, DemoBillResponse
from app.services.bills import create_demo_bill, reward_preview
from app.services.claims import (
    BillAlreadyClaimedError,
    BillNotFoundError,
    InactiveRestaurantError,
    InvalidBillError,
    claim_bill,
)


router = APIRouter(prefix="/bills", tags=["bills"])


@router.post("/demo", response_model=DemoBillResponse, status_code=status.HTTP_201_CREATED)
def create_development_bill(
    payload: DemoBillRequest, db: DbSession, current_user: CurrentUser
) -> DemoBillResponse:
    del current_user
    restaurant = db.get(Restaurant, payload.restaurant_id)
    if restaurant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
    if not restaurant.active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Restaurant is not currently active"
        )

    bill = create_demo_bill(db, restaurant, payload.bill_amount)
    return DemoBillResponse(
        id=bill.id,
        restaurant=restaurant,
        bill_number=bill.bill_number,
        bill_amount=bill.amount,
        bill_date=bill.bill_date,
        reward_percentage=restaurant.reward_percentage,
        reward_amount=reward_preview(bill, restaurant),
        claimable=bill.status == BillStatus.CLAIMABLE,
    )


@router.post("/{bill_id}/claim", response_model=ClaimResponse)
def claim_development_bill(
    bill_id: UUID, db: DbSession, current_user: CurrentUser
) -> ClaimResponse:
    try:
        result = claim_bill(db, bill_id=bill_id, user_id=current_user.id)
    except BillNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except InactiveRestaurantError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except BillAlreadyClaimedError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except InvalidBillError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)
        ) from exc

    return ClaimResponse(
        reward_amount=result.reward_amount,
        transaction=result.transaction,
        updated_balance=result.updated_balance,
    )
