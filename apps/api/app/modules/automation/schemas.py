"""
ForgeCRM API — Workflow Automation Pydantic Schemas

Request/response DTOs for the Automation Engine REST API.
Mirrors the backend SQLAlchemy models.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ── Enumerations (literal unions — avoids Enum import overhead) ─────────────────

TriggerEvent = Literal[
    "LEAD_CREATED", "LEAD_UPDATED", "LEAD_CONVERTED",
    "DEAL_CREATED", "DEAL_UPDATED", "DEAL_STAGE_CHANGED",
    "TASK_CREATED", "TASK_COMPLETED",
    "CONTACT_CREATED", "CONTACT_UPDATED",
    "COMPANY_CREATED", "COMPANY_UPDATED",
    "PIPELINE_CHANGED",
    "MEMBER_JOINED",
    "FILE_UPLOADED",
    "MANUAL",
    "SCHEDULED",
]

ConditionOperator = Literal[
    "EQUALS", "NOT_EQUALS",
    "CONTAINS", "NOT_CONTAINS",
    "STARTS_WITH", "ENDS_WITH",
    "GREATER_THAN", "LESS_THAN",
    "GREATER_OR_EQUAL", "LESS_OR_EQUAL",
    "EMPTY", "NOT_EMPTY",
]

ActionType = Literal[
    "CREATE_TASK",
    "UPDATE_LEAD", "UPDATE_COMPANY", "UPDATE_CONTACT", "UPDATE_DEAL",
    "MOVE_DEAL_STAGE",
    "ASSIGN_OWNER",
    "SEND_EMAIL", "SEND_NOTIFICATION",
    "CREATE_ACTIVITY",
    "ADD_TAG", "REMOVE_TAG",
    "ARCHIVE_RECORD",
    "CREATE_FOLLOWUP_TASK",
    "WEBHOOK",
]

RunStatus = Literal["running", "success", "failed", "skipped"]
ConditionLogic = Literal["AND", "OR"]
ValueType = Literal["string", "number", "boolean", "date"]


# ── Condition Schemas ──────────────────────────────────────────────────────────


class AutomationConditionCreate(BaseModel):
    """Payload for creating a single condition predicate."""

    group_index: int = Field(default=0, ge=0, description="Condition group index. Same group = AND. Diff groups = OR.")
    field_path: str = Field(..., min_length=1, max_length=100, description="Dotted path into trigger data e.g. 'status', 'value'")
    operator: ConditionOperator
    value: str | None = Field(default=None, description="Comparison value. NULL for EMPTY/NOT_EMPTY operators.")
    value_type: ValueType = Field(default="string")


class AutomationConditionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    rule_id: UUID
    group_index: int
    field_path: str
    operator: str
    value: str | None
    value_type: str
    created_at: datetime


# ── Action Schemas ─────────────────────────────────────────────────────────────


class AutomationActionCreate(BaseModel):
    """Payload for a single action step."""

    position: int = Field(default=0, ge=0)
    action_type: ActionType
    config: dict[str, Any] = Field(default_factory=dict, description="Action-specific configuration payload.")


class AutomationActionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    rule_id: UUID
    position: int
    action_type: str
    config: dict[str, Any]
    created_at: datetime


# ── Rule Schemas ───────────────────────────────────────────────────────────────


class AutomationRuleCreate(BaseModel):
    """Payload for creating a new automation rule."""

    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    is_active: bool = True
    trigger_event: TriggerEvent
    trigger_entity_type: str | None = Field(default=None, max_length=50)
    condition_logic: ConditionLogic = "AND"
    conditions: list[AutomationConditionCreate] = Field(default_factory=list)
    actions: list[AutomationActionCreate] = Field(default_factory=list, min_length=1)


class AutomationRuleUpdate(BaseModel):
    """Payload for updating an existing automation rule (all optional)."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    is_active: bool | None = None
    trigger_event: TriggerEvent | None = None
    trigger_entity_type: str | None = None
    condition_logic: ConditionLogic | None = None
    conditions: list[AutomationConditionCreate] | None = None
    actions: list[AutomationActionCreate] | None = None


