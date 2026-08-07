"""
ForgeCRM API — Autonomous AI Agent Runtime Engine

Coordinates Plan Generation, State Machine Transitions, DAG Step Execution,
Resumable Checkpoints, and Compensation Rollbacks.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ai.agents.checkpoint import CheckpointManager
from app.modules.ai.agents.executor import StepExecutor
from app.modules.ai.agents.models import AgentExecution, AgentPlanModel, AgentStepModel
from app.modules.ai.agents.planner import DAGPlanner
from app.modules.ai.agents.schemas import AgentExecutionStatus, AgentPlanSchema, PlanStepSchema
from app.modules.ai.agents.state_machine import AgentStateMachine, AgentState


class AgentRuntimeEngine:
    """Core Autonomous Agent Runtime Engine."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.executor = StepExecutor(db)
        self.checkpoint_manager = CheckpointManager(db)

    async def run_agent_goal(
        self,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
        user_permissions: list[str],
        goal: str,
    ) -> AgentExecutionStatus:
        """Executes an autonomous agent goal from planning through completion or rollback."""
        # 1. Create Execution record (Created)
        execution_id = uuid.uuid4()
        execution = AgentExecution(
            id=execution_id,
            workspace_id=workspace_id,
            user_id=user_id,
            goal=goal,
            state="Created",
        )
        self.db.add(execution)
        await self.db.flush()

        # 2. State: Planning
        AgentStateMachine.validate_transition("Created", "Planning")
        execution.state = "Planning"
        await self.db.flush()

        available_tools = ["search_deals", "create_lead", "update_company", "delete_company"]
        plan_schema = DAGPlanner.generate_plan(goal, available_tools)

        # Save Plan to DB
        plan_model = AgentPlanModel(
            id=uuid.uuid4(),
            execution_id=execution_id,
            goal=goal,
            dag_graph_json=plan_schema.model_dump(mode="json"),
            total_steps=plan_schema.total_steps,
        )
        self.db.add(plan_model)
        await self.db.flush()

        # 3. State: Running
        AgentStateMachine.validate_transition("Planning", "Running")
        execution.state = "Running"
        await self.db.flush()

        completed_steps: list[PlanStepSchema] = []
        previous_outputs: dict[str, Any] = {}

        for step in plan_schema.steps:
            # Check if approval required
            if step.approval_required:
                AgentStateMachine.validate_transition("Running", "Waiting Approval")
                execution.state = "Waiting Approval"
                await self.db.flush()

                return AgentExecutionStatus(
                    execution_id=execution_id,
                    workspace_id=workspace_id,
                    user_id=user_id,
                    goal=goal,
                    state="Waiting Approval",
                    completed_steps=len(completed_steps),
                    total_steps=plan_schema.total_steps,
                    current_step=step.id,
                    plan=plan_schema,
                    created_at=execution.created_at,
                )

            # Execute Step
            step_res = await self.executor.execute_step(
                workspace_id=workspace_id,
                user_id=user_id,
                user_permissions=user_permissions,
                step=step,
                previous_outputs=previous_outputs,
            )

            # Record Step in DB
            step_model = AgentStepModel(
                id=uuid.uuid4(),
                execution_id=execution_id,
                step_key=step_res.id,
                title=step_res.title,
                tool_name=step_res.tool,
                inputs_json=step_res.inputs,
                outputs_json=step_res.output,
                status=step_res.status,
                retry_count=step_res.retry_count,
                error_message=step_res.error,
            )
            self.db.add(step_model)

            # Save Checkpoint
            await self.checkpoint_manager.save_checkpoint(
                execution_id=execution_id,
                step_key=step_res.id,
                state_snapshot={"step_id": step_res.id, "status": step_res.status, "output": step_res.output},
            )

            if step_res.status == "completed":
                completed_steps.append(step_res)
                if step_res.output:
                    previous_outputs[f"{step_res.id}.output"] = step_res.output
            elif step_res.status == "approval_required":
                execution.state = "Waiting Approval"
                await self.db.flush()
                return AgentExecutionStatus(
                    execution_id=execution_id,
                    workspace_id=workspace_id,
                    user_id=user_id,
                    goal=goal,
                    state="Waiting Approval",
                    completed_steps=len(completed_steps),
                    total_steps=plan_schema.total_steps,
                    current_step=step_res.id,
                    plan=plan_schema,
                    created_at=execution.created_at,
                )
            else:
                # Step Failed -> Trigger Compensation Rollback
                AgentStateMachine.validate_transition("Running", "Rolled Back")
                execution.state = "Rolled Back"
                execution.error_message = step_res.error or "Step execution failed."

                await self.executor.rollback_completed_steps(
                    workspace_id=workspace_id,
                    user_id=user_id,
                    user_permissions=user_permissions,
                    completed_steps=completed_steps,
                )
                await self.db.flush()

                return AgentExecutionStatus(
                    execution_id=execution_id,
                    workspace_id=workspace_id,
                    user_id=user_id,
                    goal=goal,
                    state="Rolled Back",
                    completed_steps=len(completed_steps),
                    total_steps=plan_schema.total_steps,
                    current_step=step_res.id,
                    plan=plan_schema,
                    error=execution.error_message,
                    created_at=execution.created_at,
                )

        # 4. State: Completed
        AgentStateMachine.validate_transition("Running", "Completed")
        execution.state = "Completed"
        await self.db.flush()

        return AgentExecutionStatus(
            execution_id=execution_id,
            workspace_id=workspace_id,
            user_id=user_id,
            goal=goal,
            state="Completed",
            completed_steps=len(completed_steps),
            total_steps=plan_schema.total_steps,
            plan=plan_schema,
            created_at=execution.created_at,
        )
