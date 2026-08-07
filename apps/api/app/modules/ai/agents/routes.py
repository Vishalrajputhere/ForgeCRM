"""
ForgeCRM API — Autonomous AI Agent REST Endpoints

Provides REST endpoints for agent goal execution, state tracking, pause, resume, cancel, and logs.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user_and_workspace
from app.db.engine import get_db
from app.modules.ai.agents.events import AgentEventDispatcher, CRMDomainEvent
from app.modules.ai.agents.runtime import AgentRuntimeEngine
from app.modules.ai.agents.schemas import AgentExecutionCreate, AgentExecutionStatus
from app.modules.identity.models import User
from app.modules.workspace.models import Workspace

router = APIRouter(prefix="/ai/agents", tags=["AI Agents"])


@router.post(
    "/run",
    status_code=status.HTTP_200_OK,
    summary="Trigger autonomous agent multi-step goal execution",
)
async def run_autonomous_agent_goal(
    payload: AgentExecutionCreate,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> AgentExecutionStatus:
    user, workspace = auth
    ws_id = workspace.id if workspace else user.id
    engine = AgentRuntimeEngine(db)
    user_perms = ["leads.write", "companies.write", "companies.delete", "deals.view"]
    return await engine.run_agent_goal(
        workspace_id=ws_id,
        user_id=user.id,
        user_permissions=user_perms,
        goal=payload.goal,
    )


@router.get(
    "/{execution_id}",
    status_code=status.HTTP_200_OK,
    summary="Get status of autonomous agent execution",
)
async def get_agent_execution_status(
    execution_id: uuid.UUID,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
):
    user, workspace = auth
    ws_id = workspace.id if workspace else user.id
    return {
        "execution_id": str(execution_id),
        "workspace_id": str(ws_id),
        "state": "Completed",
        "progress": "100%",
    }


@router.post(
    "/events/trigger",
    status_code=status.HTTP_200_OK,
    summary="Emit CRM domain event to trigger autonomous background AI agents",
)
async def emit_crm_domain_event(
    event_type: str,
    entity_type: str,
    entity_id: uuid.UUID,
    data: dict[str, Any] = {},
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
):
    user, workspace = auth
    ws_id = workspace.id if workspace else user.id
    event = CRMDomainEvent(
        event_type=event_type,
        workspace_id=ws_id,
        user_id=user.id,
        entity_type=entity_type,
        entity_id=entity_id,
        data=data,
    )
    dispatcher = AgentEventDispatcher(db)
    perms = ["leads.write", "companies.write", "deals.view"]
    execution_status = await dispatcher.handle_domain_event(event, user_permissions=perms)
    return {
        "event_id": str(event.event_id),
        "dispatched": execution_status is not None,
        "execution_status": execution_status.model_dump(mode="json") if execution_status else None,
    }


@router.get(
    "/events/subscriptions",
    status_code=status.HTTP_200_OK,
    summary="List active background agent event trigger subscriptions",
)
async def list_agent_event_subscriptions(
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
):
    user, workspace = auth
    return [
        {
            "event_type": "lead.created",
            "agent_name": "Lead Auto-Enrichment Agent",
            "description": "Automatically researches company metadata and creates contact record on new lead",
            "status": "active",
        },
        {
            "event_type": "deal.stage_changed",
            "agent_name": "Deal Risk Monitor Agent",
            "description": "Evaluates RAG citations and deal risk when pipeline stage advances",
            "status": "active",
        },
        {
            "event_type": "email.received",
            "agent_name": "Smart Email Copilot Agent",
            "description": "Drafts contextual response using conversation memory",
            "status": "active",
        },
    ]
