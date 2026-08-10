"""
ForgeCRM API — Phase 7.5.2 AI Model Registry & Provider Management Unit Tests

Tests for:
  - ModelRegistry registration and retrieval
  - ModelVersionManager deprecation handling and active model resolution
  - ProviderFailoverManager failure detection and fallback chain
  - ABTestingEngine traffic splitting and model selection
  - CanaryDeploymentManager rollout weighting
  - RollbackManager emergency rollback trigger

Documentation: docs/07_Testing/703_INTEGRATION_TESTING.md
"""

from __future__ import annotations

import pytest

from app.modules.ai.lifecycle.registry import ModelRegistry, RegisteredModel
from app.modules.ai.lifecycle.versions import ModelVersionManager
from app.modules.ai.lifecycle.failover import ProviderFailoverManager
from app.modules.ai.lifecycle.ab_testing import ABTestingEngine, CanaryDeploymentManager
from app.modules.ai.lifecycle.rollback import RollbackManager


def test_model_registry_get_and_list() -> None:
    """Verifies ModelRegistry returns registered models and defaults."""
    default_model = ModelRegistry.get_default_model()
    assert default_model.model_name == "gemini-2.5-flash"
    assert default_model.provider == "gemini"

    models = ModelRegistry.list_models()
    assert len(models) >= 5

    openai_models = ModelRegistry.list_models("openai")
    assert len(openai_models) >= 2
    assert all(m.provider == "openai" for m in openai_models)


def test_model_version_manager_deprecation() -> None:
    """Verifies ModelVersionManager resolves deprecated models to active replacements."""
    active = ModelVersionManager.resolve_active_model("gemini-1.5-flash")
    assert active == "gemini-2.5-flash"

    gpt_active = ModelVersionManager.resolve_active_model("gpt-3.5-turbo")
    assert gpt_active == "gpt-4o-mini"


def test_provider_failover_manager() -> None:
    """Verifies ProviderFailoverManager switches to backup provider on failure."""
    assert ProviderFailoverManager.get_healthy_provider("gemini") == "gemini"

    # Simulate 5 failures for gemini
    for _ in range(5):
        ProviderFailoverManager.record_failure("gemini")

    fallback = ProviderFailoverManager.get_healthy_provider("gemini")
    assert fallback == "openai"

    # Restore gemini
    ProviderFailoverManager.record_success("gemini")
    assert ProviderFailoverManager.get_healthy_provider("gemini") == "gemini"


def test_ab_testing_engine() -> None:
    """Verifies ABTestingEngine registers experiments and selects models."""
    exp = ABTestingEngine.create_experiment("exp_01", "gemini-2.5-flash", "gpt-4o", traffic_split=0.50)
    assert exp.experiment_id == "exp_01"

    # Seed-based routing test
    m1 = ABTestingEngine.select_model("exp_01", seed="user_123")
    assert m1 in ("gemini-2.5-flash", "gpt-4o")


def test_canary_deployment_manager() -> None:
    """Verifies CanaryDeploymentManager routes based on weight."""
    CanaryDeploymentManager.set_canary_weight("gpt-4o", 0.0)
    assert CanaryDeploymentManager.should_route_to_canary("gpt-4o") is False

    CanaryDeploymentManager.set_canary_weight("gpt-4o", 1.0)
    assert CanaryDeploymentManager.should_route_to_canary("gpt-4o") is True


def test_rollback_manager() -> None:
    """Verifies RollbackManager triggers emergency rollback."""
    RollbackManager.set_last_stable("gemini-2.5-flash")
    target = RollbackManager.trigger_emergency_rollback("experimental-model")
    assert target == "gemini-2.5-flash"
