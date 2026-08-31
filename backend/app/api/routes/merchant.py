from datetime import datetime, time, timedelta, timezone
from decimal import Decimal
from uuid import UUID
from zoneinfo import ZoneInfo

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import joinedload

from app.api.dependencies import (
    CurrentStaffMemberships,
    CurrentUser,
    DbSession,
    RestaurantAccess,
)
from app.models import (
    Bill,
    BillClaimStatus,
    BillSource,
    Restaurant,
    RewardTransaction,
    TransactionStatus,
)
from app.schemas.merchant import (
    ClaimTokenResponse,
    MerchantBillCreateRequest,
    MerchantBillCreateResponse,
    MerchantBillPageResponse,
    MerchantBillResponse,
    MerchantDashboardResponse,
    MerchantMeResponse,
    StaffMembershipResponse,
)
from app.schemas.restaurants import RestaurantResponse
from app.schemas.users import UserResponse
from app.services.merchant import (
    DuplicateMerchantBillError,
    MerchantAccessError,
    MerchantBillNotFoundError,
    MerchantBillNotRefreshableError,
    create_merchant_bill,
    get_merchant_bill,
    merchant_bill_response,
    refresh_merchant_claim_token,
    sync_expired_claim_status,
)


router = APIRouter(prefix="/merchant", tags=["merchant"])


def _sync_expired_bills(db: DbSession, bills: list[Bill]) -> None:
    changed = False
    for bill in bills:
        changed = sync_expired_claim_status(db, bill) or changed
    if changed:
        db.commit()


def _today_bounds() -> tuple[datetime, datetime]:
    dubai = ZoneInfo("Asia/Dubai")
    local_start = datetime.combine(datetime.now(dubai).date(), time.min, tzinfo=dubai)
    return local_start.astimezone(timezone.utc), (local_start + timedelta(days=1)).astimezone(
        timezone.utc
    )


@router.get("/me", response_model=MerchantMeResponse)
def merchant_me(
    current_user: CurrentUser, memberships: CurrentStaffMemberships
) -> MerchantMeResponse:
    return MerchantMeResponse(
        user=UserResponse.model_validate(current_user),
        memberships=[StaffMembershipResponse.model_validate(item) for item in memberships],
    )


@router.get("/restaurants", response_model=list[RestaurantResponse])
def merchant_restaurants(
    memberships: CurrentStaffMemberships,
) -> list[RestaurantResponse]:
    return [RestaurantResponse.model_validate(item.restaurant) for item in memberships]


@router.get(
    "/restaurants/{restaurant_id}/dashboard",
    response_model=MerchantDashboardResponse,
)
def merchant_dashboard(
    restaurant_id: UUID,
    db: DbSession,
    membership: RestaurantAccess,
) -> MerchantDashboardResponse:
    del membership
    start, end = _today_bounds()
    bill_filters = (
        Bill.restaurant_id == restaurant_id,
        Bill.source == BillSource.MERCHANT,
        Bill.created_at >= start,
        Bill.created_at < end,
    )
    expirable_bills = list(
        db.scalars(
            select(Bill).where(
                *bill_filters,
                Bill.claim_status == BillClaimStatus.UNCLAIMED,
            )
        ).all()
    )
    _sync_expired_bills(db, expirable_bills)
    today_bills = int(db.scalar(select(func.count(Bill.id)).where(*bill_filters)) or 0)
    today_claimed = int(
        db.scalar(
            select(func.count(Bill.id)).where(
                *bill_filters, Bill.claim_status == BillClaimStatus.CLAIMED
            )
        )
        or 0
    )
    today_unclaimed = int(
        db.scalar(
            select(func.count(Bill.id)).where(
                *bill_filters, Bill.claim_status == BillClaimStatus.UNCLAIMED
            )
        )
        or 0
    )
    sales = Decimal(
        db.scalar(select(func.coalesce(func.sum(Bill.amount), 0)).where(*bill_filters)) or 0
    )
    rewards = Decimal(
        db.scalar(
            select(func.coalesce(func.sum(RewardTransaction.amount), 0))
            .join(Bill, RewardTransaction.bill_id == Bill.id)
            .where(
                *bill_filters,
                RewardTransaction.status == TransactionStatus.COMPLETED,
            )
        )
        or 0
    )
    recent = list(
        db.scalars(
            select(Bill)
            .options(
                joinedload(Bill.restaurant, innerjoin=True),
                joinedload(Bill.reward_claim),
            )
            .where(Bill.restaurant_id == restaurant_id, Bill.source == BillSource.MERCHANT)
            .order_by(Bill.created_at.desc(), Bill.id.desc())
            .limit(5)
        ).all()
    )
    _sync_expired_bills(db, recent)
    return MerchantDashboardResponse(
        today_bills=today_bills,
        today_claimed_bills=today_claimed,
        today_unclaimed_bills=today_unclaimed,
        today_sales_tracked=sales,
        today_rewards_issued=rewards,
        recent_bills=[merchant_bill_response(db, bill) for bill in recent],
    )


