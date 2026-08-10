"""
ForgeCRM — AI Skills Shared Explainability Engine

Generates structured explainability metadata for AI Skill responses:
- Evidence (supporting data points)
- Sources (RAG and CRM citations summary)
- Missing context (flagged missing context or data gaps)
- Confidence explanation
- Why this answer was produced

Does NOT expose raw chain-of-thought.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class ExplainabilityReport:
    """Structured explainability output for end-user trust and auditability."""

    evidence: list[str] = field(default_factory=list)
    sources: list[str] = field(default_factory=list)
    missing_context: list[str] = field(default_factory=list)
    confidence_explanation: str = ""
    why_produced: str = ""


class ExplainabilityEngine:
    """Generates user-facing explainability reports without exposing raw thinking logs."""

    @staticmethod
    def generate(
        skill_type: str,
        goal: str,
        rag_snippets: list[dict[str, Any]],
        memory_context: list[str],
        tool_calls_used: list[str],
        confidence_score: float,
        confidence_label: str,
        confidence_explanation: str,
    ) -> ExplainabilityReport:
        """Constructs a clean, non-sensitive explainability report."""
        evidence: list[str] = []
        sources: list[str] = []
        missing_context: list[str] = []

        # Collect sources
        for s in rag_snippets:
            stype = s.get("entity_type", "document")
            sname = s.get("entity_name") or s.get("source", "CRM Document")
            sources.append(f"{stype.title()}: {sname}")
        sources = list(dict.fromkeys(sources))[:6]  # Deduplicate

        # Collect evidence
        if rag_snippets:
            top_score = rag_snippets[0].get("relevance_score", 0.0)
            evidence.append(f"Retrieved {len(rag_snippets)} relevant CRM record snippets (top relevance {top_score:.0%}).")
        if memory_context:
            evidence.append(f"Loaded {len(memory_context)} workspace & user memory preference(s).")
        if tool_calls_used:
            evidence.append(f"Verified live status using CRM tools: {', '.join(tool_calls_used)}.")

        # Identify missing context / data gaps
        if not rag_snippets:
            missing_context.append("No matching document chunks or unstructured notes were found in vector storage.")
        if not memory_context:
            missing_context.append("No prior user interaction memory was recorded for this entity.")
        if confidence_score < 0.60:
            missing_context.append("Limited historical CRM activities available for this query time window.")

        # Construct concise 'Why this answer was produced' rationale
        if sources:
            why_produced = (
                f"Generated using {len(sources)} grounded CRM source(s) and workspace memory "
                f"with {confidence_label} confidence ({confidence_score:.0%})."
            )
        else:
            why_produced = (
                f"Generated from CRM database context with {confidence_label} confidence ({confidence_score:.0%})."
            )

        return ExplainabilityReport(
            evidence=evidence,
            sources=sources,
            missing_context=missing_context,
            confidence_explanation=confidence_explanation,
            why_produced=why_produced,
        )
