"""CRM Core Operational Schema (companies, contacts, leads, pipelines, deals, tasks, activities)

Revision ID: 003_crm_core_schema
Revises: 002_workspace_isolation_schema
Create Date: 2026-07-25 21:00:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "003_crm_core_schema"
down_revision: str | None = "002_workspace_isolation_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ── Lookup Tables ─────────────────────────────────────────────────────────
    op.create_table(
        "company_industries",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.VARCHAR(length=150), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    op.create_table(
        "lead_sources",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.VARCHAR(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.BOOLEAN(), server_default="true", nullable=False),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("workspace_id", "name", name="uq_workspace_lead_source_name"),
    )
    op.create_index(op.f("ix_lead_sources_workspace_id"), "lead_sources", ["workspace_id"], unique=False)

    op.create_table(
        "lead_statuses",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.VARCHAR(length=100), nullable=False),
        sa.Column("color", sa.VARCHAR(length=20), nullable=True),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_final", sa.BOOLEAN(), server_default="false", nullable=False),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_lead_statuses_workspace_id"), "lead_statuses", ["workspace_id"], unique=False)

    op.create_table(
        "activity_types",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.VARCHAR(length=120), nullable=False),
        sa.Column("category", sa.VARCHAR(length=50), nullable=False),
        sa.Column("icon", sa.VARCHAR(length=50), nullable=True),
        sa.Column("color", sa.VARCHAR(length=20), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    # ── companies ─────────────────────────────────────────────────────────────
    op.create_table(
        "companies",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("owner_member_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.VARCHAR(length=255), nullable=False),
        sa.Column("legal_name", sa.VARCHAR(length=255), nullable=True),
        sa.Column("industry_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("website", sa.Text(), nullable=True),
        sa.Column("email", sa.VARCHAR(length=255), nullable=True),
        sa.Column("phone", sa.VARCHAR(length=50), nullable=True),
        sa.Column("annual_revenue", sa.NUMERIC(precision=18, scale=2), nullable=True),
        sa.Column("employee_count", sa.Integer(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.VARCHAR(length=30), server_default="Active", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["industry_id"], ["company_industries.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["owner_member_id"], ["workspace_members.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("workspace_id", "name", name="uq_workspace_company_name"),
    )
    op.create_index(op.f("ix_companies_workspace_id"), "companies", ["workspace_id"], unique=False)
    op.create_index(op.f("ix_companies_owner_member_id"), "companies", ["owner_member_id"], unique=False)
    op.create_index(op.f("ix_companies_industry_id"), "companies", ["industry_id"], unique=False)
    op.create_index(op.f("ix_companies_name"), "companies", ["name"], unique=False)
    op.create_index(op.f("ix_companies_status"), "companies", ["status"], unique=False)

    # ── contacts ─────────────────────────────────────────────────────────────
    op.create_table(
        "contacts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("owner_member_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("first_name", sa.VARCHAR(length=100), nullable=False),
        sa.Column("last_name", sa.VARCHAR(length=100), nullable=False),
        sa.Column("job_title", sa.VARCHAR(length=150), nullable=True),
        sa.Column("department", sa.VARCHAR(length=150), nullable=True),
        sa.Column("email", sa.VARCHAR(length=255), nullable=True),
        sa.Column("phone", sa.VARCHAR(length=50), nullable=True),
        sa.Column("mobile", sa.VARCHAR(length=50), nullable=True),
        sa.Column("linkedin_url", sa.Text(), nullable=True),
        sa.Column("birthday", sa.DATE(), nullable=True),
        sa.Column("is_primary", sa.BOOLEAN(), server_default="false", nullable=False),
        sa.Column("status", sa.VARCHAR(length=30), server_default="Active", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["owner_member_id"], ["workspace_members.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_contacts_workspace_id"), "contacts", ["workspace_id"], unique=False)
    op.create_index(op.f("ix_contacts_company_id"), "contacts", ["company_id"], unique=False)
    op.create_index(op.f("ix_contacts_owner_member_id"), "contacts", ["owner_member_id"], unique=False)
    op.create_index(op.f("ix_contacts_email"), "contacts", ["email"], unique=False)

    # ── leads ────────────────────────────────────────────────────────────────
    op.create_table(
        "leads",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("owner_member_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("first_name", sa.VARCHAR(length=100), nullable=False),
        sa.Column("last_name", sa.VARCHAR(length=100), nullable=True),
        sa.Column("company_name", sa.VARCHAR(length=255), nullable=True),
        sa.Column("job_title", sa.VARCHAR(length=150), nullable=True),
        sa.Column("email", sa.VARCHAR(length=255), nullable=True),
        sa.Column("phone", sa.VARCHAR(length=50), nullable=True),
        sa.Column("website", sa.Text(), nullable=True),
        sa.Column("estimated_value", sa.NUMERIC(precision=18, scale=2), nullable=True),
        sa.Column("priority", sa.VARCHAR(length=20), server_default="Medium", nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("converted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("lost_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["owner_member_id"], ["workspace_members.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["source_id"], ["lead_sources.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["status_id"], ["lead_statuses.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_leads_workspace_id"), "leads", ["workspace_id"], unique=False)
    op.create_index(op.f("ix_leads_owner_member_id"), "leads", ["owner_member_id"], unique=False)
    op.create_index(op.f("ix_leads_status_id"), "leads", ["status_id"], unique=False)

    # ── pipelines & pipeline_stages ──────────────────────────────────────────
    op.create_table(
        "pipelines",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.VARCHAR(length=150), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_default", sa.BOOLEAN(), server_default="false", nullable=False),
        sa.Column("is_active", sa.BOOLEAN(), server_default="true", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("workspace_id", "name", name="uq_workspace_pipeline_name"),
    )
    op.create_index(op.f("ix_pipelines_workspace_id"), "pipelines", ["workspace_id"], unique=False)

    op.create_table(
        "pipeline_stages",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("pipeline_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.VARCHAR(length=120), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("probability", sa.SMALLINT(), server_default="10", nullable=False),
        sa.Column("is_closed", sa.BOOLEAN(), server_default="false", nullable=False),
        sa.Column("is_won", sa.BOOLEAN(), server_default="false", nullable=False),
        sa.Column("color", sa.VARCHAR(length=20), nullable=True),
        sa.ForeignKeyConstraint(["pipeline_id"], ["pipelines.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_pipeline_stages_pipeline_id"), "pipeline_stages", ["pipeline_id"], unique=False)
    op.create_index(op.f("ix_pipeline_stages_sort_order"), "pipeline_stages", ["sort_order"], unique=False)

    # ── deals & deal_products ─────────────────────────────────────────────────
    op.create_table(
        "deals",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("pipeline_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("stage_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("primary_contact_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("owner_member_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("lead_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("name", sa.VARCHAR(length=255), nullable=False),
        sa.Column("value", sa.NUMERIC(precision=18, scale=2), server_default="0.0", nullable=False),
        sa.Column("expected_close_date", sa.DATE(), nullable=True),
        sa.Column("probability", sa.SMALLINT(), nullable=True),
        sa.Column("status", sa.VARCHAR(length=30), server_default="Open", nullable=False),
        sa.Column("loss_reason", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["lead_id"], ["leads.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["owner_member_id"], ["workspace_members.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["pipeline_id"], ["pipelines.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["primary_contact_id"], ["contacts.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["stage_id"], ["pipeline_stages.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_deals_workspace_id"), "deals", ["workspace_id"], unique=False)
    op.create_index(op.f("ix_deals_pipeline_id"), "deals", ["pipeline_id"], unique=False)
    op.create_index(op.f("ix_deals_stage_id"), "deals", ["stage_id"], unique=False)
    op.create_index(op.f("ix_deals_company_id"), "deals", ["company_id"], unique=False)
    op.create_index(op.f("ix_deals_owner_member_id"), "deals", ["owner_member_id"], unique=False)
    op.create_index(op.f("ix_deals_status"), "deals", ["status"], unique=False)

    op.create_table(
        "deal_products",
        sa.Column("deal_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_name", sa.VARCHAR(length=255), nullable=False),
        sa.Column("quantity", sa.NUMERIC(precision=12, scale=2), server_default="1.0", nullable=False),
        sa.Column("unit_price", sa.NUMERIC(precision=18, scale=2), server_default="0.0", nullable=False),
        sa.Column("discount_percent", sa.NUMERIC(precision=5, scale=2), server_default="0.0", nullable=False),
        sa.Column("line_total", sa.NUMERIC(precision=18, scale=2), server_default="0.0", nullable=False),
        sa.ForeignKeyConstraint(["deal_id"], ["deals.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("deal_id", "product_name"),
    )

    op.create_table(
        "lead_conversions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("lead_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("contact_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("deal_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("converted_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("converted_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["contact_id"], ["contacts.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["converted_by"], ["workspace_members.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["deal_id"], ["deals.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["lead_id"], ["leads.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("lead_id"),
    )

    # ── activities & tasks ────────────────────────────────────────────────────
    op.create_table(
        "activities",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("activity_type_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("actor_member_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("entity_type", sa.VARCHAR(length=50), nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.VARCHAR(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["activity_type_id"], ["activity_types.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["actor_member_id"], ["workspace_members.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_activities_workspace_id"), "activities", ["workspace_id"], unique=False)
    op.create_index(op.f("ix_activities_entity_type"), "activities", ["entity_type"], unique=False)
    op.create_index(op.f("ix_activities_entity_id"), "activities", ["entity_id"], unique=False)
    op.create_index(op.f("ix_activities_occurred_at"), "activities", ["occurred_at"], unique=False)

    op.create_table(
        "tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("owner_member_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assigned_member_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("entity_type", sa.VARCHAR(length=50), nullable=True),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.VARCHAR(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("priority", sa.VARCHAR(length=20), server_default="Medium", nullable=False),
        sa.Column("status", sa.VARCHAR(length=20), server_default="Open", nullable=False),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["assigned_member_id"], ["workspace_members.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["owner_member_id"], ["workspace_members.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_tasks_workspace_id"), "tasks", ["workspace_id"], unique=False)
    op.create_index(op.f("ix_tasks_owner_member_id"), "tasks", ["owner_member_id"], unique=False)
    op.create_index(op.f("ix_tasks_assigned_member_id"), "tasks", ["assigned_member_id"], unique=False)
    op.create_index(op.f("ix_tasks_status"), "tasks", ["status"], unique=False)
    op.create_index(op.f("ix_tasks_priority"), "tasks", ["priority"], unique=False)


def downgrade() -> None:
    op.drop_table("tasks")
    op.drop_table("activities")
    op.drop_table("lead_conversions")
    op.drop_table("deal_products")
    op.drop_table("deals")
    op.drop_table("pipeline_stages")
    op.drop_table("pipelines")
    op.drop_table("leads")
    op.drop_table("contacts")
    op.drop_table("companies")
    op.drop_table("activity_types")
    op.drop_table("lead_statuses")
    op.drop_table("lead_sources")
    op.drop_table("company_industries")
