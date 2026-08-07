"""
ForgeCRM API — Workflow Automation REST Routes

Provides the full automation management API for workspace administrators.

Endpoints:
  GET    /automations                          — List all rules
  POST   /automations                          — Create rule
  GET    /automations/{rule_id}                — Get rule detail
  PATCH  /automations/{rule_id}                — Update rule
  DELETE /automations/{rule_id}                — Soft-delete rule
  POST   /automations/{rule_id}/toggle         — Enable/disable
  POST   /automations/{rule_id}/test           — Manual test trigger
  GET    /automations/{rule_id}/runs           — Execution history
  GET    /automations/{rule_id}/runs/{run_id}  — Run detail with logs
  GET    /automation-templates                 — List templates
  POST   /automation-templates/{id}/use        — Create rule from template

Documentation: docs/03_Backend/310_AUTOMATION_ENGINE.md §5 (API)
"""

from __future__ import annotations

from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import (
    get_current_user,
    get_current_workspace_id,
    get_current_workspace_member,
)
from app.db.session import get_db_session
from app.modules.automation.schemas import (
    AutomationRuleCreate,
    AutomationRuleResponse,
    AutomationRuleSummary,
    AutomationRunResponse,
    AutomationTemplateResponse,
    TestAutomationRequest,
    TestAutomationResponse,
    ToggleResponse,
    UseTemplateRequest,
)
from app.modules.automation.service import AutomationService

router = APIRouter(prefix="", tags=["Workflow Automation"])

# Dependency aliases
WorkspaceIdDep = Annotated[UUID, Depends(get_current_workspace_id)]
WorkspaceMemberDep = Annotated[Any, Depends(get_current_workspace_member)]


# ── Automation Schema Registry ──────────────────────────────────────────────────


@router.get(
    "/automations/schema",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Get Automation Schema Registry",
    description="Get single source of truth metadata schema for all entity trigger events, fields, and allowed operators.",
)
async def get_automation_schema(
    _user: Annotated[Any, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict:
    service = AutomationService(db)
    return await service.get_schema()


# ── Automation Rules ───────────────────────────────────────────────────────────


@router.get(
    "/automations",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="List Automation Rules",
    description="List all automation rules for the current workspace with pagination.",
)
async def list_automations(
    workspace_id: WorkspaceIdDep,
    _member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    search: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
) -> dict:
    service = AutomationService(db)
    return await service.list_rules(
        workspace_id=workspace_id,
        page=page,
        page_size=page_size,
        search=search,
        is_active=is_active,
    )


@router.post(
    "/automations",
    response_model=AutomationRuleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Automation Rule",
    description="Create a new automation rule with trigger, conditions, and actions.",
)
async def create_automation(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    payload: AutomationRuleCreate,
) -> AutomationRuleResponse:
    service = AutomationService(db)
    return await service.create_rule(
        workspace_id=workspace_id,
        member_id=member.id,
        payload=payload,
    )


@router.get(
    "/automations/{rule_id}",
    response_model=AutomationRuleResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Automation Rule",
    description="Fetch a single automation rule with all conditions and actions.",
)
async def get_automation(
    rule_id: UUID,
    workspace_id: WorkspaceIdDep,
    _member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> AutomationRuleResponse:
    service = AutomationService(db)
    return await service.get_rule(workspace_id=workspace_id, rule_id=rule_id)


@router.patch(
    "/automations/{rule_id}",
    response_model=AutomationRuleResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Automation Rule",
    description="Partially update an automation rule. Providing conditions/actions replaces the existing set.",
)
async def update_automation(
    rule_id: UUID,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    payload: dict[str, Any],
) -> AutomationRuleResponse:
    service = AutomationService(db)
    return await service.update_rule(
        workspace_id=workspace_id,
        rule_id=rule_id,
        member_id=member.id,
        payload=payload,
    )


@router.delete(
    "/automations/{rule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Automation Rule",
    description="Soft-delete an automation rule. Run history is preserved.",
)
async def delete_automation(
    rule_id: UUID,
    workspace_id: WorkspaceIdDep,
    _member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    service = AutomationService(db)
    await service.delete_rule(workspace_id=workspace_id, rule_id=rule_id)


@router.post(
    "/automations/{rule_id}/toggle",
    response_model=ToggleResponse,
    status_code=status.HTTP_200_OK,
    summary="Toggle Automation Rule",
    description="Enable or disable an automation rule.",
)
async def toggle_automation(
    rule_id: UUID,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> ToggleResponse:
    service = AutomationService(db)
    return await service.toggle_rule(
        workspace_id=workspace_id,
        rule_id=rule_id,
        member_id=member.id,
    )


@router.post(
    "/automations/{rule_id}/test",
    response_model=TestAutomationResponse,
    status_code=status.HTTP_200_OK,
    summary="Test Automation Rule",
    description="Manually trigger an automation rule with simulated data to verify behavior.",
)
async def test_automation(
    rule_id: UUID,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    payload: TestAutomationRequest,
) -> TestAutomationResponse:
    service = AutomationService(db)
    return await service.test_rule(
        workspace_id=workspace_id,
        rule_id=rule_id,
        member_id=member.id,
        payload=payload,
    )


# ── Run History ────────────────────────────────────────────────────────────────


@router.get(
    "/automations/{rule_id}/runs",
    response_model=list[AutomationRunResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Automation Run History",
    description="List execution runs for an automation rule.",
)
async def list_automation_runs(
    rule_id: UUID,
    workspace_id: WorkspaceIdDep,
    _member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> list[AutomationRunResponse]:
    service = AutomationService(db)
    return await service.get_run_history(
        workspace_id=workspace_id,
        rule_id=rule_id,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/automations/{rule_id}/runs/{run_id}",
    response_model=AutomationRunResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Automation Run Detail",
    description="Fetch a single automation run with per-step action logs.",
)
async def get_automation_run(
    rule_id: UUID,
    run_id: UUID,
    workspace_id: WorkspaceIdDep,
    _member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> AutomationRunResponse:
    service = AutomationService(db)
    return await service.get_run_with_logs(
        workspace_id=workspace_id,
        rule_id=rule_id,
        run_id=run_id,
    )


# ── Templates ──────────────────────────────────────────────────────────────────


@router.get(
    "/automation-templates",
    response_model=list[AutomationTemplateResponse],
    status_code=status.HTTP_200_OK,
    summary="List Automation Templates",
    description="List all available pre-built automation templates.",
)
async def list_automation_templates(
    workspace_id: WorkspaceIdDep,
    _member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    category: str | None = Query(default=None),
) -> list[AutomationTemplateResponse]:
    service = AutomationService(db)
    return await service.list_templates(category=category)


@router.post(
    "/automation-templates/{template_id}/use",
    response_model=AutomationRuleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Rule from Template",
    description="Create a new automation rule by copying a pre-built template.",
)
async def use_automation_template(
    template_id: UUID,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    payload: UseTemplateRequest,
) -> AutomationRuleResponse:
    service = AutomationService(db)
    return await service.create_rule_from_template(
        workspace_id=workspace_id,
        template_id=template_id,
        member_id=member.id,
        payload=payload,
    )
