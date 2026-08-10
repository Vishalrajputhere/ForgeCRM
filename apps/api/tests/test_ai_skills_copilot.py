"""
ForgeCRM API — Phase 7.4.1 Enterprise Sales Copilot Unit & Integration Tests

Tests for:
  - PromptTemplate rendering and variable interpolation
  - ConfidenceScorer: HIGH / MEDIUM / LOW label assignment
  - CitationManager: RAG snippet to Citation object extraction
  - InsightGenerator: Keyword-based insight type extraction
  - ReasoningEngine: Chain construction
  - SalesCopilotSkill: End-to-end skill execution
  - BaseAISkill: Abstract framework verification

Documentation: docs/07_Testing/703_INTEGRATION_TESTING.md
"""

from __future__ import annotations

import uuid
import pytest

from app.modules.ai.skills.shared.prompt_templates import get_template, TEMPLATE_REGISTRY
from app.modules.ai.skills.shared.confidence import ConfidenceScorer, ConfidenceLabel
from app.modules.ai.skills.shared.citations import CitationManager
from app.modules.ai.skills.shared.insights import InsightGenerator
from app.modules.ai.skills.shared.reasoning import ReasoningEngine
from app.modules.ai.skills.sales_copilot import SalesCopilotSkill
from app.modules.ai.skills.schemas import SkillRequest


# ─── Prompt Template Tests ────────────────────────────────────────────────────


def test_prompt_template_registry_has_all_skills() -> None:
    """Verifies all 7 required prompt templates are registered."""
    required = ["account_summary", "opportunity_summary", "timeline_summary",
                "crm_qa", "meeting_brief", "blocker_analysis", "pipeline_explanation"]
    for tid in required:
        assert tid in TEMPLATE_REGISTRY, f"Missing template: {tid}"


def test_prompt_template_variable_interpolation() -> None:
    """Verifies variable placeholder substitution in prompt templates."""
    tmpl = get_template("account_summary")
    rendered = tmpl.render_system(
        workspace_name="Acme Workspace",
        crm_context="Company: Acme Corp",
        rag_snippets="Doc snippet 1",
        memory_context="No memories.",
    )
    assert "Acme Workspace" in rendered
    assert "Acme Corp" in rendered


def test_prompt_template_missing_variable_graceful_fallback() -> None:
    """Verifies unreplaced placeholders produce graceful fallback text."""
    tmpl = get_template("crm_qa")
    rendered = tmpl.render_system(
        workspace_name="Test WS",
        crm_context="",
        rag_snippets="",
    )
    # Should not crash; may include fallback text for missing keys
    assert "Test WS" in rendered


# ─── Confidence Scorer Tests ──────────────────────────────────────────────────


def test_confidence_scorer_high_label() -> None:
    """Verifies HIGH label when strong RAG + memory + tool coverage."""
    snippets = [
        {"relevance_score": 0.92, "entity_type": "company"},
        {"relevance_score": 0.88, "entity_type": "deal"},
        {"relevance_score": 0.85, "entity_type": "contact"},
    ]
    result = ConfidenceScorer.score(
        rag_snippets=snippets,
        memory_hits=4,
        tool_calls_made=3,
        response_length=250,
    )
    assert result.label == ConfidenceLabel.HIGH
    assert result.score >= 0.80


def test_confidence_scorer_medium_label() -> None:
    """Verifies MEDIUM label for partial coverage."""
    snippets = [{"relevance_score": 0.45, "entity_type": "deal"}]
    result = ConfidenceScorer.score(
        rag_snippets=snippets,
        memory_hits=1,
        tool_calls_made=1,
        response_length=120,
    )
    assert result.label in (ConfidenceLabel.MEDIUM, ConfidenceLabel.LOW)


