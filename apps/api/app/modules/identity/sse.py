"""
ForgeCRM API — Server-Sent Events (SSE) Manager for Real-Time Authorization

Implements a production-quality, asyncio-based in-memory connection manager
for pushing authorization change events to connected browser clients without
requiring login/logout. Used by Phase 8.X Dynamic RBAC propagation.

Architecture:
  - Each authenticated user connection subscribes to a private asyncio.Queue.
  - When a Super Admin changes a user's role, the backend publishes an event
    to that user's queue(s), which are streamed to all their open browser tabs.
  - If the user has no active SSE connections, the event is silently dropped
    (the frontend polling fallback handles the eventual consistency).

Documentation: docs/05_Security/505_AUTHORIZATION_AND_RBAC.md
"""

from __future__ import annotations

import asyncio
import json
import logging
from collections import defaultdict
from uuid import UUID

logger = logging.getLogger(__name__)

# Maximum number of SSE connections per user (prevents memory exhaustion)
_MAX_CONNECTIONS_PER_USER = 10

# Heartbeat interval in seconds (keeps proxies from closing idle connections)
SSE_HEARTBEAT_INTERVAL_SECONDS = 25


class AuthorizationSSEManager:
    """
    Manages Server-Sent Events connections for real-time authorization propagation.

    Thread-safety: This manager uses asyncio data structures.
    All methods must be called from within the asyncio event loop.
    """

    def __init__(self) -> None:
        # user_id (UUID) -> list of asyncio.Queue instances (one per open tab/connection)
        self._queues: dict[UUID, list[asyncio.Queue[str | None]]] = defaultdict(list)

    def connect(self, user_id: UUID) -> asyncio.Queue[str | None]:
        """
        Register a new SSE connection for the given user.

        Returns the queue this connection should read events from.
        Sending None into the queue signals graceful shutdown of the connection.
        """
        if len(self._queues[user_id]) >= _MAX_CONNECTIONS_PER_USER:
            # Evict the oldest connection to prevent unbounded growth
            oldest_q = self._queues[user_id].pop(0)
            oldest_q.put_nowait(None)  # Signal shutdown to oldest connection
            logger.warning(
                "sse_evicted_oldest_connection",
                extra={"user_id": str(user_id), "max": _MAX_CONNECTIONS_PER_USER},
            )

        queue: asyncio.Queue[str | None] = asyncio.Queue(maxsize=50)
        self._queues[user_id].append(queue)
        logger.debug("sse_connected", extra={"user_id": str(user_id), "connections": len(self._queues[user_id])})
        return queue

    def disconnect(self, user_id: UUID, queue: asyncio.Queue[str | None]) -> None:
        """Deregister an SSE connection for the given user."""
        try:
            self._queues[user_id].remove(queue)
        except ValueError:
            pass  # Already removed — idempotent
        if not self._queues[user_id]:
            del self._queues[user_id]
        logger.debug("sse_disconnected", extra={"user_id": str(user_id)})

    async def publish(
        self,
        user_id: UUID,
        workspace_id: UUID,
        authorization_version: int,
        reason: str = "role_changed",
    ) -> int:
        """
        Publish an authorization.changed event to all open SSE connections for a user.

        Returns the number of connections that received the event.
        Safe to call even if the user has no active SSE connections.
        """
        queues = self._queues.get(user_id, [])
        if not queues:
            logger.debug(
                "sse_no_connections_for_user",
                extra={"user_id": str(user_id), "reason": reason},
            )
            return 0

        payload = json.dumps({
            "authorization_version": authorization_version,
            "workspace_id": str(workspace_id),
            "reason": reason,
        })
        # Format as SSE message
        sse_message = f"event: authorization.changed\ndata: {payload}\n\n"

        delivered = 0
        dead_queues = []
        for q in list(queues):
            try:
                q.put_nowait(sse_message)
                delivered += 1
            except asyncio.QueueFull:
                dead_queues.append(q)
                logger.warning("sse_queue_full_evicting", extra={"user_id": str(user_id)})

        for dq in dead_queues:
            self.disconnect(user_id, dq)

        logger.info(
            "sse_published",
            extra={
                "user_id": str(user_id),
                "workspace_id": str(workspace_id),
                "auth_version": authorization_version,
                "reason": reason,
                "delivered_to": delivered,
            },
        )
        return delivered

    def active_connection_count(self) -> int:
        """Return total number of active SSE connections (for monitoring)."""
        return sum(len(qs) for qs in self._queues.values())

    def connected_user_count(self) -> int:
        """Return number of users with at least one active SSE connection."""
        return len(self._queues)


# Singleton instance (application-scoped)
authorization_sse_manager = AuthorizationSSEManager()


__all__ = [
    "AuthorizationSSEManager",
    "SSE_HEARTBEAT_INTERVAL_SECONDS",
    "authorization_sse_manager",
]
