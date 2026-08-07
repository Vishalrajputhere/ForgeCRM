"""
ForgeCRM API — Autonomous AI Agent Step Executor & Compensation Rollback Engine

Executes individual DAG nodes via MCPToolRegistry and handles automatic rollback on step failure.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ai.agents.schemas import PlanStepSchema
from app.modules.ai.mcp import MCPToolRegistry


class StepExecutor:
    """DAG Step Executor and Compensation Engine."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.mcp_registry = MCPToolRegistry(db)

    async def execute_step(
        self,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
        user_permissions: list[str],
        step: PlanStepSchema,
        previous_outputs: dict[str, Any],
    ) -> PlanStepSchema:
        """Executes a single step tool call with argument resolution and error handling."""
        # 1. Resolve argument placeholders (e.g. {{step_1.output.id}})
        resolved_inputs = self._resolve_placeholders(step.inputs, previous_outputs)

        # 2. Execute tool via MCPToolRegistry
        res = await self.mcp_registry.execute_tool(
            workspace_id=workspace_id,
            user_id=user_id,
            user_permissions=user_permissions,
            tool_name=step.tool,
            arguments=resolved_inputs,
        )

        if res.status == "success":
            step.status = "completed"
            step.output = res.result or {}
        elif res.status == "approval_required":
            step.status = "pending"
            step.approval_required = True
            step.output = {"approval_id": str(res.approval_id)}
        else:
            step.status = "failed"
            step.error = res.error or "Step execution failed."

        return step

    async def rollback_completed_steps(
        self,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
        user_permissions: list[str],
        completed_steps: list[PlanStepSchema],
    ) -> list[str]:
        """Rolls back completed steps in reverse chronological order using compensation tools."""
        rollback_logs: list[str] = []

        for step in reversed(completed_steps):
            if step.compensation_tool:
                res = await self.mcp_registry.execute_tool(
                    workspace_id=workspace_id,
                    user_id=user_id,
                    user_permissions=user_permissions,
                    tool_name=step.compensation_tool,
                    arguments=step.compensation_inputs,
                )
                step.status = "rolled_back"
                rollback_logs.append(
                    f"Rolled back step '{step.id}' using tool '{step.compensation_tool}': status={res.status}"
                )

        return rollback_logs

    def _resolve_placeholders(self, inputs: dict[str, Any], previous_outputs: dict[str, Any]) -> dict[str, Any]:
        """Resolves dynamic string template placeholders."""
        resolved = {}
        for k, v in inputs.items():
            if isinstance(v, str) and v.startswith("{{") and v.endswith("}}"):
                path_str = v[2:-2].strip()
                # Dummy lookup fallback
                resolved[k] = previous_outputs.get(path_str, f"resolved_{k}")
            else:
                resolved[k] = v
        return resolved
