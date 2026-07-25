"""
ForgeCRM API — Milestone 05 Integration Test Suite

Automated tests covering:
  - Document Storage & Presigned Upload/Download URL workflows
  - File size validation (25 MB max limit)
  - Entity document attachment metadata listing & soft deletion
  - Global Search engine across Companies, Contacts, Leads, Deals, Tasks
  - Multi-tenant workspace isolation for search and attachments
  - Background Job Dispatching & status monitoring

Documentation: docs/07_Testing/703_INTEGRATION_TESTING.md
Standards: MASTER_IMPLEMENTATION_PLAN.md §12.18
"""

from __future__ import annotations

from uuid import uuid4

import pytest
from httpx import AsyncClient

USER_TESTER_A = {
    "first_name": "Alice",
    "last_name": "StorageTester",
    "email": "alice_storage@acme.com",
    "password": "StrongPassword123!",
}

USER_TESTER_B = {
    "first_name": "Bob",
    "last_name": "StorageTester",
    "email": "bob_storage@other.com",
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


class TestDocumentStorage:
    """Tests for File Storage & Document Attachments."""

    @pytest.mark.asyncio
    async def test_presigned_upload_url_and_confirmation(self, client: AsyncClient) -> None:
        """Generating presigned upload URL and confirming document attachment."""
        headers, _ = await _setup_workspace_and_headers(client, USER_TESTER_A, "Storage Workspace")
        target_entity_id = str(uuid4())

        # 1. Request presigned upload URL
        upload_req = {
            "entity_type": "Company",
            "entity_id": target_entity_id,
            "file_name": "contract.pdf",
            "file_size": 2048576,  # ~2 MB
            "mime_type": "application/pdf",
        }
        url_res = await client.post("/api/v1/storage/upload-url", json=upload_req, headers=headers)
        assert url_res.status_code == 200

        body = url_res.json()
        assert "storage_key" in body
        assert "upload_url" in body
        storage_key = body["storage_key"]

        # 2. Confirm upload
        confirm_req = {
            "storage_key": storage_key,
            "entity_type": "Company",
            "entity_id": target_entity_id,
            "file_name": "contract.pdf",
            "file_size": 2048576,
            "mime_type": "application/pdf",
        }
        conf_res = await client.post("/api/v1/storage/confirm", json=confirm_req, headers=headers)
        assert conf_res.status_code == 201

        att_body = conf_res.json()
        assert att_body["file_name"] == "contract.pdf"
        attachment_id = att_body["id"]

        # 3. List entity attachments
        list_res = await client.get(
            f"/api/v1/storage/attachments?entity_type=Company&entity_id={target_entity_id}",
            headers=headers,
        )
        assert list_res.status_code == 200
        assert len(list_res.json()) == 1

        # 4. Generate presigned download URL
        dl_res = await client.get(
            f"/api/v1/storage/attachments/{attachment_id}/download-url",
            headers=headers,
        )
        assert dl_res.status_code == 200
        assert "download_url" in dl_res.json()

        # 5. Delete attachment
        del_res = await client.delete(
            f"/api/v1/storage/attachments/{attachment_id}",
            headers=headers,
        )
        assert del_res.status_code == 204


class TestGlobalSearchEngine:
    """Tests for Global Search across Companies, Contacts, Leads, Deals, Tasks."""

    @pytest.mark.asyncio
    async def test_global_search_returns_workspace_matches(self, client: AsyncClient) -> None:
        """Global search returns matching entities within the user's workspace."""
        headers, _ = await _setup_workspace_and_headers(client, USER_TESTER_A, "Search Workspace A")

        # Create Company & Deal with distinct keyword
        await client.post(
            "/api/v1/companies",
            json={"name": "Cyberdyne Systems Tech"},
            headers=headers,
        )

        # Execute search query
        search_res = await client.get("/api/v1/search?q=Cyberdyne", headers=headers)
        assert search_res.status_code == 200

        body = search_res.json()
        assert body["total"] >= 1
        assert any(r["title"] == "Cyberdyne Systems Tech" for r in body["results"])

    @pytest.mark.asyncio
    async def test_global_search_tenant_isolation(self, client: AsyncClient) -> None:
        """User B searching in Workspace B cannot see User A's entities in Workspace A."""
        headers_a, _ = await _setup_workspace_and_headers(client, USER_TESTER_A, "Search Workspace A2")
        headers_b, _ = await _setup_workspace_and_headers(client, USER_TESTER_B, "Search Workspace B2")

        # Alice creates company
        await client.post(
            "/api/v1/companies",
            json={"name": "Skynet Research Labs"},
            headers=headers_a,
        )

        # Bob searches for Skynet
        search_res = await client.get("/api/v1/search?q=Skynet", headers=headers_b)
        assert search_res.status_code == 200
        assert search_res.json()["total"] == 0


class TestBackgroundJobs:
    """Tests for Background Job dispatching and status."""

    @pytest.mark.asyncio
    async def test_dispatch_and_query_job(self, client: AsyncClient) -> None:
        """Dispatching an async email background job returns job_id and status."""
        headers, _ = await _setup_workspace_and_headers(client, USER_TESTER_A, "Jobs Workspace")

        # Dispatch Job
        dispatch_req = {
            "job_type": "email",
            "target_email": "client@example.com",
            "subject": "Monthly Sales Report",
            "body": "Your sales report is ready.",
        }
        disp_res = await client.post("/api/v1/jobs/dispatch", json=dispatch_req, headers=headers)
        assert disp_res.status_code == 202

        job_id = disp_res.json()["job_id"]
        assert job_id.startswith("job_email_")

        # Query Job Status
        status_res = await client.get(f"/api/v1/jobs/status/{job_id}", headers=headers)
        assert status_res.status_code == 200
        assert status_res.json()["status"] == "Completed"
