"""
ForgeCRM — AI Skills Shared Confidence Scorer

Computes normalized 0–1 confidence scores for every AI Skill response based on:
- RAG retrieval hit count and average relevance
- Memory hit count
- Tool calls successfully executed
- Context freshness
- Response token density

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Any


class ConfidenceLabel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


@dataclass
class ConfidenceResult:
    """Output of the confidence scoring computation."""

    score: float  # 0.0 – 1.0
    label: ConfidenceLabel
    breakdown: dict[str, float]
    explanation: str


class ConfidenceScorer:
    """Computes normalized confidence scores for AI Skill responses."""

    # Weight coefficients (must sum to 1.0)
    WEIGHTS = {
        "rag_coverage": 0.35,
        "memory_coverage": 0.20,
        "tool_execution": 0.20,
        "context_freshness": 0.15,
        "response_completeness": 0.10,
    }

    @classmethod
    def score(
        cls,
        rag_snippets: list[dict[str, Any]],
        memory_hits: int,
        tool_calls_made: int,
        context_freshness_score: float = 1.0,
        response_length: int = 0,
    ) -> ConfidenceResult:
        """Computes the overall confidence score for a skill response."""

        # RAG coverage: proportion of snippets with relevance >= 0.6
        if rag_snippets:
            high_quality = sum(1 for s in rag_snippets if s.get("relevance_score", 0) >= 0.6)
            rag_score = min(1.0, high_quality / max(len(rag_snippets), 1))
        else:
            rag_score = 0.2  # Low but not zero — context builder still helps

        # Memory coverage: diminishing returns after 3 memories
        memory_score = min(1.0, memory_hits / 3.0) if memory_hits > 0 else 0.3

        # Tool execution: whether MCP tools ran successfully
        tool_score = min(1.0, tool_calls_made * 0.33) if tool_calls_made > 0 else 0.4

        # Context freshness: passed in from context builder quality metrics
        freshness_score = max(0.0, min(1.0, context_freshness_score))

        # Response completeness: length heuristic (> 200 tokens is a complete response)
        completeness_score = min(1.0, response_length / 200.0)

        breakdown = {
            "rag_coverage": rag_score,
            "memory_coverage": memory_score,
            "tool_execution": tool_score,
            "context_freshness": freshness_score,
            "response_completeness": completeness_score,
        }

        weighted = sum(breakdown[k] * cls.WEIGHTS[k] for k in cls.WEIGHTS)
        final_score = round(weighted, 3)

        if final_score >= 0.80:
            label = ConfidenceLabel.HIGH
            explanation = "Response is well-grounded in CRM data, RAG citations, and memory context."
        elif final_score >= 0.55:
            label = ConfidenceLabel.MEDIUM
            explanation = "Response is partially grounded. Some claims may lack direct CRM evidence."
        else:
            label = ConfidenceLabel.LOW
            explanation = "Limited CRM context available. Treat this response as a starting point for investigation."

        return ConfidenceResult(
            score=final_score,
            label=label,
            breakdown=breakdown,
            explanation=explanation,
        )
