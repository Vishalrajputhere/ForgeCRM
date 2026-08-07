"""Workflow Automation Engine Schema

Revision ID: 006_workflow_automation_schema
Revises: 005_bulk_operations_schema
Create Date: 2026-08-04 16:00:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "006_workflow_automation_schema"
down_revision: str | None = "005_bulk_operations_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ── automation_rules ───────────────────────────────────────────────────────
    op.create_table(
        "automation_rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("name", sa.VARCHAR(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.BOOLEAN(), server_default="false", nullable=False),
        sa.Column("trigger_event", sa.VARCHAR(length=100), nullable=False),
        sa.Column("trigger_entity_type", sa.VARCHAR(length=50), nullable=True),
        sa.Column("condition_logic", sa.VARCHAR(length=10), server_default="AND", nullable=False),
        sa.Column("total_runs", sa.Integer(), server_default="0", nullable=False),
        sa.Column("successful_runs", sa.Integer(), server_default="0", nullable=False),
        sa.Column("failed_runs", sa.Integer(), server_default="0", nullable=False),
        sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_automation_rules_workspace_id", "automation_rules", ["workspace_id"])
    op.create_index("ix_automation_rules_trigger_event", "automation_rules", ["trigger_event"])
    op.create_index("ix_automation_rules_is_active", "automation_rules", ["is_active"])

    # ── automation_conditions ──────────────────────────────────────────────────
    op.create_table(
        "automation_conditions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("rule_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("group_index", sa.Integer(), server_default="0", nullable=False),
        sa.Column("field_path", sa.VARCHAR(length=100), nullable=False),
        sa.Column("operator", sa.VARCHAR(length=30), nullable=False),
        sa.Column("value", sa.Text(), nullable=True),
        sa.Column("value_type", sa.VARCHAR(length=20), server_default="string", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["rule_id"], ["automation_rules.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_automation_conditions_rule_id", "automation_conditions", ["rule_id"])

    # ── automation_actions ─────────────────────────────────────────────────────
    op.create_table(
        "automation_actions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("rule_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("position", sa.Integer(), server_default="0", nullable=False),
        sa.Column("action_type", sa.VARCHAR(length=60), nullable=False),
        sa.Column("config", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["rule_id"], ["automation_rules.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_automation_actions_rule_id", "automation_actions", ["rule_id"])

    # ── automation_runs ────────────────────────────────────────────────────────
    op.create_table(
        "automation_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("rule_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("triggered_by_member_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("trigger_entity_type", sa.VARCHAR(length=50), nullable=True),
        sa.Column("trigger_entity_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", sa.VARCHAR(length=20), server_default="running", nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("actions_executed", sa.Integer(), server_default="0", nullable=False),
        sa.Column("actions_failed", sa.Integer(), server_default="0", nullable=False),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["rule_id"], ["automation_rules.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_automation_runs_rule_id", "automation_runs", ["rule_id"])
    op.create_index("ix_automation_runs_workspace_id", "automation_runs", ["workspace_id"])
    op.create_index("ix_automation_runs_status", "automation_runs", ["status"])
    op.create_index("ix_automation_runs_started_at", "automation_runs", ["started_at"])

    # ── automation_logs ────────────────────────────────────────────────────────
    op.create_table(
        "automation_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("run_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("action_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("action_type", sa.VARCHAR(length=60), nullable=False),
        sa.Column("position", sa.Integer(), server_default="0", nullable=False),
        sa.Column("status", sa.VARCHAR(length=20), server_default="success", nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("result_data", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["run_id"], ["automation_runs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_automation_logs_run_id", "automation_logs", ["run_id"])

    # ── automation_templates ───────────────────────────────────────────────────
    op.create_table(
        "automation_templates",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.VARCHAR(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.VARCHAR(length=80), nullable=False),
        sa.Column("trigger_event", sa.VARCHAR(length=100), nullable=False),
        sa.Column("trigger_entity_type", sa.VARCHAR(length=50), nullable=True),
        sa.Column("template_config", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("is_featured", sa.BOOLEAN(), server_default="false", nullable=False),
        sa.Column("use_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_automation_templates_category", "automation_templates", ["category"])


def downgrade() -> None:
    op.drop_index("ix_automation_templates_category", table_name="automation_templates")
    op.drop_table("automation_templates")
    op.drop_index("ix_automation_logs_run_id", table_name="automation_logs")
    op.drop_table("automation_logs")
    op.drop_index("ix_automation_runs_started_at", table_name="automation_runs")
    op.drop_index("ix_automation_runs_status", table_name="automation_runs")
    op.drop_index("ix_automation_runs_workspace_id", table_name="automation_runs")
    op.drop_index("ix_automation_runs_rule_id", table_name="automation_runs")
    op.drop_table("automation_runs")
    op.drop_index("ix_automation_actions_rule_id", table_name="automation_actions")
    op.drop_table("automation_actions")
    op.drop_index("ix_automation_conditions_rule_id", table_name="automation_conditions")
    op.drop_table("automation_conditions")
    op.drop_index("ix_automation_rules_is_active", table_name="automation_rules")
    op.drop_index("ix_automation_rules_trigger_event", table_name="automation_rules")
    op.drop_index("ix_automation_rules_workspace_id", table_name="automation_rules")
    op.drop_table("automation_rules")
