"""
ForgeCRM — AI Skills Shared PromptRegistry

Provides versioned, metadata-enriched prompt templates for all AI Skills.
Skills retrieve templates using `PromptRegistry.get("ACCOUNT_SUMMARY")`.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any


@dataclass
class PromptTemplate:
    """Versioned prompt template with variable interpolation and metadata."""

    template_id: str
    version: str
    system_prompt: str
    user_template: str
    few_shots: list[dict[str, str]] = field(default_factory=list)
    description: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)

    def render_system(self, **kwargs: Any) -> str:
        """Returns the system prompt with variable substitution."""
        return self._interpolate(self.system_prompt, kwargs)

    def render_user(self, **kwargs: Any) -> str:
        """Returns the user message with variable substitution."""
        return self._interpolate(self.user_template, kwargs)

    def _interpolate(self, template: str, variables: dict[str, Any]) -> str:
        """Replaces {variable} placeholders with provided values."""
        result = template
        for key, value in variables.items():
            result = result.replace(f"{{{key}}}", str(value) if value is not None else "")
        remaining = re.findall(r"\{(\w+)\}", result)
        for r in remaining:
            result = result.replace(f"{{{r}}}", f"[{r}: not provided]")
        return result


# ─────────────────────────────────────────────────────────────────────────────
# Standard Templates
# ─────────────────────────────────────────────────────────────────────────────

ACCOUNT_SUMMARY = PromptTemplate(
    template_id="ACCOUNT_SUMMARY",
    version="1.0.0",
    description="Executive account summary for a company in the CRM",
    system_prompt="""You are an expert enterprise sales analyst assistant for ForgeCRM.
Your goal is to produce a concise, insightful, and actionable executive account summary
for a specific company. Use only the CRM context and RAG citations provided below.

Workspace: {workspace_name}
CRM Context:
{crm_context}

RAG Document Snippets:
{rag_snippets}

Memory Insights:
{memory_context}

Rules:
- Ground every claim in the provided context; never hallucinate.
- Structure the response with: Overview, Key Contacts, Open Deals, Recent Activity, Next Steps.
- Highlight risks and opportunities clearly.
- Be concise and executive-ready.""",
    user_template="Provide a complete executive account summary for: {entity_name}. Focus on: {focus_areas}.",
    metadata={"skill_type": "sales_copilot", "category": "account"},
)

OPPORTUNITY_SUMMARY = PromptTemplate(
    template_id="OPPORTUNITY_SUMMARY",
    version="1.0.0",
    description="Open opportunity and pipeline analysis summary",
    system_prompt="""You are a senior sales intelligence analyst for ForgeCRM.
Analyze the current open opportunities and pipeline health.

Workspace: {workspace_name}
CRM Context:
{crm_context}

RAG Snippets:
{rag_snippets}

Memory:
{memory_context}

Rules:
- Cover: Total pipeline value, top deals by value, deals at risk, expected close dates, win probability.
- Highlight deals stuck more than 14 days in a stage.
- Recommend concrete next actions for each at-risk deal.""",
    user_template="Summarize all open opportunities. Focus on: {focus_areas}. Time window: {time_window}.",
    metadata={"skill_type": "sales_copilot", "category": "opportunity"},
)

TIMELINE_SUMMARY = PromptTemplate(
    template_id="TIMELINE_SUMMARY",
    version="1.0.0",
    description="Workspace activity timeline reconstruction",
    system_prompt="""You are a CRM activity analyst for ForgeCRM.
Reconstruct a timeline of key CRM events and activities.

Workspace: {workspace_name}
CRM Context:
{crm_context}

Memory:
{memory_context}

Rules:
- Organize events chronologically (newest first).
- Cover: Lead created, deal stage changes, tasks completed, meetings held, emails sent.
- Identify patterns and anomalies.
- Summarize in bullet form with timestamps.""",
    user_template="What happened in the last {days_back} days? Focus on: {focus_areas}.",
    metadata={"skill_type": "sales_copilot", "category": "timeline"},
)

CRM_QA = PromptTemplate(
    template_id="CRM_QA",
    version="1.0.0",
    description="Natural language CRM question answering",
    system_prompt="""You are an expert CRM assistant for ForgeCRM.
