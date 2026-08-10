"""
ForgeCRM — Model Version Manager (Phase 7.5.2)

Manages model versions, deprecation schedules, and version migration paths.
"""

from __future__ import annotations

from typing import Any
from app.modules.ai.lifecycle.registry import ModelRegistry, RegisteredModel


class ModelVersionManager:
    """Manages model version deprecations and upgrades."""

    _DEPRECATIONS: dict[str, str] = {
        "gemini-1.5-flash": "gemini-2.5-flash",
        "gpt-3.5-turbo": "gpt-4o-mini",
        "gpt-4-turbo": "gpt-4o",
    }

    @classmethod
    def resolve_active_model(cls, requested_model: str) -> str:
        """
        Resolves requested model name to its active non-deprecated equivalent.
        Automatically upgrades deprecated model names.
        """
        if requested_model in cls._DEPRECATIONS:
            return cls._DEPRECATIONS[requested_model]

        model = ModelRegistry.get_model(requested_model)
        if model.status == "deprecated":
            return ModelRegistry.get_default_model().model_name

        return requested_model

    @classmethod
    def deprecate_model(cls, old_model: str, replacement_model: str) -> None:
        """Registers a model deprecation and replacement mapping."""
        cls._DEPRECATIONS[old_model] = replacement_model
        model = ModelRegistry.get_model(old_model)
        model.status = "deprecated"
