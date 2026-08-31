from __future__ import annotations

import enum
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TransactionType(str, enum.Enum):
    EARN = "EARN"
    REDEEM = "REDEEM"
    ADJUSTMENT = "ADJUSTMENT"
    REVERSAL = "REVERSAL"


class TransactionStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    REVERSED = "REVERSED"


class BillStatus(str, enum.Enum):
    CLAIMABLE = "CLAIMABLE"
    CLAIMED = "CLAIMED"


class BillSource(str, enum.Enum):
    DEMO = "DEMO"
    MERCHANT = "MERCHANT"
    POS = "POS"
    OCR = "OCR"


class BillClaimStatus(str, enum.Enum):
    UNCLAIMED = "UNCLAIMED"
    CLAIMED = "CLAIMED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class StaffRole(str, enum.Enum):
    OWNER = "OWNER"
    MANAGER = "MANAGER"
    CASHIER = "CASHIER"


transaction_type_enum = Enum(
    TransactionType,
    name="reward_transaction_type",
    native_enum=False,
    create_constraint=False,
    validate_strings=True,
)
transaction_status_enum = Enum(
    TransactionStatus,
    name="reward_transaction_status",
    native_enum=False,
    create_constraint=False,
    validate_strings=True,
)
bill_status_enum = Enum(
    BillStatus,
    name="bill_status",
    native_enum=False,
    create_constraint=False,
    validate_strings=True,
)
bill_source_enum = Enum(
    BillSource,
    name="bill_source",
    native_enum=False,
    create_constraint=False,
    validate_strings=True,
)
bill_claim_status_enum = Enum(
    BillClaimStatus,
    name="bill_claim_status",
    native_enum=False,
    create_constraint=False,
    validate_strings=True,
)
staff_role_enum = Enum(
    StaffRole,
    name="staff_role",
    native_enum=False,
    create_constraint=False,
    validate_strings=True,
)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    name: Mapped[str | None] = mapped_column(String(120), nullable=True)

    reward_transactions: Mapped[list[RewardTransaction]] = relationship(back_populates="user")
    reward_claims: Mapped[list[RewardClaim]] = relationship(back_populates="user")
    staff_memberships: Mapped[list[RestaurantStaff]] = relationship(back_populates="user")


