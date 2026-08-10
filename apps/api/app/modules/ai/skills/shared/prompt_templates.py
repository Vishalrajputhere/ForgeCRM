"""
ForgeCRM — AI Skills Shared Prompt Templates Engine (Alias wrapper for PromptRegistry)
"""

from app.modules.ai.skills.shared.prompt_registry import (
    PromptRegistry,
    PromptTemplate,
    ACCOUNT_SUMMARY,
    OPPORTUNITY_SUMMARY,
    TIMELINE_SUMMARY,
    CRM_QA,
    PIPELINE_ANALYSIS,
    BLOCKER_ANALYSIS,
)

TEMPLATE_REGISTRY = PromptRegistry._templates


def get_template(template_id: str) -> PromptTemplate:
    return PromptRegistry.get(template_id)