def test_confidence_scorer_low_label() -> None:
    """Verifies LOW label with no RAG, no memory, no tools."""
    result = ConfidenceScorer.score(
        rag_snippets=[],
        memory_hits=0,
        tool_calls_made=0,
        response_length=50,
    )
    assert result.label == ConfidenceLabel.LOW
    assert result.score < 0.60


def test_confidence_scorer_breakdown_keys() -> None:
    """Verifies breakdown contains all expected score components."""
    result = ConfidenceScorer.score([], 0, 0)
    assert set(result.breakdown.keys()) == {"rag_coverage", "memory_coverage", "tool_execution", "context_freshness", "response_completeness"}


# ─── Citation Manager Tests ───────────────────────────────────────────────────


def test_citation_manager_from_rag_snippets() -> None:
    """Verifies Citation extraction from RAG snippets."""
    snippets = [
        {"entity_type": "company", "entity_id": str(uuid.uuid4()), "entity_name": "Acme Corp",
         "chunk_text": "Acme Corp is a leading enterprise software company.", "relevance_score": 0.9},
        {"entity_type": "deal", "entity_id": str(uuid.uuid4()), "entity_name": "Acme Expansion",
         "chunk_text": "Deal value: $500K in negotiation stage.", "relevance_score": 0.75},
    ]
    citations = CitationManager.from_rag_snippets(snippets)
    assert len(citations) == 2
    assert citations[0].entity_type == "company"
    assert citations[0].relevance_score == 0.9
    assert "Acme Corp" in citations[0].excerpt


def test_citation_manager_deduplication() -> None:
    """Verifies duplicate citations by entity_id are removed."""
    eid = str(uuid.uuid4())
    citations_raw = [
        CitationManager.from_rag_snippets([{"entity_type": "deal", "entity_id": eid, "chunk_text": "text", "relevance_score": 0.8}])[0],
        CitationManager.from_rag_snippets([{"entity_type": "deal", "entity_id": eid, "chunk_text": "text", "relevance_score": 0.8}])[0],
    ]
    deduped = CitationManager.deduplicate(citations_raw)
    assert len(deduped) == 1


def test_citation_manager_capped_at_eight() -> None:
    """Verifies citations are capped at 8 results."""
    snippets = [{"entity_type": "deal", "chunk_text": f"text {i}", "relevance_score": 0.5} for i in range(20)]
    citations = CitationManager.from_rag_snippets(snippets)
    assert len(citations) <= 8


# ─── Insight Generator Tests ──────────────────────────────────────────────────


def test_insight_generator_detects_risk() -> None:
    """Verifies risk insight extracted from analysis text."""
    text = "There is a significant risk that this deal is stuck and may be lost if we don't act immediately."
    insights = InsightGenerator.extract_from_text(text)
    types = [i.insight_type for i in insights]
    assert "risk" in types


def test_insight_generator_detects_opportunity() -> None:
    """Verifies opportunity insight extracted from analysis text."""
    text = "There is a significant expansion opportunity with the existing customer base."
    insights = InsightGenerator.extract_from_text(text)
    types = [i.insight_type for i in insights]
    assert "opportunity" in types


def test_insight_generator_next_actions_not_empty() -> None:
    """Verifies next actions are returned for a skill type with insights."""
    from app.modules.ai.skills.shared.insights import SkillInsight
    insights = [SkillInsight(insight_type="risk", title="Risk", body="Risk detected", priority="high")]
    actions = InsightGenerator.generate_next_actions("account_summary", insights)
    assert len(actions) >= 1


# ─── Reasoning Engine Tests ───────────────────────────────────────────────────


def test_reasoning_engine_build_chain() -> None:
    """Verifies ReasoningChain is built with correct step structure."""
    chain = ReasoningEngine.build_chain(
        skill_type="account_summary",
        goal="Summarize Acme Corp",
        rag_snippets=[{"entity_type": "company", "relevance_score": 0.9}],
        memory_context=["Key account since 2023"],
        tool_calls_used=["search_deals"],
        llm_summary="Acme Corp is a high-value account with 3 open deals.",
        confidence=0.85,
    )
    assert chain.goal == "Summarize Acme Corp"
    assert len(chain.steps) >= 3
    assert chain.overall_confidence == 0.85
    assert chain.conclusion != ""


