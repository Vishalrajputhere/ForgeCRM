"""
ForgeCRM — BaseAISkill Abstract Framework

The reusable execution pipeline that ALL AI Skills inherit from.
Every future skill (SalesCopilot, DealCoach, ForecastAgent, LeadQualificationAgent,
EmailCopilot, MeetingAssistant, ExecutiveCopilot) extends BaseAISkill.

Provides the standardized pipeline methods:
  build_context()
  retrieve_rag()
  load_memory()
  collect_tool_data()
  build_prompt()
  call_llm()
  generate_reasoning()
  generate_explainability()
  calculate_confidence()
  extract_citations()
  generate_insights()
  build_response()

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
from app.modules.ai.skills.schemas import SkillRequest, SkillResponse
from app.modules.ai.skills.shared.citations import CitationManager
from app.modules.ai.skills.shared.confidence import ConfidenceResult, ConfidenceScorer
from app.modules.ai.skills.shared.explainability import ExplainabilityEngine, ExplainabilityReport
from app.modules.ai.skills.shared.insights import InsightGenerator, SkillInsight
from app.modules.ai.skills.shared.prompt_registry import PromptRegistry, PromptTemplate
from app.modules.ai.skills.shared.reasoning import ReasoningChain, ReasoningEngine
from app.modules.ai.skills.shared.response_builder import ResponseBuilder


class BaseAISkill(ABC):
    """
    Abstract base class for all ForgeCRM AI Skills.

    Child classes override `build_prompt()` and optionally `collect_tool_data()`
    or post-processing hooks. Everything else is executed automatically by the
    standard template method pipeline in `execute()`.
    """

    skill_type: str = "base"
    default_template_id: str = "CRM_QA"

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.context_builder = EnterpriseContextBuilder(db)
        self.rag_engine = RAGRetrievalEngine(db)
        self.memory_manager = AIMemoryManager(db)
        self.mcp_registry = MCPToolRegistry(db)
        self.ai_router = AIRouterEngine()

    # ─── Standard Template Method Pipeline ────────────────────────────────────

    async def execute(
        self,
        request: SkillRequest,
        workspace_id: uuid.UUID,
        workspace_name: str,
        user_id: uuid.UUID,
        user_role: str = "member",
    ) -> SkillResponse:
        """Standard execution pipeline for all AI Skills."""
        skill_name = request.skill or request.skill_type or self.skill_type
        goal = request.question or f"Execute {skill_name} analysis"

        # 1. Build context
        crm_context_str = await self.build_context(
            workspace_id, workspace_name, user_id, user_role,
            request.entity_type, request.entity_id, goal
        )

        # 2. Retrieve RAG snippets
        rag_snippets = await self.retrieve_rag(
            workspace_id, request.question or goal, request.entity_type
        )

        # 3. Load memory
        memory_context = await self.load_memory(
            workspace_id, user_id, request.question or goal
        )

        # 4. Collect tool data
        tool_calls_used = await self.collect_tool_data(
            workspace_id, user_id, skill_name, request
        )

        # 5. Build prompt (Overridden or default from PromptRegistry)
        system_prompt, user_message, template_id = self.build_prompt(
            request, workspace_name, crm_context_str, rag_snippets, memory_context
        )

        # 6. Call LLM via AI Router
        llm_text, prompt_tokens, completion_tokens, cost, provider, model = await self.call_llm(
            system_prompt, user_message, request.provider, request.model
        )

        # 7–11. Build final SkillResponse using ResponseBuilder
        builder = (
            ResponseBuilder(skill_name, goal)
            .set_summary(llm_text)
            .set_rag_snippets(rag_snippets)
            .set_memory_context(memory_context)
            .set_tool_calls_used(tool_calls_used)
            .set_metrics(prompt_tokens, completion_tokens, cost)
            .set_provider_info(provider, model)
            .set_template_id(template_id)
            .set_entity(request.entity_type, request.entity_id)
        )

        return builder.build()

    # ─── Standard Pipeline Methods ────────────────────────────────────────────

    async def build_context(
        self,
        workspace_id: uuid.UUID,
        workspace_name: str,
        user_id: uuid.UUID,
        user_role: str,
        entity_type: str | None,
        entity_id: uuid.UUID | None,
        user_prompt: str,
    ) -> str:
        """Assembles context using EnterpriseContextBuilder."""
        try:
            payload = await self.context_builder.build(
                workspace_id=workspace_id,
                workspace_name=workspace_name,
                user_id=user_id,
                user_role=user_role,
                entity_type=entity_type,
                entity_id=entity_id,
                user_prompt=user_prompt,
                model_name="gemini-1.5-flash",
            )
            lines = [f"Workspace: {workspace_name}"]
            if entity_type and entity_id:
                lines.append(f"Active Entity: {entity_type} ({entity_id})")
            if payload and hasattr(payload, "entity_context") and payload.entity_context:
                lines.append(f"Entity Details: {payload.entity_context}")
            return "\n".join(lines)
        except Exception:
            return f"Workspace: {workspace_name}"

    async def retrieve_rag(
        self,
        workspace_id: uuid.UUID,
        query: str,
        entity_type: str | None = None,
        top_k: int = 6,
    ) -> list[dict[str, Any]]:
        """Runs hybrid RAG retrieval."""
        try:
            return await self.rag_engine.retrieve(
                workspace_id=workspace_id,
                query=query,
                entity_type=entity_type,
                top_k=top_k,
            )
        except Exception:
            return []

    async def load_memory(
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

    async def collect_tool_data(
        self,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
        skill_name: str,
        request: SkillRequest,
    ) -> list[str]:
        """Default hook returning tool execution metadata."""
        default_tools = {
            "account_summary": ["search_deals", "update_company"],
            "opportunity_summary": ["search_deals"],
            "meeting_brief": ["search_contacts"],
            "show_blockers": ["search_deals"],
            "explain_pipeline": ["search_deals"],
            "crm_qa": ["search_deals", "search_contacts"],
        }
        return default_tools.get(skill_name, [])

    @abstractmethod
    def build_prompt(
        self,
        request: SkillRequest,
        workspace_name: str,
        crm_context: str,
        rag_snippets: list[dict[str, Any]],
        memory_context: list[str],
    ) -> tuple[str, str, str]:
        """
        Builds and returns (system_prompt, user_message, template_id).
        Must be implemented by child skill classes.
        """
        ...

    async def call_llm(
        self,
        system_prompt: str,
        user_message: str,
        provider: str | None = None,
        model: str | None = None,
    ) -> tuple[str, int, int, float, str, str]:
        """Calls AIRouterEngine and returns (text, prompt_tokens, completion_tokens, cost, provider, model)."""
        selected_provider = self.ai_router.get_provider(provider)
        request = AIChatRequest(
            messages=[
                AIMessageTurn(role="system", content=system_prompt),
                AIMessageTurn(role="user", content=user_message),
            ],
            provider=provider,
            model=model,
            temperature=0.3,
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

    def generate_reasoning(
        self,
        goal: str,
        rag_snippets: list[dict[str, Any]],
        memory_context: list[str],
        tool_calls_used: list[str],
        llm_summary: str,
        confidence: float,
    ) -> ReasoningChain:
        return ReasoningEngine.build_chain(
            self.skill_type, goal, rag_snippets, memory_context, tool_calls_used, llm_summary, confidence
        )

    def generate_explainability(
        self,
        goal: str,
        rag_snippets: list[dict[str, Any]],
        memory_context: list[str],
        tool_calls_used: list[str],
        confidence_score: float,
        confidence_label: str,
        confidence_explanation: str,
    ) -> ExplainabilityReport:
        return ExplainabilityEngine.generate(
            self.skill_type, goal, rag_snippets, memory_context, tool_calls_used, confidence_score, confidence_label, confidence_explanation
        )

    def calculate_confidence(
        self,
        rag_snippets: list[dict[str, Any]],
        memory_hits: int,
        tool_calls_made: int,
        response_text: str,
    ) -> ConfidenceResult:
        return ConfidenceScorer.score(rag_snippets, memory_hits, tool_calls_made, response_length=len(response_text.split()))

    def extract_citations(self, rag_snippets: list[dict[str, Any]]) -> list[Any]:
        return CitationManager.from_rag_snippets(rag_snippets)

    def generate_insights(self, analysis_text: str, entity_type: str | None = None, entity_id: str | None = None) -> list[SkillInsight]:
        return InsightGenerator.extract_from_text(analysis_text, entity_type=entity_type, entity_id=entity_id)

    def build_response(
        self,
        summary: str,
        goal: str,
        rag_snippets: list[dict[str, Any]],
        memory_context: list[str],
        tool_calls_used: list[str],
        prompt_tokens: int,
        completion_tokens: int,
        cost: float,
        provider: str,
        model: str,
        template_id: str,
    ) -> SkillResponse:
        builder = (
            ResponseBuilder(self.skill_type, goal)
            .set_summary(summary)
            .set_rag_snippets(rag_snippets)
            .set_memory_context(memory_context)
            .set_tool_calls_used(tool_calls_used)
            .set_metrics(prompt_tokens, completion_tokens, cost)
            .set_provider_info(provider, model)
            .set_template_id(template_id)
        )
        return builder.build()
