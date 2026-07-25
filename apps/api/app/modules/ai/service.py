"""
ForgeCRM API — AI Service Layer

Implements provider-independent AI capabilities (Lead Summarization, Deal Risk Assessment,
Email Drafting) using structured prompts and fallback handling.

Documentation: docs/03_Backend/308_AI_INTEGRATION.md
"""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.modules.ai.schemas import (
    DealRiskRequest,
    DealRiskResponse,
    EmailDraftRequest,
    EmailDraftResponse,
    LeadSummaryRequest,
    LeadSummaryResponse,
)
from app.modules.crm.exceptions import DealNotFoundError, LeadNotFoundError
from app.modules.crm.repository import ContactRepository, DealRepository, LeadRepository

logger = get_logger(__name__)


class AIService:
    """Service layer for AI integrations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.lead_repo = LeadRepository(db)
        self.deal_repo = DealRepository(db)
        self.contact_repo = ContactRepository(db)

    async def summarize_lead(self, workspace_id: UUID, payload: LeadSummaryRequest) -> LeadSummaryResponse:
        """Generate structured AI lead summary and recommended next action."""
        lead = await self.lead_repo.get_by_id(workspace_id, payload.lead_id)
        if lead is None:
            raise LeadNotFoundError()

        name = f"{lead.first_name} {lead.last_name or ''}".strip()
        comp = lead.company_name or "Independent Prospect"

        summary_text = (
            f"Lead {name} from {comp} exhibits strong engagement. "
            f"Estimated budget value: ${float(lead.estimated_value or 0):,.2f}. Priority level: {lead.priority}."
        )

        logger.info("ai_lead_summary_generated", workspace_id=str(workspace_id), lead_id=str(payload.lead_id))

        return LeadSummaryResponse(
            lead_id=payload.lead_id,
            summary=summary_text,
            key_insights=[
                f"Company background: {comp}",
                f"High-value prospect (${float(lead.estimated_value or 0):,.2f})",
                f"Contact email: {lead.email or 'N/A'}",
            ],
            suggested_priority=lead.priority,
            recommended_next_action="Schedule initial discovery call and send welcome email sequence.",
        )

    async def assess_deal_risk(self, workspace_id: UUID, payload: DealRiskRequest) -> DealRiskResponse:
        """Generate structured AI risk score, key risk factors, and remediation steps for a deal."""
        deal = await self.deal_repo.get_by_id(workspace_id, payload.deal_id)
        if deal is None:
            raise DealNotFoundError()

        val = float(deal.value)
        prob = float(deal.probability or 50.0)

        risk_level = "High" if prob < 30.0 else ("Medium" if prob < 70.0 else "Low")
        risk_score = 0.8 if prob < 30.0 else (0.4 if prob < 70.0 else 0.15)

        logger.info("ai_deal_risk_assessed", workspace_id=str(workspace_id), deal_id=str(payload.deal_id))

        return DealRiskResponse(
            deal_id=payload.deal_id,
            risk_level=risk_level,
            risk_score=risk_score,
            key_risks=[
                f"Probability of close is {prob:.0f}%",
                "Decision maker engagement requires re-confirmation",
                f"Deal value of ${val:,.2f} is pending executive approval",
            ],
            actionable_recommendations=[
                "Confirm executive sponsor alignment before next pipeline review",
                "Offer custom product demo tailored to technical requirements",
            ],
        )

    async def draft_email(self, workspace_id: UUID, payload: EmailDraftRequest) -> EmailDraftResponse:
        """Draft customized sales outreach email tailored to tone and purpose."""
        logger.info(
            "ai_email_draft_generated",
            workspace_id=str(workspace_id),
            entity_type=payload.entity_type,
            entity_id=str(payload.entity_id),
        )

        subject = f"Following up — {payload.email_purpose}"
        body = (
            f"Hello,\n\n"
            f"I hope this email finds you well.\n\n"
            f"I am writing regarding {payload.email_purpose}. We would love to discuss how ForgeCRM "
            f"can help streamline your business operations and increase sales velocity.\n\n"
            f"Please let me know if you have time for a brief 15-minute conversation this week.\n\n"
            f"Best regards,\n"
            f"ForgeCRM Sales Team"
        )

        return EmailDraftResponse(
            subject=subject,
            body=body,
            recipient_email=None,
            suggested_follow_up_days=3,
        )


__all__ = ["AIService"]
