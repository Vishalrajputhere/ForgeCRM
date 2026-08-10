"""
ForgeCRM API — Phase 7.5.3 AI Governance & Policy Unit Tests

Tests for:
  - RoleBasedPromptAccess RBAC enforcement
  - PolicyEnforcer workspace budget cap enforcement

Documentation: docs/07_Testing/703_INTEGRATION_TESTING.md
"""

from __future__ import annotations

import pytest

from app.modules.ai.governance.policies import RoleBasedPromptAccess, PolicyEnforcer


def test_role_based_prompt_access() -> None:
    """Verifies RBAC rules for AI skill access."""
    assert RoleBasedPromptAccess.can_access_skill("admin", "executive_copilot") is True
    assert RoleBasedPromptAccess.can_access_skill("executive", "executive_copilot") is True
    assert RoleBasedPromptAccess.can_access_skill("member", "executive_copilot") is False
    assert RoleBasedPromptAccess.can_access_skill("member", "sales_copilot") is True


def test_policy_enforcer_budget_and_rbac() -> None:
    """Verifies PolicyEnforcer blocks unauthorized roles and budget overflow."""
    res_ok = PolicyEnforcer.enforce_policy("executive", "executive_copilot", current_daily_spend_usd=10.0, max_daily_budget_usd=100.0)
    assert res_ok.is_permitted is True

    res_rbac_denied = PolicyEnforcer.enforce_policy("member", "executive_copilot", current_daily_spend_usd=10.0, max_daily_budget_usd=100.0)
    assert res_rbac_denied.is_permitted is False
    assert "not authorized" in res_rbac_denied.reason

    res_budget_denied = PolicyEnforcer.enforce_policy("executive", "executive_copilot", current_daily_spend_usd=105.0, max_daily_budget_usd=100.0)
    assert res_budget_denied.is_permitted is False
    assert "budget cap" in res_budget_denied.reason
