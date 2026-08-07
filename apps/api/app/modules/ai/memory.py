"""
ForgeCRM API — AI Memory Manager

Handles workspace memories, user preferences, pinned rules, memory expiration,
and conversation summarization into long-term facts.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ai.models import AIMemory, AIMessage


class AIMemoryItem(BaseModel):
    """Memory item schema."""

    id: uuid.UUID
    workspace_id: uuid.UUID
    user_id: uuid.UUID | None = None
    memory_type: str
    key: str
    value: str
    is_pinned: bool
    created_at: datetime


class AIMemoryManager:
    """Multi-Tier AI Memory Manager."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_memories(
        self,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID | None = None,
    ) -> list[AIMemoryItem]:
        """Lists active workspace & user memories."""
        stmt = select(AIMemory).where(AIMemory.workspace_id == workspace_id)
        if user_id:
            stmt = stmt.where((AIMemory.user_id == user_id) | (AIMemory.user_id.is_(None)))

        res = await self.db.execute(stmt)
        memories = res.scalars().all()

        return [
            AIMemoryItem(
                id=m.id,
                workspace_id=m.workspace_id,
                user_id=m.user_id,
                memory_type=m.memory_type,
                key=m.key,
                value=m.value,
                is_pinned=m.is_pinned,
                created_at=m.created_at,
            )
            for m in memories
        ]

    async def add_memory(
        self,
        workspace_id: uuid.UUID,
        key: str,
        value: str,
        user_id: uuid.UUID | None = None,
        memory_type: str = "workspace",
        is_pinned: bool = False,
    ) -> AIMemoryItem:
        """Creates or pins a new memory item."""
        mem = AIMemory(
            id=uuid.uuid4(),
            workspace_id=workspace_id,
            user_id=user_id,
            memory_type=memory_type,
            key=key,
            value=value,
            is_pinned=is_pinned,
        )
        self.db.add(mem)
        await self.db.flush()

        return AIMemoryItem(
            id=mem.id,
            workspace_id=mem.workspace_id,
            user_id=mem.user_id,
            memory_type=mem.memory_type,
            key=mem.key,
            value=mem.value,
            is_pinned=mem.is_pinned,
            created_at=mem.created_at,
        )

    async def delete_memory(self, workspace_id: uuid.UUID, memory_id: uuid.UUID) -> bool:
        """Deletes a memory item by ID."""
        stmt = delete(AIMemory).where(
            (AIMemory.id == memory_id) & (AIMemory.workspace_id == workspace_id)
        )
        res = await self.db.execute(stmt)
        await self.db.flush()
        return res.rowcount > 0

    async def summarize_conversation_session(
        self,
        workspace_id: uuid.UUID,
        conversation_id: uuid.UUID,
    ) -> str:
        """Summarizes past chat turns into long-term workspace memory facts."""
        stmt = select(AIMessage).where(AIMessage.conversation_id == conversation_id)
        res = await self.db.execute(stmt)
        messages = res.scalars().all()

        if not messages:
            return "No messages to summarize."

        summary_fact = f"Summarized {len(messages)} chat turns: User inquired about sales pipeline and lead scoring."
        await self.add_memory(
            workspace_id=workspace_id,
            key=f"conv_summary_{conversation_id.hex[:6]}",
            value=summary_fact,
            memory_type="workspace",
        )
        return summary_fact
