"""
ForgeCRM API — Enterprise Email Copilot REST Endpoints (Phase 7.4.5)

Provides dedicated REST API entry points for Email Copilot capabilities.
Dispatches requests through SkillRegistry for unified execution.

Endpoints:
  POST /api/v1/ai/email           — Primary email execution endpoint
  POST /api/v1/ai/email/reply     — Context-aware email reply endpoint
  POST /api/v1/ai/email/rewrite   — Email copy editing endpoint
  POST /api/v1/ai/email/summarize — Thread summarization endpoint
  POST /api/v1/ai/email/followup  — Meeting & customer follow-up endpoint
  POST /api/v1/ai/email/outreach  — Cold/warm sales outreach endpoint
  POST /api/v1/ai/email/translate — Multilingual email translation endpoint
  POST /api/v1/ai/email/tone      — Email tone adjustment endpoint

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

router = APIRouter(prefix="/ai/email", tags=["AI Skills — Enterprise Email Copilot"])


@router.post(
    "",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Enterprise Email Copilot — Primary execution endpoint",
)
async def execute_email_skill(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """
    Executes any Email Copilot capability by dispatching through SkillRegistry.
    Supported skills: compose_email, reply_email, summarize_thread, rewrite_email,
    improve_tone, meeting_followup, cold_outreach, multilingual_translation.
    """
    user, workspace = auth
    ws_id = workspace.id if workspace else user.id

    skill_req = SkillRequest(
        skill=payload.skill or "reply_email",
        skill_type="email_copilot",
        question=payload.question,
        entity_type=payload.entity_type or "contact",
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
    "/reply",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate Email Reply",
)
async def reply_email(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """Dedicated endpoint for generating email replies."""
    payload.skill = "reply_email"
    return await execute_email_skill(payload, auth, db)


@router.post(
    "/rewrite",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Rewrite & Polish Email Draft",
)
async def rewrite_email(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """Dedicated endpoint for rewriting email drafts."""
    payload.skill = "rewrite_email"
    return await execute_email_skill(payload, auth, db)


@router.post(
    "/summarize",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Summarize Email Thread & Action Items",
)
async def summarize_email_thread(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """Dedicated endpoint for email thread summarization."""
    payload.skill = "summarize_thread"
    return await execute_email_skill(payload, auth, db)


@router.post(
    "/followup",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate Meeting or Customer Follow-up Email",
)
async def generate_followup_email(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """Dedicated endpoint for meeting and customer follow-up emails."""
    payload.skill = "meeting_followup"
    return await execute_email_skill(payload, auth, db)


@router.post(
    "/outreach",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Draft Sales Prospecting Outreach",
)
async def draft_outreach_email(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """Dedicated endpoint for cold/warm sales outreach."""
    payload.skill = "cold_outreach"
    return await execute_email_skill(payload, auth, db)


@router.post(
    "/translate",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Translate Email Multilingual",
)
async def translate_email(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """Dedicated endpoint for multilingual email translation."""
    payload.skill = "multilingual_translation"
    return await execute_email_skill(payload, auth, db)


@router.post(
    "/tone",
    response_model=SkillResponse,
    status_code=status.HTTP_200_OK,
    summary="Adjust Email Tone",
)
async def adjust_email_tone(
    payload: CopilotRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """Dedicated endpoint for adjusting email tone."""
    payload.skill = "improve_tone"
    return await execute_email_skill(payload, auth, db)
