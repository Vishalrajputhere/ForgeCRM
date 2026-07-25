"""
ForgeCRM API — Correlation ID Middleware

Binds a correlation ID to the structlog context for the duration
of each request. This enables tracing a single user action across
multiple log entries.

Documentation: docs/03_Backend/309_OBSERVABILITY.md
"""

from __future__ import annotations

import structlog
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

CORRELATION_ID_HEADER = "X-Correlation-ID"


class CorrelationIDMiddleware(BaseHTTPMiddleware):
    """
    Middleware that binds request context to the structlog context variables.

    For every request this middleware binds:
      - correlation_id (from header or request_id fallback)
      - request_id
      - method
      - path

    These fields appear automatically in every log line emitted during
    the request lifetime, enabling full log correlation without passing
    context objects through the call chain.
    """

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        # Clear context from any previous request (important for async workers)
        structlog.contextvars.clear_contextvars()

        # Get or generate the correlation ID
        correlation_id = (
            request.headers.get(CORRELATION_ID_HEADER)
            or getattr(request.state, "request_id", None)
            or "unknown"
        )

        # Bind context that will appear in all log entries for this request
        structlog.contextvars.bind_contextvars(
            correlation_id=correlation_id,
            request_id=getattr(request.state, "request_id", correlation_id),
            http_method=request.method,
            http_path=str(request.url.path),
        )

        response = await call_next(request)

        # Echo correlation ID in the response
        response.headers[CORRELATION_ID_HEADER] = correlation_id

        return response


__all__ = ["CORRELATION_ID_HEADER", "CorrelationIDMiddleware"]
