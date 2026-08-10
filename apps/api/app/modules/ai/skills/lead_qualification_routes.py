"""
ForgeCRM API — Enterprise Lead Qualification REST Endpoints (Phase 7.4.3)

Provides dedicated REST API entry points for Lead Qualification capabilities.
Dispatches requests through SkillRegistry for unified execution.

Endpoints:
  POST /api/v1/ai/lead-qualification           — Primary lead qualification endpoint
  POST /api/v1/ai/lead-qualification/score     — Lead scoring endpoint (fit + intent)
  POST /api/v1/ai/lead-qualification/qualify   — Full BANT qualification endpoint
  POST /api/v1/ai/lead-qualification/icp       — ICP match scoring endpoint
  POST /api/v1/ai/lead-qualification/follow-up — Follow-up strategy endpoint

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

router = APIRouter(prefix="/ai/lead-qualification", tags=["AI Skills — Lead Qualification"])


@router.post(
    "",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Enterprise Lead Qualification — Primary execution endpoint",
)
async def execute_lead_qualification_skill(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """
    Executes any Lead Qualification capability by dispatching through SkillRegistry.
    Supported skills: qualify_lead, lead_score, fit_score, intent_score, icp_match,
    buying_signals, urgency_detection, follow_up_strategy, qualification_summary.
    """
    user, workspace = auth
    ws_id = workspace.id if workspace else user.id

    skill_req = SkillRequest(
        skill=payload.skill or "qualify_lead",
        skill_type="lead_qualification",
        question=payload.question,
        entity_type=payload.entity_type or "lead",
        entity_id=payload.entity_id,
        entity_name=payload.entity_name,
        focus_areas=payload.focus_areas,
        time_window=payload.time_window,
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
    "/score",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Composite Lead Scoring (Fit + Intent)",
)
async def score_lead(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """Dedicated endpoint for composite lead scoring."""
    payload.skill = "lead_score"
    return await execute_lead_qualification_skill(payload, auth, db)


@router.post(
    "/qualify",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Full BANT Lead Qualification",
)
async def qualify_lead(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """Dedicated endpoint for full BANT qualification."""
    payload.skill = "qualify_lead"
    return await execute_lead_qualification_skill(payload, auth, db)


@router.post(
    "/icp",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Ideal Customer Profile (ICP) Match Assessment",
)
async def assess_icp_match(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """Dedicated endpoint for ICP alignment scoring."""
    payload.skill = "icp_match"
    return await execute_lead_qualification_skill(payload, auth, db)


@router.post(
    "/follow-up",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Personalised Outreach & Follow-up Strategy",
)
async def generate_follow_up_strategy(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """Dedicated endpoint for personalised outreach sequence generation."""
    payload.skill = "follow_up_strategy"
    return await execute_lead_qualification_skill(payload, auth, db)
