"""
ForgeCRM API — Phase 7.4.6 Enterprise Executive Copilot Unit & Integration Tests

Tests for:
  - Executive Copilot prompt templates in PromptRegistry
  - ExecutiveCopilotSkill execution via BaseAISkill pipeline
  - SkillRegistry dispatching for Executive Copilot skills
  - Dedicated Executive Copilot REST endpoints (/api/v1/ai/executive)

Documentation: docs/07_Testing/703_INTEGRATION_TESTING.md
"""

from __future__ import annotations

import uuid
import pytest

from app.modules.ai.skills.shared.prompt_registry import PromptRegistry
from app.modules.ai.skills.registry import SkillRegistry
from app.modules.ai.skills.executive_copilot import ExecutiveCopilotSkill
from app.modules.ai.skills.schemas import SkillRequest, SkillResponse
from app.modules.ai.models import AIExecutiveReport, AIExecutiveInsight


def test_executive_copilot_prompt_templates_registered() -> None:
    """Verifies all Executive Copilot prompt templates are present in PromptRegistry."""
    required = [
        "EXECUTIVE_DASHBOARD", "EXECUTIVE_WEEKLY_REPORT", "BOARD_REPORT",
        "KPI_ANALYSIS", "COMPANY_HEALTH", "PIPELINE_SUMMARY",
        "REVENUE_SUMMARY", "TEAM_PERFORMANCE", "STRATEGIC_OPPORTUNITIES",
        "EXECUTIVE_NEXT_ACTIONS",
    ]
    for key in required:
        tmpl = PromptRegistry.get(key)
        assert tmpl.template_id == key
        assert tmpl.version == "1.0.0"


def test_executive_copilot_skills_registered_in_registry() -> None:
    """Verifies all Executive Copilot skills are registered in SkillRegistry."""
    skills = SkillRegistry.list_skills()
    registered_keys = [s["skill"] for s in skills]
    assert "executive_copilot" in registered_keys
    assert "executive_dashboard" in registered_keys
    assert "company_health" in registered_keys
    assert "board_report" in registered_keys
    assert "weekly_summary" in registered_keys
    assert "kpi_analysis" in registered_keys
    assert "strategic_opportunities" in registered_keys
    assert "executive_next_actions" in registered_keys


@pytest.mark.asyncio
async def test_executive_copilot_skill_execution(db_session) -> None:
    """Verifies ExecutiveCopilotSkill executes executive_dashboard analysis via BaseAISkill pipeline."""
    skill = ExecutiveCopilotSkill(db_session)
    req = SkillRequest(
        skill="executive_dashboard",
        question="Synthesize executive dashboard for Q3 2026",
        entity_type="workspace",
        time_window="Q3 2026",
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
async def test_executive_copilot_all_capabilities_dispatch(db_session) -> None:
    """Verifies SkillRegistry dispatches all Executive Copilot capabilities."""
    ws_id = uuid.uuid4()
    capabilities = [
        "executive_dashboard", "company_health", "board_report",
        "weekly_summary", "kpi_analysis", "revenue_summary",
        "pipeline_summary", "strategic_opportunities", "executive_next_actions",
    ]
    for cap in capabilities:
        req = SkillRequest(
            skill=cap,
            question=f"Test {cap} request",
            entity_type="workspace",
            time_window="Q3 2026",
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
