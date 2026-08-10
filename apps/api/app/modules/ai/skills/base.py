"""
ForgeCRM — BaseAISkill Abstract Framework

The reusable foundation that ALL AI Skills inherit from.
Every future skill (DealCoach, ForecastAgent, LeadQualificationAgent,
EmailCopilot, MeetingAssistant, ExecutiveCopilot) extends BaseAISkill.

Provides out-of-the-box:
- Enterprise Context Builder integration
- RAG Retrieval
- Memory Manager
- MCP Tool Registry
- AI Router (provider-agnostic)
- Confidence Scoring
- Citation Extraction
- Insight Generation
- Reasoning Chain Construction
- Telemetry tracking

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

import time
import uuid
from abc import ABC, abstractmethod
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ai.context import EnterpriseContextBuilder
from app.modules.ai.mcp import MCPToolRegistry
from app.modules.ai.memory import AIMemoryManager
from app.modules.ai.rag import RAGRetrievalEngine
from app.modules.ai.router import AIRouterEngine
from app.modules.ai.schemas import AIChatRequest, AIMessageTurn
from app.modules.ai.skills.schemas import (
    CitationSchema,
    InsightSchema,
    ReasoningChainSchema,
    ReasoningStepSchema,
    SkillRequest,
    SkillResponse,
)
from app.modules.ai.skills.shared.citations import CitationManager
from app.modules.ai.skills.shared.confidence import ConfidenceScorer
from app.modules.ai.skills.shared.insights import InsightGenerator
from app.modules.ai.skills.shared.prompt_templates import get_template
from app.modules.ai.skills.shared.reasoning import ReasoningEngine


class BaseAISkill(ABC):
    """
    Abstract base class for all ForgeCRM AI Skills.

    Subclasses must implement `execute()`.
    All shared infrastructure (context, RAG, memory, MCP, confidence, citations)
    is available via helper methods.
    """

    skill_type: str = "base"
    default_template_id: str = "crm_qa"

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.context_builder = EnterpriseContextBuilder(db)
        self.rag_engine = RAGRetrievalEngine(db)
        self.memory_manager = AIMemoryManager(db)
        self.mcp_registry = MCPToolRegistry(db)
        self.ai_router = AIRouterEngine()

    @abstractmethod
    async def execute(
        self,
        request: SkillRequest,
        workspace_id: uuid.UUID,
        workspace_name: str,
        user_id: uuid.UUID,
        user_role: str = "member",
    ) -> SkillResponse:
        """Execute the AI skill and return a structured SkillResponse."""
        ...

    # ─── Shared Helper Methods ────────────────────────────────────────────────

    async def _build_context_payload(
        self,
        workspace_id: uuid.UUID,
        workspace_name: str,
        user_id: uuid.UUID,
        user_role: str,
        entity_type: str | None,
        entity_id: uuid.UUID | None,
        user_prompt: str,
    ) -> Any:
        """Assembles the full 6-layer enterprise context payload."""
        return await self.context_builder.build(
            workspace_id=workspace_id,
            workspace_name=workspace_name,
            user_id=user_id,
            user_role=user_role,
            entity_type=entity_type,
            entity_id=entity_id,
            user_prompt=user_prompt,
            model_name="gemini-1.5-flash",
        )

    async def _retrieve_rag(
        self,
        workspace_id: uuid.UUID,
        query: str,
        entity_type: str | None = None,
        top_k: int = 6,
    ) -> list[dict[str, Any]]:
        """Runs hybrid RAG retrieval and returns ranked snippets."""
        try:
            return await self.rag_engine.retrieve(
                workspace_id=workspace_id,
                query=query,
                entity_type=entity_type,
                top_k=top_k,
            )
        except Exception:
            return []

    async def _load_memories(
        self,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
        query: str,
        limit: int = 5,
    ) -> list[str]:
        """Loads relevant workspace and user memories."""
        try:
            memories = await self.memory_manager.get_relevant_memories(
                workspace_id=workspace_id,
                user_id=user_id,
                query=query,
                limit=limit,
            )
            return [m.value if hasattr(m, "value") else str(m) for m in memories]
        except Exception:
            return []

    def _score_confidence(
        self,
        rag_snippets: list[dict[str, Any]],
        memory_hits: int,
        tool_calls_made: int,
        response_text: str,
    ) -> tuple[float, str, str]:
        """Returns (score, label, explanation)."""
        result = ConfidenceScorer.score(
            rag_snippets=rag_snippets,
            memory_hits=memory_hits,
            tool_calls_made=tool_calls_made,
            response_length=len(response_text.split()),
        )
        return result.score, result.label.value, result.explanation

    def _extract_citations(self, rag_snippets: list[dict[str, Any]]) -> list[CitationSchema]:
        """Extracts structured citations from RAG results."""
        raw = CitationManager.from_rag_snippets(rag_snippets)
        return [
            CitationSchema(
                citation_id=c.citation_id,
                source=c.source,
                entity_type=c.entity_type,
                entity_id=c.entity_id,
                entity_name=c.entity_name,
                excerpt=c.excerpt,
                relevance_score=c.relevance_score,
                page_number=c.page_number,
            )
            for c in raw
        ]

    def _generate_insights(
        self,
        analysis_text: str,
        entity_type: str | None = None,
        entity_id: str | None = None,
    ) -> list[InsightSchema]:
        """Extracts typed business insights from analysis text."""
        raw = InsightGenerator.extract_from_text(
            analysis_text=analysis_text,
            entity_type=entity_type,
            entity_id=entity_id,
        )
        return [
            InsightSchema(
                insight_type=i.insight_type,
                title=i.title,
                body=i.body,
                confidence=i.confidence,
                entity_type=i.entity_type,
                entity_id=i.entity_id,
                tags=i.tags,
                priority=i.priority,
            )
            for i in raw
        ]

    def _build_reasoning_chain(
        self,
        goal: str,
        rag_snippets: list[dict[str, Any]],
        memory_context: list[str],
        tool_calls_used: list[str],
        llm_summary: str,
        confidence: float,
    ) -> ReasoningChainSchema:
        """Constructs a structured reasoning chain."""
        chain = ReasoningEngine.build_chain(
            skill_type=self.skill_type,
            goal=goal,
            rag_snippets=rag_snippets,
            memory_context=memory_context,
            tool_calls_used=tool_calls_used,
            llm_summary=llm_summary,
            confidence=confidence,
        )
        return ReasoningChainSchema(
            goal=chain.goal,
            steps=[
                ReasoningStepSchema(
                    step_number=s.step_number,
                    title=s.title,
                    description=s.description,
                    evidence=s.evidence,
                    confidence=s.confidence,
                )
                for s in chain.steps
            ],
            conclusion=chain.conclusion,
            overall_confidence=chain.overall_confidence,
        )

    async def _call_llm(
        self,
        system_prompt: str,
        user_message: str,
        provider: str | None = None,
        model: str | None = None,
    ) -> tuple[str, int, int, float, str, str]:
        """Calls the AI Router and returns (text, prompt_tokens, completion_tokens, cost, provider, model)."""
        selected_provider = self.ai_router.get_provider(provider)
        request = AIChatRequest(
            messages=[
                AIMessageTurn(role="system", content=system_prompt),
                AIMessageTurn(role="user", content=user_message),
            ],
            provider=provider,
            model=model,
            temperature=0.3,  # Lower temperature for factual skill responses
            max_tokens=2048,
        )
        response = await selected_provider.chat(request)
        return (
            response.message.content,
            response.prompt_tokens,
            response.completion_tokens,
            response.estimated_cost_usd,
            response.provider,
            response.model,
        )
