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


class Bill(Base):
    __tablename__ = "bills"
    __table_args__ = (
        UniqueConstraint("restaurant_id", "bill_number", name="uq_bills_restaurant_bill_number"),
        CheckConstraint("amount > 0", name="amount_positive"),
        CheckConstraint("status IN ('CLAIMABLE', 'CLAIMED')", name="status_values"),
        Index("ix_bills_restaurant_created_at", "restaurant_id", "created_at"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    restaurant_id: Mapped[UUID] = mapped_column(
        ForeignKey("restaurants.id", ondelete="RESTRICT"), nullable=False
    )
    bill_number: Mapped[str] = mapped_column(String(80), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    bill_date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    status: Mapped[BillStatus] = mapped_column(
        bill_status_enum, nullable=False, default=BillStatus.CLAIMABLE
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    restaurant: Mapped[Restaurant] = relationship(back_populates="bills")
    reward_transaction: Mapped[RewardTransaction | None] = relationship(back_populates="bill")
    reward_claim: Mapped[RewardClaim | None] = relationship(back_populates="bill")


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
