"""
ForgeCRM API — Autonomous AI Agent State Machine

Manages valid lifecycle transitions across Created, Planning, Waiting Approval,
Running, Paused, Retrying, Completed, Failed, Cancelled, and Rolled Back.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

from typing import Literal

AgentState = Literal[
    "Created",
    "Planning",
    "Waiting Approval",
    "Running",
    "Paused",
    "Retrying",
    "Completed",
    "Failed",
    "Cancelled",
    "Rolled Back",
]

# Valid state transitions graph
VALID_TRANSITIONS: dict[AgentState, set[AgentState]] = {
    "Created": {"Planning", "Cancelled"},
    "Planning": {"Waiting Approval", "Running", "Failed", "Cancelled"},
    "Waiting Approval": {"Running", "Cancelled", "Failed"},
    "Running": {"Paused", "Retrying", "Completed", "Failed", "Rolled Back", "Cancelled"},
    "Paused": {"Running", "Cancelled"},
    "Retrying": {"Running", "Failed", "Rolled Back"},
    "Completed": set(),
    "Failed": {"Rolled Back", "Cancelled"},
    "Cancelled": set(),
    "Rolled Back": set(),
}


class AgentStateMachine:
    """Agent State Machine Validator."""

    @staticmethod
    def can_transition(current_state: AgentState, target_state: AgentState) -> bool:
        """Returns True if transition from current_state to target_state is permitted."""
        allowed = VALID_TRANSITIONS.get(current_state, set())
        return target_state in allowed

    @staticmethod
    def validate_transition(current_state: AgentState, target_state: AgentState) -> None:
        """Raises ValueError if transition is invalid."""
        if not AgentStateMachine.can_transition(current_state, target_state):
            raise ValueError(
                f"Invalid Agent State Transition: Cannot move from '{current_state}' to '{target_state}'."
            )
