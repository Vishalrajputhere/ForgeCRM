"""
ForgeCRM — Enterprise AI Model Lifecycle & Provider Management Module (Phase 7.5.2)
"""

from app.modules.ai.lifecycle.registry import ModelRegistry
from app.modules.ai.lifecycle.versions import ModelVersionManager
from app.modules.ai.lifecycle.failover import ProviderFailoverManager
from app.modules.ai.lifecycle.ab_testing import ABTestingEngine, CanaryDeploymentManager
from app.modules.ai.lifecycle.rollback import RollbackManager

__all__ = [
    "ModelRegistry",
    "ModelVersionManager",
    "ProviderFailoverManager",
    "ABTestingEngine",
    "CanaryDeploymentManager",
    "RollbackManager",
]
