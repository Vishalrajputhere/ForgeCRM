"""
ForgeCRM API — AI Context Builder

Assembles user permissions, workspace context, entity metadata, and RAG search results.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

import uuid
from typing import Any

from pydantic import BaseModel


class AIContextPayload(BaseModel):
    """Context payload injected into system prompt."""

    workspace_id: uuid.UUID
    user_id: uuid.UUID
    role: str
    entity_context: dict[str, Any] | None = None
    rag_documents: list[str] = []
    system_prompt: str


class AIContextBuilder:
    """Context Builder Engine."""

    async def build_context(
        self,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
        role: str = "member",
        entity_type: str | None = None,
        entity_id: uuid.UUID | None = None,
    ) -> AIContextPayload:
        system_prompt = (
            "You are ForgeCRM AI Copilot, an enterprise AI assistant for CRM sales management. "
            "Help users analyze leads, draft responses, and summarize account renewal risks concisely and accurately."
        )

        entity_context = None
        if entity_type and entity_id:
            entity_context = {"type": entity_type, "id": str(entity_id)}

        return AIContextPayload(
            workspace_id=workspace_id,
            user_id=user_id,
            role=role,
            entity_context=entity_context,
            rag_documents=["Acme Corp ARR $450,000 renewal closing Q3 2026."],
            system_prompt=system_prompt,
        )
