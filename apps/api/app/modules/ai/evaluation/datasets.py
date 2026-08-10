"""
ForgeCRM — Golden Dataset Manager (Phase 7.5.1)

Manages ground-truth test cases and benchmark datasets for AI skill evaluation.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class GoldenTestCase:
    """Ground-truth test case for evaluating AI skills."""

    case_id: str
    skill_type: str
    question: str
    expected_keywords: list[str]
    expected_citations: list[str]
    expected_sentiment: str | None = None
    min_confidence: float = 0.80


class GoldenDatasetManager:
    """Manages curated ground-truth datasets for automated benchmarking."""

    _DEFAULT_TEST_CASES: list[GoldenTestCase] = [
        GoldenTestCase(
            case_id="sales_copilot_01",
            skill_type="sales_copilot",
            question="Summarize account details for NexaCorp and list top risks",
            expected_keywords=["NexaCorp", "account", "risk", "revenue"],
            expected_citations=["crm_account_nexacorp"],
        ),
        GoldenTestCase(
            case_id="deal_coach_01",
            skill_type="deal_coach",
            question="Analyze deal health for Enterprise Renewal deal",
            expected_keywords=["health", "deal", "probability", "win"],
            expected_citations=["opportunity_enterprise_renewal"],
        ),
        GoldenTestCase(
            case_id="lead_qual_01",
            skill_type="lead_qualification",
            question="Qualify incoming lead Sarah Jenkins from scale-up company",
            expected_keywords=["score", "fit", "icp", "budget", "qualified"],
            expected_citations=["lead_sarah_jenkins"],
        ),
        GoldenTestCase(
            case_id="forecast_ai_01",
            skill_type="forecast_ai",
            question="Generate revenue forecast and quarterly scenario simulation for Q3",
            expected_keywords=["forecast", "revenue", "pipeline", "scenario", "best_case"],
            expected_citations=["forecast_q3_2026"],
        ),
        GoldenTestCase(
            case_id="email_copilot_01",
            skill_type="email_copilot",
            question="Draft professional reply to customer inquiring about SOC2 report",
            expected_keywords=["reply", "security", "SOC2", "compliance"],
            expected_citations=["doc_soc2_report"],
        ),
        GoldenTestCase(
            case_id="executive_01",
            skill_type="executive_copilot",
            question="Synthesize C-suite board report and company commercial health score",
            expected_keywords=["board", "ARR", "health", "metrics", "strategic"],
            expected_citations=["board_q3_report"],
        ),
    ]

    @classmethod
    def get_test_cases(cls, skill_type: str | None = None) -> list[GoldenTestCase]:
        """Returns test cases, optionally filtered by skill_type."""
        if not skill_type:
            return cls._DEFAULT_TEST_CASES
        return [tc for tc in cls._DEFAULT_TEST_CASES if tc.skill_type == skill_type]

    @classmethod
    def add_test_case(cls, test_case: GoldenTestCase) -> None:
        """Adds a custom test case to the manager."""
        cls._DEFAULT_TEST_CASES.append(test_case)
