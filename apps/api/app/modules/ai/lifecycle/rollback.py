"""
ForgeCRM — Rollback Manager (Phase 7.5.2)

Handles emergency model configuration and provider rollbacks.
"""

from __future__ import annotations

from typing import Any
from app.modules.ai.lifecycle.registry import ModelRegistry, RegisteredModel


class RollbackManager:
    """Manages model deployment rollbacks to last known healthy baseline."""

    _LAST_STABLE_MODEL: str = "gemini-2.5-flash"

    @classmethod
    def set_last_stable(cls, model_name: str) -> None:
        """Sets the last known stable model baseline."""
        cls._LAST_STABLE_MODEL = model_name

    @classmethod
    def trigger_emergency_rollback(cls, failed_model: str) -> str:
        """
        Triggers emergency rollback for a failing model, pointing traffic to last stable baseline.
        """
        model = ModelRegistry.get_model(failed_model)
        model.status = "deprecated"
        return cls._LAST_STABLE_MODEL
