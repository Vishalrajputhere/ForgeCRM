"""
ForgeCRM API — Autonomous AI Agent Event Trigger Dispatcher

Subscribes to CRM domain events (lead.created, deal.stage_changed, email.received)
and dispatches autonomous background AI Agent goal executions.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

import uuid
from typing import Any

from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ai.agents.runtime import AgentRuntimeEngine
from app.modules.ai.agents.schemas import AgentExecutionStatus


class CRMDomainEvent(BaseModel):
    """CRM Domain Event payload."""

    event_id: uuid.UUID = uuid.uuid4()
    event_type: str  # lead.created, deal.stage_changed, email.received
    workspace_id: uuid.UUID
    user_id: uuid.UUID
    entity_type: str
    entity_id: uuid.UUID
    data: dict[str, Any] = {}


class AgentEventDispatcher:
    """Event Listener and Background Agent Dispatcher."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.runtime = AgentRuntimeEngine(db)

    async def handle_domain_event(
        self,
        event: CRMDomainEvent,
        user_permissions: list[str] | None = None,
    ) -> AgentExecutionStatus | None:
        """Evaluates domain event and triggers autonomous background agent run if matched."""
        perms = user_permissions or ["leads.write", "companies.write", "deals.view"]

        # 1. Lead Auto-Enrichment Agent (Trigger: lead.created)
        if event.event_type == "lead.created":
            lead_name = event.data.get("name", "New Lead")
            goal = f"Enrich new sales lead '{lead_name}' (ID: {event.entity_id}), research company details, and create initial contact record."
            return await self.runtime.run_agent_goal(
                workspace_id=event.workspace_id,
                user_id=event.user_id,
                user_permissions=perms,
                goal=goal,
            )

        # 2. Deal Risk Monitor Agent (Trigger: deal.stage_changed)
        elif event.event_type == "deal.stage_changed":
            deal_name = event.data.get("deal_name", "Acme Deal")
            new_stage = event.data.get("new_stage", "Qualified")
            goal = f"Analyze deal risk for '{deal_name}' moved to stage '{new_stage}', evaluate RAG citations, and log risk summary."
            return await self.runtime.run_agent_goal(
                workspace_id=event.workspace_id,
                user_id=event.user_id,
                user_permissions=perms,
                goal=goal,
            )

        # 3. Smart Email Copilot Agent (Trigger: email.received)
        elif event.event_type == "email.received":
            subject = event.data.get("subject", "Inquiry")
            goal = f"Process incoming email '{subject}', check workspace context and memory summaries, and draft response."
            return await self.runtime.run_agent_goal(
                workspace_id=event.workspace_id,
                user_id=event.user_id,
                user_permissions=perms,
                goal=goal,
            )

        return None
