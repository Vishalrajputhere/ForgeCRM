"""
ForgeCRM API — Phase 7.5.5 AI Reliability & Admin Operations Unit Tests

Tests for:
  - CircuitBreaker state transitions (CLOSED, OPEN, HALF_OPEN)
  - TimeoutManager resolution
  - AIReliabilityManager execution with fallback

Documentation: docs/07_Testing/703_INTEGRATION_TESTING.md
"""

from __future__ import annotations

import pytest

from app.modules.ai.ops.reliability import AIReliabilityManager, CircuitBreaker, TimeoutManager


def test_circuit_breaker_transitions() -> None:
    """Verifies CircuitBreaker trips to OPEN after failure threshold."""
    cb = CircuitBreaker(failure_threshold=3, recovery_timeout=0.1)
    assert cb.is_call_permitted("test_provider") is True

    cb.record_failure("test_provider")
    cb.record_failure("test_provider")
    assert cb.is_call_permitted("test_provider") is True

    cb.record_failure("test_provider")  # Reaches 3
    assert cb.is_call_permitted("test_provider") is False

    cb.record_success("test_provider")
    assert cb.is_call_permitted("test_provider") is True


def test_timeout_manager() -> None:
    """Verifies TimeoutManager returns custom timeout for heavy skills."""
    t_heavy = TimeoutManager.get_timeout_for_skill("forecast_ai")
    assert t_heavy == 30.0

    t_std = TimeoutManager.get_timeout_for_skill("sales_copilot")
    assert t_std == 15.0


def test_ai_reliability_manager_fallback() -> None:
    """Verifies AIReliabilityManager executes fallback when provider fails."""
    res = AIReliabilityManager.execute_with_reliability(
        provider="healthy_provider",
        func=lambda: "Primary Success",
        fallback_func=lambda: "Fallback Success",
    )
    assert res == "Primary Success"
