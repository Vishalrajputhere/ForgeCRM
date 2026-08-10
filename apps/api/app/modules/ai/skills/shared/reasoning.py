"""
ForgeCRM — AI Skills Shared Reasoning Engine

Builds structured, step-by-step reasoning chains that accompany every AI Skill response.
Provides full explainability — users can inspect exactly how the AI arrived at conclusions.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class ReasoningStep:
    """A single step in the AI reasoning chain."""

    step_number: int
    title: str
    description: str
    evidence: list[str] = field(default_factory=list)  # Supporting snippets/data points
    confidence: float = 1.0  # Per-step confidence 0–1


@dataclass
class ReasoningChain:
    """Complete reasoning chain for a skill response."""

    goal: str
    steps: list[ReasoningStep]
    conclusion: str
    overall_confidence: float


class ReasoningEngine:
    """Builds structured reasoning chains for AI Skill responses."""

    @staticmethod
    def build_chain(
        skill_type: str,
        goal: str,
        rag_snippets: list[dict[str, Any]],
        memory_context: list[str],
        tool_calls_used: list[str],
        llm_summary: str,
        confidence: float,
    ) -> ReasoningChain:
        """Constructs a step-by-step reasoning chain from skill execution evidence."""

        steps: list[ReasoningStep] = []
        step_num = 1

        # Step 1: Context Assembly
        steps.append(
            ReasoningStep(
                step_number=step_num,
                title="Assembled CRM Context",
                description="Retrieved workspace, user permissions, entity data, and related CRM records from the Enterprise Context Builder.",
                evidence=[f"Skill type: {skill_type}", f"Goal: {goal}"],
                confidence=1.0,
            )
        )
        step_num += 1

        # Step 2: RAG Retrieval
        if rag_snippets:
            top_sources = list({s.get("entity_type", "document") for s in rag_snippets[:3]})
            steps.append(
                ReasoningStep(
                    step_number=step_num,
                    title="RAG Document Retrieval",
                    description=f"Retrieved {len(rag_snippets)} relevant document chunks via hybrid RRF vector + keyword search.",
                    evidence=[f"Sources: {', '.join(top_sources)}", f"Top relevance: {rag_snippets[0].get('relevance_score', 0):.2f}" if rag_snippets else ""],
                    confidence=min(1.0, 0.6 + len(rag_snippets) * 0.05),
                )
            )
            step_num += 1

        # Step 3: Memory Retrieval
        if memory_context:
            steps.append(
                ReasoningStep(
                    step_number=step_num,
                    title="Memory Context Loaded",
                    description=f"Loaded {len(memory_context)} relevant workspace and user memories.",
                    evidence=memory_context[:2],
                    confidence=0.9,
                )
            )
            step_num += 1

        # Step 4: MCP Tool Execution
        if tool_calls_used:
            steps.append(
                ReasoningStep(
                    step_number=step_num,
                    title="MCP Tool Execution",
                    description=f"Executed {len(tool_calls_used)} CRM tools to fetch live data.",
                    evidence=[f"Tools used: {', '.join(tool_calls_used)}"],
                    confidence=0.95,
                )
            )
            step_num += 1

        # Step 5: LLM Synthesis
        steps.append(
            ReasoningStep(
                step_number=step_num,
                title="AI Synthesis",
                description="Combined all context, RAG snippets, and memory into a coherent response using the AI provider.",
                evidence=[f"Response length: {len(llm_summary.split())} words"],
                confidence=confidence,
            )
        )

        conclusion = (
            f"Based on {len(rag_snippets)} retrieved documents and {len(memory_context)} memory entries, "
            f"the AI produced a response with {confidence * 100:.0f}% confidence."
        )

        return ReasoningChain(
            goal=goal,
            steps=steps,
            conclusion=conclusion,
            overall_confidence=confidence,
        )
