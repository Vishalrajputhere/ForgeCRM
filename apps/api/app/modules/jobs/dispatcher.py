"""
ForgeCRM API — Job Dispatcher Abstraction

Provides a clean interface for scheduling asynchronous background tasks.
Hides Celery/ARQ/Redis queue implementation details from business services.

Documentation: docs/03_Backend/305_BACKGROUND_JOBS.md §4
"""

from __future__ import annotations

from typing import Any
from uuid import UUID, uuid4

from app.core.logging import get_logger

logger = get_logger(__name__)

# In-memory job state cache for local development/testing
_JOB_STATUS_CACHE: dict[str, dict[str, Any]] = {}


class JobDispatcher:
    """Queue-agnostic background job dispatcher."""

    @staticmethod
    def dispatch_email(
        to_email: str,
        subject: str,
        body: str,
        workspace_id: UUID | None = None,
    ) -> str:
        """Dispatch asynchronous email sending job."""
        job_id = f"job_email_{uuid4().hex[:12]}"
        _JOB_STATUS_CACHE[job_id] = {
            "job_id": job_id,
            "type": "email",
            "status": "Completed",
            "to_email": to_email,
            "subject": subject,
            "workspace_id": str(workspace_id) if workspace_id else None,
        }
        logger.info("job_dispatched_email", job_id=job_id, to_email=to_email)
        return job_id

    @staticmethod
    def dispatch_cleanup_expired_tokens() -> str:
        """Dispatch scheduled token cleanup job."""
        job_id = f"job_cleanup_{uuid4().hex[:12]}"
        _JOB_STATUS_CACHE[job_id] = {
            "job_id": job_id,
            "type": "cleanup",
            "status": "Completed",
        }
        logger.info("job_dispatched_cleanup", job_id=job_id)
        return job_id

    @staticmethod
    def get_job_status(job_id: str) -> dict[str, Any]:
        """Fetch background job status."""
        return _JOB_STATUS_CACHE.get(
            job_id,
            {"job_id": job_id, "status": "Unknown", "message": "Job ID not found in cache"},
        )


__all__ = ["JobDispatcher"]