@router.post(
    "/restaurants/{restaurant_id}/bills",
    response_model=MerchantBillCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_bill(
    restaurant_id: UUID,
    payload: MerchantBillCreateRequest,
    db: DbSession,
    membership: RestaurantAccess,
) -> MerchantBillCreateResponse:
    del restaurant_id
    try:
        result = create_merchant_bill(
            db,
            membership=membership,
            bill_number=payload.bill_number,
            bill_amount=payload.bill_amount,
        )
    except DuplicateMerchantBillError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return MerchantBillCreateResponse(
        bill=merchant_bill_response(db, result.bill),
        claim=ClaimTokenResponse(
            token=result.claim.token,
            claim_url=result.claim.claim_url,
            expires_at=result.claim.expires_at,
        ),
    )


@router.get(
    "/restaurants/{restaurant_id}/bills",
    response_model=MerchantBillPageResponse,
)
def list_bills(
    restaurant_id: UUID,
    db: DbSession,
    membership: RestaurantAccess,
    claim_status: BillClaimStatus | None = Query(default=None),
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> MerchantBillPageResponse:
    del membership
    expirable_bills = list(
        db.scalars(
            select(Bill).where(
                Bill.restaurant_id == restaurant_id,
                Bill.source == BillSource.MERCHANT,
                Bill.claim_status == BillClaimStatus.UNCLAIMED,
            )
        ).all()
    )
    _sync_expired_bills(db, expirable_bills)
    filters = [
        Bill.restaurant_id == restaurant_id,
        Bill.source == BillSource.MERCHANT,
    ]
    if claim_status is not None:
        filters.append(Bill.claim_status == claim_status)
    total = int(db.scalar(select(func.count(Bill.id)).where(*filters)) or 0)
    bills = list(
        db.scalars(
            select(Bill)
            .options(
                joinedload(Bill.restaurant, innerjoin=True),
                joinedload(Bill.reward_claim),
            )
            .where(*filters)
            .order_by(Bill.created_at.desc(), Bill.id.desc())
            .limit(limit)
            .offset(offset)
        ).all()
    )
    _sync_expired_bills(db, bills)
    return MerchantBillPageResponse(
        items=[merchant_bill_response(db, bill) for bill in bills],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/bills/{bill_id}", response_model=MerchantBillResponse)
def get_bill(bill_id: UUID, db: DbSession, current_user: CurrentUser) -> MerchantBillResponse:
    try:
        bill, _membership = get_merchant_bill(
            db, bill_id=bill_id, user_id=current_user.id
        )
    except MerchantBillNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except MerchantAccessError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    if sync_expired_claim_status(db, bill):
        db.commit()
    return merchant_bill_response(db, bill)


@router.post("/bills/{bill_id}/refresh-claim-token", response_model=ClaimTokenResponse)
def refresh_claim_token(
    bill_id: UUID, db: DbSession, current_user: CurrentUser
) -> ClaimTokenResponse:
    try:
        bill, membership = get_merchant_bill(
            db, bill_id=bill_id, user_id=current_user.id
        )
        claim = refresh_merchant_claim_token(
            db, bill=bill, membership=membership
        )
    except MerchantBillNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except MerchantAccessError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except MerchantBillNotRefreshableError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return ClaimTokenResponse(
        token=claim.token,
        claim_url=claim.claim_url,
        expires_at=claim.expires_at,
    )
