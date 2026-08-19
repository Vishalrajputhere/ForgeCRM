"""
ForgeCRM API — Enterprise AI Context Builder

Assembles 6-layer unified context payload:
1. Workspace Context
2. User & Permission Context
3. Route & Entity Context
4. Related CRM Records
5. RAG Document Snippets  (real DB retrieval — no demo citations)
6. Conversation Memory & Preferences (real AIMemory records from PostgreSQL)

Quality metrics are computed dynamically from actual context coverage,
not hardcoded. Build duration is measured with time.monotonic().

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

import time
import uuid
from typing import Any

from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ai.models import AIContextSnapshot
from app.modules.ai.rag import RAGRetrievalEngine
from app.modules.ai.ranking import RouteContextPrioritizer, TokenBudget
from app.modules.ai.security import AISecuritySanitizer


class EnterpriseContextPayload(BaseModel):
    """Unified 6-layer enterprise context object."""

    snapshot_id: uuid.UUID
    workspace_id: uuid.UUID
    workspace_name: str
    user_id: uuid.UUID
    user_role: str
    permissions: list[str]
    active_route: str | None
    entity_context: dict[str, Any] | None
    rag_snippets: list[dict[str, Any]]
    conversation_memory: list[str]
    quality_metrics: dict[str, float]
    token_budget: TokenBudget
    system_prompt: str


class EnterpriseContextBuilder:
    """Enterprise Context Builder Engine — all data sourced from live DB."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.rag_engine = RAGRetrievalEngine(db)

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
        user_prompt: str | None = None,
        model_name: str = "gemini-1.5-flash",
    ) -> EnterpriseContextPayload:
        build_start = time.monotonic()

        perms = permissions or ["companies.view", "deals.view", "leads.view", "contacts.view"]
        token_budget = RouteContextPrioritizer.get_token_budget(model_name)

        # ── 1. Mask sensitive entity fields if entity data present ────────────
        masked_entity_data = None
        if raw_entity_data:
            masked_entity_data = AISecuritySanitizer.mask_sensitive_entity_dict(raw_entity_data)

        # ── 2. Prioritize route & entity context ──────────────────────────────
        prioritized_entity = RouteContextPrioritizer.prioritize_context(
            current_route=active_route,
            entity_type=entity_type,
            entity_data=masked_entity_data,
            related_data=None,
        )

        # ── 3. Retrieve RAG snippets (real DB — no fallback demo) ─────────────
        rag_citations: list[dict[str, Any]] = []
        # When no explicit user_prompt is provided, synthesise a context query
        # from the active route and entity type so RAG fires for entity-page context.
        effective_query = user_prompt or (
            f"{entity_type} {active_route}" if (entity_type or active_route) else None
        )
        if effective_query:
            try:
                rag_res = await self.rag_engine.search(
                    workspace_id=workspace_id,
                    user_id=user_id,
                    query=effective_query,
                    top_k=3,
                    entity_type=entity_type,
                )
                rag_citations = [c.model_dump(mode="json") for c in rag_res.results]
            except Exception:
                # RAG is non-critical — silently skip if unavailable
                rag_citations = []

        # ── 4. Load real conversation memory from PostgreSQL ──────────────────
        conversation_memory: list[str] = []
        try:
            from app.modules.ai.memory import AIMemoryManager
            memory_manager = AIMemoryManager(self.db)
            memory_items = await memory_manager.list_memories(
                workspace_id=workspace_id,
                user_id=user_id,
            )
            # Convert to plain strings for context injection
            conversation_memory = [
                f"{item.key}: {item.value}"
                for item in memory_items
                if item.value.strip()
            ]
        except Exception:
            # Memory is non-critical — silently skip if unavailable
            conversation_memory = []

        # ── 5. Compute quality metrics dynamically from actual coverage ───────
        has_entity = bool(prioritized_entity)
        has_rag = len(rag_citations) > 0
        has_memory = len(conversation_memory) > 0

        # Coverage score: proportion of context layers that have real data
        layers_with_data = sum([has_entity, has_rag, has_memory, bool(perms)])
        coverage_score = round(layers_with_data / 4.0, 2)
        # Confidence: scaled by rag snippet count (more citations = more grounded)
        confidence_score = round(min(0.6 + (len(rag_citations) * 0.1), 0.99), 2)
        # Quality: composite of coverage and confidence
        quality_score = round((coverage_score + confidence_score) / 2, 2)

        quality_metrics: dict[str, float] = {
            "quality_score": quality_score,
            "coverage_score": coverage_score,
            "confidence_score": confidence_score,
            "rag_citations_count": float(len(rag_citations)),
            "memory_items_count": float(len(conversation_memory)),
        }

        # ── 6. Assemble system prompt ─────────────────────────────────────────
        system_prompt = (
            f"You are ForgeCRM Sales Copilot for workspace '{workspace_name}'. "
            f"Ground all answers in the provided CRM records, workspace history, and RAG document citations. "
            f"User role: {user_role}. Always adhere strictly to RBAC boundaries."
        )

        build_duration_ms = int((time.monotonic() - build_start) * 1000)

        # ── 7. Persist context snapshot for explainability ────────────────────
        snapshot_id = uuid.uuid4()
        try:
            snapshot = AIContextSnapshot(
                id=snapshot_id,
                workspace_id=workspace_id,
                user_id=user_id,
                route=active_route,
                assembled_context={
                    "entity": prioritized_entity,
                    "rag": rag_citations,
                    "memory": conversation_memory,
                },
                discarded_context={},
                quality_metrics=quality_metrics,
                build_duration_ms=build_duration_ms,
            )
            self.db.add(snapshot)
            await self.db.flush()
        except Exception:
            pass  # Snapshot is audit-only — never abort request for this

        return EnterpriseContextPayload(
            snapshot_id=snapshot_id,
            workspace_id=workspace_id,
            workspace_name=workspace_name,
            user_id=user_id,
            user_role=user_role,
            permissions=perms,
            active_route=active_route,
            entity_context=prioritized_entity,
            rag_snippets=rag_citations,
            conversation_memory=conversation_memory,
            quality_metrics=quality_metrics,
            token_budget=token_budget,
            system_prompt=system_prompt,
        )
