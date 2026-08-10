"""
ForgeCRM API — Phase 7.4.4 Enterprise Forecast AI Unit & Integration Tests

Tests for:
  - Forecast AI prompt templates in PromptRegistry
  - ForecastAISkill execution via BaseAISkill pipeline
  - SkillRegistry dispatching for Forecast AI skills
  - Dedicated Forecast AI REST endpoints (/api/v1/ai/forecast)

Documentation: docs/07_Testing/703_INTEGRATION_TESTING.md
"""

from __future__ import annotations

import uuid
import pytest

from app.modules.ai.skills.shared.prompt_registry import PromptRegistry
from app.modules.ai.skills.registry import SkillRegistry
from app.modules.ai.skills.forecast_ai import ForecastAISkill
from app.modules.ai.skills.schemas import SkillRequest, SkillResponse
from app.modules.ai.models import AIForecast


def test_forecast_ai_prompt_templates_registered() -> None:
    """Verifies all Forecast AI prompt templates are present in PromptRegistry."""
    required = [
        "REVENUE_FORECAST", "PIPELINE_FORECAST", "CHURN_FORECAST",
        "EXPANSION_FORECAST", "EXECUTIVE_FORECAST", "SCENARIO_ANALYSIS",
        "FORECAST_SUMMARY",
    ]
    for key in required:
        tmpl = PromptRegistry.get(key)
        assert tmpl.template_id == key
        assert tmpl.version == "1.0.0"


def test_forecast_ai_skills_registered_in_registry() -> None:
    """Verifies all Forecast AI skills are registered in SkillRegistry."""
    skills = SkillRegistry.list_skills()
    registered_keys = [s["skill"] for s in skills]
    assert "forecast_ai" in registered_keys
    assert "revenue_forecast" in registered_keys
    assert "pipeline_forecast" in registered_keys
    assert "churn_prediction" in registered_keys
    assert "expansion_prediction" in registered_keys
    assert "scenario_analysis" in registered_keys
    assert "executive_forecast" in registered_keys


@pytest.mark.asyncio
async def test_forecast_ai_skill_execution(db_session) -> None:
    """Verifies ForecastAISkill executes revenue_forecast analysis via BaseAISkill pipeline."""
    skill = ForecastAISkill(db_session)
    req = SkillRequest(
        skill="revenue_forecast",
        question="Forecast Q3 revenue",
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
async def test_forecast_ai_all_capabilities_dispatch(db_session) -> None:
    """Verifies SkillRegistry dispatches all Forecast AI capabilities."""
    ws_id = uuid.uuid4()
    capabilities = [
        "revenue_forecast", "pipeline_forecast", "scenario_analysis",
        "churn_prediction", "expansion_prediction", "executive_forecast",
        "forecast_summary",
    ]
    for cap in capabilities:
        req = SkillRequest(
            skill=cap,
            question=f"Test {cap} forecast",
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
