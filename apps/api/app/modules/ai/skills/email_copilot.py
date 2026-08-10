"""
ForgeCRM — Enterprise Email Copilot & Communication Skill (Phase 7.4.5)

Provides 20 enterprise email & communication capabilities:
  1. compose_email            — Draft cold/warm sales prospecting emails
  2. reply_email              — Context-aware professional reply generation
  3. summarize_thread         — Thread summarization & action item extraction
  4. rewrite_email            — Copy editing for clarity and response optimization
  5. improve_tone             — Tone adjustment (Executive, Formal, Friendly, Persuasive, Urgent)
  6. shorten_email            — Conciseness optimization
  7. expand_email             — Detailed elaboration on key value propositions
  8. executive_summary        — C-suite BLUF briefing email
  9. meeting_followup         — Post-meeting recap & action items email
 10. proposal_email           — Commercial proposal & pricing deal email
 11. introduction_email       — Executive/partner warm intro email
 12. cold_outreach            — High-converting cold outreach sequence
 13. customer_followup        — Value-added customer check-in email
 14. negotiation_email       — Pricing negotiation & concession terms email
 15. escalation_email        — Urgent issue escalation to leadership email
 16. objection_response       — Sales objection handling & counter-argument reply
 17. email_sentiment          — Customer sentiment classification & risk analysis
 18. multilingual_translation — Translation into Spanish, French, German, Japanese, etc.
 19. grammar_fix              — Grammar, spelling, and B2B etiquette correction
 20. communication_summary    — Unified communication activity synthesis

Extends BaseAISkill and registers in SkillRegistry.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

from typing import Any

from app.modules.ai.skills.base import BaseAISkill
from app.modules.ai.skills.registry import SkillRegistry
from app.modules.ai.skills.schemas import SkillRequest
from app.modules.ai.skills.shared.prompt_registry import PromptRegistry


class EmailCopilotSkill(BaseAISkill):
    """
    Enterprise Email Copilot — AI skill for email generation, thread summarization, tone adjustment, and translation.

    Extends BaseAISkill template method execution pipeline.
    Overrides `build_prompt()` to map skill requests to PromptRegistry templates.
    """

    skill_type = "email_copilot"
    default_template_id = "EMAIL_REPLY"

    def build_prompt(
        self,
        request: SkillRequest,
        workspace_name: str,
        crm_context: str,
        rag_snippets: list[dict[str, Any]],
        memory_context: list[str],
    ) -> tuple[str, str, str]:
        """Maps request.skill to PromptRegistry templates for Email Copilot."""
        skill_key = (request.skill or request.skill_type or "reply_email").lower()

        template_map = {
            "reply_email": "EMAIL_REPLY",
            "reply": "EMAIL_REPLY",
            "objection_response": "EMAIL_REPLY",
            "summarize_thread": "EMAIL_SUMMARY",
            "email_summary": "EMAIL_SUMMARY",
            "email_sentiment": "EMAIL_SUMMARY",
            "communication_summary": "EMAIL_SUMMARY",
            "rewrite_email": "EMAIL_REWRITE",
            "shorten_email": "EMAIL_REWRITE",
            "expand_email": "EMAIL_REWRITE",
            "grammar_fix": "EMAIL_REWRITE",
            "improve_tone": "EMAIL_TONE",
            "change_tone": "EMAIL_TONE",
            "customer_followup": "CUSTOMER_FOLLOWUP",
            "followup": "CUSTOMER_FOLLOWUP",
            "meeting_followup": "MEETING_FOLLOWUP",
            "recap_email": "MEETING_FOLLOWUP",
            "compose_email": "SALES_OUTREACH",
            "cold_outreach": "SALES_OUTREACH",
            "introduction_email": "SALES_OUTREACH",
            "proposal_email": "NEGOTIATION_EMAIL",
            "negotiation_email": "NEGOTIATION_EMAIL",
            "executive_summary": "EXECUTIVE_EMAIL",
            "escalation_email": "EXECUTIVE_EMAIL",
            "multilingual_translation": "EMAIL_TRANSLATION",
            "translate": "EMAIL_TRANSLATION",
        }

        template_id = template_map.get(skill_key, "EMAIL_REPLY")
        template = PromptRegistry.get(template_id)

        formatted_rag = self._format_rag_snippets(rag_snippets)
        formatted_mem = "\n".join(memory_context) if memory_context else "No prior email communication memory."
        entity_name = request.entity_name or "the recipient"

        if template_id == "EMAIL_REPLY":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                rag_snippets=formatted_rag,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                entity_name=entity_name,
                focus_areas=request.focus_areas or request.question or "Thank you for the proposal, let's schedule a call.",
            )
        elif template_id == "EMAIL_SUMMARY":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                entity_name=entity_name,
                focus_areas=request.focus_areas or "Recent email chain regarding enterprise contract terms",
            )
        elif template_id == "EMAIL_REWRITE":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                focus_areas=request.question or request.focus_areas or "Hi, just wanted to check if you had time to review our proposal.",
            )
        elif template_id == "EMAIL_TONE":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                entity_name=request.question or "Draft email content",
                focus_areas=request.focus_areas or "Executive",
            )
        elif template_id == "CUSTOMER_FOLLOWUP":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                entity_name=entity_name,
                focus_areas=request.focus_areas or "Following up on Q3 platform deployment roadmap",
            )
        elif template_id == "MEETING_FOLLOWUP":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                rag_snippets=formatted_rag,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                entity_name=entity_name,
                focus_areas=request.focus_areas or "Discussed pricing, technical integration, and security clearance",
            )
        elif template_id == "SALES_OUTREACH":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                rag_snippets=formatted_rag,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                entity_name=entity_name,
                focus_areas=request.focus_areas or "AI-driven sales automation & CRM intelligence",
            )
        elif template_id == "NEGOTIATION_EMAIL":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                rag_snippets=formatted_rag,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                entity_name=entity_name,
                focus_areas=request.focus_areas or "10% annual discount in exchange for 3-year enterprise commitment",
            )
        elif template_id == "EXECUTIVE_EMAIL":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                entity_name=entity_name,
                focus_areas=request.focus_areas or "Acme Corp $250K Expansion Deal Sign-off",
            )
        elif template_id == "EMAIL_TRANSLATION":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
            )
            user_message = template.render_user(
                entity_name=request.question or "Hello, thank you for your message.",
                focus_areas=request.focus_areas or "Spanish",
            )
        else:
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                rag_snippets=formatted_rag,
                memory_context=formatted_mem,
            )
            user_message = f"Process email request '{skill_key}' for recipient {entity_name}."

        return system_prompt, user_message, template_id

    def _format_rag_snippets(self, rag_snippets: list[dict[str, Any]]) -> str:
        if not rag_snippets:
            return "No relevant RAG documents found."
        formatted: list[str] = []
        for i, s in enumerate(rag_snippets[:6], 1):
            text = s.get("chunk_text", s.get("text", ""))[:400]
            stype = s.get("entity_type", "email")
            score = s.get("relevance_score", 0.0)
            formatted.append(f"[{i}] ({stype}, relevance={score:.2f})\n{text}")
        return "\n\n".join(formatted)


# ─── Auto-register EmailCopilotSkill in SkillRegistry ────────────────────────

SkillRegistry.register_many(
    [
        "email_copilot",
        "compose_email",
        "reply_email",
        "summarize_thread",
        "rewrite_email",
        "improve_tone",
        "shorten_email",
        "expand_email",
        "executive_summary",
        "meeting_followup",
        "proposal_email",
        "introduction_email",
        "cold_outreach",
        "customer_followup",
        "negotiation_email",
        "escalation_email",
        "objection_response",
        "email_sentiment",
        "multilingual_translation",
        "grammar_fix",
        "communication_summary",
    ],
    EmailCopilotSkill,
)
