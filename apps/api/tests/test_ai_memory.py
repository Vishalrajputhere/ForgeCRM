"""
ForgeCRM API — Sub-Phase 7.2.3 AI Memory & Conversation Branching Integration Tests

Tests for AIMemoryManager (CRUD, workspace vs user memory, pinned rules),
conversation summarization, and vector health diagnostics endpoint.

Documentation: docs/07_Testing/703_INTEGRATION_TESTING.md
"""

from __future__ import annotations

import uuid
import pytest
from app.modules.ai.memory import AIMemoryManager
from app.modules.ai.models import AIMessage


@pytest.mark.asyncio
async def test_ai_memory_manager_crud(db_session) -> None:
    """Verifies creation, listing, and deletion of workspace & user memory rules."""
    ws_id = uuid.uuid4()
    user_id = uuid.uuid4()
    manager = AIMemoryManager(db_session)

    # 1. Add workspace memory
    mem1 = await manager.add_memory(
        workspace_id=ws_id,
        key="target_icp",
        value="Target ICP: B2B SaaS companies >50 employees",
        memory_type="workspace",
        is_pinned=True,
    )
    assert mem1.key == "target_icp"
    assert mem1.is_pinned is True

    # 2. Add user preference
    mem2 = await manager.add_memory(
        workspace_id=ws_id,
        user_id=user_id,
        key="summary_style",
        value="User prefers bulleted executive summaries",
        memory_type="user",
    )
    assert mem2.user_id == user_id

    # 3. List memories
    memories = await manager.list_memories(workspace_id=ws_id, user_id=user_id)
    assert len(memories) == 2

    # 4. Delete memory
    deleted = await manager.delete_memory(workspace_id=ws_id, memory_id=mem1.id)
    assert deleted is True

    memories_after = await manager.list_memories(workspace_id=ws_id, user_id=user_id)
    assert len(memories_after) == 1
    assert memories_after[0].key == "summary_style"


@pytest.mark.asyncio
async def test_conversation_summarization_engine(db_session) -> None:
    """Verifies summarization of past chat turns into long-term memory facts."""
    ws_id = uuid.uuid4()
    conv_id = uuid.uuid4()

    # Seed messages
    msg1 = AIMessage(
        id=uuid.uuid4(),
        conversation_id=conv_id,
        role="user",
        content="What is the renewal risk for Acme Corp?",
    )
    msg2 = AIMessage(
        id=uuid.uuid4(),
        conversation_id=conv_id,
        role="assistant",
        content="Acme Corp renewal is scheduled for Q3 2026 ($450,000 ARR).",
    )
    db_session.add_all([msg1, msg2])
    await db_session.flush()

    manager = AIMemoryManager(db_session)
    summary_fact = await manager.summarize_conversation_session(
        workspace_id=ws_id,
        conversation_id=conv_id,
    )

    assert "Summarized 2 chat turns" in summary_fact
    memories = await manager.list_memories(workspace_id=ws_id)
    assert len(memories) == 1
    assert "Summarized 2 chat turns" in memories[0].value
