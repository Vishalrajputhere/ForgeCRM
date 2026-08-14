"""
ForgeCRM API — Sub-Phase 7.2.5 AI Telemetry & Debug Dashboard Integration Tests

Tests for /api/v1/ai/debug/telemetry and /api/v1/ai/debug/sessions endpoints.

Documentation: docs/07_Testing/703_INTEGRATION_TESTING.md
"""

from __future__ import annotations

import uuid
import pytest
from app.modules.ai.routes import get_ai_telemetry, list_ai_debug_sessions
from app.modules.identity.models import User
from app.modules.workspace.models import Workspace


@pytest.mark.asyncio
async def test_ai_telemetry_endpoint(db_session) -> None:
    """Verifies retrieval of aggregated AI telemetry stats."""
    user = User(id=uuid.uuid4(), email="admin@acme.com")
    workspace = Workspace(id=uuid.uuid4(), name="Acme Enterprise")

    telemetry = await get_ai_telemetry(auth=(user, workspace), db=db_session)
    assert telemetry["workspace_id"] == str(workspace.id)
    assert telemetry["total_requests"] >= 100
    assert telemetry["estimated_cost_usd"] > 0
    assert telemetry["rag_hit_rate"] >= 0.8
    assert "latency_breakdown" in telemetry


@pytest.mark.asyncio
async def test_ai_debug_sessions_endpoint(db_session) -> None:
    """Verifies listing of recent AI sessions for step-by-step trace replay."""
    user = User(id=uuid.uuid4(), email="admin@acme.com")
    workspace = Workspace(id=uuid.uuid4(), name="Acme Enterprise")

    sessions = await list_ai_debug_sessions(auth=(user, workspace), db=db_session)
    assert len(sessions) >= 1
    assert sessions[0]["user_email"] == "admin@acme.com"
    assert sessions[0]["model"] in {"gemini-flash-latest", "gemini-1.5-flash", "gemini-3-flash-preview"}
