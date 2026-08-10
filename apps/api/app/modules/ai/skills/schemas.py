"""
ForgeCRM — AI Skills Pydantic V2 Schemas

Defines the standard request/response contract for ALL AI Skills.
Every future skill (DealCoach, ForecastAgent, LeadQualificationAgent,
EmailCopilot, MeetingAssistant, ExecutiveCopilot) must use these schemas.

Documentation: docs/03_Backend/302_API_DESIGN.md
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


# ─── Citation Schema ──────────────────────────────────────────────────────────

class CitationSchema(BaseModel):
    """Source citation from RAG retrieval or CRM entity context."""

    citation_id: str
    source: str
    entity_type: str
    entity_id: str | None = None
    entity_name: str = ""
    excerpt: str
    relevance_score: float
    page_number: int | None = None
    url: str | None = None


# ─── Insight Schema ───────────────────────────────────────────────────────────

class InsightSchema(BaseModel):
    """Structured business insight extracted from AI skill analysis."""

    insight_type: Literal["risk", "opportunity", "recommendation", "alert", "trend", "info"]
    title: str
    body: str
    confidence: float
    entity_type: str | None = None
    entity_id: str | None = None
    tags: list[str] = []
    priority: Literal["high", "medium", "low"] = "medium"


# ─── Reasoning Schema ─────────────────────────────────────────────────────────

class ReasoningStepSchema(BaseModel):
    """One step in the AI reasoning chain."""

    step_number: int
    title: str
    description: str
    evidence: list[str] = []
    confidence: float


class ReasoningChainSchema(BaseModel):
    """Full reasoning chain for a skill response."""

    goal: str
    steps: list[ReasoningStepSchema]
    conclusion: str
    overall_confidence: float


# ─── Explainability Schema ─────────────────────────────────────────────────────

class ExplainabilitySchema(BaseModel):
    """Structured user-facing explainability report."""

    evidence: list[str] = []
    sources: list[str] = []
    missing_context: list[str] = []
    confidence_explanation: str = ""
    why_produced: str = ""


# ─── Skill Request ────────────────────────────────────────────────────────────

class SkillRequest(BaseModel):
    """Standard request payload for any AI Skill execution."""

    skill: str = Field(..., description="Skill identifier, e.g. 'account_summary', 'crm_qa'")
    skill_type: str | None = Field(None, description="Alias for skill")
    question: str | None = Field(None, description="Free-text question for Q&A skills")
    entity_type: str | None = Field(None, description="CRM entity type (company, deal, lead, contact)")
    entity_id: uuid.UUID | None = Field(None, description="CRM entity UUID")
    entity_name: str | None = Field(None, description="Human-readable entity name")
    focus_areas: str | None = Field(None, description="Optional focus hints (e.g. 'revenue, blockers')")
    time_window: str | None = Field("30 days", description="Time window for timeline skills")
    provider: str | None = Field(None, description="Preferred AI provider override")
    model: str | None = Field(None, description="Preferred model override")
    context_hints: dict[str, Any] = Field(default_factory=dict, description="Extra context hints")


# ─── Skill Response ───────────────────────────────────────────────────────────

class SkillResponse(BaseModel):
    """
    Standard response contract mandatory across the platform (Rule 10).
    """

    skill: str = Field(..., description="Skill identifier")
    skill_type: str = Field(..., description="Skill identifier")
    summary: str = Field(..., description="Primary AI-generated response")
    reasoning: ReasoningChainSchema | None = None
    reasoning_chain: ReasoningChainSchema | None = None  # Alias for backward compatibility
    explainability: ExplainabilitySchema | None = None
    confidence: float = Field(..., ge=0.0, le=1.0)
    confidence_label: Literal["HIGH", "MEDIUM", "LOW"]
    confidence_explanation: str = ""
    citations: list[CitationSchema] = []
    evidence: list[str] = []
    missing_context: list[str] = []
    insights: list[InsightSchema] = []
    recommendations: list[str] = []
    next_actions: list[str] = []
    tool_calls_used: list[str] = []
    latency_ms: int = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    token_usage: dict[str, int] = Field(default_factory=dict)
    estimated_cost_usd: float = 0.0
    provider_used: str = ""
    model_used: str = ""
    template_id: str = ""
    template_version: str = ""
    generated_at: datetime = Field(default_factory=datetime.utcnow)


# ─── Copilot Request (single endpoint contract for POST /api/v1/ai/copilot) ────

class CopilotRequest(BaseModel):
    """Request payload for POST /api/v1/ai/copilot."""

    skill: str = Field("crm_qa", description="Skill identifier, e.g. 'account_summary', 'crm_qa'")
    question: str | None = Field(None, description="Natural language CRM question or command")
    entity_type: str | None = None
    entity_id: uuid.UUID | None = None
    entity_name: str | None = None
    focus_areas: str | None = None
    time_window: str | None = "30 days"
    provider: str | None = None
    model: str | None = None
