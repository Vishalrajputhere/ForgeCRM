"""
ForgeCRM API — Enterprise Executive Copilot REST Endpoints (Phase 7.4.6)

Provides dedicated REST API entry points for Executive Copilot capabilities.
Dispatches requests through SkillRegistry for unified execution.

Endpoints:
  POST /api/v1/ai/executive                 — Primary executive execution endpoint
  POST /api/v1/ai/executive/dashboard       — Executive dashboard synthesis endpoint
  POST /api/v1/ai/executive/company-health  — Company health score endpoint
  POST /api/v1/ai/executive/board-report    — Quarterly board of directors report endpoint
  POST /api/v1/ai/executive/weekly          — Weekly executive briefing endpoint
  POST /api/v1/ai/executive/quarterly       — Quarterly performance review endpoint
  POST /api/v1/ai/executive/pipeline        — Executive pipeline health summary endpoint
  POST /api/v1/ai/executive/opportunities   — Strategic growth opportunities endpoint

Documentation: docs/03_Backend/302_API_DESIGN.md
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user_and_workspace
from app.db.engine import get_db
from app.modules.ai.skills.registry import SkillRegistry
from app.modules.ai.skills.schemas import CopilotRequest, SkillRequest, SkillResponse
from app.modules.identity.models import User
from app.modules.workspace.models import Workspace

router = APIRouter(prefix="/ai/executive", tags=["AI Skills — Enterprise Executive Copilot"])


@router.post(
    "",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Enterprise Executive Copilot — Primary execution endpoint",
)
async def execute_executive_skill(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """
    Executes any Executive Copilot capability by dispatching through SkillRegistry.
    Supported skills: executive_dashboard, company_health, board_report, weekly_summary,
    quarterly_review, pipeline_summary, strategic_opportunities, executive_next_actions.
    """
    user, workspace = auth
    ws_id = workspace.id if workspace else user.id

    skill_req = SkillRequest(
        skill=payload.skill or "executive_dashboard",
        skill_type="executive_copilot",
        question=payload.question,
        entity_type=payload.entity_type or "workspace",
        entity_id=payload.entity_id,
        entity_name=payload.entity_name,
        focus_areas=payload.focus_areas,
        time_window=payload.time_window or "Q3 2026",
        provider=payload.provider,
        model=payload.model,
    )

    return await SkillRegistry.dispatch(
        request=skill_req,
        workspace_id=ws_id,
        workspace_name=getattr(workspace, "name", "Workspace"),
        user_id=user.id,
        user_role=getattr(user, "role", "member"),
        db=db,
    )


@router.post(
    "/dashboard",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Executive Dashboard Synthesis",
)
async def get_executive_dashboard(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """Dedicated endpoint for executive dashboard synthesis."""
    payload.skill = "executive_dashboard"
    return await execute_executive_skill(payload, auth, db)


@router.post(
    "/company-health",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Company Commercial Health Diagnostic",
)
async def assess_company_health(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """Dedicated endpoint for company commercial health scoring."""
    payload.skill = "company_health"
    return await execute_executive_skill(payload, auth, db)


@router.post(
    "/board-report",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Quarterly Board of Directors Report",
)
async def generate_board_report(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """Dedicated endpoint for formal quarterly board report generation."""
    payload.skill = "board_report"
    return await execute_executive_skill(payload, auth, db)


@router.post(
    "/weekly",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Weekly Executive Briefing",
)
async def get_weekly_summary(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """Dedicated endpoint for weekly executive pipeline briefing."""
    payload.skill = "weekly_summary"
    return await execute_executive_skill(payload, auth, db)


@router.post(
    "/quarterly",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Quarterly Business Review",
)
async def review_quarterly_performance(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """Dedicated endpoint for quarterly performance reviews."""
    payload.skill = "quarterly_review"
    return await execute_executive_skill(payload, auth, db)


@router.post(
    "/pipeline",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Executive Pipeline Summary",
)
async def get_executive_pipeline_summary(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """Dedicated endpoint for executive pipeline health summary."""
    payload.skill = "pipeline_summary"
    return await execute_executive_skill(payload, auth, db)


@router.post(
    "/opportunities",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Strategic Growth Opportunities",
)
async def identify_strategic_opportunities(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """Dedicated endpoint for strategic growth opportunities identification."""
    payload.skill = "strategic_opportunities"
    return await execute_executive_skill(payload, auth, db)
