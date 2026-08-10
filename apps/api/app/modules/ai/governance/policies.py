"""
ForgeCRM — Policy Enforcer & Role-Based Prompt Access (Phase 7.5.3)

Enforces AI safety policies, daily budget caps, and role-based skill permissions (RBAC).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class PolicyEvaluationResult:
    is_permitted: bool
    policy_name: str
    reason: str


class RoleBasedPromptAccess:
    """RBAC matrix enforcing role permissions for AI skills."""

    _ROLE_PERMISSIONS: dict[str, set[str]] = {
        "admin": {"*"},  # Admin has access to all skills
        "executive": {"executive_copilot", "sales_copilot", "deal_coach", "forecast_ai", "email_copilot"},
        "manager": {"sales_copilot", "deal_coach", "lead_qualification", "forecast_ai", "email_copilot"},
        "member": {"sales_copilot", "deal_coach", "lead_qualification", "email_copilot"},
        "guest": {"sales_copilot"},
    }

    @classmethod
    def can_access_skill(cls, user_role: str, skill_type: str) -> bool:
        """Verifies if user_role has permission to execute skill_type."""
        role_skills = cls._ROLE_PERMISSIONS.get(user_role.lower(), cls._ROLE_PERMISSIONS["member"])
        if "*" in role_skills or skill_type in role_skills:
            return True
        return False


class PolicyEnforcer:
    """Enforces workspace-level AI safety policies and budget caps."""

    @classmethod
    def enforce_policy(
        cls,
        user_role: str,
        skill_type: str,
        current_daily_spend_usd: float = 12.50,
        max_daily_budget_usd: float = 100.0,
    ) -> PolicyEvaluationResult:
        """Evaluates policy permissions and daily budget caps."""
        if not RoleBasedPromptAccess.can_access_skill(user_role, skill_type):
            return PolicyEvaluationResult(
                is_permitted=False,
                policy_name="RBAC_Skill_Access",
                reason=f"Role '{user_role}' is not authorized to execute skill '{skill_type}'",
            )

        if current_daily_spend_usd >= max_daily_budget_usd:
            return PolicyEvaluationResult(
                is_permitted=False,
                policy_name="Workspace_Daily_Budget_Cap",
                reason=f"Workspace daily AI budget cap (${max_daily_budget_usd}) exceeded.",
            )

        return PolicyEvaluationResult(
            is_permitted=True,
            policy_name="Default_Enterprise_Policy",
            reason="Access granted.",
        )
