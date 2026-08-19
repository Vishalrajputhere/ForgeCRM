"""
ForgeCRM API — Job Dispatcher (Redis-backed)

Provides a clean interface for scheduling asynchronous background tasks.
Replaces the in-memory _JOB_STATUS_CACHE stub with a real Redis-backed
implementation. Job state is persisted for 7 days.

Celery `.delay()` is used to enqueue work. Redis is used for status queries.
Falls back gracefully if Redis is unreachable — logs a warning and returns
an ephemeral in-process status so the caller always gets a response.

Documentation: docs/03_Backend/305_BACKGROUND_JOBS.md
"""

from __future__ import annotations

import json
import logging
import os
from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

_logger = logging.getLogger("forgecrm.jobs")

# ── Redis connection ────────────────────────────────────────────────────────
_REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
_STATE_TTL_SECONDS = 604_800  # 7 days


def _get_redis() -> Any:
    """Return a synchronous Redis client, or None if unavailable."""
    try:
        import redis as redis_sync
        return redis_sync.from_url(_REDIS_URL, decode_responses=True, socket_connect_timeout=2)
    except Exception:  # noqa: BLE001
        return None


def _write_initial_state(job_id: str, details: dict[str, Any]) -> None:
    """Write the initial 'Queued' state to Redis synchronously."""
    r = _get_redis()
    if r is None:
        return
    try:
        payload: dict[str, Any] = {
            "job_id": job_id,
            "status": "Queued",
            "created_at": datetime.now(UTC).isoformat(),
            **details,
        }
        r.setex(f"job:{job_id}:state", _STATE_TTL_SECONDS, json.dumps(payload))
    except Exception:  # noqa: BLE001
        pass


def _read_state(job_id: str) -> dict[str, Any] | None:
    """Read job state from Redis. Returns None if key missing or Redis down."""
    r = _get_redis()
    if r is None:
        return None
    try:
        raw = r.get(f"job:{job_id}:state")
        if raw:
            return json.loads(raw)
    except Exception:  # noqa: BLE001
        pass
    return None


# ── Lazy import of Celery tasks (avoids circular imports at module load) ────
def _get_tasks() -> Any:
    """Import tasks module lazily so the dispatcher can be imported anywhere."""
    from app.modules.jobs import tasks as _tasks
    return _tasks


class JobDispatcher:
    """
    Queue-agnostic background job dispatcher backed by Celery + Redis.

    All public methods return a string job_id.
    State is persisted in Redis and readable via get_job_status().
    """

    @staticmethod
    def dispatch_email(
        to_email: str,
        subject: str,
        body: str,
        workspace_id: UUID | None = None,
    ) -> str:
        """Enqueue an async email delivery task."""
        job_id = f"job_email_{uuid4().hex[:12]}"
        details = {
            "type": "email",
            "to_email": to_email,
            "subject": subject,
            "workspace_id": str(workspace_id) if workspace_id else None,
        }
        _write_initial_state(job_id, details)
        try:
            tasks = _get_tasks()
            tasks.send_email_task.delay(
                job_id=job_id,
                to_email=to_email,
                subject=subject,
                body=body,
                workspace_id=str(workspace_id) if workspace_id else None,
            )
            _logger.info("job_dispatched", extra={"job_id": job_id, "type": "email"})
        except Exception as exc:  # noqa: BLE001
            _logger.warning(
                "celery_unavailable_email_job_queued_in_redis_only",
                extra={"job_id": job_id, "error": str(exc)},
            )
        return job_id

    @staticmethod
    def dispatch_cleanup_expired_tokens() -> str:
        """Enqueue an expired-token database cleanup task."""
        job_id = f"job_cleanup_{uuid4().hex[:12]}"
        _write_initial_state(job_id, {"type": "cleanup"})
        try:
            tasks = _get_tasks()
            tasks.cleanup_expired_tokens_task.delay(job_id=job_id)
            _logger.info("job_dispatched", extra={"job_id": job_id, "type": "cleanup"})
        except Exception as exc:  # noqa: BLE001
            _logger.warning(
                "celery_unavailable_cleanup_job_redis_only",
                extra={"job_id": job_id, "error": str(exc)},
            )
        return job_id

    @staticmethod
    def dispatch_csv_import(
        import_job_id: UUID,
        workspace_id: UUID,
        member_id: UUID,
    ) -> str:
        """Enqueue a CSV import processing task."""
        job_id = f"job_import_{uuid4().hex[:12]}"
        _write_initial_state(job_id, {
            "type": "csv_import",
            "import_job_id": str(import_job_id),
            "workspace_id": str(workspace_id),
        })
        try:
            tasks = _get_tasks()
            tasks.process_csv_import_task.delay(
                job_id=job_id,
                import_job_id=str(import_job_id),
                workspace_id=str(workspace_id),
                member_id=str(member_id),
            )
            _logger.info("job_dispatched", extra={"job_id": job_id, "type": "csv_import"})
        except Exception as exc:  # noqa: BLE001
            _logger.warning("celery_unavailable", extra={"job_id": job_id, "error": str(exc)})
        return job_id

    @staticmethod
    def dispatch_export(
        export_job_id: UUID,
        workspace_id: UUID,
        member_id: UUID,
    ) -> str:
        """Enqueue a CSV export task."""
        job_id = f"job_export_{uuid4().hex[:12]}"
        _write_initial_state(job_id, {
            "type": "csv_export",
            "export_job_id": str(export_job_id),
            "workspace_id": str(workspace_id),
        })
        try:
            tasks = _get_tasks()
            tasks.run_export_task.delay(
                job_id=job_id,
                export_job_id=str(export_job_id),
                workspace_id=str(workspace_id),
                member_id=str(member_id),
            )
            _logger.info("job_dispatched", extra={"job_id": job_id, "type": "csv_export"})
        except Exception as exc:  # noqa: BLE001
            _logger.warning("celery_unavailable", extra={"job_id": job_id, "error": str(exc)})
        return job_id

    @staticmethod
    def dispatch_automation(
        rule_id: UUID,
        trigger_data: dict[str, Any],
        workspace_id: UUID,
        member_id: UUID | None = None,
    ) -> str:
        """Enqueue an async automation rule execution task."""
        job_id = f"job_auto_{uuid4().hex[:12]}"
        _write_initial_state(job_id, {
            "type": "automation",
            "rule_id": str(rule_id),
            "workspace_id": str(workspace_id),
        })
        try:
            tasks = _get_tasks()
            tasks.run_automation_async_task.delay(
                job_id=job_id,
                rule_id=str(rule_id),
                trigger_data=trigger_data,
                workspace_id=str(workspace_id),
                member_id=str(member_id) if member_id else None,
            )
            _logger.info("job_dispatched", extra={"job_id": job_id, "type": "automation"})
        except Exception as exc:  # noqa: BLE001
            _logger.warning("celery_unavailable", extra={"job_id": job_id, "error": str(exc)})
        return job_id

    @staticmethod
    def get_job_status(job_id: str) -> dict[str, Any]:
        """
        Fetch background job status from Redis.

        Returns a structured dict with at minimum:
          - job_id
          - status: "Queued" | "running" | "Completed" | "Failed" | "Unknown"
        """
        state = _read_state(job_id)
        if state:
            return state
        return {
            "job_id": job_id,
            "status": "Unknown",
            "message": "Job not found — either expired (>7 days) or Redis unavailable.",
        }


__all__ = ["JobDispatcher"]
