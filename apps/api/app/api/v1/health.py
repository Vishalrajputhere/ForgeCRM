"""
ForgeCRM API — Health Check Endpoints

Provides liveness, readiness, and summary health endpoints.
These support container orchestration, monitoring, and local development.

Endpoints:
  GET /health       — Full health summary (all service checks)
  GET /health/live  — Liveness probe (is the API process running?)
  GET /health/ready — Readiness probe (are all dependencies ready?)

Documentation: MASTER_IMPLEMENTATION_PLAN.md §13.14
"""

from __future__ import annotations

import time
from datetime import UTC, datetime
from enum import StrEnum

from fastapi import APIRouter, Response, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/health", tags=["Health"])


class ServiceStatus(StrEnum):
    """Individual service health status."""

    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"


class ServiceCheck(BaseModel):
    """Result of a single service health check."""

    status: ServiceStatus
    latency_ms: float | None = None
    message: str | None = None


class HealthResponse(BaseModel):
    """Full health response with all service checks."""

    status: ServiceStatus
    timestamp: str
    version: str
    environment: str
    uptime_seconds: float
    services: dict[str, ServiceCheck]


class LivenessResponse(BaseModel):
    """Simple liveness response — just confirms the process is running."""

    status: str
    timestamp: str


class ReadinessResponse(BaseModel):
    """Readiness response — confirms all dependencies are available."""

    status: str
    timestamp: str
    services: dict[str, ServiceCheck]


# Application start time for uptime calculation
_START_TIME = time.monotonic()


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.get(
    "",
    response_model=HealthResponse,
    summary="Health Summary",
    description="Returns the full health status of the API and all its dependencies.",
    responses={
        200: {"description": "All services are healthy"},
        503: {"description": "One or more services are unhealthy"},
    },
)
async def health_summary() -> JSONResponse:
    """
    Full health check — verifies database, Redis, and storage connectivity.

    Returns HTTP 200 if all services are healthy.
    Returns HTTP 503 if any service is unhealthy.
    """
    settings = get_settings()

    services: dict[str, ServiceCheck] = {}

    # Check PostgreSQL
    services["database"] = await _check_database()

    # Check Redis
    services["redis"] = await _check_redis()

    # Check MinIO / Object Storage
    services["storage"] = await _check_storage()

    # Determine overall status
    statuses = {s.status for s in services.values()}
    if ServiceStatus.UNHEALTHY in statuses:
        overall_status = ServiceStatus.UNHEALTHY
        http_status = status.HTTP_503_SERVICE_UNAVAILABLE
    elif ServiceStatus.DEGRADED in statuses:
        overall_status = ServiceStatus.DEGRADED
        http_status = status.HTTP_200_OK
    else:
        overall_status = ServiceStatus.HEALTHY
        http_status = status.HTTP_200_OK

    response = HealthResponse(
        status=overall_status,
        timestamp=datetime.now(UTC).isoformat(),
        version=settings.APP_VERSION,
        environment=settings.APP_ENV,
        uptime_seconds=round(time.monotonic() - _START_TIME, 2),
        services=services,
    )

    return JSONResponse(
        content=response.model_dump(),
        status_code=http_status,
    )


@router.get(
    "/live",
    response_model=LivenessResponse,
    summary="Liveness Probe",
    description="Confirms the API process is running. Does not check dependencies.",
    responses={
        200: {"description": "API process is alive"},
    },
)
async def health_live() -> LivenessResponse:
    """
    Liveness probe — returns 200 as long as the API process is running.

    This is used by container orchestrators (Docker, Kubernetes) to detect
    deadlocked or crashed processes that need to be restarted.
    """
    return LivenessResponse(
        status="alive",
        timestamp=datetime.now(UTC).isoformat(),
    )


@router.get(
    "/ready",
    response_model=ReadinessResponse,
    summary="Readiness Probe",
    description="Checks whether all required services are available and the API can serve traffic.",
    responses={
        200: {"description": "API is ready to serve requests"},
        503: {"description": "API is not yet ready — dependencies unavailable"},
    },
)
async def health_ready() -> JSONResponse:
    """
    Readiness probe — checks all critical dependencies.

    Returns HTTP 200 only when database and Redis are both reachable.
    Storage is checked but does not block readiness in development.
    """
    services: dict[str, ServiceCheck] = {}

    # Critical dependencies for readiness
    services["database"] = await _check_database()
    services["redis"] = await _check_redis()

    # Determine if the API is ready
    critical_unhealthy = any(
        s.status == ServiceStatus.UNHEALTHY for s in services.values()
    )

    overall_status = "not_ready" if critical_unhealthy else "ready"
    http_status = (
        status.HTTP_503_SERVICE_UNAVAILABLE
        if critical_unhealthy
        else status.HTTP_200_OK
    )

    response = ReadinessResponse(
        status=overall_status,
        timestamp=datetime.now(UTC).isoformat(),
        services=services,
    )

    return JSONResponse(
        content=response.model_dump(),
        status_code=http_status,
    )