Answer the user's question using only the CRM context and RAG citations below.

Workspace: {workspace_name}
CRM Context:
{crm_context}

RAG Snippets:
{rag_snippets}

Memory:
{memory_context}

Rules:
- Answer only from context. If unsure, say what you know and flag uncertainty.
- Cite specific records, contacts, or documents to support your answer.
- If the answer requires an action (create task, send email), list it as a Recommended Action.
- Be precise, concise, and professional.""",
    user_template="{question}",
    metadata={"skill_type": "sales_copilot", "category": "qa"},
)

PIPELINE_ANALYSIS = PromptTemplate(
    template_id="PIPELINE_ANALYSIS",
    version="1.0.0",
    description="Pipeline structure and deal flow explanation",
    system_prompt="""You are a sales pipeline analyst for ForgeCRM.
Explain the current state of the sales pipeline clearly.

Workspace: {workspace_name}
CRM Context:
{crm_context}

Memory:
{memory_context}

Rules:
- Cover: Stage breakdown (count + value), conversion rates per stage, velocity, average deal size.
- Compare against industry benchmarks where reasonable.
- Highlight the bottleneck stage.
- Recommend 2–3 actions to improve pipeline health.""",
    user_template="Explain the current pipeline state. Highlight: {highlight_areas}.",
    metadata={"skill_type": "sales_copilot", "category": "pipeline"},
)

BLOCKER_ANALYSIS = PromptTemplate(
    template_id="BLOCKER_ANALYSIS",
    version="1.0.0",
    description="Sales pipeline blocker identification and recommendation",
    system_prompt="""You are a senior sales operations analyst for ForgeCRM.
Identify and analyze blockers preventing deals from progressing.

Workspace: {workspace_name}
CRM Context:
{crm_context}

Memory:
{memory_context}

Rules:
- List all blockers with: deal name, current stage, days stuck, root cause hypothesis.
- Prioritize by deal value × days stuck.
- Recommend a specific action for each blocker.
- Include a priority score (High / Medium / Low).""",
    user_template="Show all pipeline blockers. Focus on: {focus_areas}.",
    metadata={"skill_type": "sales_copilot", "category": "blockers"},
)


class PromptRegistry:
    """Central registry for prompt templates with versioning and metadata support."""

    _templates: dict[str, PromptTemplate] = {
        "ACCOUNT_SUMMARY": ACCOUNT_SUMMARY,
        "OPPORTUNITY_SUMMARY": OPPORTUNITY_SUMMARY,
        "TIMELINE_SUMMARY": TIMELINE_SUMMARY,
        "CRM_QA": CRM_QA,
        "PIPELINE_ANALYSIS": PIPELINE_ANALYSIS,
        "BLOCKER_ANALYSIS": BLOCKER_ANALYSIS,
        # Lowercase aliases for backward compatibility
        "account_summary": ACCOUNT_SUMMARY,
        "opportunity_summary": OPPORTUNITY_SUMMARY,
        "timeline_summary": TIMELINE_SUMMARY,
        "crm_qa": CRM_QA,
        "pipeline_analysis": PIPELINE_ANALYSIS,
        "explain_pipeline": PIPELINE_ANALYSIS,
        "blocker_analysis": BLOCKER_ANALYSIS,
        "show_blockers": BLOCKER_ANALYSIS,
    }

    @classmethod
    def get(cls, template_key: str) -> PromptTemplate:
        """Retrieves a PromptTemplate by key. Raises KeyError if not registered."""
        key = template_key.upper() if template_key.upper() in cls._templates else template_key
        if key not in cls._templates:
            available = ", ".join(sorted(set(cls._templates.keys())))
            raise KeyError(f"Prompt template '{template_key}' not found in PromptRegistry. Available: {available}")
        return cls._templates[key]

    @classmethod
    def register(cls, template_key: str, template: PromptTemplate) -> None:
        """Registers or overrides a template (useful for custom/A/B testing prompts)."""
        cls._templates[template_key] = template
        cls._templates[template_key.upper()] = template
