"""
ForgeCRM API — Phase 7.5.4 AI Semantic Cache Unit Tests

Tests for:
  - SemanticCacheEngine prompt hashing and put/get caching
  - Workspace isolation and cache invalidation

Documentation: docs/07_Testing/703_INTEGRATION_TESTING.md
"""

from __future__ import annotations

import uuid
import pytest

from app.modules.ai.cache.engine import SemanticCacheEngine


def test_semantic_cache_put_and_get() -> None:
    """Verifies SemanticCacheEngine stores and retrieves AI skill responses."""
    ws_id = uuid.uuid4()
    prompt = "Summarize account details for NexaCorp"
    skill = "sales_copilot"
    res_data = {"summary": "NexaCorp ARR $580K with 124% NRR", "confidence": 0.95}

    hit_before = SemanticCacheEngine.get(ws_id, prompt, skill)
    assert hit_before.is_hit is False

    key = SemanticCacheEngine.put(ws_id, prompt, skill, res_data)
    assert key != ""

    hit_after = SemanticCacheEngine.get(ws_id, prompt, skill)
    assert hit_after.is_hit is True
    assert hit_after.response_json == res_data
    assert hit_after.similarity_score == 1.0


def test_semantic_cache_workspace_isolation() -> None:
    """Verifies cache entries are isolated per workspace."""
    ws1 = uuid.uuid4()
    ws2 = uuid.uuid4()
    prompt = "Get pipeline summary"
    skill = "pipeline_summary"

    SemanticCacheEngine.put(ws1, prompt, skill, {"data": "ws1_pipeline"})
    hit_ws1 = SemanticCacheEngine.get(ws1, prompt, skill)
    hit_ws2 = SemanticCacheEngine.get(ws2, prompt, skill)

    assert hit_ws1.is_hit is True
    assert hit_ws2.is_hit is False

    count_del = SemanticCacheEngine.invalidate_workspace_cache(ws1)
    assert count_del >= 1
    assert SemanticCacheEngine.get(ws1, prompt, skill).is_hit is False
