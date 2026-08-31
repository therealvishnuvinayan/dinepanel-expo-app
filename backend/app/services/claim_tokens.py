import hashlib
import hmac
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.core.config import get_settings
from app.models import Bill, BillClaimStatus, BillClaimToken
from app.services.claims import (
    BillAlreadyClaimedError,
    ClaimResult,
    InactiveRestaurantError,
    InvalidBillError,
    _raise_duplicate_for_integrity_error,
    apply_claim_to_locked_bill,
)
from app.services.rewards import calculate_balance


class ClaimTokenError(ValueError):
    pass


class InvalidClaimTokenError(ClaimTokenError):
    pass


class ExpiredClaimTokenError(ClaimTokenError):
    pass


class ConsumedClaimTokenError(ClaimTokenError):
    pass


class InvalidatedClaimTokenError(ClaimTokenError):
    pass


@dataclass(frozen=True)
class IssuedClaimToken:
    token: str
    claim_url: str
    expires_at: datetime


@dataclass(frozen=True)
class ClaimTokenPreview:
    token_record: BillClaimToken
    bill: Bill


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def ensure_aware(value: datetime) -> datetime:
    return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)


def hash_claim_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def issue_claim_token(
    db: Session, *, bill: Bill, created_by_staff_id: UUID
) -> IssuedClaimToken:
    now = utc_now()
    settings = get_settings()
    db.execute(
        update(BillClaimToken)
        .where(
            BillClaimToken.bill_id == bill.id,
            BillClaimToken.consumed_at.is_(None),
            BillClaimToken.invalidated_at.is_(None),
        )
        .values(invalidated_at=now)
    )
    plaintext_token = secrets.token_urlsafe(32)
    expires_at = now + timedelta(minutes=settings.claim_token_expire_minutes)
    db.add(
        BillClaimToken(
            bill_id=bill.id,
            token_hash=hash_claim_token(plaintext_token),
            expires_at=expires_at,
            created_by_staff_id=created_by_staff_id,
        )
    )
    bill.claim_status = BillClaimStatus.UNCLAIMED
    db.flush()
    return IssuedClaimToken(
        token=plaintext_token,
        claim_url=f"{settings.claim_base_url.rstrip('/')}/{plaintext_token}",
        expires_at=expires_at,
    )


def resolve_claim_token(
    db: Session, *, token: str, for_update: bool = False
) -> ClaimTokenPreview:
    incoming_hash = hash_claim_token(token)
    query = (
        select(BillClaimToken)
        .options(
            joinedload(BillClaimToken.bill)
            .joinedload(Bill.restaurant, innerjoin=True)
        )
        .where(BillClaimToken.token_hash == incoming_hash)
    )
    if for_update:
        query = query.with_for_update(of=BillClaimToken)
    token_record = db.scalar(query)
    if token_record is None or not hmac.compare_digest(token_record.token_hash, incoming_hash):
        raise InvalidClaimTokenError("Claim code is invalid")
    if token_record.consumed_at is not None:
        raise ConsumedClaimTokenError("Claim code has already been used")
    if token_record.invalidated_at is not None:
        raise InvalidatedClaimTokenError("Claim code is no longer active")
    if ensure_aware(token_record.expires_at) <= utc_now():
        raise ExpiredClaimTokenError("Claim code has expired")
    if token_record.bill.claim_status == BillClaimStatus.CLAIMED:
        raise BillAlreadyClaimedError("Bill has already been claimed")
    if token_record.bill.claim_status == BillClaimStatus.CANCELLED:
        raise InvalidBillError("Bill has been cancelled")
    if not token_record.bill.restaurant.active:
        raise InactiveRestaurantError("Restaurant is not currently active")
    return ClaimTokenPreview(token_record=token_record, bill=token_record.bill)


def claim_with_token(db: Session, *, token: str, user_id: UUID) -> ClaimResult:
    try:
        initial_preview = resolve_claim_token(db, token=token)
        bill = db.scalar(
            select(Bill)
            .options(joinedload(Bill.restaurant, innerjoin=True))
            .where(Bill.id == initial_preview.bill.id)
            .with_for_update()
        )
        if bill is None:
            raise InvalidClaimTokenError("Claim code is invalid")
        preview = resolve_claim_token(db, token=token, for_update=True)
        if preview.bill.id != bill.id:
            raise InvalidClaimTokenError("Claim code is invalid")
        reward_amount, transaction = apply_claim_to_locked_bill(
            db, bill=bill, user_id=user_id
        )
        now = utc_now()
        preview.token_record.consumed_at = now
        db.execute(
            update(BillClaimToken)
            .where(
                BillClaimToken.bill_id == bill.id,
                BillClaimToken.id != preview.token_record.id,
                BillClaimToken.consumed_at.is_(None),
                BillClaimToken.invalidated_at.is_(None),
            )
            .values(invalidated_at=now)
        )
        db.flush()
        updated_balance = calculate_balance(db, user_id)
        db.commit()
        db.refresh(transaction)
        return ClaimResult(
            reward_amount=reward_amount,
            transaction=transaction,
            updated_balance=updated_balance,
            bill=bill,
        )
    except (
        ClaimTokenError,
        BillAlreadyClaimedError,
        InactiveRestaurantError,
        InvalidBillError,
    ):
        db.rollback()
        raise
    except IntegrityError as exc:
        db.rollback()
        _raise_duplicate_for_integrity_error(exc)
    except Exception:
        db.rollback()
        raise
