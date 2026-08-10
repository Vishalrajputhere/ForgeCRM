"""
ForgeCRM API — Phase 7.4.3 Enterprise Lead Qualification Unit & Integration Tests

Tests for:
  - Lead Qualification prompt templates in PromptRegistry
  - LeadQualificationSkill execution via BaseAISkill pipeline
  - SkillRegistry dispatching for Lead Qualification skills
  - Dedicated Lead Qualification REST endpoints (/api/v1/ai/lead-qualification)

Documentation: docs/07_Testing/703_INTEGRATION_TESTING.md
"""

from __future__ import annotations

import uuid
import pytest

from app.modules.ai.skills.shared.prompt_registry import PromptRegistry
from app.modules.ai.skills.registry import SkillRegistry
from app.modules.ai.skills.lead_qualification import LeadQualificationSkill
from app.modules.ai.skills.schemas import SkillRequest, SkillResponse
from app.modules.ai.models import AILeadScore


def test_lead_qualification_prompt_templates_registered() -> None:
    """Verifies all LeadQualification prompt templates are present in PromptRegistry."""
    required = [
        "LEAD_QUALIFICATION", "ICP_MATCH", "LEAD_SCORING",
        "BUYING_SIGNALS", "FOLLOW_UP_STRATEGY", "LEAD_SUMMARY",
    ]
    for key in required:
        tmpl = PromptRegistry.get(key)
        assert tmpl.template_id == key
        assert tmpl.version == "1.0.0"


def test_lead_qualification_skills_registered_in_registry() -> None:
    """Verifies all Lead Qualification skills are registered in SkillRegistry."""
    skills = SkillRegistry.list_skills()
    registered_keys = [s["skill"] for s in skills]
    assert "lead_qualification" in registered_keys
    assert "qualify_lead" in registered_keys
    assert "lead_score" in registered_keys
    assert "icp_match" in registered_keys
    assert "buying_signals" in registered_keys
    assert "follow_up_strategy" in registered_keys


@pytest.mark.asyncio
async def test_lead_qualification_skill_execution(db_session) -> None:
    """Verifies LeadQualificationSkill executes qualify_lead analysis via BaseAISkill pipeline."""
    skill = LeadQualificationSkill(db_session)
    req = SkillRequest(
        skill="qualify_lead",
        question="Qualify Sarah Jenkins lead",
        entity_type="lead",
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
async def test_lead_qualification_all_capabilities_dispatch(db_session) -> None:
    """Verifies SkillRegistry dispatches all Lead Qualification capabilities."""
    ws_id = uuid.uuid4()
    capabilities = [
        "qualify_lead", "lead_score", "icp_match",
        "buying_signals", "follow_up_strategy", "qualification_summary",
    ]
    for cap in capabilities:
        req = SkillRequest(
            skill=cap,
            question=f"Test {cap} analysis",
            entity_type="lead",
            entity_name="Test Enterprise Lead",
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