class Restaurant(TimestampMixin, Base):
    __tablename__ = "restaurants"
    __table_args__ = (
        CheckConstraint(
            "reward_percentage >= 0 AND reward_percentage <= 100",
            name="reward_percentage_range",
        ),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    slug: Mapped[str] = mapped_column(String(180), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    cuisine: Mapped[str] = mapped_column(String(80), nullable=False)
    reward_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    address: Mapped[str] = mapped_column(String(250), nullable=False)
    area: Mapped[str] = mapped_column(String(100), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False, default="Dubai")
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")

    bills: Mapped[list[Bill]] = relationship(back_populates="restaurant")
    reward_transactions: Mapped[list[RewardTransaction]] = relationship(back_populates="restaurant")
    reward_claims: Mapped[list[RewardClaim]] = relationship(back_populates="restaurant")
    staff_memberships: Mapped[list[RestaurantStaff]] = relationship(back_populates="restaurant")


class RestaurantStaff(TimestampMixin, Base):
    __tablename__ = "restaurant_staff"
    __table_args__ = (
        UniqueConstraint(
            "user_id", "restaurant_id", name="uq_restaurant_staff_user_restaurant"
        ),
        CheckConstraint("role IN ('OWNER', 'MANAGER', 'CASHIER')", name="role_values"),
        Index("ix_restaurant_staff_restaurant_active", "restaurant_id", "is_active"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    restaurant_id: Mapped[UUID] = mapped_column(
        ForeignKey("restaurants.id", ondelete="RESTRICT"), nullable=False
    )
    role: Mapped[StaffRole] = mapped_column(staff_role_enum, nullable=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )

    user: Mapped[User] = relationship(back_populates="staff_memberships")
    restaurant: Mapped[Restaurant] = relationship(back_populates="staff_memberships")
    created_bills: Mapped[list[Bill]] = relationship(back_populates="created_by_staff")
    claim_tokens: Mapped[list[BillClaimToken]] = relationship(back_populates="created_by_staff")


class Bill(Base):
    __tablename__ = "bills"
    __table_args__ = (
        UniqueConstraint("restaurant_id", "bill_number", name="uq_bills_restaurant_bill_number"),
        CheckConstraint("amount > 0", name="amount_positive"),
        CheckConstraint("status IN ('CLAIMABLE', 'CLAIMED')", name="status_values"),
        CheckConstraint("source IN ('DEMO', 'MERCHANT', 'POS', 'OCR')", name="source_values"),
        CheckConstraint(
            "claim_status IN ('UNCLAIMED', 'CLAIMED', 'EXPIRED', 'CANCELLED')",
            name="claim_status_values",
        ),
        Index("ix_bills_restaurant_created_at", "restaurant_id", "created_at"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    restaurant_id: Mapped[UUID] = mapped_column(
        ForeignKey("restaurants.id", ondelete="RESTRICT"), nullable=False
    )
    created_by_staff_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("restaurant_staff.id", ondelete="RESTRICT"), nullable=True
    )
    bill_number: Mapped[str] = mapped_column(String(80), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    bill_date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    status: Mapped[BillStatus] = mapped_column(
        bill_status_enum, nullable=False, default=BillStatus.CLAIMABLE
    )
    source: Mapped[BillSource] = mapped_column(
        bill_source_enum, nullable=False, default=BillSource.DEMO, server_default="DEMO"
    )
    claim_status: Mapped[BillClaimStatus] = mapped_column(
        bill_claim_status_enum,
        nullable=False,
        default=BillClaimStatus.UNCLAIMED,
        server_default="UNCLAIMED",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    restaurant: Mapped[Restaurant] = relationship(back_populates="bills")
    created_by_staff: Mapped[RestaurantStaff | None] = relationship(back_populates="created_bills")
    reward_transaction: Mapped[RewardTransaction | None] = relationship(back_populates="bill")
    reward_claim: Mapped[RewardClaim | None] = relationship(back_populates="bill")
    claim_tokens: Mapped[list[BillClaimToken]] = relationship(back_populates="bill")


class BillClaimToken(Base):
    __tablename__ = "bill_claim_tokens"
    __table_args__ = (
        UniqueConstraint("token_hash", name="uq_bill_claim_tokens_token_hash"),
        Index("ix_bill_claim_tokens_bill_created_at", "bill_id", "created_at"),
        Index("ix_bill_claim_tokens_expires_at", "expires_at"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    bill_id: Mapped[UUID] = mapped_column(
        ForeignKey("bills.id", ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    invalidated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    created_by_staff_id: Mapped[UUID] = mapped_column(
        ForeignKey("restaurant_staff.id", ondelete="RESTRICT"), nullable=False
    )

    bill: Mapped[Bill] = relationship(back_populates="claim_tokens")
    created_by_staff: Mapped[RestaurantStaff] = relationship(back_populates="claim_tokens")


class RewardTransaction(Base):
    __tablename__ = "reward_transactions"
    __table_args__ = (
        CheckConstraint("amount <> 0", name="amount_nonzero"),
        CheckConstraint(
            "type IN ('EARN', 'REDEEM', 'ADJUSTMENT', 'REVERSAL')",
            name="type_values",
        ),
        CheckConstraint(
            "status IN ('PENDING', 'COMPLETED', 'REVERSED')",
            name="status_values",
        ),
        Index("ix_reward_transactions_user_created_at", "user_id", "created_at"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    restaurant_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("restaurants.id", ondelete="RESTRICT"), nullable=True
    )
    bill_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("bills.id", ondelete="RESTRICT"), unique=True, nullable=True
    )
    type: Mapped[TransactionType] = mapped_column(transaction_type_enum, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[TransactionStatus] = mapped_column(transaction_status_enum, nullable=False)
    description: Mapped[str] = mapped_column(String(250), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped[User] = relationship(back_populates="reward_transactions")
    restaurant: Mapped[Restaurant | None] = relationship(back_populates="reward_transactions")
    bill: Mapped[Bill | None] = relationship(back_populates="reward_transaction")
    reward_claim: Mapped[RewardClaim | None] = relationship(back_populates="reward_transaction")


class RewardClaim(Base):
    __tablename__ = "reward_claims"
    __table_args__ = (
        UniqueConstraint("bill_id", name="uq_reward_claims_bill_id"),
        UniqueConstraint("reward_transaction_id", name="uq_reward_claims_reward_transaction_id"),
        Index("ix_reward_claims_user_claimed_at", "user_id", "claimed_at"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    restaurant_id: Mapped[UUID] = mapped_column(
        ForeignKey("restaurants.id", ondelete="RESTRICT"), nullable=False
    )
    bill_id: Mapped[UUID] = mapped_column(ForeignKey("bills.id", ondelete="RESTRICT"), nullable=False)
    reward_transaction_id: Mapped[UUID] = mapped_column(
        ForeignKey("reward_transactions.id", ondelete="RESTRICT"), nullable=False
    )
    claimed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped[User] = relationship(back_populates="reward_claims")
    restaurant: Mapped[Restaurant] = relationship(back_populates="reward_claims")
    bill: Mapped[Bill] = relationship(back_populates="reward_claim")
    reward_transaction: Mapped[RewardTransaction] = relationship(back_populates="reward_claim")
