"""Document Storage Schema (document_attachments)

Revision ID: 004_storage_and_search_schema
Revises: 003_crm_core_schema
Create Date: 2026-07-25 21:15:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "004_storage_and_search_schema"
down_revision: str | None = "003_crm_core_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "document_attachments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("uploaded_by_member_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("entity_type", sa.VARCHAR(length=50), nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("file_name", sa.VARCHAR(length=255), nullable=False),
        sa.Column("file_size", sa.BIGINT(), nullable=False),
        sa.Column("mime_type", sa.VARCHAR(length=100), nullable=False),
        sa.Column("storage_key", sa.Text(), nullable=False),
        sa.Column("storage_provider", sa.VARCHAR(length=30), server_default="MinIO", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["uploaded_by_member_id"], ["workspace_members.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("storage_key"),
    )
    op.create_index(op.f("ix_document_attachments_workspace_id"), "document_attachments", ["workspace_id"], unique=False)
    op.create_index(op.f("ix_document_attachments_uploaded_by_member_id"), "document_attachments", ["uploaded_by_member_id"], unique=False)
    op.create_index(op.f("ix_document_attachments_entity_type"), "document_attachments", ["entity_type"], unique=False)
    op.create_index(op.f("ix_document_attachments_entity_id"), "document_attachments", ["entity_id"], unique=False)


def downgrade() -> None:
    op.drop_table("document_attachments")
