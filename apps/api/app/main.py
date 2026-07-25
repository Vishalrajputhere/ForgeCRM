"""
ForgeCRM API — Application Factory

Creates and configures the FastAPI application instance.
Uses lifespan context for startup and shutdown resource management.

Architecture: Modular Monolith (ADR-001)
Stack: FastAPI + SQLAlchemy 2 + asyncpg (ADR-004)

Documentation:
  docs/03_Backend/301_BACKEND_OVERVIEW.md
  docs/01_Architecture/101_SYSTEM_ARCHITECTURE.md
"""

from __future__ import annotations

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

import orjson
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.v1.router import api_v1_router
from app.core.config import get_settings
from app.core.exceptions import ForgeCRMError
from app.core.logging import get_logger, setup_logging
from app.schemas.errors import ErrorResponse, ValidationErrorDetail, ValidationErrorResponse


# ── Application Lifespan ──────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan context manager.

    Handles startup initialization and graceful shutdown of:
    - Database engine and connection pool
    - Redis connection
    - Object storage client
    - Logging system
    """
    settings = get_settings()

    # ── Startup ──────────────────────────────────────────────────────────────
    setup_logging(
        log_level=settings.LOG_LEVEL,
        log_format=settings.LOG_FORMAT,
    )

    logger = get_logger(__name__)
    logger.info(
        "application_starting",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.APP_ENV,
    )

    # Initialize database engine and session factory
    from app.db.engine import init_db

    engine, session_factory = init_db(
        database_url=str(settings.DATABASE_URL),
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_timeout=settings.DB_POOL_TIMEOUT,
        pool_recycle=settings.DB_POOL_RECYCLE,
        echo=settings.DB_ECHO_SQL if settings.is_development else False,
    )
    logger.info("database_initialized")

    # Ensure MinIO bucket exists in development
    if settings.is_development or settings.STORAGE_PROVIDER == "minio":
        try:
            await _ensure_minio_bucket(settings)
            logger.info("storage_bucket_verified", bucket=settings.MINIO_BUCKET)
        except Exception as exc:
            logger.warning(
                "storage_bucket_verification_failed",
                error=str(exc),
                message="Storage may be unavailable — continuing startup",
            )

    logger.info(
        "application_started",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
    )

    # ── Application runs here ─────────────────────────────────────────────────
    yield

    # ── Shutdown ──────────────────────────────────────────────────────────────
    logger.info("application_shutting_down")

    from app.db.engine import dispose_engine

    await dispose_engine()
    logger.info("database_connections_closed")

    logger.info("application_shutdown_complete")


# ── Application Factory ───────────────────────────────────────────────────────


def create_application() -> FastAPI:
    """
    Create and configure the FastAPI application.

    This factory function is the single entry point for creating
    the application instance. It registers all middleware, exception
    handlers, and routers in the correct order.

    Returns:
        Configured FastAPI application ready to serve requests.
    """
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        description="Enterprise-grade multi-tenant CRM platform.",
        version=settings.APP_VERSION,
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        openapi_url="/openapi.json" if not settings.is_production else None,
        lifespan=lifespan,
        # Use orjson for faster JSON serialization
        default_response_class=_ORJSONResponse,
    )

    # ── Middleware (order matters — outermost runs first) ─────────────────────
    _register_middleware(app, settings)

    # ── Exception Handlers ────────────────────────────────────────────────────
    _register_exception_handlers(app)

    # ── Routers ───────────────────────────────────────────────────────────────
    _register_routers(app)

    return app


def _register_middleware(app: FastAPI, settings: Any) -> None:
    """Register all HTTP middleware in the correct order."""
    # NOTE: Middleware is applied in LIFO order in Starlette/FastAPI.
    # The last registered middleware runs FIRST on incoming requests.

    # GZip compression (innermost — applied to response before sending)
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    # CORS — must be registered before custom middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Correlation-ID"],
    )

    # Request logging
    from app.middleware.logging import RequestLoggingMiddleware
    app.add_middleware(RequestLoggingMiddleware)

    # Correlation ID — must run before request logging to bind context
    from app.middleware.correlation import CorrelationIDMiddleware
    app.add_middleware(CorrelationIDMiddleware)

    # Request ID — must run first (outermost) to generate the ID
    from app.middleware.request_id import RequestIDMiddleware
    app.add_middleware(RequestIDMiddleware)


def _register_exception_handlers(app: FastAPI) -> None:
    """Register centralized exception handlers."""

    @app.exception_handler(ForgeCRMError)
    async def forgecrm_exception_handler(
        request: Request,
        exc: ForgeCRMError,
    ) -> JSONResponse:
        """Handle all ForgeCRM domain exceptions consistently."""
        request_id = getattr(request.state, "request_id", None)
        logger = get_logger(__name__)
        logger.warning(
            "domain_exception",
            error_code=exc.error_code,
            message=exc.message,
            status_code=exc.status_code,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorResponse(
                error_code=exc.error_code,
                message=exc.message,
                details=exc.detail,
                request_id=request_id,
            ).model_dump(),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        """Handle Pydantic validation errors with field-level details."""
        request_id = getattr(request.state, "request_id", None)
        details = [
            ValidationErrorDetail(
                loc=[str(loc) for loc in error["loc"]],
                msg=error["msg"],
                type=error["type"],
            )
            for error in exc.errors()
        ]
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=ValidationErrorResponse(
                details=details,
                request_id=request_id,
            ).model_dump(),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        """
        Catch-all handler for unhandled exceptions.

        Never returns internal stack traces to clients.
        """
        request_id = getattr(request.state, "request_id", None)
        logger = get_logger(__name__)
        logger.exception(
            "unhandled_exception",
            error=str(exc),
            error_type=type(exc).__name__,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ErrorResponse(
                error_code="INTERNAL_ERROR",
                message="An unexpected error occurred. Please try again later.",
                request_id=request_id,
            ).model_dump(),
        )


def _register_routers(app: FastAPI) -> None:
    """Register all API routers."""
    # V1 API router (all routes under /api/v1)
    app.include_router(api_v1_router)

    # Root health redirect for Docker health checks
    @app.get("/health", include_in_schema=False)
    async def root_health() -> JSONResponse:
        """Root health endpoint — delegates to /api/v1/health/live."""
        from datetime import UTC, datetime

        return JSONResponse(
            content={"status": "healthy", "timestamp": datetime.now(UTC).isoformat()}
        )


# ── Utilities ─────────────────────────────────────────────────────────────────


class _ORJSONResponse(JSONResponse):
    """FastAPI response class using orjson for faster serialization."""

    media_type = "application/json"

    def render(self, content: Any) -> bytes:  # noqa: ANN401
        return orjson.dumps(
            content,
            option=orjson.OPT_NON_STR_KEYS | orjson.OPT_SERIALIZE_UUID,
        )


async def _ensure_minio_bucket(settings: Any) -> None:
    """Create the default MinIO bucket if it does not exist."""
    import asyncio
    import boto3
    from botocore.config import Config
    from botocore.exceptions import ClientError

    def _create_bucket() -> None:
        client = boto3.client(
            "s3",
            endpoint_url=f"http{'s' if settings.MINIO_SECURE else ''}://{settings.MINIO_ENDPOINT}",
            aws_access_key_id=settings.MINIO_ACCESS_KEY.get_secret_value(),
            aws_secret_access_key=settings.MINIO_SECRET_KEY.get_secret_value(),
            config=Config(connect_timeout=5, read_timeout=5, retries={"max_attempts": 2}),
        )
        try:
            client.head_bucket(Bucket=settings.MINIO_BUCKET)
        except ClientError as exc:
            error_code = exc.response.get("Error", {}).get("Code", "")
            if error_code in ("404", "NoSuchBucket"):
                client.create_bucket(Bucket=settings.MINIO_BUCKET)

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _create_bucket)


# ── Application Instance ──────────────────────────────────────────────────────

app = create_application()
