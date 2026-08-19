"""
ForgeCRM API — Celery Worker Application

Defines the Celery application instance connected to Redis as both
broker and result backend. All background tasks are registered here.

Usage:
    # Start the worker from apps/api/
    celery -A app.modules.jobs.worker worker --loglevel=info --concurrency=4

    # Start with Flower monitoring
    celery -A app.modules.jobs.worker flower --port=5555

Documentation: docs/03_Backend/305_BACKGROUND_JOBS.md
"""

from __future__ import annotations

import os

from celery import Celery

# ── Redis connection from environment (falls back to local dev default) ────────
REDIS_URL: str = os.environ.get(
    "REDIS_URL",
    "redis://localhost:6379/0",
)

# ── Celery Application ─────────────────────────────────────────────────────────
celery_app = Celery(
    "forgecrm",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

celery_app.conf.update(
    # Serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    # Timezone
    timezone="UTC",
    enable_utc=True,
    # Result storage
    result_expires=604_800,  # 7 days in seconds
    # Reliability
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
    # Task routes (queue separation)
    task_routes={
        "app.modules.jobs.tasks.send_email_task": {"queue": "email"},
        "app.modules.jobs.tasks.cleanup_expired_tokens_task": {"queue": "maintenance"},
        "app.modules.jobs.tasks.process_csv_import_task": {"queue": "import"},
        "app.modules.jobs.tasks.run_export_task": {"queue": "export"},
        "app.modules.jobs.tasks.run_automation_async_task": {"queue": "automation"},
        "app.modules.jobs.tasks.run_ai_skill_background_task": {"queue": "ai"},
    },
    # Auto-discover tasks in tasks.py
    imports=["app.modules.jobs.tasks"],
)

__all__ = ["celery_app"]
