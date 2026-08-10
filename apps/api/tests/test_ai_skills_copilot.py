"""
ForgeCRM API — Phase 7.4.1 Enterprise Sales Copilot Refined Unit & Integration Tests

Tests for:
  - PromptRegistry template retrieval and metadata
  - ExplainabilityEngine non-sensitive report generation
  - ResponseBuilder standardized SkillResponse construction
  - SkillRegistry skill registration and dispatching
  - SalesCopilotSkill execution via BaseAISkill pipeline
  - Single REST endpoint contract compliance

Documentation: docs/07_Testing/703_INTEGRATION_TESTING.md
"""

from __future__ import annotations

import uuid
import pytest

from app.modules.ai.skills.shared.prompt_registry import PromptRegistry, PromptTemplate
from app.modules.ai.skills.shared.explainability import ExplainabilityEngine
from app.modules.ai.skills.shared.response_builder import ResponseBuilder
from app.modules.ai.skills.shared.confidence import ConfidenceScorer, ConfidenceLabel
from app.modules.ai.skills.shared.citations import CitationManager
from app.modules.ai.skills.shared.insights import InsightGenerator
from app.modules.ai.skills.registry import SkillRegistry
from app.modules.ai.skills.sales_copilot import SalesCopilotSkill
from app.modules.ai.skills.schemas import SkillRequest, CopilotRequest, SkillResponse


# ─── PromptRegistry Tests ─────────────────────────────────────────────────────


def test_prompt_registry_templates() -> None:
    """Verifies all required prompt templates are present in PromptRegistry."""
    required = [
        "ACCOUNT_SUMMARY", "OPPORTUNITY_SUMMARY", "TIMELINE_SUMMARY",
        "CRM_QA", "PIPELINE_ANALYSIS", "BLOCKER_ANALYSIS",
    ]
    for key in required:
        tmpl = PromptRegistry.get(key)
        assert tmpl.template_id == key
        assert tmpl.version == "1.0.0"


def test_prompt_registry_case_insensitive_lookup() -> None:
    """Verifies case-insensitive and alias key lookup in PromptRegistry."""
    t1 = PromptRegistry.get("account_summary")
    t2 = PromptRegistry.get("ACCOUNT_SUMMARY")
    assert t1.template_id == t2.template_id


def test_prompt_registry_custom_registration() -> None:
    """Verifies registering custom prompt templates."""
    custom = PromptTemplate(
        template_id="CUSTOM_TEST",
        version="2.0.0",
        system_prompt="Test system {var}",
        user_template="Test user {query}",
    )
    PromptRegistry.register("CUSTOM_TEST", custom)
    retrieved = PromptRegistry.get("CUSTOM_TEST")
    assert retrieved.version == "2.0.0"


# ─── ExplainabilityEngine Tests ───────────────────────────────────────────────


def test_explainability_engine_report_generation() -> None:
    """Verifies ExplainabilityEngine produces structured non-sensitive report."""
    snippets = [
        {"entity_type": "company", "entity_name": "Acme Corp", "relevance_score": 0.92},
        {"entity_type": "deal", "entity_name": "Enterprise Deal", "relevance_score": 0.85},
    ]
    report = ExplainabilityEngine.generate(
        skill_type="account_summary",
        goal="Summarize Acme Corp",
        rag_snippets=snippets,
        memory_context=["Key enterprise client"],
        tool_calls_used=["search_deals"],
        confidence_score=0.88,
        confidence_label="HIGH",
        confidence_explanation="Well-grounded in CRM data.",
    )
    assert len(report.sources) >= 2
    assert "Company: Acme Corp" in report.sources
    assert len(report.evidence) >= 1
    assert "HIGH" in report.why_produced


# ─── ResponseBuilder Tests ───────────────────────────────────────────────────


def test_response_builder_constructs_valid_skill_response() -> None:
    """Verifies ResponseBuilder constructs complete SkillResponse with all contract fields."""
    snippets = [
        {"entity_type": "company", "relevance_score": 0.95},
        {"entity_type": "deal", "relevance_score": 0.88},
        {"entity_type": "contact", "relevance_score": 0.85},
    ]
    builder = (
        ResponseBuilder("account_summary", "Summarize Acme Corp")
        .set_summary("Acme Corp is a key account with $500K ARR. High growth potential.")
        .set_rag_snippets(snippets)
        .set_memory_context(["Prefers quarterly reviews", "Key contact: Sarah", "Expansion opportunity"])
        .set_tool_calls_used(["search_deals", "update_company"])
        .set_metrics(150, 80, 0.0002)
        .set_provider_info("gemini", "gemini-1.5-flash")
        .set_template_id("ACCOUNT_SUMMARY")
    )
    response = builder.build()
    assert isinstance(response, SkillResponse)
    assert response.skill == "account_summary"
    assert response.confidence_label in ("HIGH", "MEDIUM")
    assert response.token_usage["total_tokens"] == 230
    assert len(response.citations) >= 1
    assert response.explainability is not None



# ─── SkillRegistry Tests ──────────────────────────────────────────────────────


def test_skill_registry_registration_and_list() -> None:
    """Verifies SkillRegistry lists registered skills."""
    skills = SkillRegistry.list_skills()
    skill_names = [s["skill"] for s in skills]
    assert "crm_qa" in skill_names
    assert "account_summary" in skill_names


@pytest.mark.asyncio
async def test_skill_registry_dispatch(db_session) -> None:
    """Verifies SkillRegistry.dispatch() executes mapped skill."""
    req = SkillRequest(skill="account_summary", question="Summarize Acme Corp")
    ws_id = uuid.uuid4()
    response = await SkillRegistry.dispatch(
        request=req,
        workspace_id=ws_id,
        workspace_name="Acme WS",
        user_id=uuid.uuid4(),
        db=db_session,
    )
    assert response.skill == "account_summary"
    assert response.summary != ""
    assert response.confidence >= 0.0


# ─── SalesCopilotSkill End-to-End Tests ──────────────────────────────────────


@pytest.mark.asyncio
async def test_sales_copilot_crm_qa_pipeline(db_session) -> None:
    """Verifies SalesCopilotSkill executes full BaseAISkill pipeline for crm_qa."""
    skill = SalesCopilotSkill(db_session)
    req = SkillRequest(skill="crm_qa", question="What are our top open deals?")
    ws_id = uuid.uuid4()
    response = await skill.execute(
        request=req,
        workspace_id=ws_id,
        workspace_name="Test WS",
        user_id=uuid.uuid4(),
    )
    assert response.skill == "crm_qa"
    assert response.summary != ""
    assert response.confidence_label in ("HIGH", "MEDIUM", "LOW")
    assert isinstance(response.citations, list)
    assert isinstance(response.insights, list)


@pytest.mark.asyncio
async def test_sales_copilot_all_capabilities_dispatch(db_session) -> None:
    """Verifies dispatching all 6 SalesCopilot skills via SkillRegistry."""
    ws_id = uuid.uuid4()
    skills_to_test = [
        "account_summary", "opportunity_summary", "timeline_summary",
        "crm_qa", "explain_pipeline", "show_blockers",
    ]
    for skey in skills_to_test:
        req = SkillRequest(skill=skey, question=f"Test question for {skey}")
        res = await SkillRegistry.dispatch(
            request=req,
            workspace_id=ws_id,
            workspace_name="Test Workspace",
            user_id=uuid.uuid4(),
            db=db_session,
        )
        assert res.summary != "", f"Failed summary for {skey}"
        assert res.confidence >= 0.0, f"Failed confidence for {skey}"
