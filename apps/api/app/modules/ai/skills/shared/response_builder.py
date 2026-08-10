"""
ForgeCRM — AI Skills Shared ResponseBuilder

Central builder pattern for constructing standardized SkillResponse objects across all AI Skills.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

import time
import uuid
from typing import Any

from app.modules.ai.skills.schemas import (
    CitationSchema,
    ExplainabilitySchema,
    InsightSchema,
    ReasoningChainSchema,
    ReasoningStepSchema,
    SkillResponse,
)
from app.modules.ai.skills.shared.citations import CitationManager
from app.modules.ai.skills.shared.confidence import ConfidenceScorer
from app.modules.ai.skills.shared.explainability import ExplainabilityEngine
from app.modules.ai.skills.shared.insights import InsightGenerator
from app.modules.ai.skills.shared.prompt_registry import PromptRegistry
from app.modules.ai.skills.shared.reasoning import ReasoningEngine


class ResponseBuilder:
    """Builder class for assembling complete, compliant SkillResponse objects."""

    def __init__(self, skill_type: str, goal: str) -> None:
        self.skill_type = skill_type
        self.goal = goal
        self._summary: str = ""
        self._rag_snippets: list[dict[str, Any]] = []
        self._memory_context: list[str] = []
        self._tool_calls_used: list[str] = []
        self._prompt_tokens: int = 0
        self._completion_tokens: int = 0
        self._cost_usd: float = 0.0
        self._provider: str = ""
        self._model: str = ""
        self._template_id: str = "CRM_QA"
        self._start_time: float = time.monotonic()
        self._entity_type: str | None = None
        self._entity_id: str | None = None

    def set_summary(self, summary: str) -> ResponseBuilder:
        self._summary = summary
        return self

    def set_rag_snippets(self, snippets: list[dict[str, Any]]) -> ResponseBuilder:
        self._rag_snippets = snippets
        return self

    def set_memory_context(self, memory: list[str]) -> ResponseBuilder:
        self._memory_context = memory
        return self

    def set_tool_calls_used(self, tools: list[str]) -> ResponseBuilder:
        self._tool_calls_used = tools
        return self

    def set_metrics(self, prompt_tokens: int, completion_tokens: int, cost_usd: float) -> ResponseBuilder:
        self._prompt_tokens = prompt_tokens
        self._completion_tokens = completion_tokens
        self._cost_usd = cost_usd
        return self

    def set_provider_info(self, provider: str, model: str) -> ResponseBuilder:
        self._provider = provider
        self._model = model
        return self

    def set_template_id(self, template_id: str) -> ResponseBuilder:
        self._template_id = template_id
        return self

    def set_entity(self, entity_type: str | None, entity_id: str | uuid.UUID | None) -> ResponseBuilder:
        self._entity_type = entity_type
        self._entity_id = str(entity_id) if entity_id else None
        return self

    def build(self) -> SkillResponse:
        """Constructs and returns the final SkillResponse."""
        latency_ms = int((time.monotonic() - self._start_time) * 1000)

        # 1. Confidence
        conf = ConfidenceScorer.score(
            rag_snippets=self._rag_snippets,
            memory_hits=len(self._memory_context),
            tool_calls_made=len(self._tool_calls_used),
            response_length=len(self._summary.split()),
        )

        # 2. Citations
        citations_raw = CitationManager.from_rag_snippets(self._rag_snippets)
        citations = [
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
            for c in citations_raw
        ]

        # 3. Insights (NO second LLM call!)
        raw_insights = InsightGenerator.extract_from_text(
            analysis_text=self._summary,
            entity_type=self._entity_type,
            entity_id=self._entity_id,
        )
        insights = [
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
            for i in raw_insights
        ]

        # 4. Recommendations & Next Actions
        raw_struct_insights = [type("I", (), {"insight_type": i.insight_type})() for i in raw_insights]
        recommendations = InsightGenerator.generate_next_actions(self._template_id, raw_struct_insights)  # type: ignore[arg-type]
        next_actions = recommendations[:3]

        # 5. Reasoning Chain
        rchain = ReasoningEngine.build_chain(
            skill_type=self.skill_type,
            goal=self.goal,
            rag_snippets=self._rag_snippets,
            memory_context=self._memory_context,
            tool_calls_used=self._tool_calls_used,
            llm_summary=self._summary,
            confidence=conf.score,
        )
        reasoning_schema = ReasoningChainSchema(
            goal=rchain.goal,
            steps=[
                ReasoningStepSchema(
                    step_number=s.step_number,
                    title=s.title,
                    description=s.description,
                    evidence=s.evidence,
                    confidence=s.confidence,
                )
                for s in rchain.steps
            ],
            conclusion=rchain.conclusion,
            overall_confidence=rchain.overall_confidence,
        )

        # 6. Explainability Report
        exp_report = ExplainabilityEngine.generate(
            skill_type=self.skill_type,
            goal=self.goal,
            rag_snippets=self._rag_snippets,
            memory_context=self._memory_context,
            tool_calls_used=self._tool_calls_used,
            confidence_score=conf.score,
            confidence_label=conf.label.value,
            confidence_explanation=conf.explanation,
        )
        explainability_schema = ExplainabilitySchema(
            evidence=exp_report.evidence,
            sources=exp_report.sources,
            missing_context=exp_report.missing_context,
            confidence_explanation=exp_report.confidence_explanation,
            why_produced=exp_report.why_produced,
        )

        # Template metadata
        try:
            tmpl = PromptRegistry.get(self._template_id)
            tmpl_version = tmpl.version
        except Exception:
            tmpl_version = "1.0.0"

        return SkillResponse(
            skill=self.skill_type,
            skill_type=self.skill_type,
            summary=self._summary,
            reasoning=reasoning_schema,
            explainability=explainability_schema,
            confidence=conf.score,
            confidence_label=conf.label.value,  # type: ignore[arg-type]
            confidence_explanation=conf.explanation,
            citations=citations,
            evidence=exp_report.evidence,
            missing_context=exp_report.missing_context,
            insights=insights,
            recommendations=recommendations,
            next_actions=next_actions,
            tool_calls_used=self._tool_calls_used,
            latency_ms=latency_ms,
            prompt_tokens=self._prompt_tokens,
            completion_tokens=self._completion_tokens,
            token_usage={
                "prompt_tokens": self._prompt_tokens,
                "completion_tokens": self._completion_tokens,
                "total_tokens": self._prompt_tokens + self._completion_tokens,
            },
            estimated_cost_usd=self._cost_usd,
            provider_used=self._provider,
            model_used=self._model,
            template_id=self._template_id,
            template_version=tmpl_version,
        )
