"""
ForgeCRM API — Workflow Automation Module

SQLAlchemy models for the Enterprise Workflow Automation Engine.

Documentation: docs/03_Backend/310_AUTOMATION_ENGINE.md
"""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import BOOLEAN, INTEGER, VARCHAR, DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, BaseModel, TimestampMixin, UUIDPrimaryKeyMixin


# ── AutomationRule ─────────────────────────────────────────────────────────────


class AutomationRule(BaseModel):
    """
    Master workflow automation rule definition.

    Defines when to trigger (trigger_event + trigger_entity_type),
    how to evaluate conditions (condition_logic), and tracks runtime stats.
    Child relationships load conditions and actions.
    """

    __tablename__ = "automation_rules"

    workspace_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(BOOLEAN, default=False, server_default="false", nullable=False, index=True)

    # Trigger definition
    trigger_event: Mapped[str] = mapped_column(VARCHAR(100), nullable=False, index=True)
    trigger_entity_type: Mapped[str | None] = mapped_column(VARCHAR(50), nullable=True)

    # Condition evaluation logic: AND | OR
    condition_logic: Mapped[str] = mapped_column(VARCHAR(10), default="AND", server_default="AND", nullable=False)

    # Execution statistics (denormalized for fast dashboard rendering)
    total_runs: Mapped[int] = mapped_column(INTEGER, default=0, server_default="0", nullable=False)
    successful_runs: Mapped[int] = mapped_column(INTEGER, default=0, server_default="0", nullable=False)
    failed_runs: Mapped[int] = mapped_column(INTEGER, default=0, server_default="0", nullable=False)
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    conditions: Mapped[list[AutomationCondition]] = relationship(
        "AutomationCondition",
        back_populates="rule",
        cascade="all, delete-orphan",
        order_by="AutomationCondition.group_index",
    )
    actions: Mapped[list[AutomationAction]] = relationship(
        "AutomationAction",
        back_populates="rule",
        cascade="all, delete-orphan",
        order_by="AutomationAction.position",
    )
    runs: Mapped[list[AutomationRun]] = relationship(
        "AutomationRun",
        back_populates="rule",
        cascade="all, delete-orphan",
        order_by="AutomationRun.started_at.desc()",
    )


# ── AutomationCondition ────────────────────────────────────────────────────────


class AutomationCondition(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    A single condition predicate for an automation rule.

    field_path is a dotted path into the trigger entity data (e.g. 'lead.status').
    Conditions in the same group_index are ANDed together.
    Different group_indexes are ORed (when condition_logic is OR).
    """

    __tablename__ = "automation_conditions"

    rule_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("automation_rules.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    group_index: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    field_path: Mapped[str] = mapped_column(VARCHAR(100), nullable=False)
    operator: Mapped[str] = mapped_column(VARCHAR(30), nullable=False)
    value: Mapped[str | None] = mapped_column(Text, nullable=True)
    value_type: Mapped[str] = mapped_column(VARCHAR(20), default="string", server_default="string", nullable=False)

    # Relationships
    rule: Mapped[AutomationRule] = relationship("AutomationRule", back_populates="conditions")


# ── AutomationAction ───────────────────────────────────────────────────────────


class AutomationAction(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    An ordered action step within an automation rule.

    action_type determines what the engine does.
    config is a JSONB blob specific to the action_type.
    position controls execution order.
    """

    __tablename__ = "automation_actions"

    rule_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("automation_rules.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    position: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    action_type: Mapped[str] = mapped_column(VARCHAR(60), nullable=False)
    config: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict, server_default="{}")

    # Relationships
    rule: Mapped[AutomationRule] = relationship("AutomationRule", back_populates="actions")


# ── AutomationRun ──────────────────────────────────────────────────────────────


class AutomationRun(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Immutable execution record for one invocation of an automation rule.

    Created at the start of each run and updated on completion.
    """

    __tablename__ = "automation_runs"

    rule_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("automation_rules.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    workspace_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    triggered_by_member_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), nullable=True)
    trigger_entity_type: Mapped[str | None] = mapped_column(VARCHAR(50), nullable=True)
    trigger_entity_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), nullable=True)

    # Execution state
    status: Mapped[str] = mapped_column(VARCHAR(20), default="running", server_default="running", nullable=False, index=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    actions_executed: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    actions_failed: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    rule: Mapped[AutomationRule] = relationship("AutomationRule", back_populates="runs")
    logs: Mapped[list[AutomationLog]] = relationship(
        "AutomationLog",
        back_populates="run",
        cascade="all, delete-orphan",
        order_by="AutomationLog.position",
    )


# ── AutomationLog ──────────────────────────────────────────────────────────────


class AutomationLog(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Per-step action execution log within a single automation run."""

    __tablename__ = "automation_logs"

    run_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("automation_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    action_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), nullable=True)
    action_type: Mapped[str] = mapped_column(VARCHAR(60), nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    status: Mapped[str] = mapped_column(VARCHAR(20), default="success", server_default="success", nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    result_data: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Relationships
    run: Mapped[AutomationRun] = relationship("AutomationRun", back_populates="logs")


# ── AutomationTemplate ─────────────────────────────────────────────────────────


class AutomationTemplate(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Pre-built automation recipe. Global (no workspace_id).

    Users copy a template to create their own rule via POST /automation-templates/{id}/use.
    template_config contains the full rule definition (conditions + actions).
    """

    __tablename__ = "automation_templates"

    name: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(VARCHAR(80), nullable=False, index=True)
    trigger_event: Mapped[str] = mapped_column(VARCHAR(100), nullable=False)
    trigger_entity_type: Mapped[str | None] = mapped_column(VARCHAR(50), nullable=True)
    template_config: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict, server_default="{}")
    is_featured: Mapped[bool] = mapped_column(BOOLEAN, default=False, server_default="false", nullable=False)
    use_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)


__all__ = [
    "AutomationAction",
    "AutomationCondition",
    "AutomationLog",
    "AutomationRule",
    "AutomationRun",
    "AutomationTemplate",
]
