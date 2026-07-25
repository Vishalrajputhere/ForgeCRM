"""
ForgeCRM API — Request Logging Middleware

Logs every incoming request with method, path, status code,
and execution duration. Sensitive paths (auth endpoints) are
logged without request bodies.

Documentation: docs/03_Backend/309_OBSERVABILITY.md
Standards: MASTER_IMPLEMENTATION_PLAN.md §12.10
"""

from __future__ import annotations

import time

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.logging import get_logger

logger = get_logger(__name__)

# Paths that should not have their details logged
_SENSITIVE_PATHS = frozenset({
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/refresh",
    "/api/v1/auth/password-reset",
})

# Paths to skip logging entirely (e.g., health checks in high-traffic envs)
_SILENT_PATHS = frozenset({
    "/health",
    "/health/live",
    "/health/ready",
    "/favicon.ico",
})


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that logs every HTTP request with timing information.

    Each request generates:
      - A 'request_started' log at the start
      - A 'request_finished' log with status code and duration at the end

    Sensitive paths are logged without bodies.
    Health check endpoints can be silenced to reduce log noise.
    """

    def __init__(self, app: object, silent_paths: bool = True) -> None:
        super().__init__(app)  # type: ignore[arg-type]
        self._silent_paths = silent_paths

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        path = str(request.url.path)

        # Skip logging for health/favicon endpoints in production
        if self._silent_paths and path in _SILENT_PATHS:
            return await call_next(request)

        start_time = time.monotonic()

        logger.info(
            "request_started",
            method=request.method,
            path=path,
            client=_get_client_ip(request),
        )

        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = round((time.monotonic() - start_time) * 1000, 2)
            logger.exception(
                "request_failed",
                method=request.method,
                path=path,
                duration_ms=duration_ms,
                error=str(exc),
            )
            raise

        duration_ms = round((time.monotonic() - start_time) * 1000, 2)

        log_fn = logger.warning if response.status_code >= 400 else logger.info

        log_fn(
            "request_finished",
            method=request.method,
            path=path,
            status_code=response.status_code,
            duration_ms=duration_ms,
        )

        return response


def _get_client_ip(request: Request) -> str:
    """Extract the real client IP, respecting X-Forwarded-For headers."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Take the first IP in the chain (the original client)
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


__all__ = ["RequestLoggingMiddleware"]
