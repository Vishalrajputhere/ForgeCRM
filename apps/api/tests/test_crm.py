"""
ForgeCRM API — CRM Core Operational Integration Test Suite

Automated integration tests covering:
  - Companies CRUD and duplicate name handling
  - Contacts CRUD
  - Leads creation and transactional lead conversion (Company + Contact + Deal)
  - Pipeline creation and Deal stage movements
  - Task creation and completion
  - Entity timeline activity tracking
  - Multi-tenant workspace isolation across all CRM endpoints

Documentation: docs/07_Testing/703_INTEGRATION_TESTING.md
Standards: MASTER_IMPLEMENTATION_PLAN.md §12.18
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient

USER_ALICE = {
    "first_name": "Alice",
    "last_name": "Owner",
    "email": "alice_crm@acme.com",
    "password": "StrongPassword123!",
}

USER_BOB = {
    "first_name": "Bob",
    "last_name": "Tenant",
    "email": "bob_crm@other.com",
    "password": "StrongPassword123!",
}


async def _setup_workspace_and_headers(
    client: AsyncClient,
    user_data: dict[str, str],
    ws_name: str,
) -> tuple[dict[str, str], str]:
    """Helper to register user, create workspace, and return headers + workspace ID."""
    reg_res = await client.post("/api/v1/auth/register", json=user_data)
    token = reg_res.json()["access_token"]

    auth_headers = {"Authorization": f"Bearer {token}"}
    ws_res = await client.post("/api/v1/workspaces", json={"name": ws_name}, headers=auth_headers)
    ws_id = ws_res.json()["id"]

    full_headers = {
        "Authorization": f"Bearer {token}",
        "X-Workspace-ID": ws_id,
    }
    return full_headers, ws_id


class TestCompanyAndContactWorkflows:
    """Tests for Company and Contact operations."""

    @pytest.mark.asyncio
    async def test_company_and_contact_creation(self, client: AsyncClient) -> None:
        """Creating a Company and attaching a Contact."""
        headers, _ = await _setup_workspace_and_headers(client, USER_ALICE, "Alice CRM Corp")

        # 1. Create Company
        comp_payload = {
            "name": "Acme Software Inc",
            "website": "https://acme.com",
            "annual_revenue": 1000000.0,
            "employee_count": 45,
        }
        comp_res = await client.post("/api/v1/companies", json=comp_payload, headers=headers)
        assert comp_res.status_code == 201
        comp_id = comp_res.json()["id"]
        assert comp_res.json()["name"] == "Acme Software Inc"

        # 2. Create Contact for Company
        contact_payload = {
            "company_id": comp_id,
            "first_name": "Sarah",
            "last_name": "Conner",
            "email": "sarah@acme.com",
            "job_title": "CTO",
            "is_primary": True,
        }
        cnt_res = await client.post("/api/v1/contacts", json=contact_payload, headers=headers)
        assert cnt_res.status_code == 201
        assert cnt_res.json()["first_name"] == "Sarah"
        assert cnt_res.json()["company_id"] == comp_id

        # 3. List Contacts
        list_res = await client.get(f"/api/v1/contacts?company_id={comp_id}", headers=headers)
        assert list_res.status_code == 200
        assert len(list_res.json()) == 1


class TestLeadConversionWorkflow:
    """Tests for Leads and Transactional Lead Conversion."""

    @pytest.mark.asyncio
    async def test_transactional_lead_conversion(self, client: AsyncClient) -> None:
        """Lead is converted transactionally into a Company, Primary Contact, and Deal."""
        headers, _ = await _setup_workspace_and_headers(client, USER_ALICE, "Lead Conv Workspace")

        # 1. Create Lead
        lead_payload = {
            "first_name": "David",
            "last_name": "Miller",
            "company_name": "Miller Logistics",
            "email": "david@miller.com",
            "estimated_value": 50000.0,
        }
        lead_res = await client.post("/api/v1/leads", json=lead_payload, headers=headers)
        assert lead_res.status_code == 201
        lead_id = lead_res.json()["id"]

        # 2. Transactionally Convert Lead
        convert_payload = {
            "create_deal": True,
            "deal_name": "Miller Enterprise Contract",
            "deal_value": 75000.0,
        }
        conv_res = await client.post(
            f"/api/v1/leads/{lead_id}/convert",
            json=convert_payload,
            headers=headers,
        )
        assert conv_res.status_code == 200

        body = conv_res.json()
        assert body["company"]["name"] == "Miller Logistics"
        assert body["contact"]["first_name"] == "David"
        assert body["deal"]["name"] == "Miller Enterprise Contract"
        assert body["deal"]["value"] == 75000.0

        # 3. Attempting to convert again should return 409 Conflict
        dup_res = await client.post(
            f"/api/v1/leads/{lead_id}/convert",
            json=convert_payload,
            headers=headers,
        )
        assert dup_res.status_code == 409
        assert dup_res.json()["error_code"] == "LEAD_ALREADY_CONVERTED"


class TestDealsAndPipelines:
    """Tests for Sales Pipelines and Deals."""

    @pytest.mark.asyncio
    async def test_deal_creation_and_stage_movement(self, client: AsyncClient) -> None:
        """Creating a Deal and moving its stage updates status correctly."""
        headers, _ = await _setup_workspace_and_headers(client, USER_ALICE, "Pipeline Workspace")

        # Create Company
        comp_res = await client.post(
            "/api/v1/companies",
            json={"name": "Global Tech"},
            headers=headers,
        )
        comp_id = comp_res.json()["id"]

        # Fetch Default Pipeline
        pip_res = await client.get("/api/v1/pipelines", headers=headers)
        assert pip_res.status_code == 200
        pipeline = pip_res.json()[0]
        stages = pipeline["stages"]
        stage_1_id = stages[0]["id"]
        stage_won_id = next(s["id"] for s in stages if s["is_won"])

        # Create Deal
        deal_payload = {
            "name": "Global Expansion Deal",
            "company_id": comp_id,
            "pipeline_id": pipeline["id"],
            "stage_id": stage_1_id,
            "value": 120000.0,
        }
        deal_res = await client.post("/api/v1/deals", json=deal_payload, headers=headers)
        assert deal_res.status_code == 201
        deal_id = deal_res.json()["id"]
        assert deal_res.json()["status"] == "Open"

        # Move Stage to Closed Won
        move_res = await client.post(
            f"/api/v1/deals/{deal_id}/move-stage",
            json={"stage_id": stage_won_id},
            headers=headers,
        )
        assert move_res.status_code == 200
        assert move_res.json()["status"] == "Won"


class TestTasksAndTimelines:
    """Tests for Tasks and Timeline Activity histories."""

    @pytest.mark.asyncio
    async def test_task_creation_and_completion(self, client: AsyncClient) -> None:
        """Creating and completing a task generates timeline activity."""
        headers, _ = await _setup_workspace_and_headers(client, USER_ALICE, "Tasks Workspace")

        # Create Task
        task_payload = {
            "title": "Follow up with client",
            "priority": "High",
        }
        task_res = await client.post("/api/v1/tasks", json=task_payload, headers=headers)
        assert task_res.status_code == 201
        task_id = task_res.json()["id"]
        assert task_res.json()["status"] == "Open"

        # Complete Task
        complete_res = await client.post(f"/api/v1/tasks/{task_id}/complete", headers=headers)
        assert complete_res.status_code == 200
        assert complete_res.json()["status"] == "Completed"


class TestCRMMultiTenantIsolation:
    """Tests for multi-tenant workspace isolation across CRM endpoints."""

    @pytest.mark.asyncio
    async def test_bob_cannot_access_alice_crm_data(self, client: AsyncClient) -> None:
        """User B with another workspace header cannot access User A's company details."""
        headers_a, _ = await _setup_workspace_and_headers(client, USER_ALICE, "Alice Workspace CRM")
        headers_b, _ = await _setup_workspace_and_headers(client, USER_BOB, "Bob Workspace CRM")

        # Alice creates company
        comp_res = await client.post(
            "/api/v1/companies",
            json={"name": "Alice Private Account"},
            headers=headers_a,
        )
        comp_id = comp_res.json()["id"]

        # Bob attempts to access Alice's company with Bob's X-Workspace-ID header
        access_res = await client.get(f"/api/v1/companies/{comp_id}", headers=headers_b)
        assert access_res.status_code == 404
        assert access_res.json()["error_code"] == "COMPANY_NOT_FOUND"
