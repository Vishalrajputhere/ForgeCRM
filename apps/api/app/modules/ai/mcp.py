"""
ForgeCRM API — Model Context Protocol (MCP) Tool Registry Engine

Defines provider-agnostic CRM tool definitions, RBAC permission verification,
Tier 3 Human Action Approvals, and tool execution orchestration.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Callable

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ai.models import AIPendingAction, AIToolExecutionLog
from app.modules.ai.schemas import AIToolDefinition


class MCPToolResult(BaseModel):
    """MCP Tool Execution Result."""

    tool_name: str
    status: str  # success, failed, approval_required
    result: dict[str, Any] | None = None
    approval_id: uuid.UUID | None = None
    error: str | None = None
    duration_ms: int = 0


class MCPToolRegistry:
    """MCP Tool Registry and Execution Guard."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self._tools: dict[str, dict[str, Any]] = self._register_default_crm_tools()

    def _register_default_crm_tools(self) -> dict[str, dict[str, Any]]:
        """Registers default CRM tool signatures with required permissions and risk tiers."""
        return {
            "create_lead": {
                "definition": AIToolDefinition(
                    name="create_lead",
                    description="Creates a new sales lead in the CRM",
                    parameters={
                        "type": "object",
                        "properties": {
                            "name": {"type": "string", "description": "Lead full name"},
                            "email": {"type": "string", "description": "Lead email address"},
                            "company_name": {"type": "string", "description": "Company name"},
                        },
                        "required": ["name", "email"],
                    },
                ),
                "required_permission": "leads.write",
                "risk_tier": 1,  # Normal auto-execution
            },
            "update_company": {
                "definition": AIToolDefinition(
                    name="update_company",
                    description="Updates company details in the CRM",
                    parameters={
                        "type": "object",
                        "properties": {
                            "company_id": {"type": "string", "description": "UUID of company"},
                            "name": {"type": "string", "description": "Updated company name"},
                            "annual_revenue": {"type": "number", "description": "Annual ARR revenue"},
                        },
                        "required": ["company_id"],
                    },
                ),
                "required_permission": "companies.write",
                "risk_tier": 1,
            },
            "delete_company": {
                "definition": AIToolDefinition(
                    name="delete_company",
                    description="Permanently deletes a company record (Requires Human Approval)",
                    parameters={
                        "type": "object",
                        "properties": {
                            "company_id": {"type": "string", "description": "UUID of company to delete"},
                            "reason": {"type": "string", "description": "Deletion justification"},
                        },
                        "required": ["company_id"],
                    },
                ),
                "required_permission": "companies.delete",
                "risk_tier": 3,  # Destructive -> Requires Human Approval
            },
            "search_deals": {
                "definition": AIToolDefinition(
                    name="search_deals",
                    description="Searches active sales pipeline deals by query",
                    parameters={
                        "type": "object",
                        "properties": {
                            "query": {"type": "string", "description": "Search query"},
                            "stage": {"type": "string", "description": "Pipeline stage"},
                        },
                        "required": ["query"],
                    },
                ),
                "required_permission": "deals.view",
                "risk_tier": 1,
            },
        }

    def list_available_tools(self, user_permissions: list[str]) -> list[dict[str, Any]]:
        """Lists available tool definitions decorated with user permission flags."""
        result = []
        for name, info in self._tools.items():
            req_perm = info["required_permission"]
            has_perm = req_perm in user_permissions or "admin" in user_permissions
            result.append(
                {
                    "tool": info["definition"].model_dump(mode="json"),
                    "required_permission": req_perm,
                    "has_permission": has_perm,
                    "risk_tier": info["risk_tier"],
                }
            )
        return result

    async def execute_tool(
        self,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
        user_permissions: list[str],
        tool_name: str,
        arguments: dict[str, Any],
    ) -> MCPToolResult:
        """Executes tool function call with RBAC and Human Action Approval guardrails."""
        if tool_name not in self._tools:
            return MCPToolResult(tool_name=tool_name, status="failed", error=f"Unknown tool '{tool_name}'")

        tool_info = self._tools[tool_name]
        req_perm = tool_info["required_permission"]

        # 1. RBAC Guardrail Check
        if req_perm not in user_permissions and "admin" not in user_permissions:
            return MCPToolResult(
                tool_name=tool_name,
                status="failed",
                error=f"Permission Denied: User lacks required permission '{req_perm}' for tool '{tool_name}'",
            )

        # 2. Tier 3 Human Action Approval Guardrail Check
        if tool_info["risk_tier"] == 3:
            pending_action = AIPendingAction(
                id=uuid.uuid4(),
                workspace_id=workspace_id,
                user_id=user_id,
                tool_name=tool_name,
                arguments_json=arguments,
                description=f"AI requested destructive action '{tool_name}' with args {arguments}",
                status="pending",
            )
            self.db.add(pending_action)
            await self.db.flush()

            # Audit log
            log_entry = AIToolExecutionLog(
                workspace_id=workspace_id,
                user_id=user_id,
                tool_name=tool_name,
                arguments_json=arguments,
                status="approval_required",
                duration_ms=12,
            )
            self.db.add(log_entry)
            await self.db.flush()

            return MCPToolResult(
                tool_name=tool_name,
                status="approval_required",
                approval_id=pending_action.id,
                result={"message": "Human approval required for destructive operation."},
                duration_ms=12,
            )

        # 3. Execute Non-destructive Tool
        mock_output = {
            "create_lead": {"lead_id": str(uuid.uuid4()), "status": "created", "name": arguments.get("name")},
            "update_company": {"company_id": arguments.get("company_id"), "status": "updated"},
            "search_deals": {"count": 2, "deals": [{"name": "Acme Enterprise Deal", "amount": 450000}]},
        }.get(tool_name, {"status": "executed"})

        # Audit log
        log_entry = AIToolExecutionLog(
            workspace_id=workspace_id,
            user_id=user_id,
            tool_name=tool_name,
            arguments_json=arguments,
            result_json=mock_output,
            status="success",
            duration_ms=24,
        )
        self.db.add(log_entry)
        await self.db.flush()

        return MCPToolResult(
            tool_name=tool_name,
            status="success",
            result=mock_output,
            duration_ms=24,
        )

    async def resolve_pending_action(
        self,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
        action_id: uuid.UUID,
        approved: bool,
    ) -> dict[str, Any]:
        """Approves or rejects pending human action request."""
        stmt = select(AIPendingAction).where(
            (AIPendingAction.id == action_id) & (AIPendingAction.workspace_id == workspace_id)
        )
        res = await self.db.execute(stmt)
        action = res.scalar_one_or_none()

        if not action:
            raise ValueError(f"Pending action '{action_id}' not found.")

        action.status = "approved" if approved else "rejected"
        action.resolved_by = user_id
        action.resolved_at = datetime.utcnow()
        await self.db.flush()

        execution_result = None
        if approved:
            execution_result = {"status": "deleted", "deleted_id": action.arguments_json.get("company_id")}

        return {
            "action_id": str(action.id),
            "status": action.status,
            "resolved_by": str(user_id),
            "execution_result": execution_result,
        }
