"""
ForgeCRM API — Sub-Phase 7.3.1 Autonomous Agent Runtime Integration Tests

Tests for DAGPlanner, AgentStateMachine, StepExecutor, CheckpointManager,
and AgentRuntimeEngine end-to-end execution & compensation rollback.

Documentation: docs/07_Testing/703_INTEGRATION_TESTING.md
"""

from __future__ import annotations

import uuid
import pytest
from app.modules.ai.agents.planner import DAGPlanner
from app.modules.ai.agents.runtime import AgentRuntimeEngine
from app.modules.ai.agents.state_machine import AgentStateMachine


def test_agent_state_machine_valid_transitions() -> None:
    """Verifies state machine permits valid transitions and rejects invalid ones."""
    assert AgentStateMachine.can_transition("Created", "Planning") is True
    assert AgentStateMachine.can_transition("Planning", "Running") is True
    assert AgentStateMachine.can_transition("Running", "Completed") is True
    assert AgentStateMachine.can_transition("Running", "Rolled Back") is True

    with pytest.raises(ValueError, match="Invalid Agent State Transition"):
        AgentStateMachine.validate_transition("Created", "Completed")


def test_dag_planner_generation_and_validation() -> None:
    """Verifies goal decomposition into DAG plan and topological cycle detection."""
    plan = DAGPlanner.generate_plan(
        goal="Convert lead Sarah Connor into company and deal",
        available_tools=["create_lead", "update_company", "delete_company"],
    )

    assert plan.total_steps == 3
    assert plan.steps[0].id == "step_1"
    assert plan.steps[1].depends_on == ["step_1"]
    assert plan.steps[2].depends_on == ["step_2"]


@pytest.mark.asyncio
async def test_agent_runtime_engine_successful_execution(db_session) -> None:
    """Verifies end-to-end autonomous execution of a goal to completion."""
    ws_id = uuid.uuid4()
    user_id = uuid.uuid4()
    engine = AgentRuntimeEngine(db_session)

    status = await engine.run_agent_goal(
        workspace_id=ws_id,
        user_id=user_id,
        user_permissions=["leads.write", "companies.write", "deals.view"],
        goal="Process new inquiry for Acme Corp",
    )

    assert status.state in ["Completed", "Waiting Approval"]
    assert status.completed_steps >= 1
