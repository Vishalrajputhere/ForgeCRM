"""
ForgeCRM API — Enterprise AI Context Builder

Assembles 6-layer unified context payload:
1. Workspace Context
2. User & Permission Context
3. Route & Entity Context
4. Related CRM Records
5. RAG Document Snippets
6. Conversation Memory & Preferences

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

import uuid
from typing import Any

from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ai.ranking import RouteContextPrioritizer, TokenBudget
from app.modules.ai.security import AISecuritySanitizer


class EnterpriseContextPayload(BaseModel):
    """Unified 6-layer enterprise context object."""

    workspace_id: uuid.UUID
    workspace_name: str
    user_id: uuid.UUID
    user_role: str
    permissions: list[str]
    active_route: str | None
    entity_context: dict[str, Any] | None
    rag_snippets: list[dict[str, Any]]
    conversation_memory: list[str]
    token_budget: TokenBudget
    system_prompt: str


class EnterpriseContextBuilder:
    """Enterprise Context Builder Engine."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def build(
        self,
        workspace_id: uuid.UUID,
        workspace_name: str,
        user_id: uuid.UUID,
        user_role: str = "member",
        permissions: list[str] | None = None,
        active_route: str | None = None,
        entity_type: str | None = None,
        entity_id: uuid.UUID | None = None,
        raw_entity_data: dict[str, Any] | None = None,
        model_name: str = "gemini-1.5-flash",
    ) -> EnterpriseContextPayload:
        perms = permissions or ["companies.view", "deals.view", "leads.view", "contacts.view"]
        token_budget = RouteContextPrioritizer.get_token_budget(model_name)

        # 1. Mask sensitive entity fields if entity data present
        masked_entity_data = None
        if raw_entity_data:
            masked_entity_data = AISecuritySanitizer.mask_sensitive_entity_dict(raw_entity_data)

        # 2. Prioritize route & entity context
        prioritized_entity = RouteContextPrioritizer.prioritize_context(
            current_route=active_route,
            entity_type=entity_type,
            entity_data=masked_entity_data,
            related_data=None,
        )

        # 3. Assemble System Prompt with Workspace Boundaries
        system_prompt = (
            f"You are ForgeCRM Sales Copilot for workspace '{workspace_name}'. "
            f"Ground all answers in the provided CRM records, workspace history, and RAG document citations. "
            f"User role: {user_role}. Always adhere strictly to RBAC boundaries."
        )

        # 4. Mock RAG document snippets & conversation memory facts
        rag_snippets = [
            {
                "citation": "Q3_Renewal_Proposal.pdf, Page 4",
                "content": "Enterprise Cloud Renewal ($450,000 ARR) scheduled for Q3 2026.",
                "similarity_score": 0.92,
                "confidence": "High",
            }
        ]

        conversation_memory = [
            "User prefers bulleted executive summaries with tabular deal data.",
            "Target ICP: Mid-Market B2B SaaS companies (>50 employees).",
        ]

        return EnterpriseContextPayload(
            workspace_id=workspace_id,
            workspace_name=workspace_name,
            user_id=user_id,
            user_role=user_role,
            permissions=perms,
            active_route=active_route,
            entity_context=prioritized_entity,
            rag_snippets=rag_snippets,
            conversation_memory=conversation_memory,
            token_budget=token_budget,
            system_prompt=system_prompt,
        )
