"""
ForgeCRM API — AI Integration Routes

FastAPI router for AI-assisted Lead Summarization, Deal Risk Assessment,
and Sales Email Drafting.

Documentation: docs/03_Backend/308_AI_INTEGRATION.md
"""

from __future__ import annotations

from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import (
    get_current_workspace_id,
    get_current_workspace_member,
)
from app.db.session import get_db_session
from app.modules.ai.schemas import (
    DealRiskRequest,
    DealRiskResponse,
    EmailDraftRequest,
    EmailDraftResponse,
    LeadSummaryRequest,
    LeadSummaryResponse,
)
from app.modules.ai.service import AIService

router = APIRouter(prefix="/ai", tags=["AI Productivity & Insights"])

WorkspaceIdDep = Annotated[UUID, Depends(get_current_workspace_id)]
WorkspaceMemberDep = Annotated[Any, Depends(get_current_workspace_member)]


@router.post(
    "/summarize-lead",
    response_model=LeadSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Summarize Lead with AI",
    description="Generates a structured AI summary and recommended next action for a lead.",
)
async def summarize_lead(
    payload: LeadSummaryRequest,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> LeadSummaryResponse:
    service = AIService(db)
    return await service.summarize_lead(workspace_id, payload)


@router.post(
    "/assess-deal-risk",
    response_model=DealRiskResponse,
    status_code=status.HTTP_200_OK,
    summary="Assess Deal Risk with AI",
    description="Generates structured deal risk score, risk factors, and recommended remediation steps.",
)
async def assess_deal_risk(
    payload: DealRiskRequest,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> DealRiskResponse:
    service = AIService(db)
    return await service.assess_deal_risk(workspace_id, payload)


@router.post(
    "/draft-email",
    response_model=EmailDraftResponse,
    status_code=status.HTTP_200_OK,
    summary="Draft Sales Email with AI",
    description="Drafts a customized outreach sales email based on tone and purpose.",
)
async def draft_email(
    payload: EmailDraftRequest,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> EmailDraftResponse:
    service = AIService(db)
    return await service.draft_email(workspace_id, payload)
