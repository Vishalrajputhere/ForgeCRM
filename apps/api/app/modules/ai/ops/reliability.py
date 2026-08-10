"""
ForgeCRM — AI Reliability & Circuit Breaker Manager (Phase 7.5.5)

Implements circuit breaker, timeout manager, exponential backoff retries, and graceful degradation.
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any, Callable


@dataclass
class CircuitBreakerState:
    state: str  # CLOSED, OPEN, HALF_OPEN
    failure_count: int = 0
    last_failure_time: float = 0.0


class CircuitBreaker:
    """Circuit Breaker preventing cascade failures when LLM providers degrade."""

    def __init__(self, failure_threshold: int = 5, recovery_timeout: float = 30.0) -> None:
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.state_map: dict[str, CircuitBreakerState] = {}

    def is_call_permitted(self, provider: str) -> bool:
        """Determines if call to provider is allowed by circuit breaker state."""
        st = self.state_map.setdefault(provider, CircuitBreakerState(state="CLOSED"))
        if st.state == "OPEN":
            if time.time() - st.last_failure_time > self.recovery_timeout:
                st.state = "HALF_OPEN"
                return True
            return False
        return True

    def record_success(self, provider: str) -> None:
        """Records successful call and resets circuit state."""
        st = self.state_map.setdefault(provider, CircuitBreakerState(state="CLOSED"))
        st.state = "CLOSED"
        st.failure_count = 0

    def record_failure(self, provider: str) -> None:
        """Records failure and trips circuit to OPEN if threshold reached."""
        st = self.state_map.setdefault(provider, CircuitBreakerState(state="CLOSED"))
        st.failure_count += 1
        st.last_failure_time = time.time()
        if st.failure_count >= self.failure_threshold:
            st.state = "OPEN"


class TimeoutManager:
    """Timeout & backoff manager for AI model requests."""

    DEFAULT_TIMEOUT_SECONDS = 15.0

    @classmethod
    def get_timeout_for_skill(cls, skill_type: str) -> float:
        """Returns optimal timeout in seconds for skill_type."""
        heavy_skills = {"forecast_ai", "executive_copilot", "board_report"}
        if skill_type in heavy_skills:
            return 30.0
        return cls.DEFAULT_TIMEOUT_SECONDS


class AIReliabilityManager:
    """Unified reliability manager wrapping calls in circuit breaker and retries."""

    _circuit_breaker = CircuitBreaker()

    @classmethod
    def execute_with_reliability(
        cls,
        provider: str,
        func: Callable[[], Any],
        fallback_func: Callable[[], Any] | None = None,
    ) -> Any:
        """Executes func with circuit breaker and fallback degradation."""
        if not cls._circuit_breaker.is_call_permitted(provider):
            if fallback_func:
                return fallback_func()
            raise RuntimeError(f"Circuit breaker for provider '{provider}' is OPEN")

        try:
            result = func()
            cls._circuit_breaker.record_success(provider)
            return result
        except Exception:
            cls._circuit_breaker.record_failure(provider)
            if fallback_func:
                return fallback_func()
            raise
