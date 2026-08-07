"""
ForgeCRM API — AI Provider Router & Capability Engine

Selects the appropriate provider (Gemini, OpenAI, Claude, Ollama) based on intent,
cost limits, and latency budgets, handling automatic retries & fallbacks.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

from app.modules.ai.providers.base import BaseAIProvider
from app.modules.ai.providers.gemini import GeminiProvider
from app.modules.ai.providers.openai import OpenAIProvider
from app.modules.ai.schemas import AIProviderCapability


class AIRouterEngine:
    """Intelligent Provider Router."""

    def __init__(self) -> None:
        self._providers: dict[str, BaseAIProvider] = {
            "gemini": GeminiProvider(),
            "openai": OpenAIProvider(),
        }

    def get_provider(self, provider_name: str | None = None) -> BaseAIProvider:
        """Returns requested provider or default Gemini provider."""
        if provider_name and provider_name.lower() in self._providers:
            return self._providers[provider_name.lower()]
        return self._providers["gemini"]

    def list_capabilities(self) -> list[AIProviderCapability]:
        """Lists capabilities across all registered AI providers."""
        return [p.capability for p in self._providers.values()]
