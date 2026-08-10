"""
ForgeCRM API — Enterprise Deal Coach REST Endpoints (Phase 7.4.2)

Provides dedicated REST API entry points for Deal Coach capabilities.
Dispatches requests through SkillRegistry for unified execution.

Endpoints:
  POST /api/v1/ai/deal-coach         — Primary deal coach execution endpoint
  POST /api/v1/ai/deal-coach/health  — Quick deal health assessment endpoint
  POST /api/v1/ai/deal-coach/win-prob — Win probability prediction endpoint

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

router = APIRouter(prefix="/ai/deal-coach", tags=["AI Skills — Enterprise Deal Coach"])


@router.post(
    "",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Enterprise Deal Coach — Primary execution endpoint",
)
async def execute_deal_coach_skill(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """
    Executes any Deal Coach capability by dispatching through SkillRegistry.
    Supported skills: deal_health, win_probability, risk_detection, next_best_action,
    negotiation_strategy, closing_readiness, executive_summary, deal_blockers.
    """
    user, workspace = auth
    ws_id = workspace.id if workspace else user.id

    skill_req = SkillRequest(
        skill=payload.skill or "deal_health",
        skill_type="deal_coach",
        question=payload.question,
        entity_type=payload.entity_type or "deal",
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
    "/health",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Quick Deal Health Analysis",
)
async def analyze_deal_health(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """Dedicated endpoint for quick deal health assessment."""
    payload.skill = "deal_health"
    return await execute_deal_coach_skill(payload, auth, db)


@router.post(
    "/win-prob",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Win Probability Prediction",
)
async def predict_win_probability(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """Dedicated endpoint for win probability estimation."""
    payload.skill = "win_probability"
    return await execute_deal_coach_skill(payload, auth, db)
