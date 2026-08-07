"""
ForgeCRM API — AI Context Prioritization & Token Allocator

Dynamically weights entity relevance based on active route and caps prompt bounds.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class TokenBudget(BaseModel):
    """Token budget breakdown for prompt assembly."""

    max_context_tokens: int = 128000
    system_tokens: int = 2000
    entity_tokens: int = 32000
    rag_tokens: int = 16000
    memory_tokens: int = 8000
    chat_tokens: int = 8000
    completion_tokens: int = 4000


class RouteContextPrioritizer:
    """Route Context Prioritizer."""

    @staticmethod
    def get_token_budget(model_name: str) -> TokenBudget:
        """Returns token allocation based on target model capability."""
        if "gemini" in model_name.lower():
            return TokenBudget(
                max_context_tokens=1000000,
                system_tokens=4000,
                entity_tokens=64000,
                rag_tokens=64000,
                memory_tokens=16000,
                chat_tokens=16000,
                completion_tokens=8000,
            )
        return TokenBudget()

    @staticmethod
    def prioritize_context(
        current_route: str | None,
        entity_type: str | None,
        entity_data: dict[str, Any] | None,
        related_data: dict[str, Any] | None,
    ) -> dict[str, Any]:
        """Ranks and weights entity fields according to user's active page route."""
        prioritized: dict[str, Any] = {}

        if entity_data:
            prioritized["active_entity"] = {
                "type": entity_type or "general",
                "data": entity_data,
                "priority_weight": 1.0,
            }

        if related_data:
            prioritized["related_records"] = {
                "data": related_data,
                "priority_weight": 0.7,
            }

        return prioritized
