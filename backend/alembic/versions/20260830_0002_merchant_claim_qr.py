"""Add merchant staff and secure bill claim tokens.

Revision ID: 20260830_0002
Revises: 20260830_0001
Create Date: 2026-08-30
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260830_0002"
down_revision: str | None = "20260830_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "restaurant_staff",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("restaurant_id", sa.Uuid(), nullable=False),
        sa.Column(
            "role",
            sa.Enum(
                "OWNER", "MANAGER", "CASHIER",
                name="staff_role", native_enum=False, create_constraint=False,
            ),
            nullable=False,
        ),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "role IN ('OWNER', 'MANAGER', 'CASHIER')",
            name=op.f("ck_restaurant_staff_role_values"),
        ),
        sa.ForeignKeyConstraint(
            ["restaurant_id"],
            ["restaurants.id"],
            name=op.f("fk_restaurant_staff_restaurant_id_restaurants"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_restaurant_staff_user_id_users"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_restaurant_staff")),
        sa.UniqueConstraint(
            "user_id", "restaurant_id", name="uq_restaurant_staff_user_restaurant"
        ),
    )
    op.create_index(
        "ix_restaurant_staff_restaurant_active",
        "restaurant_staff",
        ["restaurant_id", "is_active"],
        unique=False,
    )

    op.add_column(
        "bills",
        sa.Column(
            "created_by_staff_id",
            sa.Uuid(),
            nullable=True,
        ),
    )
    op.add_column(
        "bills",
        sa.Column(
            "source",
            sa.Enum(
                "DEMO", "MERCHANT", "POS", "OCR",
                name="bill_source", native_enum=False, create_constraint=False,
            ),
            server_default=sa.text("'DEMO'"),
            nullable=False,
        ),
    )
    op.add_column(
        "bills",
        sa.Column(
            "claim_status",
            sa.Enum(
                "UNCLAIMED", "CLAIMED", "EXPIRED", "CANCELLED",
                name="bill_claim_status", native_enum=False, create_constraint=False,
            ),
            server_default=sa.text("'UNCLAIMED'"),
            nullable=False,
        ),
    )
    op.execute("UPDATE bills SET claim_status = 'CLAIMED' WHERE status = 'CLAIMED'")
    op.create_check_constraint(
        op.f("ck_bills_source_values"),
        "bills",
        "source IN ('DEMO', 'MERCHANT', 'POS', 'OCR')",
    )
    op.create_check_constraint(
        op.f("ck_bills_claim_status_values"),
        "bills",
        "claim_status IN ('UNCLAIMED', 'CLAIMED', 'EXPIRED', 'CANCELLED')",
    )
    op.create_foreign_key(
        op.f("fk_bills_created_by_staff_id_restaurant_staff"),
        "bills",
        "restaurant_staff",
        ["created_by_staff_id"],
        ["id"],
        ondelete="RESTRICT",
    )

    op.create_table(
        "bill_claim_tokens",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("bill_id", sa.Uuid(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("invalidated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column("created_by_staff_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(
            ["bill_id"],
            ["bills.id"],
            name=op.f("fk_bill_claim_tokens_bill_id_bills"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["created_by_staff_id"],
            ["restaurant_staff.id"],
            name=op.f("fk_bill_claim_tokens_created_by_staff_id_restaurant_staff"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_bill_claim_tokens")),
        sa.UniqueConstraint("token_hash", name="uq_bill_claim_tokens_token_hash"),
    )
    op.create_index(
        "ix_bill_claim_tokens_bill_created_at",
        "bill_claim_tokens",
        ["bill_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_bill_claim_tokens_expires_at",
        "bill_claim_tokens",
        ["expires_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_bill_claim_tokens_expires_at", table_name="bill_claim_tokens")
    op.drop_index("ix_bill_claim_tokens_bill_created_at", table_name="bill_claim_tokens")
    op.drop_table("bill_claim_tokens")
    op.drop_constraint(
        op.f("fk_bills_created_by_staff_id_restaurant_staff"),
        "bills",
        type_="foreignkey",
    )
    op.drop_constraint(op.f("ck_bills_claim_status_values"), "bills", type_="check")
    op.drop_constraint(op.f("ck_bills_source_values"), "bills", type_="check")
    op.drop_column("bills", "claim_status")
    op.drop_column("bills", "source")
    op.drop_column("bills", "created_by_staff_id")
    op.drop_index("ix_restaurant_staff_restaurant_active", table_name="restaurant_staff")
    op.drop_table("restaurant_staff")
