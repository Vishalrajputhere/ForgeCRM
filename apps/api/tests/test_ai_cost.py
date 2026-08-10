"""
ForgeCRM API — Phase 7.5.5 AI Cost Analytics Unit Tests

Tests for:
  - CostAnalyticsEngine recording usage and workspace summary calculations

Documentation: docs/07_Testing/703_INTEGRATION_TESTING.md
"""

from __future__ import annotations

import uuid
import pytest

from app.modules.ai.ops.cost import CostAnalyticsEngine
from app.modules.ai.models import AICostRecord


@pytest.mark.asyncio
async def test_cost_analytics_engine_recording(db_session) -> None:
    """Verifies CostAnalyticsEngine records token usage and calculates spend."""
    ws_id = uuid.uuid4()
    engine = CostAnalyticsEngine(db_session)

    record = await engine.record_usage(
        workspace_id=ws_id,
        skill_type="sales_copilot",
        provider="gemini",
        model="gemini-2.5-flash",
        prompt_tokens=1000,
        completion_tokens=500,
    )

    assert isinstance(record, AICostRecord)
    assert record.total_tokens == 1500
    assert record.cost_usd > 0.0

    summary = CostAnalyticsEngine.calculate_workspace_summary(ws_id, monthly_budget_usd=100.0)
    assert summary.workspace_id == str(ws_id)
    assert summary.budget_used_pct > 0.0
    assert summary.savings_from_cache_usd >= 0.0