class AutomationRuleResponse(BaseModel):
    """Full automation rule representation."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    name: str
    description: str | None
    is_active: bool
    trigger_event: str
    trigger_entity_type: str | None
    condition_logic: str
    total_runs: int
    successful_runs: int
    failed_runs: int
    last_run_at: datetime | None
    conditions: list[AutomationConditionResponse]
    actions: list[AutomationActionResponse]
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None


class AutomationRuleSummary(BaseModel):
    """Lightweight rule summary for list views."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None
    is_active: bool
    trigger_event: str
    trigger_entity_type: str | None
    total_runs: int
    successful_runs: int
    failed_runs: int
    last_run_at: datetime | None
    created_at: datetime
    updated_at: datetime


# ── Run Schemas ────────────────────────────────────────────────────────────────


class AutomationLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    run_id: UUID
    action_id: UUID | None
    action_type: str
    position: int
    status: str
    message: str | None
    result_data: dict[str, Any] | None
    duration_ms: int | None
    created_at: datetime


class AutomationRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    rule_id: UUID
    workspace_id: UUID
    triggered_by_member_id: UUID | None
    trigger_entity_type: str | None
    trigger_entity_id: UUID | None
    status: str
    error_message: str | None
    actions_executed: int
    actions_failed: int
    duration_ms: int | None
    started_at: datetime
    finished_at: datetime | None
    logs: list[AutomationLogResponse] = Field(default_factory=list)


# ── Template Schemas ───────────────────────────────────────────────────────────


class AutomationTemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None
    category: str
    trigger_event: str
    trigger_entity_type: str | None
    template_config: dict[str, Any]
    is_featured: bool
    use_count: int
    created_at: datetime


class UseTemplateRequest(BaseModel):
    """Request to create a rule from a template."""

    name: str | None = Field(default=None, min_length=1, max_length=255, description="Override template name.")


# ── Test Trigger Schema ────────────────────────────────────────────────────────


class TestAutomationRequest(BaseModel):
    """Payload for manually testing an automation rule."""

    trigger_data: dict[str, Any] = Field(
        default_factory=dict,
        description="Simulated trigger entity data for condition evaluation.",
    )


class ConditionEvaluationDetail(BaseModel):
    """Granular condition evaluation result for rule debugger ('Explain Why')."""

    field_path: str
    operator: str
    expected_value: Any
    actual_value: Any
    result: bool
    explanation: str


class TestAutomationResponse(BaseModel):
    """Result of a manual test trigger."""

    rule_id: UUID
    run_id: UUID
    status: str
    conditions_passed: bool
    actions_executed: int
    actions_failed: int
    duration_ms: int | None
    logs: list[AutomationLogResponse]
    evaluation_details: list[ConditionEvaluationDetail] = Field(default_factory=list)


# ── Toggle Schema ──────────────────────────────────────────────────────────────


class ToggleResponse(BaseModel):
    id: UUID
    is_active: bool
    message: str


# ── Schema Registry DTOs ───────────────────────────────────────────────────────


class FieldMetadataResponse(BaseModel):
    key: str
    label: str
    type: str
    allowed_operators: list[str]
    options: list[dict[str, str]] | None = None
    description: str | None = None


class EntitySchemaResponse(BaseModel):
    entity_name: str
    label: str
    fields: list[FieldMetadataResponse]


class AutomationSchemaResponse(BaseModel):
    trigger_events: dict[str, EntitySchemaResponse]
    operators_by_type: dict[str, list[str]]
    alias_mappings: dict[str, str]


__all__ = [
    "ActionType",
    "AutomationActionCreate",
    "AutomationActionResponse",
    "AutomationConditionCreate",
    "AutomationConditionResponse",
    "AutomationLogResponse",
    "AutomationRuleCreate",
    "AutomationRuleResponse",
    "AutomationRuleSummary",
    "AutomationRunResponse",
    "AutomationSchemaResponse",
    "AutomationTemplateResponse",
    "ConditionEvaluationDetail",
    "ConditionLogic",
    "ConditionOperator",
    "EntitySchemaResponse",
    "FieldMetadataResponse",
    "RunStatus",
    "TestAutomationRequest",
    "TestAutomationResponse",
    "ToggleResponse",
    "TriggerEvent",
    "UseTemplateRequest",
    "ValueType",
]

