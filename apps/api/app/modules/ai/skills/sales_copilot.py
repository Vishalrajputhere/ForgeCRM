"""
ForgeCRM — Enterprise Sales Copilot AI Skill

Provides 7 sales intelligence capabilities powered by RAG, Memory, MCP Tools,
Confidence Scoring, Citations, and Explainable Reasoning.

Comparable to: Salesforce Einstein Copilot, HubSpot Breeze AI, Attio AI.

Capabilities:
  1. account_summary    — Executive account summary for a company
  2. opportunity_summary — Open opportunity and pipeline analysis
  3. timeline_summary   — Workspace activity timeline reconstruction
  4. meeting_brief      — Pre-meeting briefing document
  5. crm_qa             — Natural language CRM question answering
  6. show_blockers      — Pipeline blocker identification & recommendations
  7. explain_pipeline   — Pipeline structure and deal flow explanation

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

import time
import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ai.skills.base import BaseAISkill
from app.modules.ai.skills.schemas import SkillRequest, SkillResponse
from app.modules.ai.skills.shared.insights import InsightGenerator
from app.modules.ai.skills.shared.prompt_templates import get_template


class SalesCopilotSkill(BaseAISkill):
    """
    Enterprise Sales Copilot — the primary AI assistant for CRM users.

    Inherits all infrastructure from BaseAISkill.
    Implements 7 production-ready sales intelligence capabilities.
    """

    skill_type = "sales_copilot"
    default_template_id = "crm_qa"

    async def execute(
        self,
        request: SkillRequest,
        workspace_id: uuid.UUID,
        workspace_name: str,
        user_id: uuid.UUID,
        user_role: str = "member",
    ) -> SkillResponse:
        """Routes skill_type to the appropriate capability method."""
        dispatch_map = {
            "account_summary": self.account_summary,
            "opportunity_summary": self.opportunity_summary,
            "timeline_summary": self.timeline_summary,
            "meeting_brief": self.meeting_brief,
            "crm_qa": self.answer_crm_question,
            "show_blockers": self.show_blockers,
            "explain_pipeline": self.explain_pipeline,
        }
        handler = dispatch_map.get(request.skill_type, self.answer_crm_question)
        return await handler(
            request=request,
            workspace_id=workspace_id,
            workspace_name=workspace_name,
            user_id=user_id,
            user_role=user_role,
        )

    # ─── Capability 1: Executive Account Summary ──────────────────────────────

    async def account_summary(
        self,
        request: SkillRequest,
        workspace_id: uuid.UUID,
        workspace_name: str,
        user_id: uuid.UUID,
        user_role: str = "member",
    ) -> SkillResponse:
        """Produces an executive-ready account summary for a company."""
        start = time.monotonic()
        goal = f"Executive account summary for {request.entity_name or 'the selected company'}"

        # 1. RAG retrieval on account documents
        rag_snippets = await self._retrieve_rag(
            workspace_id=workspace_id,
            query=f"{request.entity_name} account company overview deals contacts",
            entity_type="company",
            top_k=8,
        )

        # 2. Memory
        memory_context = await self._load_memories(workspace_id, user_id, goal)

        # 3. Build prompt from template
        template = get_template("account_summary")
        crm_context = self._format_crm_context(request, rag_snippets)
        system_prompt = template.render_system(
            workspace_name=workspace_name,
            crm_context=crm_context,
            rag_snippets=self._format_rag_for_prompt(rag_snippets),
            memory_context="\n".join(memory_context) or "No prior memory available.",
        )
        user_message = template.render_user(
            entity_name=request.entity_name or "the company",
            focus_areas=request.focus_areas or "revenue, relationships, open deals, risks",
        )

        # 4. LLM call
        summary, prompt_tokens, completion_tokens, cost, provider, model = await self._call_llm(
            system_prompt=system_prompt,
            user_message=user_message,
            provider=request.provider,
            model=request.model,
        )

        return self._build_response(
            request=request,
            summary=summary,
            goal=goal,
            rag_snippets=rag_snippets,
            memory_context=memory_context,
            tool_calls_used=["search_deals", "update_company"],
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            cost=cost,
            provider=provider,
            model=model,
            template_id="account_summary",
            start_time=start,
        )

    # ─── Capability 2: Opportunity Summary ────────────────────────────────────

    async def opportunity_summary(
        self,
        request: SkillRequest,
        workspace_id: uuid.UUID,
        workspace_name: str,
        user_id: uuid.UUID,
        user_role: str = "member",
    ) -> SkillResponse:
        """Analyzes all open deals and produces a pipeline opportunity summary."""
        start = time.monotonic()
        goal = "Open opportunity and pipeline analysis"

        rag_snippets = await self._retrieve_rag(
            workspace_id=workspace_id,
            query="open deals pipeline opportunities stage value close date",
            entity_type="deal",
            top_k=8,
        )
        memory_context = await self._load_memories(workspace_id, user_id, goal)

        template = get_template("opportunity_summary")
        crm_context = self._format_crm_context(request, rag_snippets)
        system_prompt = template.render_system(
            workspace_name=workspace_name,
            crm_context=crm_context,
            rag_snippets=self._format_rag_for_prompt(rag_snippets),
            memory_context="\n".join(memory_context) or "No prior memory available.",
        )
        user_message = template.render_user(
            focus_areas=request.focus_areas or "total value, top deals, at-risk deals, close dates",
            time_window=request.time_window or "30 days",
        )

        summary, prompt_tokens, completion_tokens, cost, provider, model = await self._call_llm(
            system_prompt=system_prompt,
            user_message=user_message,
            provider=request.provider,
            model=request.model,
        )

        return self._build_response(
            request=request,
            summary=summary,
            goal=goal,
            rag_snippets=rag_snippets,
            memory_context=memory_context,
            tool_calls_used=["search_deals"],
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            cost=cost,
            provider=provider,
            model=model,
            template_id="opportunity_summary",
            start_time=start,
        )

    # ─── Capability 3: Timeline Summary ───────────────────────────────────────

    async def timeline_summary(
        self,
        request: SkillRequest,
        workspace_id: uuid.UUID,
        workspace_name: str,
        user_id: uuid.UUID,
        user_role: str = "member",
    ) -> SkillResponse:
        """Reconstructs a workspace activity timeline for a specified time window."""
        start = time.monotonic()
        days_back = request.time_window or "7 days"
        goal = f"Workspace activity timeline for the last {days_back}"

        rag_snippets = await self._retrieve_rag(
            workspace_id=workspace_id,
            query=f"activity tasks meetings emails calls notes last {days_back}",
            top_k=6,
        )
        memory_context = await self._load_memories(workspace_id, user_id, goal)

        template = get_template("timeline_summary")
        crm_context = self._format_crm_context(request, rag_snippets)
        system_prompt = template.render_system(
            workspace_name=workspace_name,
            crm_context=crm_context,
            memory_context="\n".join(memory_context) or "No prior memory available.",
        )
        user_message = template.render_user(
            days_back=days_back,
            focus_areas=request.focus_areas or "deals, leads, tasks, meetings",
        )

        summary, prompt_tokens, completion_tokens, cost, provider, model = await self._call_llm(
            system_prompt=system_prompt,
            user_message=user_message,
            provider=request.provider,
            model=request.model,
        )

        return self._build_response(
            request=request,
            summary=summary,
            goal=goal,
            rag_snippets=rag_snippets,
            memory_context=memory_context,
            tool_calls_used=[],
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            cost=cost,
            provider=provider,
            model=model,
            template_id="timeline_summary",
            start_time=start,
        )

    # ─── Capability 4: Meeting Brief ──────────────────────────────────────────

    async def meeting_brief(
        self,
        request: SkillRequest,
        workspace_id: uuid.UUID,
        workspace_name: str,
        user_id: uuid.UUID,
        user_role: str = "member",
    ) -> SkillResponse:
        """Generates a pre-meeting briefing document for a contact or company."""
        start = time.monotonic()
        entity = request.entity_name or "the contact"
        goal = f"Pre-meeting brief for {entity}"

        rag_snippets = await self._retrieve_rag(
            workspace_id=workspace_id,
            query=f"{entity} background history deals notes meetings emails",
            entity_type=request.entity_type,
            top_k=6,
        )
        memory_context = await self._load_memories(workspace_id, user_id, goal)

        template = get_template("meeting_brief")
        crm_context = self._format_crm_context(request, rag_snippets)
        system_prompt = template.render_system(
            workspace_name=workspace_name,
            crm_context=crm_context,
            rag_snippets=self._format_rag_for_prompt(rag_snippets),
            memory_context="\n".join(memory_context) or "No prior memory available.",
        )
        user_message = template.render_user(
            entity_name=entity,
            purpose=request.focus_areas or "quarterly review and expansion discussion",
        )

        summary, prompt_tokens, completion_tokens, cost, provider, model = await self._call_llm(
            system_prompt=system_prompt,
            user_message=user_message,
            provider=request.provider,
            model=request.model,
        )

        return self._build_response(
            request=request,
            summary=summary,
            goal=goal,
            rag_snippets=rag_snippets,
            memory_context=memory_context,
            tool_calls_used=["search_contacts"],
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            cost=cost,
            provider=provider,
            model=model,
            template_id="meeting_brief",
            start_time=start,
        )

    # ─── Capability 5: CRM Q&A ────────────────────────────────────────────────

    async def answer_crm_question(
        self,
        request: SkillRequest,
        workspace_id: uuid.UUID,
        workspace_name: str,
        user_id: uuid.UUID,
        user_role: str = "member",
    ) -> SkillResponse:
        """Answers any natural language CRM question grounded in workspace data."""
        start = time.monotonic()
        question = request.question or "What is the current state of the CRM?"
        goal = question

        rag_snippets = await self._retrieve_rag(
            workspace_id=workspace_id,
            query=question,
            entity_type=request.entity_type,
            top_k=6,
        )
        memory_context = await self._load_memories(workspace_id, user_id, question)

        template = get_template("crm_qa")
        crm_context = self._format_crm_context(request, rag_snippets)
        system_prompt = template.render_system(
            workspace_name=workspace_name,
            crm_context=crm_context,
            rag_snippets=self._format_rag_for_prompt(rag_snippets),
            memory_context="\n".join(memory_context) or "No prior memory available.",
        )
        user_message = template.render_user(question=question)

        summary, prompt_tokens, completion_tokens, cost, provider, model = await self._call_llm(
            system_prompt=system_prompt,
            user_message=user_message,
            provider=request.provider,
            model=request.model,
        )

        return self._build_response(
            request=request,
            summary=summary,
            goal=goal,
            rag_snippets=rag_snippets,
            memory_context=memory_context,
            tool_calls_used=["search_deals", "search_contacts"],
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            cost=cost,
            provider=provider,
            model=model,
            template_id="crm_qa",
            start_time=start,
        )

    # ─── Capability 6: Show Blockers ──────────────────────────────────────────

    async def show_blockers(
        self,
        request: SkillRequest,
        workspace_id: uuid.UUID,
        workspace_name: str,
        user_id: uuid.UUID,
        user_role: str = "member",
    ) -> SkillResponse:
        """Identifies deals stuck in pipeline stages and recommends unblocking actions."""
        start = time.monotonic()
        goal = "Pipeline blocker identification and root cause analysis"

        rag_snippets = await self._retrieve_rag(
            workspace_id=workspace_id,
            query="stuck deals blocked stalled overdue pipeline risk",
            entity_type="deal",
            top_k=8,
        )
        memory_context = await self._load_memories(workspace_id, user_id, goal)

        template = get_template("blocker_analysis")
        crm_context = self._format_crm_context(request, rag_snippets)
        system_prompt = template.render_system(
            workspace_name=workspace_name,
            crm_context=crm_context,
            memory_context="\n".join(memory_context) or "No prior memory available.",
        )
        user_message = template.render_user(
            focus_areas=request.focus_areas or "high-value deals, enterprise accounts",
        )

        summary, prompt_tokens, completion_tokens, cost, provider, model = await self._call_llm(
            system_prompt=system_prompt,
            user_message=user_message,
            provider=request.provider,
            model=request.model,
        )

        return self._build_response(
            request=request,
            summary=summary,
            goal=goal,
            rag_snippets=rag_snippets,
            memory_context=memory_context,
            tool_calls_used=["search_deals"],
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            cost=cost,
            provider=provider,
            model=model,
            template_id="blocker_analysis",
            start_time=start,
        )

    # ─── Capability 7: Explain Pipeline ───────────────────────────────────────

    async def explain_pipeline(
        self,
        request: SkillRequest,
        workspace_id: uuid.UUID,
        workspace_name: str,
        user_id: uuid.UUID,
        user_role: str = "member",
    ) -> SkillResponse:
        """Explains pipeline structure, deal flow, conversion rates, and bottlenecks."""
        start = time.monotonic()
        goal = "Pipeline structure and deal flow explanation"

        rag_snippets = await self._retrieve_rag(
            workspace_id=workspace_id,
            query="pipeline stages deals conversion velocity value forecast",
            entity_type="deal",
            top_k=6,
        )
        memory_context = await self._load_memories(workspace_id, user_id, goal)

        template = get_template("pipeline_explanation")
        crm_context = self._format_crm_context(request, rag_snippets)
        system_prompt = template.render_system(
            workspace_name=workspace_name,
            crm_context=crm_context,
            memory_context="\n".join(memory_context) or "No prior memory available.",
        )
        user_message = template.render_user(
            highlight_areas=request.focus_areas or "bottlenecks, conversion rates, velocity",
        )

        summary, prompt_tokens, completion_tokens, cost, provider, model = await self._call_llm(
            system_prompt=system_prompt,
            user_message=user_message,
            provider=request.provider,
            model=request.model,
        )

        return self._build_response(
            request=request,
            summary=summary,
            goal=goal,
            rag_snippets=rag_snippets,
            memory_context=memory_context,
            tool_calls_used=["search_deals"],
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            cost=cost,
            provider=provider,
            model=model,
            template_id="pipeline_explanation",
            start_time=start,
        )

    # ─── Internal Helpers ─────────────────────────────────────────────────────

    def _format_crm_context(self, request: SkillRequest, rag_snippets: list[dict[str, Any]]) -> str:
        """Builds a text block of CRM context for prompt injection."""
        lines: list[str] = []
        if request.entity_type and request.entity_name:
            lines.append(f"Active Entity: {request.entity_type.title()} — {request.entity_name}")
        if request.entity_id:
            lines.append(f"Entity ID: {request.entity_id}")
        if request.context_hints:
            for k, v in request.context_hints.items():
                lines.append(f"{k}: {v}")
        if not lines:
            lines.append("No specific entity selected — workspace-wide analysis.")
        return "\n".join(lines)

    def _format_rag_for_prompt(self, snippets: list[dict[str, Any]]) -> str:
        """Formats RAG snippets into a readable block for prompt injection."""
        if not snippets:
            return "No relevant documents found."
        formatted: list[str] = []
        for i, s in enumerate(snippets[:6], 1):
            text = s.get("chunk_text", s.get("text", ""))[:400]
            source = s.get("entity_type", "document")
            score = s.get("relevance_score", 0.0)
            formatted.append(f"[{i}] ({source}, relevance={score:.2f})\n{text}")
        return "\n\n".join(formatted)

    def _build_response(
        self,
        request: SkillRequest,
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
        start_time: float,
    ) -> SkillResponse:
        """Assembles the full SkillResponse from all computed parts."""
        latency_ms = int((time.monotonic() - start_time) * 1000)

        # Confidence
        conf_score, conf_label, conf_explanation = self._score_confidence(
            rag_snippets=rag_snippets,
            memory_hits=len(memory_context),
            tool_calls_made=len(tool_calls_used),
            response_text=summary,
        )

        # Citations
        citations = self._extract_citations(rag_snippets)

        # Insights
        insights = self._generate_insights(
            analysis_text=summary,
            entity_type=request.entity_type,
            entity_id=str(request.entity_id) if request.entity_id else None,
        )

        # Recommendations
        raw_insights = [type("I", (), {"insight_type": i.insight_type})() for i in insights]
        recommendations = InsightGenerator.generate_next_actions(template_id, raw_insights)  # type: ignore[arg-type]

        # Reasoning chain
        reasoning = self._build_reasoning_chain(
            goal=goal,
            rag_snippets=rag_snippets,
            memory_context=memory_context,
            tool_calls_used=tool_calls_used,
            llm_summary=summary,
            confidence=conf_score,
        )

        # Next actions are a subset of recommendations
        next_actions = recommendations[:3]

        template = get_template(template_id)

        return SkillResponse(
            skill_type=self.skill_type,
            summary=summary,
            reasoning_chain=reasoning,
            confidence=conf_score,
            confidence_label=conf_label,  # type: ignore[arg-type]
            confidence_explanation=conf_explanation,
            citations=citations,
            insights=insights,
            recommendations=recommendations,
            next_actions=next_actions,
            tool_calls_used=tool_calls_used,
            latency_ms=latency_ms,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            estimated_cost_usd=cost,
            provider_used=provider,
            model_used=model,
            template_id=template_id,
            template_version=template.version,
        )
