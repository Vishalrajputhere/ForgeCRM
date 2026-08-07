"""
ForgeCRM API — Automation Engine Unit Tests

Tests condition evaluation and automation logic.
"""

import pytest

from app.modules.automation.engine import _evaluate_condition, evaluate_conditions
from app.modules.automation.models import AutomationCondition, AutomationRule


def test_condition_evaluation_equals():
    cond = AutomationCondition(
        field_path="status",
        operator="EQUALS",
        value="Active",
        value_type="string",
    )
    assert _evaluate_condition(cond, {"status": "Active"}) is True
    assert _evaluate_condition(cond, {"status": "Inactive"}) is False


def test_condition_evaluation_greater_than():
    cond = AutomationCondition(
        field_path="value",
        operator="GREATER_THAN",
        value="1000",
        value_type="number",
    )
    assert _evaluate_condition(cond, {"value": 5000}) is True
    assert _evaluate_condition(cond, {"value": 500}) is False


def test_evaluate_conditions_and_logic():
    c1 = AutomationCondition(group_index=0, field_path="priority", operator="EQUALS", value="High", value_type="string")
    c2 = AutomationCondition(group_index=0, field_path="status", operator="EQUALS", value="Open", value_type="string")

    rule = AutomationRule(condition_logic="AND", conditions=[c1, c2])

    assert evaluate_conditions(rule, {"priority": "High", "status": "Open"}) is True
    assert evaluate_conditions(rule, {"priority": "High", "status": "Closed"}) is False


def test_evaluate_conditions_empty_rule():
    rule = AutomationRule(condition_logic="AND", conditions=[])
    assert evaluate_conditions(rule, {"any": "data"}) is True
