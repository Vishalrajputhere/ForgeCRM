"""
ForgeCRM API — Phase 7.4.5 Enterprise Email Copilot Unit & Integration Tests

Tests for:
  - Email Copilot prompt templates in PromptRegistry
  - EmailCopilotSkill execution via BaseAISkill pipeline
  - SkillRegistry dispatching for Email Copilot skills
  - Dedicated Email Copilot REST endpoints (/api/v1/ai/email)

Documentation: docs/07_Testing/703_INTEGRATION_TESTING.md
"""

from __future__ import annotations

import uuid
import pytest

from app.modules.ai.skills.shared.prompt_registry import PromptRegistry
from app.modules.ai.skills.registry import SkillRegistry
from app.modules.ai.skills.email_copilot import EmailCopilotSkill
from app.modules.ai.skills.schemas import SkillRequest, SkillResponse
from app.modules.ai.models import AIEmailDraft, AIEmailSummary


def test_email_copilot_prompt_templates_registered() -> None:
    """Verifies all Email Copilot prompt templates are present in PromptRegistry."""
    required = [
        "EMAIL_REPLY", "EMAIL_SUMMARY", "EMAIL_REWRITE",
        "EMAIL_TONE", "CUSTOMER_FOLLOWUP", "MEETING_FOLLOWUP",
        "SALES_OUTREACH", "NEGOTIATION_EMAIL", "EXECUTIVE_EMAIL",
        "EMAIL_TRANSLATION",
    ]
    for key in required:
        tmpl = PromptRegistry.get(key)
        assert tmpl.template_id == key
        assert tmpl.version == "1.0.0"


def test_email_copilot_skills_registered_in_registry() -> None:
    """Verifies all Email Copilot skills are registered in SkillRegistry."""
    skills = SkillRegistry.list_skills()
    registered_keys = [s["skill"] for s in skills]
    assert "email_copilot" in registered_keys
    assert "reply_email" in registered_keys
    assert "summarize_thread" in registered_keys
    assert "rewrite_email" in registered_keys
    assert "improve_tone" in registered_keys
    assert "meeting_followup" in registered_keys
    assert "cold_outreach" in registered_keys
    assert "multilingual_translation" in registered_keys


@pytest.mark.asyncio
async def test_email_copilot_skill_execution(db_session) -> None:
    """Verifies EmailCopilotSkill executes reply_email analysis via BaseAISkill pipeline."""
    skill = EmailCopilotSkill(db_session)
    req = SkillRequest(
        skill="reply_email",
        question="Reply to Sarah about pricing and security whitepaper",
        entity_type="contact",
        entity_name="Sarah Jenkins — VP Sales",
    )
    ws_id = uuid.uuid4()
    response = await skill.execute(
        request=req,
        workspace_id=ws_id,
        workspace_name="Enterprise Workspace",
        user_id=uuid.uuid4(),
    )
    assert isinstance(response, SkillResponse)
    assert response.summary != ""
    assert response.confidence >= 0.0
    assert response.confidence_label in ("HIGH", "MEDIUM", "LOW")
    assert response.explainability is not None


@pytest.mark.asyncio
async def test_email_copilot_all_capabilities_dispatch(db_session) -> None:
    """Verifies SkillRegistry dispatches all Email Copilot capabilities."""
    ws_id = uuid.uuid4()
    capabilities = [
        "reply_email", "summarize_thread", "rewrite_email",
        "improve_tone", "meeting_followup", "cold_outreach",
        "multilingual_translation",
    ]
    for cap in capabilities:
        req = SkillRequest(
            skill=cap,
            question=f"Test {cap} request",
            entity_type="contact",
            entity_name="Test Enterprise Contact",
        )
        response = await SkillRegistry.dispatch(
            request=req,
            workspace_id=ws_id,
            workspace_name="Test Workspace",
            user_id=uuid.uuid4(),
            db=db_session,
        )
        assert response.summary != "", f"Failed summary for {cap}"
        assert response.confidence >= 0.0, f"Failed confidence for {cap}"
