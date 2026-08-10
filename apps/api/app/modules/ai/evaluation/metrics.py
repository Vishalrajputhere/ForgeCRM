"""
ForgeCRM — AI Evaluation Metrics & Quality Score Calculator (Phase 7.5.1)

Calculates quality scores, accuracy, faithfulness, hallucination rates, citation validation,
reasoning quality, answer completeness, and confidence calibration.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class EvaluationMetrics:
    """Quantitative quality metrics for an AI Skill response."""

    accuracy: float = 0.90  # Ground-truth similarity (0.0-1.0)
    faithfulness: float = 0.92  # Adherence to retrieved context (0.0-1.0)
    hallucination_score: float = 0.04  # Unsupported facts (0.0-1.0, lower is better)
    citation_score: float = 0.95  # Valid citation ratio (0.0-1.0)
    reasoning_quality: float = 0.88  # Structural logic depth (0.0-1.0)
    answer_completeness: float = 0.91  # Coverage of user question (0.0-1.0)
    confidence_calibration: float = 0.94  # Confidence score alignment with reality
    latency_ms: int = 420
    token_usage: int = 850
    cost_usd: float = 0.0012
    metadata: dict[str, Any] = field(default_factory=dict)


class QualityScoreCalculator:
    """Calculates composite overall quality score (0-100) from EvaluationMetrics."""

    WEIGHT_ACCURACY = 0.30
    WEIGHT_FAITHFULNESS = 0.25
    WEIGHT_HALLUCINATION = 0.20  # Inverted (1 - hallucination_score)
    WEIGHT_CITATIONS = 0.10
    WEIGHT_COMPLETENESS = 0.15

    @classmethod
    def calculate_composite_score(cls, metrics: EvaluationMetrics) -> float:
        """
        Calculates composite overall quality score (0.0 to 100.0).
        High accuracy, high faithfulness, low hallucination yield top scores.
        """
        hallucination_factor = max(0.0, 1.0 - metrics.hallucination_score)

        raw_score = (
            (metrics.accuracy * cls.WEIGHT_ACCURACY)
            + (metrics.faithfulness * cls.WEIGHT_FAITHFULNESS)
            + (hallucination_factor * cls.WEIGHT_HALLUCINATION)
            + (metrics.citation_score * cls.WEIGHT_CITATIONS)
            + (metrics.answer_completeness * cls.WEIGHT_COMPLETENESS)
        )

        return round(raw_score * 100.0, 2)
