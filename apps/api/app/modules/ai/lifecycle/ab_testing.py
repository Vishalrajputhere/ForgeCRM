"""
ForgeCRM — A/B Testing & Canary Deployment Engine (Phase 7.5.2)

Manages A/B traffic splitting, shadow model testing, and canary deployments.
"""

from __future__ import annotations

import random
from dataclasses import dataclass
from typing import Any


@dataclass
class ABExperiment:
    experiment_id: str
    control_model: str
    candidate_model: str
    traffic_split: float = 0.50  # 50% candidate, 50% control
    is_active: bool = True


class ABTestingEngine:
    """Manages model A/B testing experiments and traffic routing."""

    _EXPERIMENTS: dict[str, ABExperiment] = {}

    @classmethod
    def create_experiment(
        cls, experiment_id: str, control_model: str, candidate_model: str, traffic_split: float = 0.50
    ) -> ABExperiment:
        """Registers a new A/B testing experiment."""
        exp = ABExperiment(
            experiment_id=experiment_id,
            control_model=control_model,
            candidate_model=candidate_model,
            traffic_split=traffic_split,
        )
        cls._EXPERIMENTS[experiment_id] = exp
        return exp

    @classmethod
    def select_model(cls, experiment_id: str, seed: str | None = None) -> str:
        """Determines model to route request to based on experiment traffic split."""
        exp = cls._EXPERIMENTS.get(experiment_id)
        if not exp or not exp.is_active:
            return exp.control_model if exp else "gemini-2.5-flash"

        if seed:
            roll = (hash(seed) % 100) / 100.0
        else:
            roll = random.random()

        if roll < exp.traffic_split:
            return exp.candidate_model
        return exp.control_model


class CanaryDeploymentManager:
    """Manages canary rollout percentages for new model deployments."""

    _CANARY_WEIGHTS: dict[str, float] = {}

    @classmethod
    def set_canary_weight(cls, model_name: str, weight: float) -> None:
        """Sets canary weight (0.0 to 1.0) for a model."""
        cls._CANARY_WEIGHTS[model_name] = max(0.0, min(1.0, weight))

    @classmethod
    def should_route_to_canary(cls, model_name: str, request_id: str | None = None) -> bool:
        """Determines if a request should be routed to canary model deployment."""
        weight = cls._CANARY_WEIGHTS.get(model_name, 0.0)
        if weight <= 0.0:
            return False
        if weight >= 1.0:
            return True

        if request_id:
            roll = (hash(request_id) % 100) / 100.0
        else:
            roll = random.random()

        return roll < weight
