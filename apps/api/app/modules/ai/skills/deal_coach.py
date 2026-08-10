"""
ForgeCRM — Enterprise Deal Coach AI Skill (Phase 7.4.2)

Provides 15 enterprise deal coaching and sales intelligence capabilities:
  1. deal_health             — Comprehensive deal health analysis
  2. win_probability         — Win probability estimation & confidence
  3. risk_detection          — Risk detection & mitigation strategy
  4. stakeholder_gaps        — Missing stakeholder identification
  5. pipeline_hygiene        — CRM data quality & hygiene auditing
  6. timeline_analysis       — Historical deal activity timeline review
  7. next_best_action        — Prioritized action recommendations
  8. negotiation_strategy    — Negotiation playbook & concession management
  9. competitor_analysis     — Competitive positioning & displacement tactics
 10. closing_readiness       — Closing readiness checklist & milestone audit
 11. executive_summary       — Board/executive deal summary
 12. deal_blockers           — Root cause blocker analysis
 13. forecast_contribution   — Deal contribution to workspace revenue forecast
 14. crm_hygiene             — Missing required fields & stale date detection
 15. sentiment_summary       — Customer engagement sentiment synthesis

Extends BaseAISkill and registers in SkillRegistry.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

from typing import Any

from app.modules.ai.skills.base import BaseAISkill
from app.modules.ai.skills.registry import SkillRegistry
from app.modules.ai.skills.schemas import SkillRequest
from app.modules.ai.skills.shared.prompt_registry import PromptRegistry


class DealCoachSkill(BaseAISkill):
    """
    Enterprise Deal Coach — AI skill for deal health, win probability, and risk coaching.

    Extends BaseAISkill template method execution pipeline.
    Overrides `build_prompt()` to map skill requests to PromptRegistry templates.
    """

    skill_type = "deal_coach"
    default_template_id = "DEAL_HEALTH"

    def build_prompt(
        self,
        request: SkillRequest,
        workspace_name: str,
        crm_context: str,
        rag_snippets: list[dict[str, Any]],
        memory_context: list[str],
    ) -> tuple[str, str, str]:
        """Maps request.skill to PromptRegistry templates for Deal Coach."""
        skill_key = (request.skill or request.skill_type or "deal_health").lower()

        template_map = {
            "deal_health": "DEAL_HEALTH",
            "health_analysis": "DEAL_HEALTH",
            "win_probability": "WIN_PROBABILITY",
            "win_rate": "WIN_PROBABILITY",
            "deal_risk": "DEAL_RISK",
            "risk_detection": "DEAL_RISK",
            "stakeholder_gaps": "DEAL_RISK",
            "missing_stakeholders": "DEAL_RISK",
            "pipeline_hygiene": "DEAL_HEALTH",
            "crm_hygiene": "DEAL_HEALTH",
            "timeline_analysis": "TIMELINE_SUMMARY",
            "deal_timeline": "TIMELINE_SUMMARY",
            "next_best_action": "NEXT_BEST_ACTION",
            "next_action": "NEXT_BEST_ACTION",
            "negotiation_strategy": "NEGOTIATION_STRATEGY",
            "competitor_analysis": "NEGOTIATION_STRATEGY",
            "closing_readiness": "CLOSING_READINESS",
            "executive_summary": "DEAL_EXECUTIVE_SUMMARY",
            "deal_summary": "DEAL_EXECUTIVE_SUMMARY",
            "deal_blockers": "BLOCKER_ANALYSIS",
            "forecast_contribution": "WIN_PROBABILITY",
            "sentiment_summary": "DEAL_HEALTH",
        }

        template_id = template_map.get(skill_key, "DEAL_HEALTH")
        template = PromptRegistry.get(template_id)

        formatted_rag = self._format_rag_snippets(rag_snippets)
        formatted_mem = "\n".join(memory_context) if memory_context else "No prior deal memory available."
        entity_name = request.entity_name or "the target deal"

        if template_id == "DEAL_HEALTH":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                rag_snippets=formatted_rag,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                entity_name=entity_name,
                focus_areas=request.focus_areas or "stage progression, activity velocity, risks, stakeholder gaps",
            )
        elif template_id == "WIN_PROBABILITY":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                rag_snippets=formatted_rag,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                entity_name=entity_name,
                stage="Current Stage",
                close_date="Target Close Date",
            )
        elif template_id == "DEAL_RISK":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                entity_name=entity_name,
                focus_areas=request.focus_areas or "stakeholder risk, competitive risk, budget risk, timeline risk",
            )
        elif template_id == "NEXT_BEST_ACTION":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                entity_name=entity_name,
                blockers=request.focus_areas or "none identified",
            )
        elif template_id == "NEGOTIATION_STRATEGY":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                rag_snippets=formatted_rag,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                entity_name=entity_name,
                concerns=request.focus_areas or "pricing, contract terms, SLA, scope",
            )
        elif template_id == "CLOSING_READINESS":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                entity_name=entity_name,
                close_date="Target Close Date",
            )
        elif template_id == "DEAL_EXECUTIVE_SUMMARY":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                rag_snippets=formatted_rag,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                entity_name=entity_name,
                audience="Executive Leadership / Board",
            )
        else:
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                rag_snippets=formatted_rag,
                memory_context=formatted_mem,
            )
            user_message = f"Perform {skill_key} analysis for deal {entity_name}."

        return system_prompt, user_message, template_id

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


# ─── Auto-register DealCoachSkill in SkillRegistry ────────────────────────────

SkillRegistry.register_many(
    [
        "deal_coach",
        "deal_health",
        "health_analysis",
        "win_probability",
        "win_rate",
        "deal_risk",
        "risk_detection",
        "stakeholder_gaps",
        "missing_stakeholders",
        "pipeline_hygiene",
        "crm_hygiene",
        "timeline_analysis",
        "deal_timeline",
        "next_best_action",
        "next_action",
        "negotiation_strategy",
        "competitor_analysis",
        "closing_readiness",
        "executive_summary",
        "deal_summary",
        "deal_blockers",
        "forecast_contribution",
        "sentiment_summary",
    ],
    DealCoachSkill,
)
