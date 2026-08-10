"""
ForgeCRM — AI Skills Shared Insight Generator

Extracts structured AIInsight objects from LLM-generated text and CRM data context.
Insight categories: risk, opportunity, recommendation, alert, trend.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal


InsightType = Literal["risk", "opportunity", "recommendation", "alert", "trend", "info"]

# Keyword heuristics for insight type classification
_RISK_KEYWORDS = ["risk", "stuck", "blocker", "overdue", "missed", "stalled", "churn", "at-risk", "danger"]
_OPPORTUNITY_KEYWORDS = ["opportunity", "potential", "upsell", "expansion", "grow", "renewal", "whitespace"]
_ALERT_KEYWORDS = ["urgent", "immediately", "critical", "follow up today", "escalate", "expires"]
_TREND_KEYWORDS = ["trend", "increasing", "declining", "quarter over quarter", "yoy", "momentum"]
_RECOMMENDATION_KEYWORDS = ["recommend", "suggest", "consider", "should", "action", "next step"]


@dataclass
class SkillInsight:
    """Structured business insight extracted from AI skill analysis."""

    insight_type: InsightType
    title: str
    body: str
    confidence: float = 0.8
    entity_type: str | None = None
    entity_id: str | None = None
    tags: list[str] = field(default_factory=list)
    priority: Literal["high", "medium", "low"] = "medium"


class InsightGenerator:
    """Extracts structured insights from AI skill analysis text."""

    @staticmethod
    def extract_from_text(
        analysis_text: str,
        max_insights: int = 5,
        entity_type: str | None = None,
        entity_id: str | None = None,
    ) -> list[SkillInsight]:
        """Parses LLM output text and extracts typed insight objects."""
        insights: list[SkillInsight] = []
        text_lower = analysis_text.lower()

        # Risk detection
        if any(kw in text_lower for kw in _RISK_KEYWORDS):
            risk_sentences = [
                s.strip() for s in analysis_text.split(".") if any(kw in s.lower() for kw in _RISK_KEYWORDS)
            ]
            if risk_sentences:
                insights.append(
                    SkillInsight(
                        insight_type="risk",
                        title="Deal Risk Detected",
                        body=risk_sentences[0][:200] + ("." if not risk_sentences[0].endswith(".") else ""),
                        confidence=0.78,
                        entity_type=entity_type,
                        entity_id=entity_id,
                        priority="high",
                        tags=["risk", "pipeline"],
                    )
                )

        # Opportunity detection
        if any(kw in text_lower for kw in _OPPORTUNITY_KEYWORDS):
            opp_sentences = [
                s.strip() for s in analysis_text.split(".") if any(kw in s.lower() for kw in _OPPORTUNITY_KEYWORDS)
            ]
            if opp_sentences:
                insights.append(
                    SkillInsight(
                        insight_type="opportunity",
                        title="Growth Opportunity Identified",
                        body=opp_sentences[0][:200] + ".",
                        confidence=0.75,
                        entity_type=entity_type,
                        entity_id=entity_id,
                        priority="medium",
                        tags=["opportunity", "growth"],
                    )
                )

        # Alert detection
        if any(kw in text_lower for kw in _ALERT_KEYWORDS):
            alert_sentences = [
                s.strip() for s in analysis_text.split(".") if any(kw in s.lower() for kw in _ALERT_KEYWORDS)
            ]
            if alert_sentences:
                insights.append(
                    SkillInsight(
                        insight_type="alert",
                        title="Urgent Action Required",
                        body=alert_sentences[0][:200] + ".",
                        confidence=0.85,
                        priority="high",
                        tags=["alert", "urgent"],
                    )
                )

        # Recommendation detection
        if any(kw in text_lower for kw in _RECOMMENDATION_KEYWORDS):
            rec_sentences = [
                s.strip() for s in analysis_text.split(".") if any(kw in s.lower() for kw in _RECOMMENDATION_KEYWORDS)
            ]
            if rec_sentences:
                insights.append(
                    SkillInsight(
                        insight_type="recommendation",
                        title="AI Recommendation",
                        body=rec_sentences[0][:200] + ".",
                        confidence=0.80,
                        priority="medium",
                        tags=["recommendation", "action"],
                    )
                )

        # Trend detection
        if any(kw in text_lower for kw in _TREND_KEYWORDS):
            trend_sentences = [
                s.strip() for s in analysis_text.split(".") if any(kw in s.lower() for kw in _TREND_KEYWORDS)
            ]
            if trend_sentences:
                insights.append(
                    SkillInsight(
                        insight_type="trend",
                        title="Trend Observed",
                        body=trend_sentences[0][:200] + ".",
                        confidence=0.72,
                        priority="low",
                        tags=["trend", "analytics"],
                    )
                )

        return insights[:max_insights]

    @staticmethod
    def generate_next_actions(skill_type: str, insights: list[SkillInsight]) -> list[str]:
        """Derives recommended next actions from the extracted insights."""
        actions: list[str] = []

        for insight in insights:
            if insight.insight_type == "risk":
                actions.append("Schedule an urgent review call to address identified risk.")
            elif insight.insight_type == "opportunity":
                actions.append("Create an expansion opportunity and assign to AE.")
            elif insight.insight_type == "alert":
                actions.append("Escalate immediately — set a follow-up task for today.")
            elif insight.insight_type == "recommendation":
                actions.append("Review AI recommendation and create corresponding task.")

        # Skill-type specific default actions
        skill_defaults: dict[str, list[str]] = {
            "account_summary": ["Update account health score in CRM.", "Schedule quarterly business review (QBR)."],
            "opportunity_summary": ["Review stuck deals in pipeline.", "Update forecast in CRM."],
            "crm_qa": ["Verify answer against CRM records.", "Create task if action required."],
            "meeting_brief": ["Share meeting brief with attendees.", "Set pre-meeting reminder task."],
            "blocker_analysis": ["Assign unblocking tasks to reps.", "Escalate high-value stuck deals."],
            "pipeline_explanation": ["Adjust pipeline coverage ratio.", "Review stage conversion rates."],
        }

        actions.extend(skill_defaults.get(skill_type, []))
        return list(dict.fromkeys(actions))[:5]  # Deduplicate, cap at 5
