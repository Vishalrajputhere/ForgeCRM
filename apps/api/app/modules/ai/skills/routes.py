"""
ForgeCRM API — AI Skills REST Endpoints (Phase 7.4.1)

Provides the Enterprise Sales Copilot REST API endpoints.
All future AI Skill endpoints (DealCoach, ForecastAgent, etc.) are added here.

Endpoints:
  POST /api/v1/ai/copilot          — General CRM Q&A
  POST /api/v1/ai/copilot/account  — Executive account summary
  POST /api/v1/ai/copilot/opportunity — Opportunity summary
  POST /api/v1/ai/copilot/timeline — Activity timeline
  POST /api/v1/ai/copilot/meeting  — Meeting brief
  POST /api/v1/ai/copilot/blockers — Pipeline blockers
  POST /api/v1/ai/copilot/pipeline — Pipeline explanation
  GET  /api/v1/ai/copilot/skills   — List available skills

Documentation: docs/03_Backend/302_API_DESIGN.md
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user_and_workspace
from app.db.engine import get_db
from app.modules.ai.skills.sales_copilot import SalesCopilotSkill
from app.modules.ai.skills.schemas import CopilotRequest, SkillRequest, SkillResponse
from app.modules.identity.models import User
from app.modules.workspace.models import Workspace

router = APIRouter(prefix="/ai/copilot", tags=["AI Skills — Sales Copilot"])


def _make_skill_request(skill_type: str, payload: CopilotRequest) -> SkillRequest:
    """Converts a CopilotRequest into a SkillRequest for dispatch."""
    return SkillRequest(
        skill_type=skill_type,
        question=payload.question,
        entity_type=payload.entity_type,
        entity_id=payload.entity_id,
        entity_name=payload.entity_name,
        focus_areas=payload.focus_areas,
        provider=payload.provider,
        model=payload.model,
    )


# ─── General CRM Q&A ──────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Enterprise Sales Copilot — Natural language CRM Q&A",
)
async def copilot_qa(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    user, workspace = auth
    ws_id = workspace.id if workspace else user.id
    skill = SalesCopilotSkill(db)
    return await skill.execute(
        request=_make_skill_request("crm_qa", payload),
        workspace_id=ws_id,
        workspace_name=getattr(workspace, "name", "Workspace"),
        user_id=user.id,
        user_role=getattr(user, "role", "member"),
    )


# ─── Account Summary ─────────────────────────────────────────────────────────

@router.post(
    "/account",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Sales Copilot — Executive account summary for a company",
)
async def copilot_account_summary(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    user, workspace = auth
    ws_id = workspace.id if workspace else user.id
    skill = SalesCopilotSkill(db)
    return await skill.execute(
        request=_make_skill_request("account_summary", payload),
        workspace_id=ws_id,
        workspace_name=getattr(workspace, "name", "Workspace"),
        user_id=user.id,
        user_role=getattr(user, "role", "member"),
    )


# ─── Opportunity Summary ──────────────────────────────────────────────────────

@router.post(
    "/opportunity",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Sales Copilot — Open opportunity and pipeline analysis",
)
async def copilot_opportunity_summary(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    user, workspace = auth
    ws_id = workspace.id if workspace else user.id
    skill = SalesCopilotSkill(db)
    return await skill.execute(
        request=_make_skill_request("opportunity_summary", payload),
        workspace_id=ws_id,
        workspace_name=getattr(workspace, "name", "Workspace"),
        user_id=user.id,
        user_role=getattr(user, "role", "member"),
    )


# ─── Timeline Summary ─────────────────────────────────────────────────────────

@router.post(
    "/timeline",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Sales Copilot — Activity timeline reconstruction",
)
async def copilot_timeline_summary(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    user, workspace = auth
    ws_id = workspace.id if workspace else user.id
    skill = SalesCopilotSkill(db)
    return await skill.execute(
        request=_make_skill_request("timeline_summary", payload),
        workspace_id=ws_id,
        workspace_name=getattr(workspace, "name", "Workspace"),
        user_id=user.id,
        user_role=getattr(user, "role", "member"),
    )


# ─── Meeting Brief ────────────────────────────────────────────────────────────

@router.post(
    "/meeting",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Sales Copilot — Pre-meeting briefing document",
)
async def copilot_meeting_brief(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    user, workspace = auth
    ws_id = workspace.id if workspace else user.id
    skill = SalesCopilotSkill(db)
    return await skill.execute(
        request=_make_skill_request("meeting_brief", payload),
        workspace_id=ws_id,
        workspace_name=getattr(workspace, "name", "Workspace"),
        user_id=user.id,
        user_role=getattr(user, "role", "member"),
    )


# ─── Pipeline Blockers ────────────────────────────────────────────────────────

@router.post(
    "/blockers",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Sales Copilot — Pipeline blocker identification",
)
async def copilot_blockers(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    user, workspace = auth
    ws_id = workspace.id if workspace else user.id
    skill = SalesCopilotSkill(db)
    return await skill.execute(
        request=_make_skill_request("show_blockers", payload),
        workspace_id=ws_id,
        workspace_name=getattr(workspace, "name", "Workspace"),
        user_id=user.id,
        user_role=getattr(user, "role", "member"),
    )


# ─── Pipeline Explanation ─────────────────────────────────────────────────────

@router.post(
    "/pipeline",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Sales Copilot — Pipeline structure and deal flow explanation",
)
async def copilot_pipeline_explanation(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    user, workspace = auth
    ws_id = workspace.id if workspace else user.id
    skill = SalesCopilotSkill(db)
    return await skill.execute(
        request=_make_skill_request("explain_pipeline", payload),
        workspace_id=ws_id,
        workspace_name=getattr(workspace, "name", "Workspace"),
        user_id=user.id,
        user_role=getattr(user, "role", "member"),
    )


# ─── Available Skills Registry ────────────────────────────────────────────────

@router.get(
    "/skills",
    status_code=status.HTTP_200_OK,
    summary="List all available AI Skill types and capabilities",
)
async def list_available_skills(
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    return [
        {"skill_type": "crm_qa", "name": "CRM Q&A", "description": "Answer any natural language question using CRM data, RAG, and memory.", "phase": "7.4.1"},
        {"skill_type": "account_summary", "name": "Account Summary", "description": "Executive account summary for a company with deals, contacts, risks.", "phase": "7.4.1"},
        {"skill_type": "opportunity_summary", "name": "Opportunity Summary", "description": "Open deals and pipeline analysis with at-risk detection.", "phase": "7.4.1"},
        {"skill_type": "timeline_summary", "name": "Timeline Summary", "description": "CRM activity timeline reconstruction for any time window.", "phase": "7.4.1"},
        {"skill_type": "meeting_brief", "name": "Meeting Brief", "description": "Pre-meeting briefing with contact background and talking points.", "phase": "7.4.1"},
        {"skill_type": "show_blockers", "name": "Pipeline Blockers", "description": "Identify stuck deals with root cause and priority recommendations.", "phase": "7.4.1"},
        {"skill_type": "explain_pipeline", "name": "Pipeline Explanation", "description": "Pipeline structure, conversion rates, bottlenecks, and actions.", "phase": "7.4.1"},
    ]
