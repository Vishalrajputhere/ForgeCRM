"""
ForgeCRM — Enterprise Sales Copilot AI Skill

Provides 6 enterprise sales intelligence capabilities powered by BaseAISkill:
  1. account_summary     — Executive account summary for a company
  2. opportunity_summary — Open opportunity and pipeline analysis
  3. timeline_summary    — Workspace activity timeline reconstruction
  4. answer_crm_question — Natural language CRM Q&A
  5. explain_pipeline    — Pipeline structure and deal flow explanation
  6. show_blockers       — Pipeline blocker identification & recommendations

Note: `meeting_brief` is omitted as it belongs to the Communication Assistant phase.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

from typing import Any

from app.modules.ai.skills.base import BaseAISkill
from app.modules.ai.skills.registry import SkillRegistry
from app.modules.ai.skills.schemas import SkillRequest
from app.modules.ai.skills.shared.prompt_registry import PromptRegistry


class SalesCopilotSkill(BaseAISkill):
    """
    Enterprise Sales Copilot — the primary AI assistant for CRM users.

    Inherits standard execution pipeline from BaseAISkill.
    Overrides `build_prompt()` to select templates from PromptRegistry based on request.skill.
    """

    skill_type = "sales_copilot"
    default_template_id = "CRM_QA"

    def build_prompt(
        self,
        request: SkillRequest,
        workspace_name: str,
        crm_context: str,
        rag_snippets: list[dict[str, Any]],
        memory_context: list[str],
    ) -> tuple[str, str, str]:
        """Maps request.skill to a PromptRegistry template and returns (system_prompt, user_message, template_id)."""
        skill_key = (request.skill or request.skill_type or "crm_qa").lower()

        template_map = {
            "account_summary": "ACCOUNT_SUMMARY",
            "opportunity_summary": "OPPORTUNITY_SUMMARY",
            "timeline_summary": "TIMELINE_SUMMARY",
            "explain_pipeline": "PIPELINE_ANALYSIS",
            "pipeline_analysis": "PIPELINE_ANALYSIS",
            "show_blockers": "BLOCKER_ANALYSIS",
            "blocker_analysis": "BLOCKER_ANALYSIS",
            "crm_qa": "CRM_QA",
        }
        template_id = template_map.get(skill_key, "CRM_QA")
        template = PromptRegistry.get(template_id)

        formatted_rag = self._format_rag_snippets(rag_snippets)
        formatted_mem = "\n".join(memory_context) if memory_context else "No prior memory available."

        if template_id == "ACCOUNT_SUMMARY":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                rag_snippets=formatted_rag,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                entity_name=request.entity_name or "the selected company",
                focus_areas=request.focus_areas or "revenue, open deals, risks, key contacts",
            )
        elif template_id == "OPPORTUNITY_SUMMARY":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                rag_snippets=formatted_rag,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                focus_areas=request.focus_areas or "total value, top deals, at-risk deals",
                time_window=request.time_window or "30 days",
            )
        elif template_id == "TIMELINE_SUMMARY":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                days_back=request.time_window or "30 days",
                focus_areas=request.focus_areas or "deals, leads, tasks, meetings",
            )
        elif template_id == "PIPELINE_ANALYSIS":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                highlight_areas=request.focus_areas or "bottlenecks, conversion rates, deal velocity",
            )
        elif template_id == "BLOCKER_ANALYSIS":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                focus_areas=request.focus_areas or "high-value deals, stuck deals",
            )
        else:  # CRM_QA
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                rag_snippets=formatted_rag,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                question=request.question or "What is the current state of the sales pipeline?",
            )

        return system_prompt, user_message, template_id

    # ─── Helper: Format RAG Snippets for Prompt Injection ─────────────────────

    def _format_rag_snippets(self, rag_snippets: list[dict[str, Any]]) -> str:
        if not rag_snippets:
            return "No relevant RAG documents found."
        formatted: list[str] = []
        for i, s in enumerate(rag_snippets[:6], 1):
            text = s.get("chunk_text", s.get("text", ""))[:400]
            stype = s.get("entity_type", "document")
            score = s.get("relevance_score", 0.0)
            formatted.append(f"[{i}] ({stype}, relevance={score:.2f})\n{text}")
        return "\n\n".join(formatted)


# ─── Auto-register SalesCopilotSkill in SkillRegistry ─────────────────────────

SkillRegistry.register_many(
    [
        "sales_copilot",
        "crm_qa",
        "account_summary",
        "opportunity_summary",
        "timeline_summary",
        "explain_pipeline",
        "pipeline_analysis",
        "show_blockers",
        "blocker_analysis",
    ],
    SalesCopilotSkill,
)
