"""
ForgeCRM — Provider Failover Manager (Phase 7.5.2)

Monitors AI provider health, tracks error rates, and automatically triggers seamless failover to backup providers.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class ProviderHealthStatus:
    provider: str
    status: str  # healthy, degraded, offline
    avg_latency_ms: float = 250.0
    consecutive_failures: int = 0
    error_rate: float = 0.0


class ProviderFailoverManager:
    """Manages AI provider failover strategy and health monitoring."""

    _HEALTH: dict[str, ProviderHealthStatus] = {
        "gemini": ProviderHealthStatus(provider="gemini", status="healthy"),
        "openai": ProviderHealthStatus(provider="openai", status="healthy"),
        "ollama": ProviderHealthStatus(provider="ollama", status="healthy"),
    }

    _FALLBACK_CHAIN: dict[str, str] = {
        "gemini": "openai",
        "openai": "gemini",
        "ollama": "gemini",
    }

    @classmethod
    def get_healthy_provider(cls, primary_provider: str = "gemini") -> str:
        """
        Returns primary_provider if healthy, or falls back to backup provider in chain.
        """
        primary_health = cls._HEALTH.get(primary_provider, ProviderHealthStatus(provider=primary_provider, status="offline"))
        if primary_health.status == "healthy":
            return primary_provider

        fallback = cls._FALLBACK_CHAIN.get(primary_provider, "gemini")
        fallback_health = cls._HEALTH.get(fallback, ProviderHealthStatus(provider=fallback, status="healthy"))

        if fallback_health.status == "healthy":
            return fallback

        return "gemini"  # Final safety fallback

    @classmethod
    def record_failure(cls, provider: str) -> None:
        """Records a provider failure and marks provider degraded/offline if threshold met."""
        health = cls._HEALTH.setdefault(provider, ProviderHealthStatus(provider=provider, status="healthy"))
        health.consecutive_failures += 1
        health.error_rate = min(1.0, health.error_rate + 0.2)

        if health.consecutive_failures >= 3:
            health.status = "degraded"
        if health.consecutive_failures >= 5:
            health.status = "offline"

    @classmethod
    def record_success(cls, provider: str, latency_ms: float = 250.0) -> None:
        """Records a successful provider call and restores healthy status."""
        health = cls._HEALTH.setdefault(provider, ProviderHealthStatus(provider=provider, status="healthy"))
        health.consecutive_failures = 0
        health.error_rate = max(0.0, health.error_rate - 0.1)
        health.status = "healthy"
        health.avg_latency_ms = (health.avg_latency_ms * 0.8) + (latency_ms * 0.2)
