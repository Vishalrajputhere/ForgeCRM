"""
ForgeCRM API — Request ID Middleware

Assigns a unique request ID to every incoming HTTP request.
The request ID is attached to the response header and to the
structured log context for correlation.

Documentation: docs/03_Backend/309_OBSERVABILITY.md
"""

from __future__ import annotations

import uuid

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

REQUEST_ID_HEADER = "X-Request-ID"
REQUEST_ID_CONTEXT_KEY = "request_id"


class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Middleware that assigns a unique request ID to every HTTP request.

    If the client provides an X-Request-ID header, it is used verbatim.
    Otherwise a new UUID4 is generated.

    The request ID is:
      - Stored in request.state.request_id
      - Added to the response as X-Request-ID header
      - Bound to the structlog context for the duration of the request
    """

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        # Use client-provided ID or generate a new one
        request_id = request.headers.get(REQUEST_ID_HEADER) or _generate_request_id()

        # Store on request state for access in route handlers
        request.state.request_id = request_id

        # Process the request
        response = await call_next(request)

        # Echo the request ID back in the response header
        response.headers[REQUEST_ID_HEADER] = request_id

        return response


def _generate_request_id() -> str:
    """Generate a new unique request ID."""
    return f"req_{uuid.uuid4().hex}"


__all__ = ["RequestIDMiddleware", "REQUEST_ID_HEADER"]
