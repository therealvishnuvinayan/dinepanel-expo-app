"""Create the DinePanel Phase 1 schema.

Revision ID: 20260830_0001
Revises:
Create Date: 2026-08-30
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260830_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
    )
    op.create_index(op.f("ix_users_phone"), "users", ["phone"], unique=True)

    op.create_table(
        "restaurants",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("slug", sa.String(length=180), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("cuisine", sa.String(length=80), nullable=False),
        sa.Column("reward_percentage", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("address", sa.String(length=250), nullable=False),
        sa.Column("area", sa.String(length=100), nullable=False),
        sa.Column("city", sa.String(length=100), nullable=False),
        sa.Column("latitude", sa.Numeric(precision=9, scale=6), nullable=True),
        sa.Column("longitude", sa.Numeric(precision=9, scale=6), nullable=True),
        sa.Column("active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint(
            "reward_percentage >= 0 AND reward_percentage <= 100",
            name=op.f("ck_restaurants_reward_percentage_range"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_restaurants")),
    )
    op.create_index(op.f("ix_restaurants_slug"), "restaurants", ["slug"], unique=True)

    op.create_table(
        "bills",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("restaurant_id", sa.Uuid(), nullable=False),
        sa.Column("bill_number", sa.String(length=80), nullable=False),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("bill_date", sa.Date(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("CLAIMABLE", "CLAIMED", name="bill_status", native_enum=False, create_constraint=False),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("amount > 0", name=op.f("ck_bills_amount_positive")),
        sa.CheckConstraint(
            "status IN ('CLAIMABLE', 'CLAIMED')", name=op.f("ck_bills_status_values")
        ),
        sa.ForeignKeyConstraint(
            ["restaurant_id"], ["restaurants.id"], name=op.f("fk_bills_restaurant_id_restaurants"), ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_bills")),
        sa.UniqueConstraint("restaurant_id", "bill_number", name="uq_bills_restaurant_bill_number"),
    )
    op.create_index("ix_bills_restaurant_created_at", "bills", ["restaurant_id", "created_at"], unique=False)

    op.create_table(
        "reward_transactions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("restaurant_id", sa.Uuid(), nullable=True),
        sa.Column("bill_id", sa.Uuid(), nullable=True),
        sa.Column(
            "type",
            sa.Enum(
                "EARN", "REDEEM", "ADJUSTMENT", "REVERSAL",
                name="reward_transaction_type", native_enum=False, create_constraint=False,
            ),
            nullable=False,
        ),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "PENDING", "COMPLETED", "REVERSED",
                name="reward_transaction_status", native_enum=False, create_constraint=False,
            ),
            nullable=False,
        ),
        sa.Column("description", sa.String(length=250), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("amount <> 0", name=op.f("ck_reward_transactions_amount_nonzero")),
        sa.CheckConstraint(
            "type IN ('EARN', 'REDEEM', 'ADJUSTMENT', 'REVERSAL')",
            name=op.f("ck_reward_transactions_type_values"),
        ),
        sa.CheckConstraint(
            "status IN ('PENDING', 'COMPLETED', 'REVERSED')",
            name=op.f("ck_reward_transactions_status_values"),
        ),
        sa.ForeignKeyConstraint(["bill_id"], ["bills.id"], name=op.f("fk_reward_transactions_bill_id_bills"), ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["restaurant_id"], ["restaurants.id"], name=op.f("fk_reward_transactions_restaurant_id_restaurants"), ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_reward_transactions_user_id_users"), ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_reward_transactions")),
        sa.UniqueConstraint("bill_id", name=op.f("uq_reward_transactions_bill_id")),
    )
    op.create_index(
        "ix_reward_transactions_user_created_at",
        "reward_transactions",
        ["user_id", "created_at"],
        unique=False,
    )

    op.create_table(
        "reward_claims",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("restaurant_id", sa.Uuid(), nullable=False),
        sa.Column("bill_id", sa.Uuid(), nullable=False),
        sa.Column("reward_transaction_id", sa.Uuid(), nullable=False),
        sa.Column("claimed_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["bill_id"], ["bills.id"], name=op.f("fk_reward_claims_bill_id_bills"), ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["restaurant_id"], ["restaurants.id"], name=op.f("fk_reward_claims_restaurant_id_restaurants"), ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["reward_transaction_id"], ["reward_transactions.id"], name=op.f("fk_reward_claims_reward_transaction_id_reward_transactions"), ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_reward_claims_user_id_users"), ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_reward_claims")),
        sa.UniqueConstraint("bill_id", name="uq_reward_claims_bill_id"),
        sa.UniqueConstraint("reward_transaction_id", name="uq_reward_claims_reward_transaction_id"),
    )
    op.create_index("ix_reward_claims_user_claimed_at", "reward_claims", ["user_id", "claimed_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_reward_claims_user_claimed_at", table_name="reward_claims")
    op.drop_table("reward_claims")
    op.drop_index("ix_reward_transactions_user_created_at", table_name="reward_transactions")
    op.drop_table("reward_transactions")
    op.drop_index("ix_bills_restaurant_created_at", table_name="bills")
    op.drop_table("bills")
    op.drop_index(op.f("ix_restaurants_slug"), table_name="restaurants")
    op.drop_table("restaurants")
    op.drop_index(op.f("ix_users_phone"), table_name="users")
    op.drop_table("users")
