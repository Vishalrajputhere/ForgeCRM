"""Product Catalog and Deal Line Items Schema

Revision ID: 008_product_catalog_and_deal_line_items
Revises: 007_harden_automation_schema
Create Date: 2026-08-14 18:00:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "008_product_catalog_and_deal_line_items"
down_revision: str | None = "007_harden_automation_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ── 1. Create products table ──────────────────────────────────────────────
    op.create_table(
        "products",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "workspace_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("workspaces.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("name", sa.VARCHAR(length=255), nullable=False, index=True),
        sa.Column("sku", sa.VARCHAR(length=100), nullable=True, index=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.VARCHAR(length=100), nullable=True, index=True),
        sa.Column("unit_price", sa.NUMERIC(precision=18, scale=2), server_default="0.0", nullable=False),
        sa.Column("currency", sa.VARCHAR(length=20), server_default="USD", nullable=False),
        sa.Column("tax_rate", sa.NUMERIC(precision=5, scale=2), server_default="0.0", nullable=False),
        sa.Column("is_active", sa.BOOLEAN(), server_default="true", nullable=False, index=True),
        sa.Column(
            "created_by_member_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("workspace_members.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("workspace_id", "sku", name="uq_workspace_product_sku"),
    )

    # ── 2. Create deal_line_items table ───────────────────────────────────────
    op.create_table(
        "deal_line_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "workspace_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("workspaces.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "deal_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("deals.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "product_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("products.id", ondelete="SET NULL"),
            nullable=True,
            index=True,
        ),
        sa.Column("product_name_snapshot", sa.VARCHAR(length=255), nullable=False),
        sa.Column("sku_snapshot", sa.VARCHAR(length=100), nullable=True),
        sa.Column("quantity", sa.NUMERIC(precision=12, scale=2), server_default="1.0", nullable=False),
        sa.Column("unit_price", sa.NUMERIC(precision=18, scale=2), server_default="0.0", nullable=False),
        sa.Column("discount_percent", sa.NUMERIC(precision=5, scale=2), server_default="0.0", nullable=False),
        sa.Column("discount_amount", sa.NUMERIC(precision=18, scale=2), server_default="0.0", nullable=False),
        sa.Column("tax_rate", sa.NUMERIC(precision=5, scale=2), server_default="0.0", nullable=False),
        sa.Column("subtotal", sa.NUMERIC(precision=18, scale=2), server_default="0.0", nullable=False),
        sa.Column("taxable_amount", sa.NUMERIC(precision=18, scale=2), server_default="0.0", nullable=False),
        sa.Column("tax_amount", sa.NUMERIC(precision=18, scale=2), server_default="0.0", nullable=False),
        sa.Column("total", sa.NUMERIC(precision=18, scale=2), server_default="0.0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("deal_line_items")
    op.drop_table("products")
