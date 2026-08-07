"""
ForgeCRM API — Phase 7.3.2 Autonomous Background Agents Integration Tests

Tests for CRMDomainEvent, AgentEventDispatcher, and background event triggers
(lead.created, deal.stage_changed, email.received).

Documentation: docs/07_Testing/703_INTEGRATION_TESTING.md
"""

from __future__ import annotations

import uuid
import pytest
from app.modules.ai.agents.events import AgentEventDispatcher, CRMDomainEvent
from app.modules.ai.agents.worker import AgentBackgroundWorker


@pytest.mark.asyncio
async def test_lead_auto_enrichment_agent_trigger(db_session) -> None:
    """Verifies lead.created domain event triggers Lead Auto-Enrichment Agent."""
    ws_id = uuid.uuid4()
    user_id = uuid.uuid4()
    lead_id = uuid.uuid4()

    event = CRMDomainEvent(
        event_type="lead.created",
        workspace_id=ws_id,
        user_id=user_id,
        entity_type="Lead",
        entity_id=lead_id,
        data={"name": "Sarah Connor", "company": "Cyberdyne Systems"},
    )

    dispatcher = AgentEventDispatcher(db_session)
    status = await dispatcher.handle_domain_event(event)

    assert status is not None
    assert "Sarah Connor" in status.goal
    assert status.completed_steps >= 1


@pytest.mark.asyncio
async def test_deal_risk_monitor_agent_trigger(db_session) -> None:
    """Verifies deal.stage_changed domain event triggers Deal Risk Monitor Agent."""
    ws_id = uuid.uuid4()
    user_id = uuid.uuid4()
    deal_id = uuid.uuid4()

    event = CRMDomainEvent(
        event_type="deal.stage_changed",
        workspace_id=ws_id,
        user_id=user_id,
        entity_type="Deal",
        entity_id=deal_id,
        data={"deal_name": "Acme Enterprise Deal", "new_stage": "Proposal Sent"},
    )

    dispatcher = AgentEventDispatcher(db_session)
    status = await dispatcher.handle_domain_event(event)

    assert status is not None
    assert "Acme Enterprise Deal" in status.goal


@pytest.mark.asyncio
async def test_agent_background_worker_batch_processing(db_session) -> None:
    """Verifies background worker batch processing of domain event queue."""
    ws_id = uuid.uuid4()
    user_id = uuid.uuid4()

    events = [
        CRMDomainEvent(
            event_type="email.received",
            workspace_id=ws_id,
            user_id=user_id,
            entity_type="Email",
            entity_id=uuid.uuid4(),
            data={"subject": "Pricing inquiry for Cloud tier"},
        )
    ]

    worker = AgentBackgroundWorker(db_session)
    processed = await worker.process_event_queue_batch(events)
    assert processed == 1
