"""
ForgeCRM — Model Registry (Phase 7.5.2)

Central registry managing AI model configurations, provider capabilities, and default routing.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class RegisteredModel:
    """Model definition registered in ModelRegistry."""

    provider: str
    model_name: str
    version: str = "1.0.0"
    status: str = "active"  # active, deprecated, shadow, canary
    is_default: bool = False
    cost_per_1k_tokens: float = 0.00015
    context_window: int = 128000
    supports_streaming: bool = True
    supports_vision: bool = True


class ModelRegistry:
    """Registry managing available LLM providers, active models, and capabilities."""

    _models: dict[str, RegisteredModel] = {
        "gemini-2.5-flash": RegisteredModel(provider="gemini", model_name="gemini-2.5-flash", version="2.5.0", status="active", is_default=True, cost_per_1k_tokens=0.00015),
        "gemini-2.5-pro": RegisteredModel(provider="gemini", model_name="gemini-2.5-pro", version="2.5.0", status="active", is_default=False, cost_per_1k_tokens=0.00125),
        "gpt-4o": RegisteredModel(provider="openai", model_name="gpt-4o", version="4.0.0", status="active", is_default=False, cost_per_1k_tokens=0.00250),
        "gpt-4o-mini": RegisteredModel(provider="openai", model_name="gpt-4o-mini", version="4.0.0", status="active", is_default=False, cost_per_1k_tokens=0.00015),
        "llama3.3:70b": RegisteredModel(provider="ollama", model_name="llama3.3:70b", version="3.3.0", status="active", is_default=False, cost_per_1k_tokens=0.0),
    }

    @classmethod
    def get_model(cls, model_name: str) -> RegisteredModel:
        """Retrieves RegisteredModel by name. Returns default Gemini model if not found."""
        return cls._models.get(model_name, cls._models["gemini-2.5-flash"])

    @classmethod
    def get_default_model(cls) -> RegisteredModel:
        """Returns the default active LLM model."""
        return cls._models["gemini-2.5-flash"]

    @classmethod
    def list_models(cls, provider: str | None = None) -> list[RegisteredModel]:
        """Lists all registered models, optionally filtered by provider."""
        if not provider:
            return list(cls._models.values())
        return [m for m in cls._models.values() if m.provider == provider]

    @classmethod
    def register_model(cls, model: RegisteredModel) -> None:
        """Registers or updates a model definition."""
        cls._models[model.model_name] = model
