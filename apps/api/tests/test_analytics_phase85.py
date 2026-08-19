"""
ForgeCRM API — Phase 8.5 Enterprise Analytics & BI Integration Tests

Verifies:
  - Time range filtering (7d, 30d, 90d, custom)
  - Sales performance leaderboard and deal velocity
  - Activity productivity and task completion rates
  - Workflow automation telemetry
  - AI token consumption & cost analytics
  - Customer account revenue intelligence
  - Custom dashboard and saved report persistence
  - CSV dataset export engine
  - Multi-tenant workspace isolation
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient

USER_ANALYTICS_TESTER_A = {
    "first_name": "Diana",
    "last_name": "Prince",
    "email": "diana_analytics@themyscira.com",
    "password": "StrongPassword123!",
}

USER_ANALYTICS_TESTER_B = {
    "first_name": "Bruce",
    "last_name": "Wayne",
    "email": "bruce_analytics@wayne.com",
    "password": "StrongPassword123!",
}


async def _setup_test_workspace(client: AsyncClient, user_data: dict[str, str], ws_name: str) -> dict[str, str]:
    reg_res = await client.post("/api/v1/auth/register", json=user_data)
    token = reg_res.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    ws_res = await client.post("/api/v1/workspaces", json={"name": ws_name}, headers=auth_headers)
    ws_id = ws_res.json()["id"]

    return {
        "Authorization": f"Bearer {token}",
        "X-Workspace-ID": ws_id,
    }


class TestPhase85Analytics:
    """Comprehensive test suite for Phase 8.5 Business Intelligence & Analytics."""

    @pytest.mark.asyncio
    async def test_multi_domain_analytics_and_time_ranges(self, client: AsyncClient) -> None:
        """Verify all domain analytics APIs calculate live PostgreSQL metrics with time range filters."""
        headers = await _setup_test_workspace(client, USER_ANALYTICS_TESTER_A, "Enterprise BI Workspace")

        # 1. Create company, lead, and deal
        comp_res = await client.post(
            "/api/v1/companies",
            json={"name": "Wayne Enterprises", "annual_revenue": 5000000},
            headers=headers,
        )
        assert comp_res.status_code == 201
        comp_id = comp_res.json()["id"]

        lead_res = await client.post(
            "/api/v1/leads",
            json={"first_name": "Clark", "last_name": "Kent", "company_name": "Daily Planet", "estimated_value": 75000, "priority": "High"},
            headers=headers,
        )
        assert lead_res.status_code == 201

        # Get default pipeline
        pipes_res = await client.get("/api/v1/pipelines", headers=headers)
        assert pipes_res.status_code == 200
        pipelines = pipes_res.json()
        assert len(pipelines) > 0
        pipe = pipelines[0]
        stage_id = pipe["stages"][0]["id"]

        deal_res = await client.post(
            "/api/v1/deals",
            json={
                "name": "Cloud Security Suite",
                "value": 120000,
                "company_id": comp_id,
                "pipeline_id": pipe["id"],
                "stage_id": stage_id,
            },
            headers=headers,
        )
        assert deal_res.status_code == 201

        # 2. Executive overview with time range
        ov_res = await client.get("/api/v1/analytics/overview?time_range=30d", headers=headers)
        assert ov_res.status_code == 200
        ov = ov_res.json()
        assert ov["active_companies"] >= 1
        assert ov["total_leads"] >= 1
        assert ov["open_deals_count"] >= 1
        assert ov["pipeline_total_value"] >= 120000

        # 3. Sales performance leaderboard
        sales_res = await client.get("/api/v1/analytics/sales?time_range=30d", headers=headers)
        assert sales_res.status_code == 200
        sales = sales_res.json()
        assert "leaderboard" in sales
        assert isinstance(sales["leaderboard"], list)

        # 4. Activity & task productivity analytics
        act_res = await client.get("/api/v1/analytics/activities?time_range=30d", headers=headers)
        assert act_res.status_code == 200
        act_data = act_res.json()
        assert "activities_by_type" in act_data
        assert "task_completion_rate_percent" in act_data

        # 5. Automation analytics
        auto_res = await client.get("/api/v1/analytics/automation?time_range=30d", headers=headers)
        assert auto_res.status_code == 200
        auto_data = auto_res.json()
        assert "total_rules" in auto_data
        assert "success_rate_percent" in auto_data

        # 6. AI analytics
        ai_res = await client.get("/api/v1/analytics/ai?time_range=30d", headers=headers)
        assert ai_res.status_code == 200
        ai_data = ai_res.json()
        assert "total_requests" in ai_data
        assert "usage_by_model" in ai_data

        # 7. Customer account analytics
        acc_res = await client.get("/api/v1/analytics/accounts?time_range=30d", headers=headers)
        assert acc_res.status_code == 200
        acc_data = acc_res.json()
        assert acc_data["active_companies"] >= 1
        assert len(acc_data["top_accounts"]) >= 1

    @pytest.mark.asyncio
    async def test_custom_dashboards_and_saved_reports_crud(self, client: AsyncClient) -> None:
        """Verify custom dashboard and saved report persistence in PostgreSQL."""
        headers = await _setup_test_workspace(client, USER_ANALYTICS_TESTER_A, "Custom Dashboards Org")

        # 1. Create Dashboard with Widgets
        dash_payload = {
            "name": "Q3 Executive Board Dashboard",
            "description": "Executive review layout with live revenue cards and pipeline velocity charts.",
            "is_default": True,
            "layout_json": {"columns": 3, "theme": "dark"},
            "widgets": [
                {
                    "widget_type": "kpi_card",
                    "title": "Won Revenue Q3",
                    "position_x": 0,
                    "position_y": 0,
                    "width": 1,
                    "height": 1,
                    "config_json": {"metric": "won_revenue"},
                },
                {
                    "widget_type": "funnel_chart",
                    "title": "Enterprise Pipeline Funnel",
                    "position_x": 1,
                    "position_y": 0,
                    "width": 2,
                    "height": 2,
                    "config_json": {"pipeline": "default"},
                },
            ],
        }

        dash_res = await client.post("/api/v1/analytics/dashboards", json=dash_payload, headers=headers)
        assert dash_res.status_code == 201
        dash = dash_res.json()
        assert dash["name"] == "Q3 Executive Board Dashboard"
        assert len(dash["widgets"]) == 2
        dash_id = dash["id"]

        # List dashboards
        list_res = await client.get("/api/v1/analytics/dashboards", headers=headers)
        assert list_res.status_code == 200
        assert any(d["id"] == dash_id for d in list_res.json())

        # Delete dashboard
        del_res = await client.delete(f"/api/v1/analytics/dashboards/{dash_id}", headers=headers)
        assert del_res.status_code == 204

        # 2. Saved Reports CRUD
        rep_payload = {
            "name": "Enterprise Lead Velocity Report",
            "description": "Weekly tracking of high priority leads and conversion rate.",
            "entity_type": "lead",
            "metrics_json": ["total_leads", "conversion_rate_percent", "avg_conversion_time_days"],
            "dimensions_json": ["source", "priority"],
            "filters_json": {"priority": "High"},
        }
        rep_res = await client.post("/api/v1/analytics/reports", json=rep_payload, headers=headers)
        assert rep_res.status_code == 201
        rep = rep_res.json()
        assert rep["name"] == "Enterprise Lead Velocity Report"
        rep_id = rep["id"]

        rep_list_res = await client.get("/api/v1/analytics/reports", headers=headers)
        assert rep_list_res.status_code == 200
        assert any(r["id"] == rep_id for r in rep_list_res.json())

        del_rep_res = await client.delete(f"/api/v1/analytics/reports/{rep_id}", headers=headers)
        assert del_rep_res.status_code == 204

    @pytest.mark.asyncio
    async def test_csv_export_endpoint(self, client: AsyncClient) -> None:
        """Verify dynamic CSV report generation and headers."""
        headers = await _setup_test_workspace(client, USER_ANALYTICS_TESTER_A, "Export Workspace")

        # Export overview CSV
        export_res = await client.post(
            "/api/v1/analytics/export",
            json={"report_type": "overview", "time_range": "30d"},
            headers=headers,
        )
        assert export_res.status_code == 200
        assert export_res.headers["content-type"].startswith("text/csv")
        assert "Active Companies" in export_res.text
        assert "Pipeline Total Value" in export_res.text

        # Export sales leaderboard CSV
        sales_export = await client.post(
            "/api/v1/analytics/export",
            json={"report_type": "sales", "time_range": "30d"},
            headers=headers,
        )
        assert sales_export.status_code == 200
        assert "Representative" in sales_export.text
        assert "Won Revenue" in sales_export.text

    @pytest.mark.asyncio
    async def test_analytics_multi_tenant_isolation(self, client: AsyncClient) -> None:
        """Confirm User in Workspace B cannot retrieve Workspace A analytics data."""
        headers_a = await _setup_test_workspace(client, USER_ANALYTICS_TESTER_A, "Isolated Workspace A")
        headers_b = await _setup_test_workspace(client, USER_ANALYTICS_TESTER_B, "Isolated Workspace B")

        # Create high value lead in Workspace A
        await client.post(
            "/api/v1/leads",
            json={"first_name": "Confidential", "last_name": "Lead", "company_name": "Target A", "estimated_value": 900000},
            headers=headers_a,
        )

        # Workspace B checks overview
        ov_b = await client.get("/api/v1/analytics/overview", headers=headers_b)
        assert ov_b.status_code == 200
        assert ov_b.json()["total_leads"] == 0
        assert ov_b.json()["active_companies"] == 0
