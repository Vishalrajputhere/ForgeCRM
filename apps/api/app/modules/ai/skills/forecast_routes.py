"""
ForgeCRM API — Enterprise Forecast AI REST Endpoints (Phase 7.4.4)

Provides dedicated REST API entry points for Forecast AI capabilities.
Dispatches requests through SkillRegistry for unified execution.

Endpoints:
  POST /api/v1/ai/forecast           — Primary forecast execution endpoint
  POST /api/v1/ai/forecast/revenue   — Revenue forecast endpoint
  POST /api/v1/ai/forecast/pipeline  — Pipeline coverage forecast endpoint
  POST /api/v1/ai/forecast/scenario  — What-if scenario simulation endpoint
  POST /api/v1/ai/forecast/churn     — Churn & retention forecast endpoint
  POST /api/v1/ai/forecast/expansion — Account expansion forecast endpoint
  POST /api/v1/ai/forecast/executive — Board executive forecast briefing endpoint

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

router = APIRouter(prefix="/ai/forecast", tags=["AI Skills — Forecast AI & Revenue Intelligence"])


@router.post(
    "",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Enterprise Forecast AI — Primary execution endpoint",
)
async def execute_forecast_skill(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """
    Executes any Forecast AI capability by dispatching through SkillRegistry.
    Supported skills: revenue_forecast, pipeline_forecast, scenario_analysis,
    churn_prediction, expansion_prediction, executive_forecast, forecast_summary.
    """
    user, workspace = auth
    ws_id = workspace.id if workspace else user.id

    skill_req = SkillRequest(
        skill=payload.skill or "revenue_forecast",
        skill_type="forecast_ai",
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
    "/revenue",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Revenue Prediction & Quota Attainment",
)
async def forecast_revenue(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """Dedicated endpoint for revenue forecast predictions."""
    payload.skill = "revenue_forecast"
    return await execute_forecast_skill(payload, auth, db)


@router.post(
    "/pipeline",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Pipeline Coverage & Velocity Forecast",
)
async def forecast_pipeline(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """Dedicated endpoint for pipeline coverage forecasting."""
    payload.skill = "pipeline_forecast"
    return await execute_forecast_skill(payload, auth, db)


@router.post(
    "/scenario",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="What-If Scenario Simulation (Best/Expected/Worst)",
)
async def simulate_scenarios(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """Dedicated endpoint for what-if scenario simulations."""
    payload.skill = "scenario_analysis"
    return await execute_forecast_skill(payload, auth, db)


@router.post(
    "/churn",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Churn Risk & Net Retention Forecast",
)
async def predict_churn(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """Dedicated endpoint for customer churn prediction."""
    payload.skill = "churn_prediction"
    return await execute_forecast_skill(payload, auth, db)


@router.post(
    "/expansion",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Account Expansion & Upsell Forecast",
)
async def forecast_expansion(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """Dedicated endpoint for account expansion forecasting."""
    payload.skill = "expansion_prediction"
    return await execute_forecast_skill(payload, auth, db)


@router.post(
    "/executive",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Board Executive Forecast Briefing",
)
async def generate_executive_forecast(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """Dedicated endpoint for board-level executive forecast briefings."""
    payload.skill = "executive_forecast"
    return await execute_forecast_skill(payload, auth, db)
