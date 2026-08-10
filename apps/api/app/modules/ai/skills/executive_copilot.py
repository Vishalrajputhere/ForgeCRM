"""
ForgeCRM — Enterprise Executive Copilot & Strategic Intelligence Skill (Phase 7.4.6)

Provides 20 enterprise executive intelligence capabilities:
  1. executive_dashboard      — Board-level executive dashboard synthesis
  2. company_health           — Commercial company health score & risk assessment
  3. quarterly_review         — Quarterly performance & strategic review
  4. weekly_summary           — Weekly executive pipeline & revenue briefing
  5. executive_brief          — Concise C-suite executive briefing
  6. board_report             — Formal quarterly Board of Directors report
  7. kpi_analysis             — Deep-dive SaaS metric & velocity KPI diagnostics
  8. revenue_summary          — ARR, MRR, NRR, and net revenue synthesis
  9. pipeline_summary         — Executive pipeline coverage & bottleneck summary
 10. sales_velocity           — Sales cycle length & deal velocity analysis
 11. team_performance         — Sales rep quota attainment & activity audit
 12. forecast_variance        — Revenue forecast vs budget variance analysis
 13. risk_overview            — Top commercial & operational organizational risks
 14. strategic_opportunities  — Market expansion & enterprise growth opportunities
 15. customer_health          — NRR, GRR, and customer retention outlook
 16. renewal_outlook          — Account renewal risk & expansion forecast
 17. market_summary           — Industry macro trends & TAM summary
 18. competitive_analysis     — Competitive displacement & market positioning
 19. growth_recommendations   — Strategic C-suite revenue growth directives
 20. executive_next_actions   — Prioritized 5-point executive action plan

Extends BaseAISkill and registers in SkillRegistry.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

from typing import Any

from app.modules.ai.skills.base import BaseAISkill
from app.modules.ai.skills.registry import SkillRegistry
from app.modules.ai.skills.schemas import SkillRequest
from app.modules.ai.skills.shared.prompt_registry import PromptRegistry


class ExecutiveCopilotSkill(BaseAISkill):
    """
    Enterprise Executive Copilot — AI skill for board reporting, executive briefings, and strategic intelligence.

    Extends BaseAISkill template method execution pipeline.
    Overrides `build_prompt()` to map skill requests to PromptRegistry templates.
    """

    skill_type = "executive_copilot"
    default_template_id = "EXECUTIVE_DASHBOARD"

    def build_prompt(
        self,
        request: SkillRequest,
        workspace_name: str,
        crm_context: str,
        rag_snippets: list[dict[str, Any]],
        memory_context: list[str],
    ) -> tuple[str, str, str]:
        """Maps request.skill to PromptRegistry templates for Executive Copilot."""
        skill_key = (request.skill or request.skill_type or "executive_dashboard").lower()

        template_map = {
            "executive_dashboard": "EXECUTIVE_DASHBOARD",
            "executive_brief": "EXECUTIVE_DASHBOARD",
            "company_health": "COMPANY_HEALTH",
            "customer_health": "COMPANY_HEALTH",
            "risk_overview": "COMPANY_HEALTH",
            "quarterly_review": "BOARD_REPORT",
            "board_report": "BOARD_REPORT",
            "weekly_summary": "EXECUTIVE_WEEKLY_REPORT",
            "kpi_analysis": "KPI_ANALYSIS",
            "sales_velocity": "KPI_ANALYSIS",
            "pipeline_summary": "PIPELINE_SUMMARY",
            "revenue_summary": "REVENUE_SUMMARY",
            "forecast_variance": "REVENUE_SUMMARY",
            "renewal_outlook": "REVENUE_SUMMARY",
            "team_performance": "TEAM_PERFORMANCE",
            "strategic_opportunities": "STRATEGIC_OPPORTUNITIES",
            "market_summary": "STRATEGIC_OPPORTUNITIES",
            "competitive_analysis": "STRATEGIC_OPPORTUNITIES",
            "growth_recommendations": "STRATEGIC_OPPORTUNITIES",
            "executive_next_actions": "EXECUTIVE_NEXT_ACTIONS",
        }

        template_id = template_map.get(skill_key, "EXECUTIVE_DASHBOARD")
        template = PromptRegistry.get(template_id)

        formatted_rag = self._format_rag_snippets(rag_snippets)
        formatted_mem = "\n".join(memory_context) if memory_context else "No prior executive briefing history."
        time_window = request.time_window or "Q3 2026"

        if template_id == "EXECUTIVE_DASHBOARD":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                rag_snippets=formatted_rag,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                workspace_name=workspace_name,
                time_window=time_window,
            )
        elif template_id == "EXECUTIVE_WEEKLY_REPORT":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                workspace_name=workspace_name,
                focus_areas=request.focus_areas or "pipeline velocity, key wins & losses, quota progress",
            )
        elif template_id == "BOARD_REPORT":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                rag_snippets=formatted_rag,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                workspace_name=workspace_name,
                time_window=time_window,
            )
        elif template_id == "KPI_ANALYSIS":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                workspace_name=workspace_name,
                focus_areas=request.focus_areas or "Sales Cycle, Average Deal Size, CAC Payback, Win Rate, NRR",
            )
        elif template_id == "COMPANY_HEALTH":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                workspace_name=workspace_name,
            )
        elif template_id == "PIPELINE_SUMMARY":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
            )
            user_message = template.render_user(
                workspace_name=workspace_name,
                time_window=time_window,
            )
        elif template_id == "REVENUE_SUMMARY":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
            )
            user_message = template.render_user(
                workspace_name=workspace_name,
                time_window=time_window,
            )
        elif template_id == "TEAM_PERFORMANCE":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
            )
            user_message = template.render_user(
                workspace_name=workspace_name,
            )
        elif template_id == "STRATEGIC_OPPORTUNITIES":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                rag_snippets=formatted_rag,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                workspace_name=workspace_name,
            )
        elif template_id == "EXECUTIVE_NEXT_ACTIONS":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                workspace_name=workspace_name,
            )
        else:
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                rag_snippets=formatted_rag,
                memory_context=formatted_mem,
            )
            user_message = f"Generate {skill_key} executive intelligence briefing for {workspace_name}."

        return system_prompt, user_message, template_id

    def _format_rag_snippets(self, rag_snippets: list[dict[str, Any]]) -> str:
        if not rag_snippets:
            return "No relevant RAG documents found."
        formatted: list[str] = []
        for i, s in enumerate(rag_snippets[:6], 1):
            text = s.get("chunk_text", s.get("text", ""))[:400]
            stype = s.get("entity_type", "report")
            score = s.get("relevance_score", 0.0)
            formatted.append(f"[{i}] ({stype}, relevance={score:.2f})\n{text}")
        return "\n\n".join(formatted)


# ─── Auto-register ExecutiveCopilotSkill in SkillRegistry ────────────────────

SkillRegistry.register_many(
    [
        "executive_copilot",
        "executive_dashboard",
        "company_health",
        "quarterly_review",
        "weekly_summary",
        "executive_brief",
        "board_report",
        "kpi_analysis",
        "revenue_summary",
        "pipeline_summary",
        "sales_velocity",
        "team_performance",
        "forecast_variance",
        "risk_overview",
        "strategic_opportunities",
        "customer_health",
        "renewal_outlook",
        "market_summary",
        "competitive_analysis",
        "growth_recommendations",
        "executive_next_actions",
    ],
    ExecutiveCopilotSkill,
)
