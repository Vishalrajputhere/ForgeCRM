"""
ForgeCRM API — Autonomous AI Agent Background Worker Pool

Asynchronous background worker polling pending event jobs and executing agents.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ai.agents.events import AgentEventDispatcher, CRMDomainEvent

logger = logging.getLogger(__name__)


class AgentBackgroundWorker:
    """Async Background Worker Queue."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.dispatcher = AgentEventDispatcher(db)

    async def process_event_queue_batch(self, events: list[CRMDomainEvent]) -> int:
        """Processes a batch of queued domain events in background worker."""
        processed_count = 0
        for ev in events:
            try:
                result = await self.dispatcher.handle_domain_event(ev)
                if result:
                    processed_count += 1
            except Exception as exc:
                logger.error("Agent Worker failed processing event %s: %s", ev.event_id, exc)

        return processed_count
