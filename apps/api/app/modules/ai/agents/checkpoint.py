"""
ForgeCRM API — Autonomous AI Agent Resumable Checkpoint Manager

Serializes state snapshots to database after every step for crash & deployment recovery.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ai.agents.models import AgentCheckpoint


class CheckpointManager:
    """Agent Checkpoint Serializer and Recovery Manager."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def save_checkpoint(
        self,
        execution_id: uuid.UUID,
        step_key: str,
        state_snapshot: dict[str, Any],
    ) -> AgentCheckpoint:
        """Saves execution state snapshot to database."""
        cp = AgentCheckpoint(
            id=uuid.uuid4(),
            execution_id=execution_id,
            step_key=step_key,
            state_snapshot_json=state_snapshot,
        )
        self.db.add(cp)
        await self.db.flush()
        return cp

    async def load_latest_checkpoint(self, execution_id: uuid.UUID) -> AgentCheckpoint | None:
        """Retrieves latest state snapshot for execution resumption."""
        stmt = (
            select(AgentCheckpoint)
            .where(AgentCheckpoint.execution_id == execution_id)
            .order_by(AgentCheckpoint.created_at.desc())
            .limit(1)
        )
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()
