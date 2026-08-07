"""
ForgeCRM API — Autonomous AI Agent DAG Planner

Decomposes user goals into a Directed Acyclic Graph (DAG) of PlanStep nodes.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

import uuid
from typing import Any

from app.modules.ai.agents.schemas import AgentPlanSchema, PlanStepSchema


class DAGPlanner:
    """DAG Plan Generator Engine."""

    @staticmethod
    def generate_plan(goal: str, available_tools: list[str]) -> AgentPlanSchema:
        """Decomposes a user goal string into a sequence of DAG PlanSteps."""
        goal_lower = goal.lower()
        steps: list[PlanStepSchema] = []

        if "convert" in goal_lower or "lead" in goal_lower:
            steps = [
                PlanStepSchema(
                    id="step_1",
                    title="Search Lead Details",
                    description="Retrieves existing lead record metadata",
                    tool="search_deals" if "search_deals" in available_tools else "create_lead",
                    inputs={"query": goal},
                    depends_on=[],
                ),
                PlanStepSchema(
                    id="step_2",
                    title="Create Target Company",
                    description="Creates target company record",
                    tool="update_company" if "update_company" in available_tools else "create_lead",
                    inputs={"company_id": str(uuid.uuid4()), "name": "Converted Acme Corp"},
                    compensation_tool="delete_company",
                    compensation_inputs={"company_id": "{{step_2.inputs.company_id}}"},
                    depends_on=["step_1"],
                ),
                PlanStepSchema(
                    id="step_3",
                    title="Archive Converted Lead",
                    description="Archives lead after successful company creation",
                    tool="create_lead",
                    inputs={"name": "Converted Lead", "email": "lead@converted.com"},
                    depends_on=["step_2"],
                ),
            ]
        else:
            steps = [
                PlanStepSchema(
                    id="step_1",
                    title="Execute CRM Query",
                    description="Executes initial goal query",
                    tool="search_deals" if "search_deals" in available_tools else "create_lead",
                    inputs={"query": goal},
                    depends_on=[],
                ),
                PlanStepSchema(
                    id="step_2",
                    title="Record Workflow Outcome",
                    description="Records workflow step outcome",
                    tool="create_lead",
                    inputs={"name": "Workflow Result", "email": "workflow@crm.com"},
                    depends_on=["step_1"],
                ),
            ]

        # Topological Sort Validation (Cycle Detection)
        DAGPlanner.validate_dag(steps)

        return AgentPlanSchema(
            plan_id=uuid.uuid4(),
            goal=goal,
            steps=steps,
            total_steps=len(steps),
        )

    @staticmethod
    def validate_dag(steps: list[PlanStepSchema]) -> None:
        """Verifies no cyclic dependencies exist using Kahn's algorithm."""
        in_degree = {s.id: 0 for s in steps}
        graph = {s.id: [] for s in steps}

        for s in steps:
            for dep in s.depends_on:
                if dep in graph:
                    graph[dep].append(s.id)
                    in_degree[s.id] += 1

        queue = [node for node, count in in_degree.items() if count == 0]
        visited = 0

        while queue:
            node = queue.pop(0)
            visited += 1
            for neighbor in graph[node]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        if visited != len(steps):
            raise ValueError("Invalid Agent Plan: Cyclic dependency detected in DAG steps.")
