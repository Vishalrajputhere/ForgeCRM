"""
ForgeCRM — Enterprise Lead Qualification AI Skill (Phase 7.4.3)

Provides 15 enterprise lead qualification & scoring capabilities:
  1. qualify_lead             — Full BANT/MEDDPICC lead qualification
  2. lead_score               — Composite lead scoring
  3. fit_score                — Firmographic fit score
  4. intent_score             — Behavioral intent score
  5. icp_match                — Ideal Customer Profile alignment & gap analysis
  6. buying_signals           — Intent signal detection & urgency scoring
  7. urgency_detection        — Purchase timeline & urgency analysis
  8. persona_detection        — Buyer persona identification
  9. company_fit              — Target account firmographic evaluation
 10. recommended_owner        — Sales rep assignment recommendation
 11. routing_recommendation   — Intelligent lead routing (SDR / AE / Self-serve)
 12. qualification_summary    — Executive lead profile briefing
 13. next_best_action         — Recommended sales actions
 14. follow_up_strategy       — Personalised 3-step outreach strategy
 15. qualification_reasoning  — Step-by-step qualification rationale

Extends BaseAISkill and registers in SkillRegistry.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

from typing import Any

from app.modules.ai.skills.base import BaseAISkill
from app.modules.ai.skills.registry import SkillRegistry
from app.modules.ai.skills.schemas import SkillRequest
from app.modules.ai.skills.shared.prompt_registry import PromptRegistry


class LeadQualificationSkill(BaseAISkill):
    """
    Enterprise Lead Qualification — AI skill for lead scoring, ICP match, and intent analysis.

    Extends BaseAISkill template method execution pipeline.
    Overrides `build_prompt()` to map skill requests to PromptRegistry templates.
    """

    skill_type = "lead_qualification"
    default_template_id = "LEAD_QUALIFICATION"

    def build_prompt(
        self,
        request: SkillRequest,
        workspace_name: str,
        crm_context: str,
        rag_snippets: list[dict[str, Any]],
        memory_context: list[str],
    ) -> tuple[str, str, str]:
        """Maps request.skill to PromptRegistry templates for Lead Qualification."""
        skill_key = (request.skill or request.skill_type or "lead_qualification").lower()

        template_map = {
            "lead_qualification": "LEAD_QUALIFICATION",
            "qualify_lead": "LEAD_QUALIFICATION",
            "qualification_reasoning": "LEAD_QUALIFICATION",
            "full_qualification": "LEAD_QUALIFICATION",
            "icp_match": "ICP_MATCH",
            "company_fit": "ICP_MATCH",
            "lead_score": "LEAD_SCORING",
            "lead_scoring": "LEAD_SCORING",
            "fit_score": "LEAD_SCORING",
            "intent_score": "LEAD_SCORING",
            "buying_signals": "BUYING_SIGNALS",
            "urgency_detection": "BUYING_SIGNALS",
            "persona_detection": "LEAD_SUMMARY",
            "recommended_owner": "LEAD_QUALIFICATION",
            "routing_recommendation": "LEAD_QUALIFICATION",
            "qualification_summary": "LEAD_SUMMARY",
            "lead_summary": "LEAD_SUMMARY",
            "next_best_action": "FOLLOW_UP_STRATEGY",
            "follow_up_strategy": "FOLLOW_UP_STRATEGY",
            "follow_up": "FOLLOW_UP_STRATEGY",
        }

        template_id = template_map.get(skill_key, "LEAD_QUALIFICATION")
        template = PromptRegistry.get(template_id)

        formatted_rag = self._format_rag_snippets(rag_snippets)
        formatted_mem = "\n".join(memory_context) if memory_context else "No prior lead interaction memory."
        entity_name = request.entity_name or "the target lead"

        if template_id == "LEAD_QUALIFICATION":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                rag_snippets=formatted_rag,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                entity_name=entity_name,
                company_name=request.focus_areas or "Target Company",
                title="Decision Maker",
            )
        elif template_id == "ICP_MATCH":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                rag_snippets=formatted_rag,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                entity_name=entity_name,
                industry=request.focus_areas or "Software / SaaS",
                company_size="100-500 employees",
            )
        elif template_id == "LEAD_SCORING":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                entity_name=entity_name,
                email="lead@company.com",
                source=request.focus_areas or "Inbound Demo Request",
            )
        elif template_id == "BUYING_SIGNALS":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                rag_snippets=formatted_rag,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                entity_name=entity_name,
                activities=request.focus_areas or "Downloaded whitepaper, visited pricing page 3x, requested demo",
            )
        elif template_id == "FOLLOW_UP_STRATEGY":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                entity_name=entity_name,
                pain_points=request.focus_areas or "scaling sales ops, pipeline visibility, manual CRM data entry",
            )
        elif template_id == "LEAD_SUMMARY":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                rag_snippets=formatted_rag,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                entity_name=entity_name,
                rep_name="Assigned SDR / AE",
            )
        else:
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                rag_snippets=formatted_rag,
                memory_context=formatted_mem,
            )
            user_message = f"Perform {skill_key} analysis for lead {entity_name}."

        return system_prompt, user_message, template_id

    def _format_rag_snippets(self, rag_snippets: list[dict[str, Any]]) -> str:
        if not rag_snippets:
            return "No relevant RAG documents found."
        formatted: list[str] = []
        for i, s in enumerate(rag_snippets[:6], 1):
            text = s.get("chunk_text", s.get("text", ""))[:400]
            stype = s.get("entity_type", "lead")
            score = s.get("relevance_score", 0.0)
            formatted.append(f"[{i}] ({stype}, relevance={score:.2f})\n{text}")
        return "\n\n".join(formatted)


# ─── Auto-register LeadQualificationSkill in SkillRegistry ───────────────────

SkillRegistry.register_many(
    [
        "lead_qualification",
        "qualify_lead",
        "lead_score",
        "lead_scoring",
        "fit_score",
        "intent_score",
        "icp_match",
        "buying_signals",
        "urgency_detection",
        "persona_detection",
        "company_fit",
        "recommended_owner",
        "routing_recommendation",
        "qualification_summary",
        "lead_summary",
        "next_best_action",
        "follow_up_strategy",
        "follow_up",
        "qualification_reasoning",
    ],
    LeadQualificationSkill,
)
