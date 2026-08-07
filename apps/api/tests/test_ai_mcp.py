"""
ForgeCRM API — Sub-Phase 7.2.4 MCP Tool Registry & Action Approvals Integration Tests

Tests for MCPToolRegistry (Tool discovery, RBAC permission verification,
Tier 3 Human Action Approvals, and pending action resolution).

Documentation: docs/07_Testing/703_INTEGRATION_TESTING.md
"""

from __future__ import annotations

import uuid
import pytest
from app.modules.ai.mcp import MCPToolRegistry


@pytest.mark.asyncio
async def test_mcp_tool_discovery_and_permissions(db_session) -> None:
    """Verifies available tool listing decorated with user permission flags."""
    registry = MCPToolRegistry(db_session)
    user_perms = ["leads.write", "deals.view"]

    tools = registry.list_available_tools(user_permissions=user_perms)
    assert len(tools) >= 4

    create_lead_tool = next(t for t in tools if t["tool"]["name"] == "create_lead")
    assert create_lead_tool["has_permission"] is True

    delete_company_tool = next(t for t in tools if t["tool"]["name"] == "delete_company")
    assert delete_company_tool["has_permission"] is False


@pytest.mark.asyncio
async def test_mcp_tool_execution_success(db_session) -> None:
    """Verifies execution of non-destructive CRM tool with RBAC check."""
    ws_id = uuid.uuid4()
    user_id = uuid.uuid4()
    registry = MCPToolRegistry(db_session)

    res = await registry.execute_tool(
        workspace_id=ws_id,
        user_id=user_id,
        user_permissions=["leads.write"],
        tool_name="create_lead",
        arguments={"name": "Sarah Connor", "email": "sarah@cyberdyne.com"},
    )

    assert res.status == "success"
    assert res.result["name"] == "Sarah Connor"
    assert res.result["status"] == "created"


@pytest.mark.asyncio
async def test_mcp_tool_permission_denied(db_session) -> None:
    """Verifies tool execution fails when user lacks required permission."""
    ws_id = uuid.uuid4()
    user_id = uuid.uuid4()
    registry = MCPToolRegistry(db_session)

    res = await registry.execute_tool(
        workspace_id=ws_id,
        user_id=user_id,
        user_permissions=[],  # Empty permissions
        tool_name="create_lead",
        arguments={"name": "John Doe", "email": "john@example.com"},
    )

    assert res.status == "failed"
    assert "Permission Denied" in res.error


@pytest.mark.asyncio
async def test_mcp_destructive_tool_approval_workflow(db_session) -> None:
    """Verifies Tier 3 destructive tool triggers Human Action Approval request."""
    ws_id = uuid.uuid4()
    user_id = uuid.uuid4()
    comp_id = str(uuid.uuid4())
    registry = MCPToolRegistry(db_session)

    # 1. Execute destructive tool 'delete_company'
    res = await registry.execute_tool(
        workspace_id=ws_id,
        user_id=user_id,
        user_permissions=["companies.delete"],
        tool_name="delete_company",
        arguments={"company_id": comp_id, "reason": "Duplicate record"},
    )

    assert res.status == "approval_required"
    assert res.approval_id is not None

    # 2. Resolve pending action (Approve)
    resolved = await registry.resolve_pending_action(
        workspace_id=ws_id,
        user_id=user_id,
        action_id=res.approval_id,
        approved=True,
    )

    assert resolved["status"] == "approved"
    assert resolved["execution_result"]["deleted_id"] == comp_id
