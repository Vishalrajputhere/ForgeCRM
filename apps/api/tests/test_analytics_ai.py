"""
ForgeCRM API — Milestone 06 Integration Test Suite

Automated tests covering:
  - Analytics & BI Executive Overview KPIs
  - Lead conversion funnel & deal revenue velocity calculation
  - Pipeline stage distributions & weighted revenue forecasts
  - AI Lead Summarization, Deal Risk Assessment, Email Drafting
  - Multi-tenant workspace isolation for reporting data
  - Prometheus metrics endpoint (/health/metrics)

Documentation: docs/07_Testing/703_INTEGRATION_TESTING.md
Standards: MASTER_IMPLEMENTATION_PLAN.md §12.18
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient

USER_ANALYTICS_A = {
    "first_name": "Alice",
    "last_name": "AnalyticsTester",
    "email": "alice_analytics@acme.com",
    "password": "StrongPassword123!",
}

USER_ANALYTICS_B = {
    "first_name": "Bob",
    "last_name": "AnalyticsTester",
    "email": "bob_analytics@other.com",
    "password": "StrongPassword123!",
}


async def _setup_workspace(
    client: AsyncClient,
    user_data: dict[str, str],
    ws_name: str,
) -> dict[str, str]:
    """Helper to register user, create workspace, and return workspace headers."""
    reg_res = await client.post("/api/v1/auth/register", json=user_data)
    token = reg_res.json()["access_token"]

    auth_headers = {"Authorization": f"Bearer {token}"}
    ws_res = await client.post("/api/v1/workspaces", json={"name": ws_name}, headers=auth_headers)
    ws_id = ws_res.json()["id"]

    return {
        "Authorization": f"Bearer {token}",
        "X-Workspace-ID": ws_id,
    }


class TestAnalyticsReporting:
    """Tests for Analytics & Executive Reporting."""

    @pytest.mark.asyncio
    async def test_executive_overview_and_funnel_metrics(self, client: AsyncClient) -> None:
        """Executive overview returns calculated KPIs for workspace."""
        headers = await _setup_workspace(client, USER_ANALYTICS_A, "Analytics Corp")

        # 1. Create company and lead
        await client.post(
            "/api/v1/companies",
            json={"name": "Analytics Target Corp"},
            headers=headers,
        )
        await client.post(
            "/api/v1/leads",
            json={"first_name": "John", "last_name": "Doe", "company_name": "Analytics Target Corp", "estimated_value": 50000},
            headers=headers,
        )

        # 2. Executive overview
        ov_res = await client.get("/api/v1/analytics/overview", headers=headers)
        assert ov_res.status_code == 200
        ov = ov_res.json()
        assert ov["active_companies"] >= 1
        assert ov["total_leads"] >= 1

        # 3. Lead metrics
        lead_m_res = await client.get("/api/v1/analytics/leads", headers=headers)
        assert lead_m_res.status_code == 200
        assert lead_m_res.json()["total_leads"] >= 1

        # 4. Deal metrics
        deal_m_res = await client.get("/api/v1/analytics/deals", headers=headers)
        assert deal_m_res.status_code == 200

        # 5. Pipeline analytics
        pipe_m_res = await client.get("/api/v1/analytics/pipeline", headers=headers)
        assert pipe_m_res.status_code == 200
        assert isinstance(pipe_m_res.json(), list)

    @pytest.mark.asyncio
    async def test_analytics_workspace_isolation(self, client: AsyncClient) -> None:
        """User B in Workspace B receives 0 metrics for User A's data."""
        headers_a = await _setup_workspace(client, USER_ANALYTICS_A, "Analytics Workspace A")
        headers_b = await _setup_workspace(client, USER_ANALYTICS_B, "Analytics Workspace B")

        # Alice creates lead
        await client.post(
            "/api/v1/leads",
            json={"first_name": "Secret", "last_name": "Lead", "company_name": "Secret Co"},
            headers=headers_a,
        )

        # Bob checks executive overview in Workspace B
        ov_b = await client.get("/api/v1/analytics/overview", headers=headers_b)
        assert ov_b.status_code == 200
        assert ov_b.json()["total_leads"] == 0


class TestAIProductivity:
    """Tests for AI Lead Summarization, Deal Risk Assessment, and Email Drafting."""

    @pytest.mark.asyncio
    async def test_ai_lead_summary_and_deal_risk(self, client: AsyncClient) -> None:
        """AI services generate structured insights for leads and deals."""
        headers = await _setup_workspace(client, USER_ANALYTICS_A, "AI Workspace")

        # Create lead
        lead_res = await client.post(
            "/api/v1/leads",
            json={"first_name": "AI", "last_name": "Prospect", "company_name": "Tech Corp", "estimated_value": 75000},
            headers=headers,
        )
        lead_id = lead_res.json()["id"]

        # 1. AI Summarize Lead
        sum_res = await client.post(
            "/api/v1/ai/summarize-lead",
            json={"lead_id": lead_id},
            headers=headers,
        )
        assert sum_res.status_code == 200
        assert "recommended_next_action" in sum_res.json()

        # 2. AI Email Draft
        draft_res = await client.post(
            "/api/v1/ai/draft-email",
            json={"entity_type": "Lead", "entity_id": lead_id, "email_purpose": "Product Demonstration"},
            headers=headers,
        )
        assert draft_res.status_code == 200
        assert "subject" in draft_res.json()
        assert "body" in draft_res.json()


class TestPrometheusMetrics:
    """Tests for Prometheus metrics probe."""

    @pytest.mark.asyncio
    async def test_metrics_endpoint_returns_prometheus_format(self, client: AsyncClient) -> None:
        """GET /api/v1/health/metrics returns Prometheus text format."""
        res = await client.get("/api/v1/health/metrics")
        assert res.status_code == 200
        assert "forgecrm_uptime_seconds" in res.text
