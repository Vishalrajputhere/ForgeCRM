"""
ForgeCRM API — Autonomous AI Agent Runtime SQLAlchemy 2 Models

Defines AgentExecution, AgentPlanModel, AgentStepModel, AgentCheckpoint, and AgentMetrics.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AgentExecution(Base):
    """Stores overall agent goal execution lifecycle state and tracking metadata."""

    __tablename__ = "ai_agent_executions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    goal: Mapped[str] = mapped_column(Text, nullable=False)
    state: Mapped[str] = mapped_column(String(32), nullable=False, default="Created", index=True)  # Created, Planning, Waiting Approval, Running, Paused, Retrying, Completed, Failed, Cancelled, Rolled Back
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    plan = relationship("AgentPlanModel", back_populates="execution", uselist=False, cascade="all, delete-orphan")
    steps = relationship("AgentStepModel", back_populates="execution", cascade="all, delete-orphan")
    checkpoints = relationship("AgentCheckpoint", back_populates="execution", cascade="all, delete-orphan")


class AgentPlanModel(Base):
    """Stores decomposed DAG plan details."""

    __tablename__ = "ai_agent_plans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    execution_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("ai_agent_executions.id", ondelete="CASCADE"), nullable=False, index=True)
    goal: Mapped[str] = mapped_column(Text, nullable=False)
    dag_graph_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    total_steps: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    execution = relationship("AgentExecution", back_populates="plan")


class AgentStepModel(Base):
    """Stores individual DAG step execution state and outputs."""

    __tablename__ = "ai_agent_steps"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    execution_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("ai_agent_executions.id", ondelete="CASCADE"), nullable=False, index=True)
    step_key: Mapped[str] = mapped_column(String(64), nullable=False)  # step_1, step_2
    title: Mapped[str] = mapped_column(String(128), nullable=False)
    tool_name: Mapped[str] = mapped_column(String(64), nullable=False)
    inputs_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    outputs_json: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")  # pending, running, completed, failed, rolled_back
    retry_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    execution = relationship("AgentExecution", back_populates="steps")


class AgentCheckpoint(Base):
    """Resumable state snapshot serialized after every step execution."""

    __tablename__ = "ai_agent_checkpoints"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    execution_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("ai_agent_executions.id", ondelete="CASCADE"), nullable=False, index=True)
    step_key: Mapped[str] = mapped_column(String(64), nullable=False)
    state_snapshot_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    execution = relationship("AgentExecution", back_populates="checkpoints")
