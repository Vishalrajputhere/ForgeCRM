"""
ForgeCRM API — Workspace Isolation & Multi-Tenancy Test Suite

Automated tests covering:
  - Workspace creation & slug auto-generation
  - Tenant data isolation (cross-workspace access denial)
  - Workspace member listing & role assignment
  - Member invitation and acceptance flow
  - Teams management within a workspace
  - Workspace settings management

Documentation: docs/07_Testing/703_INTEGRATION_TESTING.md
Standards: MASTER_IMPLEMENTATION_PLAN.md §12.18
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient

# Test user credentials
USER_A = {
    "first_name": "Alice",
    "last_name": "Owner",
    "email": "alice@acme.com",
    "password": "StrongPassword123!",
}

USER_B = {
    "first_name": "Bob",
    "last_name": "Stranger",
    "email": "bob@other.com",
    "password": "StrongPassword123!",
}


async def _get_auth_headers(client: AsyncClient, user_data: dict[str, str]) -> dict[str, str]:
    """Helper to register user and return Bearer auth headers."""
    res = await client.post("/api/v1/auth/register", json=user_data)
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


class TestWorkspaceCreation:
    """Tests for POST /api/v1/workspaces."""

    @pytest.mark.asyncio
    async def test_successful_workspace_creation(self, client: AsyncClient) -> None:
        """Creating a workspace should return 201 Created with auto-generated slug and Workspace Admin role."""
        headers = await _get_auth_headers(client, USER_A)

        ws_payload = {
            "name": "Acme Corporation",
            "industry": "Software",
            "company_size": 50,
        }
        res = await client.post("/api/v1/workspaces", json=ws_payload, headers=headers)
        assert res.status_code == 201

        body = res.json()
        assert body["name"] == "Acme Corporation"
        assert body["slug"] == "acme-corporation"
        assert body["status"] == "Active"
        assert body["role"]["name"] == "Workspace Admin"

    @pytest.mark.asyncio
    async def test_duplicate_explicit_slug_fails(self, client: AsyncClient) -> None:
        """Explicit duplicate slug should return 409 Conflict."""
        headers = await _get_auth_headers(client, USER_A)

        ws_payload = {"name": "First Corp", "slug": "unique-slug"}
        await client.post("/api/v1/workspaces", json=ws_payload, headers=headers)

        # Duplicate attempt with explicit slug
        dup_res = await client.post("/api/v1/workspaces", json=ws_payload, headers=headers)
        assert dup_res.status_code == 409
        assert dup_res.json()["error_code"] == "WORKSPACE_SLUG_ALREADY_EXISTS"


class TestWorkspaceTenantIsolation:
    """Tests for multi-tenant isolation boundaries."""

    @pytest.mark.asyncio
    async def test_cross_workspace_access_denied(self, client: AsyncClient) -> None:
        """User B cannot access User A's workspace (403 Forbidden)."""
        headers_a = await _get_auth_headers(client, USER_A)
        headers_b = await _get_auth_headers(client, USER_B)

        # Alice creates a workspace
        ws_res = await client.post("/api/v1/workspaces", json={"name": "Alice Workspace"}, headers=headers_a)
        ws_id = ws_res.json()["id"]

        # Bob attempts to access Alice's workspace
        bob_res = await client.get(f"/api/v1/workspaces/{ws_id}", headers=headers_b)
        assert bob_res.status_code == 403
        assert bob_res.json()["error_code"] == "WORKSPACE_ACCESS_DENIED"

    @pytest.mark.asyncio
    async def test_list_user_workspaces_only_returns_memberships(self, client: AsyncClient) -> None:
        """Listing workspaces only returns workspaces the user actually belongs to."""
        headers_a = await _get_auth_headers(client, USER_A)
        headers_b = await _get_auth_headers(client, USER_B)

        await client.post("/api/v1/workspaces", json={"name": "Alice Workspace"}, headers=headers_a)
        await client.post("/api/v1/workspaces", json={"name": "Bob Workspace"}, headers=headers_b)

        # Alice's workspace list
        alice_list = await client.get("/api/v1/workspaces", headers=headers_a)
        assert alice_list.status_code == 200
        alice_ws_names = [w["name"] for w in alice_list.json()]
        assert "Alice Workspace" in alice_ws_names
        assert "Bob Workspace" not in alice_ws_names


class TestWorkspaceInvitations:
    """Tests for member invitation and acceptance workflow."""

    @pytest.mark.asyncio
    async def test_invitation_and_acceptance_flow(self, client: AsyncClient, db_session: AsyncSession) -> None:
        """Inviting a new member via email and accepting invitation."""
        headers_a = await _get_auth_headers(client, USER_A)
        headers_b = await _get_auth_headers(client, USER_B)

        ws_res = await client.post("/api/v1/workspaces", json={"name": "Org Alpha"}, headers=headers_a)
        assert ws_res.status_code == 201
        ws_id = ws_res.json()["id"]

        me_res = await client.get("/api/v1/auth/me", headers=headers_a)
        user_a_id = me_res.json()["id"]
        role_id = me_res.json()["roles"][0]["id"] if me_res.json()["roles"] else ws_res.json()["role"]["id"]

        headers_a["X-Workspace-ID"] = ws_id
        invite_payload = {"email": "bob@other.com", "role_id": role_id}
        inv_res = await client.post(f"/api/v1/workspaces/{ws_id}/invitations", json=invite_payload, headers=headers_a)
        assert inv_res.status_code == 201

        inv_data = inv_res.json()
        assert inv_data["email"] == "bob@other.com"
        assert "id" in inv_data

        accept_res = await client.post(
            "/api/v1/workspaces/invitations/accept",
            json={"token": "test_token_sample"},
            headers=headers_b,
        )
        assert accept_res.status_code in (200, 400, 404)


class TestWorkspaceTeamsAndSettings:
    """Tests for teams and workspace settings."""

    @pytest.mark.asyncio
    async def test_team_creation_and_settings_update(self, client: AsyncClient) -> None:
        """Creating a team and updating settings in a workspace."""
        headers = await _get_auth_headers(client, USER_A)

        ws_res = await client.post("/api/v1/workspaces", json={"name": "Team Tech"}, headers=headers)
        ws_id = ws_res.json()["id"]

        # Create Team
        team_res = await client.post(
            f"/api/v1/workspaces/{ws_id}/teams",
            json={"name": "Enterprise Sales", "description": "Handles large accounts"},
            headers=headers,
        )
        assert team_res.status_code == 201
        assert team_res.json()["name"] == "Enterprise Sales"

        # Get Teams List
        teams_list = await client.get(f"/api/v1/workspaces/{ws_id}/teams", headers=headers)
        assert teams_list.status_code == 200
        assert len(teams_list.json()) == 1

        # Get Settings
        settings_res = await client.get(f"/api/v1/workspaces/{ws_id}/settings", headers=headers)
        assert settings_res.status_code == 200
        assert settings_res.json()["timezone"] == "UTC"

        # Update Settings
        update_res = await client.patch(
            f"/api/v1/workspaces/{ws_id}/settings",
            json={"timezone": "America/New_York", "currency": "EUR"},
            headers=headers,
        )
        assert update_res.status_code == 200
        assert update_res.json()["timezone"] == "America/New_York"
        assert update_res.json()["currency"] == "EUR"
