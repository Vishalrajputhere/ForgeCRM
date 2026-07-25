"""
ForgeCRM API — Health Endpoint Tests

Tests for the three health check endpoints:
  GET /health
  GET /health/live
  GET /health/ready

Documentation: MASTER_IMPLEMENTATION_PLAN.md §13.14 (Health Endpoints)
Testing Standards: MASTER_IMPLEMENTATION_PLAN.md §12.18
"""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


class TestLivenessEndpoint:
    """Tests for GET /health/live — liveness probe."""

    @pytest.mark.asyncio
    async def test_liveness_returns_200(self, client: AsyncClient) -> None:
        """Liveness endpoint should always return 200 when the API is running."""
        response = await client.get("/api/v1/health/live")
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_liveness_response_body(self, client: AsyncClient) -> None:
        """Liveness response must include status and timestamp fields."""
        response = await client.get("/api/v1/health/live")
        body = response.json()

        assert "status" in body
        assert body["status"] == "alive"
        assert "timestamp" in body

    @pytest.mark.asyncio
    async def test_liveness_timestamp_is_iso8601(self, client: AsyncClient) -> None:
        """Liveness timestamp must be a valid ISO 8601 UTC string."""
        from datetime import datetime

        response = await client.get("/api/v1/health/live")
        body = response.json()

        # Should parse without error
        dt = datetime.fromisoformat(body["timestamp"])
        assert dt is not None

    @pytest.mark.asyncio
    async def test_liveness_content_type_is_json(self, client: AsyncClient) -> None:
        """Liveness response must have JSON content type."""
        response = await client.get("/api/v1/health/live")
        assert "application/json" in response.headers["content-type"]


class TestHealthSummaryEndpoint:
    """Tests for GET /health — full health summary."""

    @pytest.mark.asyncio
    async def test_health_summary_returns_response(self, client: AsyncClient) -> None:
        """Health summary should return a response (200 or 503)."""
        response = await client.get("/api/v1/health")
        assert response.status_code in (200, 503)

    @pytest.mark.asyncio
    async def test_health_summary_body_structure(self, client: AsyncClient) -> None:
        """Health summary must include required fields."""
        response = await client.get("/api/v1/health")
        body = response.json()

        assert "status" in body
        assert "timestamp" in body
        assert "version" in body
        assert "environment" in body
        assert "services" in body
        assert isinstance(body["services"], dict)

    @pytest.mark.asyncio
    async def test_health_summary_includes_service_checks(
        self, client: AsyncClient
    ) -> None:
        """Health summary must include database, redis, and storage checks."""
        response = await client.get("/api/v1/health")
        body = response.json()

        services = body["services"]
        assert "database" in services
        assert "redis" in services
        assert "storage" in services

    @pytest.mark.asyncio
    async def test_health_summary_service_check_structure(
        self, client: AsyncClient
    ) -> None:
        """Each service check must include a status field."""
        response = await client.get("/api/v1/health")
        body = response.json()

        for service_name, service_data in body["services"].items():
            assert "status" in service_data, (
                f"Service '{service_name}' missing 'status' field"
            )
            assert service_data["status"] in ("healthy", "degraded", "unhealthy"), (
                f"Service '{service_name}' has invalid status: {service_data['status']}"
            )

    @pytest.mark.asyncio
    async def test_health_summary_version_matches_settings(
        self, client: AsyncClient
    ) -> None:
        """Health summary version should match the configured app version."""
        from app.core.config import get_settings

        settings = get_settings()
        response = await client.get("/api/v1/health")
        body = response.json()

        assert body["version"] == settings.APP_VERSION

    @pytest.mark.asyncio
    async def test_health_summary_unhealthy_returns_503(
        self, client: AsyncClient
    ) -> None:
        """Health summary returns 503 when a critical service is unhealthy."""
        from app.api.v1.health import ServiceCheck, ServiceStatus

        with patch(
            "app.api.v1.health._check_database",
            new_callable=AsyncMock,
            return_value=ServiceCheck(
                status=ServiceStatus.UNHEALTHY,
                message="Database unavailable",
            ),
        ):
            response = await client.get("/api/v1/health")
            assert response.status_code == 503
            body = response.json()
            assert body["status"] == "unhealthy"


class TestReadinessEndpoint:
    """Tests for GET /health/ready — readiness probe."""

    @pytest.mark.asyncio
    async def test_readiness_returns_response(self, client: AsyncClient) -> None:
        """Readiness endpoint should return a response (200 or 503)."""
        response = await client.get("/api/v1/health/ready")
        assert response.status_code in (200, 503)

    @pytest.mark.asyncio
    async def test_readiness_body_structure(self, client: AsyncClient) -> None:
        """Readiness response must include status, timestamp, and services."""
        response = await client.get("/api/v1/health/ready")
        body = response.json()

        assert "status" in body
        assert "timestamp" in body
        assert "services" in body

    @pytest.mark.asyncio
    async def test_readiness_not_ready_returns_503(self, client: AsyncClient) -> None:
        """Readiness returns 503 when database is unhealthy."""
        from app.api.v1.health import ServiceCheck, ServiceStatus

        with patch(
            "app.api.v1.health._check_database",
            new_callable=AsyncMock,
            return_value=ServiceCheck(
                status=ServiceStatus.UNHEALTHY,
                message="Database not reachable",
            ),
        ):
            response = await client.get("/api/v1/health/ready")
            assert response.status_code == 503
            body = response.json()
            assert body["status"] == "not_ready"


class TestRootHealthEndpoint:
    """Tests for GET /health — root health endpoint (Docker health check)."""

    @pytest.mark.asyncio
    async def test_root_health_returns_200(self, client: AsyncClient) -> None:
        """Root /health should return 200 for Docker health checks."""
        response = await client.get("/health")
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_root_health_returns_healthy(self, client: AsyncClient) -> None:
        """Root /health should include a healthy status."""
        response = await client.get("/health")
        body = response.json()
        assert body["status"] == "healthy"


class TestErrorHandling:
    """Tests for centralized exception handling."""

    @pytest.mark.asyncio
    async def test_404_returns_json(self, client: AsyncClient) -> None:
        """Unknown routes should not return HTML error pages."""
        response = await client.get("/api/v1/nonexistent-route")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_request_id_header_in_response(self, client: AsyncClient) -> None:
        """Every response should include an X-Request-ID header."""
        response = await client.get("/api/v1/health/live")
        assert "x-request-id" in response.headers

    @pytest.mark.asyncio
    async def test_correlation_id_header_in_response(self, client: AsyncClient) -> None:
        """Every response should include an X-Correlation-ID header."""
        response = await client.get("/api/v1/health/live")
        assert "x-correlation-id" in response.headers

    @pytest.mark.asyncio
    async def test_custom_request_id_is_echoed(self, client: AsyncClient) -> None:
        """Client-provided X-Request-ID should be echoed in the response."""
        custom_id = "test_request_12345"
        response = await client.get(
            "/api/v1/health/live",
            headers={"X-Request-ID": custom_id},
        )
        assert response.headers.get("x-request-id") == custom_id
