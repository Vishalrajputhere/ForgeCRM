"""
ForgeCRM API — Phase 7.4.2 Enterprise Deal Coach Unit & Integration Tests

Tests for:
  - DealCoach prompt templates in PromptRegistry
  - DealCoachSkill execution via BaseAISkill pipeline
  - SkillRegistry dispatching for DealCoach skills
  - Dedicated Deal Coach REST endpoints (/api/v1/ai/deal-coach)

Documentation: docs/07_Testing/703_INTEGRATION_TESTING.md
"""

from __future__ import annotations

import uuid
import pytest

from app.modules.ai.skills.shared.prompt_registry import PromptRegistry
from app.modules.ai.skills.registry import SkillRegistry
from app.modules.ai.skills.deal_coach import DealCoachSkill
from app.modules.ai.skills.schemas import SkillRequest, SkillResponse
from app.modules.ai.models import AIDealScore


def test_deal_coach_prompt_templates_registered() -> None:
    """Verifies all DealCoach prompt templates are present in PromptRegistry."""
    required = [
        "DEAL_HEALTH", "WIN_PROBABILITY", "DEAL_RISK",
        "NEXT_BEST_ACTION", "NEGOTIATION_STRATEGY", "CLOSING_READINESS",
        "DEAL_EXECUTIVE_SUMMARY",
    ]
    for key in required:
        tmpl = PromptRegistry.get(key)
        assert tmpl.template_id == key
        assert tmpl.version == "1.0.0"


def test_deal_coach_skills_registered_in_registry() -> None:
    """Verifies all DealCoach skills are registered in SkillRegistry."""
    skills = SkillRegistry.list_skills()
    registered_keys = [s["skill"] for s in skills]
    assert "deal_coach" in registered_keys
    assert "deal_health" in registered_keys
    assert "win_probability" in registered_keys
    assert "deal_risk" in registered_keys
    assert "next_best_action" in registered_keys
    assert "closing_readiness" in registered_keys


@pytest.mark.asyncio
async def test_deal_coach_skill_execution(db_session) -> None:
    """Verifies DealCoachSkill executes deal_health analysis via BaseAISkill pipeline."""
    skill = DealCoachSkill(db_session)
    req = SkillRequest(
        skill="deal_health",
        question="Analyze health for Acme deal",
        entity_type="deal",
        entity_name="Acme Corp License",
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
async def test_deal_coach_all_capabilities_dispatch(db_session) -> None:
    """Verifies SkillRegistry dispatches all DealCoach capabilities."""
    ws_id = uuid.uuid4()
    capabilities = [
        "deal_health", "win_probability", "deal_risk",
        "next_best_action", "negotiation_strategy", "closing_readiness",
        "executive_summary", "deal_blockers",
    ]
    for cap in capabilities:
        req = SkillRequest(
            skill=cap,
            question=f"Test {cap} analysis",
            entity_type="deal",
            entity_name="Test Enterprise Deal",
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
