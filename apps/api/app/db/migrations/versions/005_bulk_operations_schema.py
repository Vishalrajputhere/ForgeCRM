"""Bulk Operations Schema (import_jobs, export_jobs)

Revision ID: 005_bulk_operations_schema
Revises: 004_storage_and_search_schema
Create Date: 2026-08-04 07:45:00.000000

Adds the import_jobs and export_jobs tables used by the
CSV/Excel import engine and dataset export service introduced
in Module 3 — Enterprise Bulk Operations Engine.
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "005_bulk_operations_schema"
down_revision: str | None = "004_storage_and_search_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ── import_jobs ────────────────────────────────────────────────────────────
    op.create_table(
        "import_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_by_member_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("entity_type", sa.VARCHAR(length=50), nullable=False),
        sa.Column("filename", sa.VARCHAR(length=255), nullable=False),
        sa.Column("status", sa.VARCHAR(length=30), server_default="Completed", nullable=False),
        sa.Column("total_rows", sa.Integer(), server_default="0", nullable=False),
        sa.Column("imported_rows", sa.Integer(), server_default="0", nullable=False),
        sa.Column("skipped_rows", sa.Integer(), server_default="0", nullable=False),
        sa.Column("error_rows", sa.Integer(), server_default="0", nullable=False),
        sa.Column("duration_seconds", sa.NUMERIC(precision=10, scale=2), server_default="0", nullable=False),
        sa.Column("error_log", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by_member_id"], ["workspace_members.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_import_jobs_workspace_id"), "import_jobs", ["workspace_id"], unique=False)
    op.create_index(op.f("ix_import_jobs_entity_type"), "import_jobs", ["entity_type"], unique=False)

    # ── export_jobs ────────────────────────────────────────────────────────────
    op.create_table(
        "export_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_by_member_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("entity_type", sa.VARCHAR(length=50), nullable=False),
        sa.Column("export_format", sa.VARCHAR(length=20), server_default="csv", nullable=False),
        sa.Column("filter_scope", sa.VARCHAR(length=30), server_default="selected", nullable=False),
        sa.Column("total_records", sa.Integer(), server_default="0", nullable=False),
        sa.Column("download_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by_member_id"], ["workspace_members.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_export_jobs_workspace_id"), "export_jobs", ["workspace_id"], unique=False)
    op.create_index(op.f("ix_export_jobs_entity_type"), "export_jobs", ["entity_type"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_export_jobs_entity_type"), table_name="export_jobs")
    op.drop_index(op.f("ix_export_jobs_workspace_id"), table_name="export_jobs")
    op.drop_table("export_jobs")

    op.drop_index(op.f("ix_import_jobs_entity_type"), table_name="import_jobs")
    op.drop_index(op.f("ix_import_jobs_workspace_id"), table_name="import_jobs")
    op.drop_table("import_jobs")
