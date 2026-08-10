"""
ForgeCRM API — Phase 7.5.1 AI Evaluation & Benchmarking Unit Tests

Tests for:
  - EvaluationMetrics & QualityScoreCalculator composite score calculation
  - GoldenDatasetManager dataset retrieval and test case registration
  - PromptRegressionSuite execution against golden dataset
  - BenchmarkRunner multi-provider benchmark execution
  - EvaluationEngine ORM record generation

Documentation: docs/07_Testing/703_INTEGRATION_TESTING.md
"""

from __future__ import annotations

import uuid
import pytest

from app.modules.ai.evaluation.metrics import EvaluationMetrics, QualityScoreCalculator
from app.modules.ai.evaluation.datasets import GoldenDatasetManager, GoldenTestCase
from app.modules.ai.evaluation.regression import PromptRegressionSuite
from app.modules.ai.evaluation.benchmarks import BenchmarkRunner
from app.modules.ai.evaluation.engine import EvaluationEngine
from app.modules.ai.models import AIEvaluationRun, AIBenchmarkResult


def test_quality_score_calculator_composite() -> None:
    """Verifies QualityScoreCalculator outputs correct 0-100 composite score."""
    metrics = EvaluationMetrics(
        accuracy=0.95,
        faithfulness=0.90,
        hallucination_score=0.02,
        citation_score=0.98,
        answer_completeness=0.92,
    )
    score = QualityScoreCalculator.calculate_composite_score(metrics)
    assert 85.0 <= score <= 100.0


def test_golden_dataset_manager() -> None:
    """Verifies GoldenDatasetManager returns test cases for AI skills."""
    all_cases = GoldenDatasetManager.get_test_cases()
    assert len(all_cases) >= 6

    sales_cases = GoldenDatasetManager.get_test_cases("sales_copilot")
    assert len(sales_cases) >= 1
    assert sales_cases[0].skill_type == "sales_copilot"


def test_prompt_regression_suite_execution() -> None:
    """Verifies PromptRegressionSuite identifies matching and missing keywords."""
    tc = GoldenTestCase(
        case_id="tc_test_1",
        skill_type="sales_copilot",
        question="Check NexaCorp revenue and risks",
        expected_keywords=["NexaCorp", "revenue", "risk"],
        expected_citations=["crm_account"],
    )
    res_pass = PromptRegressionSuite.run_regression_test(tc, "NexaCorp account shows $500K revenue and low risk")
    assert res_pass.passed is True
    assert "NexaCorp" in res_pass.matched_keywords

    res_fail = PromptRegressionSuite.run_regression_test(tc, "Unknown company status", confidence=0.50)
    assert res_fail.passed is False


def test_benchmark_runner_summary() -> None:
    """Verifies BenchmarkRunner produces benchmark summaries."""
    summary = BenchmarkRunner.run_benchmark(
        benchmark_name="Test_Bench",
        provider="gemini",
        model="gemini-2.5-flash",
    )
    assert summary.benchmark_name == "Test_Bench"
    assert summary.total_samples >= 6
    assert summary.pass_rate >= 0.0
    assert summary.avg_quality_score >= 0.0


@pytest.mark.asyncio
async def test_evaluation_engine_execution(db_session) -> None:
    """Verifies EvaluationEngine evaluates responses and creates AIEvaluationRun and AIBenchmarkResult records."""
    ws_id = uuid.uuid4()
    engine = EvaluationEngine(db_session)

    eval_run = await engine.evaluate_response(
        workspace_id=ws_id,
        skill_type="sales_copilot",
        response_text="NexaCorp account details and risk analysis complete",
        confidence=0.92,
    )
    assert isinstance(eval_run, AIEvaluationRun)
    assert eval_run.overall_quality_score > 0.0

    bench_run = await engine.run_benchmark_suite(
        workspace_id=ws_id,
        benchmark_name="Integration_Bench_v1",
    )
    assert isinstance(bench_run, AIBenchmarkResult)
    assert bench_run.pass_rate >= 0.0
