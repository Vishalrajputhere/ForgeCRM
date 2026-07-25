"""
ForgeCRM API — AI Integration Schemas

Pydantic DTOs for AI Lead Summarization, Deal Risk Assessment,
and Automated Email Drafting.

Documentation: docs/03_Backend/308_AI_INTEGRATION.md
"""

from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, Field


class LeadSummaryRequest(BaseModel):
    """Lead summarization request DTO."""

    lead_id: UUID


class LeadSummaryResponse(BaseModel):
    """Lead summary output DTO."""

    lead_id: UUID
    summary: str
    key_insights: list[str]
    suggested_priority: str
    recommended_next_action: str


class DealRiskRequest(BaseModel):
    """Deal risk assessment request DTO."""

    deal_id: UUID


class DealRiskResponse(BaseModel):
    """Deal risk assessment output DTO."""

    deal_id: UUID
    risk_level: str  # Low, Medium, High
    risk_score: float  # 0.0 - 1.0
    key_risks: list[str]
    actionable_recommendations: list[str]


class EmailDraftRequest(BaseModel):
    """Email drafting request DTO."""

    entity_type: str = Field("Lead", description="Target entity type: Lead, Contact, or Deal")
    entity_id: UUID
    email_purpose: str = Field(..., description="Follow-up on product demo and discuss next steps")
    tone: str = Field("Professional", description="Professional, Friendly, Persuasive")


class EmailDraftResponse(BaseModel):
    """Email draft output DTO."""

    subject: str
    body: str
    recipient_email: str | None = None
    suggested_follow_up_days: int = 3


__all__ = [
    "DealRiskRequest",
    "DealRiskResponse",
    "EmailDraftRequest",
    "EmailDraftResponse",
    "LeadSummaryRequest",
    "LeadSummaryResponse",
]
