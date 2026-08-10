"""
ForgeCRM — Enterprise Forecast AI & Revenue Intelligence Skill (Phase 7.4.4)

Provides 18 enterprise forecast & revenue intelligence capabilities:
  1. revenue_forecast       — Quarterly & monthly revenue predictions with confidence intervals
  2. pipeline_forecast      — Funnel conversion & stage progression forecast
  3. quarterly_forecast     — Full quarter revenue & quota forecast
  4. monthly_foreview       — Month-by-month revenue projections
  5. renewal_forecast       — Customer contract renewal revenue forecast
  6. churn_prediction       — Customer churn risk & NRR impact forecasting
  7. expansion_prediction   — Upsell, cross-sell & expansion opportunity forecast
  8. forecast_accuracy      — Historical forecast accuracy analysis
  9. scenario_analysis      — Best Case, Expected Case, Worst Case simulation
 10. best_case              — Optimistic 90% commit win rate scenario
 11. expected_case          — Baseline expected revenue scenario
 12. worst_case             — Conservative worst case revenue scenario
 13. pipeline_coverage      — Pipeline coverage ratio against quota
 14. quota_attainment       — Target quota attainment prediction
 15. executive_forecast     — Board-level executive briefing
 16. forecast_summary       — Comprehensive revenue & forecast summary
 17. forecast_reasoning     — Rationale and drivers behind forecast
 18. forecast_alerts        — At-risk revenue & pipeline anomaly alerts

Extends BaseAISkill and registers in SkillRegistry.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

from typing import Any

from app.modules.ai.skills.base import BaseAISkill
from app.modules.ai.skills.registry import SkillRegistry
from app.modules.ai.skills.schemas import SkillRequest
from app.modules.ai.skills.shared.prompt_registry import PromptRegistry


class ForecastAISkill(BaseAISkill):
    """
    Enterprise Forecast AI — AI skill for revenue forecasting, scenario simulation, and churn/expansion intelligence.

    Extends BaseAISkill template method execution pipeline.
    Overrides `build_prompt()` to map skill requests to PromptRegistry templates.
    """

    skill_type = "forecast_ai"
    default_template_id = "REVENUE_FORECAST"

    def build_prompt(
        self,
        request: SkillRequest,
        workspace_name: str,
        crm_context: str,
        rag_snippets: list[dict[str, Any]],
        memory_context: list[str],
    ) -> tuple[str, str, str]:
        """Maps request.skill to PromptRegistry templates for Forecast AI."""
        skill_key = (request.skill or request.skill_type or "revenue_forecast").lower()

        template_map = {
            "revenue_forecast": "REVENUE_FORECAST",
            "quarterly_forecast": "REVENUE_FORECAST",
            "monthly_foreview": "REVENUE_FORECAST",
            "forecast_accuracy": "REVENUE_FORECAST",
            "quota_attainment": "REVENUE_FORECAST",
            "pipeline_forecast": "PIPELINE_FORECAST",
            "pipeline_coverage": "PIPELINE_FORECAST",
            "churn_prediction": "CHURN_FORECAST",
            "renewal_forecast": "CHURN_FORECAST",
            "forecast_alerts": "CHURN_FORECAST",
            "expansion_prediction": "EXPANSION_FORECAST",
            "executive_forecast": "EXECUTIVE_FORECAST",
            "scenario_analysis": "SCENARIO_ANALYSIS",
            "best_case": "SCENARIO_ANALYSIS",
            "expected_case": "SCENARIO_ANALYSIS",
            "worst_case": "SCENARIO_ANALYSIS",
            "forecast_summary": "FORECAST_SUMMARY",
            "forecast_reasoning": "FORECAST_SUMMARY",
        }

        template_id = template_map.get(skill_key, "REVENUE_FORECAST")
        template = PromptRegistry.get(template_id)

        formatted_rag = self._format_rag_snippets(rag_snippets)
        formatted_mem = "\n".join(memory_context) if memory_context else "No prior forecast history available."
        time_window = request.time_window or "Q3 2026"

        if template_id == "REVENUE_FORECAST":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                rag_snippets=formatted_rag,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                time_window=time_window,
                focus_areas=request.focus_areas or "$1,000,000 ARR Target Quota",
            )
        elif template_id == "PIPELINE_FORECAST":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                rag_snippets=formatted_rag,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                time_window=time_window,
                focus_areas=request.focus_areas or "coverage ratio, stage conversion, deal velocity",
            )
        elif template_id == "CHURN_FORECAST":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                time_window=time_window,
                focus_areas=request.focus_areas or "accounts >$20K ARR, renewal dates in next 90 days",
            )
        elif template_id == "EXPANSION_FORECAST":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                rag_snippets=formatted_rag,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                time_window=time_window,
                focus_areas=request.focus_areas or "upsell candidates, seat limit expansion, add-on modules",
            )
        elif template_id == "EXECUTIVE_FORECAST":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                rag_snippets=formatted_rag,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                time_window=time_window,
            )
        elif template_id == "SCENARIO_ANALYSIS":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                time_window=time_window,
                focus_areas=request.focus_areas or "win rates: Best 90%, Expected 70%, Worst 50%",
            )
        elif template_id == "FORECAST_SUMMARY":
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                rag_snippets=formatted_rag,
                memory_context=formatted_mem,
            )
            user_message = template.render_user(
                time_window=time_window,
            )
        else:
            system_prompt = template.render_system(
                workspace_name=workspace_name,
                crm_context=crm_context,
                rag_snippets=formatted_rag,
                memory_context=formatted_mem,
            )
            user_message = f"Perform {skill_key} analysis for period {time_window}."

        return system_prompt, user_message, template_id

    def _format_rag_snippets(self, rag_snippets: list[dict[str, Any]]) -> str:
        if not rag_snippets:
            return "No relevant RAG documents found."
        formatted: list[str] = []
        for i, s in enumerate(rag_snippets[:6], 1):
            text = s.get("chunk_text", s.get("text", ""))[:400]
            stype = s.get("entity_type", "deal")
            score = s.get("relevance_score", 0.0)
            formatted.append(f"[{i}] ({stype}, relevance={score:.2f})\n{text}")
        return "\n\n".join(formatted)


# ─── Auto-register ForecastAISkill in SkillRegistry ───────────────────────────

SkillRegistry.register_many(
    [
        "forecast_ai",
        "revenue_forecast",
        "pipeline_forecast",
        "quarterly_forecast",
        "monthly_foreview",
        "renewal_forecast",
        "churn_prediction",
        "expansion_prediction",
        "forecast_accuracy",
        "scenario_analysis",
        "best_case",
        "expected_case",
        "worst_case",
        "pipeline_coverage",
        "quota_attainment",
        "executive_forecast",
        "forecast_summary",
        "forecast_reasoning",
        "forecast_alerts",
    ],
    ForecastAISkill,
)
