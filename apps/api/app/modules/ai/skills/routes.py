"""
ForgeCRM API — AI Skills REST Endpoints (Phase 7.4.1)

Provides a unified REST API entry point for ALL AI Skills via SkillRegistry.

Endpoints:
  POST /api/v1/ai/copilot       — Single unified AI Skill execution endpoint
  GET  /api/v1/ai/copilot/skills — Discovers all registered AI Skills

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

router = APIRouter(prefix="/ai/copilot", tags=["AI Skills — Sales Copilot"])


# ─── Single Unified AI Skill Execution Endpoint (Rule 7) ──────────────────────

@router.post(
    "",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Enterprise AI Copilot — Unified AI Skill execution endpoint",
)
async def execute_copilot_skill(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """
    Executes any registered AI Skill by dispatching the request through SkillRegistry.
    """
    user, workspace = auth
    ws_id = workspace.id if workspace else user.id

    skill_req = SkillRequest(
        skill=payload.skill,
        skill_type=payload.skill,
        question=payload.question,
        entity_type=payload.entity_type,
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


# ─── Available Skills Discovery Endpoint ──────────────────────────────────────

@router.get(
    "/skills",
    status_code=status.HTTP_200_OK,
    summary="List all registered AI Skills and capabilities",
)
async def list_available_skills(
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
) -> list[dict]:
    """Returns metadata for all registered skills in SkillRegistry."""
    return SkillRegistry.list_skills()
