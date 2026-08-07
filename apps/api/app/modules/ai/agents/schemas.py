"""
ForgeCRM API — Autonomous AI Agent Runtime Pydantic V2 Schemas

Defines Agent Goal, Plan, Step, DAG Nodes, Execution Result, and Checkpoint schemas.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class PlanStepSchema(BaseModel):
    """DAG Plan Node representation."""

    id: str = Field(..., description="Unique step identifier within the DAG, e.g. step_1")
    title: str = Field(..., description="Human-readable title of step")
    description: str = Field(..., description="Detailed step objective")
    tool: str = Field(..., description="Target MCP tool name")
    inputs: dict[str, Any] = Field(default_factory=dict, description="Input parameters")
    compensation_tool: str | None = Field(None, description="Compensation tool name for rollback")
    compensation_inputs: dict[str, Any] = Field(default_factory=dict, description="Compensation inputs")
    depends_on: list[str] = Field(default_factory=list, description="IDs of prerequisite steps")
    retry_count: int = Field(default=0, description="Current retry attempt")
    max_retries: int = Field(default=3, description="Maximum allowed retries")
    timeout_seconds: int = Field(default=60, description="Step execution timeout")
    approval_required: bool = Field(default=False, description="Requires Tier 3 Human Approval")
    status: Literal["pending", "running", "completed", "failed", "retrying", "rolled_back", "skipped"] = "pending"
    output: dict[str, Any] | None = None
    error: str | None = None


class AgentPlanSchema(BaseModel):
    """Decomposed DAG Plan."""

    plan_id: uuid.UUID = Field(default_factory=uuid.uuid4)
    goal: str
    steps: list[PlanStepSchema]
    total_steps: int
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AgentExecutionCreate(BaseModel):
    """Request payload to trigger autonomous agent goal execution."""

    goal: str = Field(..., description="High-level goal description")
    active_route: str | None = Field(None, description="Current UI page route")
    entity_type: str | None = Field(None, description="Active entity context type")
    entity_id: uuid.UUID | None = Field(None, description="Active entity context ID")


class AgentExecutionStatus(BaseModel):
    """Agent execution state response payload."""

    execution_id: uuid.UUID
    workspace_id: uuid.UUID
    user_id: uuid.UUID
    goal: str
    state: Literal[
        "Created",
        "Planning",
        "Waiting Approval",
        "Running",
        "Paused",
        "Retrying",
        "Completed",
        "Failed",
        "Cancelled",
        "Rolled Back",
    ]
    completed_steps: int
    total_steps: int
    current_step: str | None = None
    plan: AgentPlanSchema | None = None
    error: str | None = None
    created_at: datetime