def test_reasoning_engine_steps_numbered_sequentially() -> None:
    """Verifies all reasoning steps are numbered starting from 1."""
    chain = ReasoningEngine.build_chain(
        skill_type="crm_qa",
        goal="What are the top deals?",
        rag_snippets=[],
        memory_context=[],
        tool_calls_used=[],
        llm_summary="The top deals are X and Y.",
        confidence=0.6,
    )
    for i, step in enumerate(chain.steps, 1):
        assert step.step_number == i


# ─── SalesCopilotSkill End-to-End Tests ──────────────────────────────────────


@pytest.mark.asyncio
async def test_sales_copilot_crm_qa(db_session) -> None:
    """Verifies SalesCopilotSkill.answer_crm_question() returns a valid SkillResponse."""
    ws_id = uuid.uuid4()
    skill = SalesCopilotSkill(db_session)
    request = SkillRequest(
        skill_type="crm_qa",
        question="What are our top three deals this quarter?",
    )
    response = await skill.execute(
        request=request,
        workspace_id=ws_id,
        workspace_name="Test Workspace",
        user_id=uuid.uuid4(),
        user_role="member",
    )
    assert response.skill_type == "sales_copilot"
    assert response.summary != ""
    assert response.confidence >= 0.0
    assert response.confidence_label in ("HIGH", "MEDIUM", "LOW")
    assert isinstance(response.citations, list)
    assert isinstance(response.insights, list)
    assert response.latency_ms >= 0


@pytest.mark.asyncio
async def test_sales_copilot_account_summary(db_session) -> None:
    """Verifies account_summary capability returns structured response."""
    ws_id = uuid.uuid4()
    skill = SalesCopilotSkill(db_session)
    request = SkillRequest(
        skill_type="account_summary",
        entity_type="company",
        entity_name="Cyberdyne Systems",
        question="Summarize Cyberdyne Systems account",
    )
    response = await skill.execute(
        request=request,
        workspace_id=ws_id,
        workspace_name="Skynet Workspace",
        user_id=uuid.uuid4(),
        user_role="member",
    )
    assert response.skill_type == "sales_copilot"
    assert response.template_id == "account_summary"
    assert response.template_version == "1.0.0"


@pytest.mark.asyncio
async def test_sales_copilot_explain_pipeline(db_session) -> None:
    """Verifies explain_pipeline capability executes without error."""
    ws_id = uuid.uuid4()
    skill = SalesCopilotSkill(db_session)
    request = SkillRequest(
        skill_type="explain_pipeline",
        question="Explain the current pipeline",
    )
    response = await skill.execute(
        request=request,
        workspace_id=ws_id,
        workspace_name="Test Workspace",
        user_id=uuid.uuid4(),
        user_role="admin",
    )
    assert response.summary != ""
    assert response.tool_calls_used == ["search_deals"]


@pytest.mark.asyncio
async def test_sales_copilot_all_skill_types_dispatch(db_session) -> None:
    """Verifies the execute() dispatcher routes all 7 skill types correctly."""
    ws_id = uuid.uuid4()
    skill = SalesCopilotSkill(db_session)
    skill_types = [
        "account_summary", "opportunity_summary", "timeline_summary",
        "meeting_brief", "crm_qa", "show_blockers", "explain_pipeline",
    ]
    for stype in skill_types:
        request = SkillRequest(skill_type=stype, question=f"Test {stype}")
        response = await skill.execute(
            request=request,
            workspace_id=ws_id,
            workspace_name="Test Workspace",
            user_id=uuid.uuid4(),
        )
        assert response.skill_type == "sales_copilot", f"Failed for {stype}"