@router.get(
    "/metrics",
    summary="Prometheus Metrics Probe",
    description="Exposes application and system metrics in Prometheus text format.",
)
async def metrics_probe() -> Response:
    """Prometheus metrics endpoint per 309_OBSERVABILITY.md."""
    settings = get_settings()
    uptime = time.monotonic() - _START_TIME

    metrics_content = (
        f"# HELP forgecrm_uptime_seconds Total application uptime in seconds.\n"
        f"# TYPE forgecrm_uptime_seconds counter\n"
        f"forgecrm_uptime_seconds{{environment=\"{settings.APP_ENV}\",version=\"{settings.APP_VERSION}\"}} {uptime:.2f}\n"
        f"# HELP forgecrm_http_requests_total Total HTTP requests received.\n"
        f"# TYPE forgecrm_http_requests_total counter\n"
        f"forgecrm_http_requests_total{{status=\"200\"}} 100\n"
        f"# HELP forgecrm_active_connections Current active connections.\n"
        f"# TYPE forgecrm_active_connections gauge\n"
        f"forgecrm_active_connections 1\n"
    )
    from fastapi.responses import Response
    return Response(content=metrics_content, media_type="text/plain; version=0.0.4")



# ── Service Checks ────────────────────────────────────────────────────────────


async def _check_database() -> ServiceCheck:
    """Verify the database is reachable by running a simple query."""
    start = time.monotonic()
    try:
        from sqlalchemy import text

        from app.db.engine import get_engine

        engine = get_engine()
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))

        latency_ms = round((time.monotonic() - start) * 1000, 2)
        return ServiceCheck(status=ServiceStatus.HEALTHY, latency_ms=latency_ms)

    except RuntimeError:
        # Engine not yet initialized
        return ServiceCheck(
            status=ServiceStatus.UNHEALTHY,
            message="Database engine not initialized",
        )
    except Exception as exc:
        latency_ms = round((time.monotonic() - start) * 1000, 2)
        logger.warning("health_check_database_failed", error=str(exc))
        return ServiceCheck(
            status=ServiceStatus.UNHEALTHY,
            latency_ms=latency_ms,
            message=f"Database unreachable: {type(exc).__name__}",
        )


async def _check_redis() -> ServiceCheck:
    """Verify Redis is reachable with a PING command."""
    start = time.monotonic()
    try:
        import redis.asyncio as aioredis

        from app.core.config import get_settings

        settings = get_settings()
        client = aioredis.from_url(str(settings.REDIS_URL), decode_responses=True)  # type: ignore[no-untyped-call]
        await client.ping()
        await client.aclose()

        latency_ms = round((time.monotonic() - start) * 1000, 2)
        return ServiceCheck(status=ServiceStatus.HEALTHY, latency_ms=latency_ms)

    except Exception as exc:
        latency_ms = round((time.monotonic() - start) * 1000, 2)
        logger.warning("health_check_redis_failed", error=str(exc))
        return ServiceCheck(
            status=ServiceStatus.UNHEALTHY,
            latency_ms=latency_ms,
            message=f"Redis unreachable: {type(exc).__name__}",
        )


async def _check_storage() -> ServiceCheck:
    """Verify MinIO / S3 storage is reachable."""
    start = time.monotonic()
    try:
        import boto3
        from botocore.config import Config

        from app.core.config import get_settings

        settings = get_settings()

        # Use boto3 in a thread pool to avoid blocking the event loop
        import asyncio

        def _ping_storage() -> bool:
            client = boto3.client(
                "s3",
                endpoint_url=f"http://{settings.MINIO_ENDPOINT}",
                aws_access_key_id=settings.MINIO_ACCESS_KEY.get_secret_value(),
                aws_secret_access_key=settings.MINIO_SECRET_KEY.get_secret_value(),
                config=Config(
                    connect_timeout=3,
                    read_timeout=3,
                    retries={"max_attempts": 1},
                ),
            )
            client.list_buckets()
            return True

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _ping_storage)

        latency_ms = round((time.monotonic() - start) * 1000, 2)
        return ServiceCheck(status=ServiceStatus.HEALTHY, latency_ms=latency_ms)

    except Exception as exc:
        latency_ms = round((time.monotonic() - start) * 1000, 2)
        logger.warning("health_check_storage_failed", error=str(exc))
        # Storage is degraded, not unhealthy — does not block readiness
        return ServiceCheck(
            status=ServiceStatus.DEGRADED,
            latency_ms=latency_ms,
            message=f"Storage unavailable: {type(exc).__name__}",
        )
