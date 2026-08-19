"""
ForgeCRM API — Background Jobs Routes

FastAPI routes for dispatching and querying asynchronous background tasks.
Jobs are enqueued via Celery and their state is persisted in Redis.

Documentation: docs/03_Backend/305_BACKGROUND_JOBS.md
"""

from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser
from app.db.session import get_db_session
from app.modules.jobs.dispatcher import JobDispatcher

router = APIRouter(prefix="/jobs", tags=["Background Jobs & Automation"])


class DispatchJobRequest(BaseModel):
    """Job dispatch request DTO."""

    job_type: str = Field(
        "email",
        description="Type: email | cleanup | csv_import | csv_export",
    )
    target_email: str | None = Field(None, description="Destination email (for email jobs)")
    subject: str | None = Field(None, description="Email subject line")
    body: str | None = Field(None, description="Email body")
    import_job_id: UUID | None = Field(None, description="ImportJob UUID (for csv_import jobs)")
    export_job_id: UUID | None = Field(None, description="ExportJob UUID (for csv_export jobs)")
    workspace_id: UUID | None = Field(None, description="Target workspace UUID")


class JobStatusResponse(BaseModel):
    """Job status response DTO."""

    job_id: str
    status: str
    details: dict[str, Any] = {}


@router.post(
    "/dispatch",
    response_model=JobStatusResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Dispatch Background Job",
    description=(
        "Schedules an asynchronous background task via Celery. "
        "Returns a job_id you can poll with GET /jobs/status/{job_id}. "
        "Job state is persisted in Redis for 7 days."
    ),
)
async def dispatch_job(
    payload: DispatchJobRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db_session),
) -> JobStatusResponse:
    ws_id = payload.workspace_id

    if payload.job_type == "email":
        job_id = JobDispatcher.dispatch_email(
            to_email=payload.target_email or current_user.email,
            subject=payload.subject or "ForgeCRM Notification",
            body=payload.body or "Notification body content",
            workspace_id=ws_id,
        )

    elif payload.job_type == "cleanup":
        job_id = JobDispatcher.dispatch_cleanup_expired_tokens()

    elif payload.job_type == "csv_import" and payload.import_job_id and ws_id:
        job_id = JobDispatcher.dispatch_csv_import(
            import_job_id=payload.import_job_id,
            workspace_id=ws_id,
            member_id=current_user.id,
        )

    elif payload.job_type == "csv_export" and payload.export_job_id and ws_id:
        job_id = JobDispatcher.dispatch_export(
            export_job_id=payload.export_job_id,
            workspace_id=ws_id,
            member_id=current_user.id,
        )

    else:
        job_id = JobDispatcher.dispatch_cleanup_expired_tokens()

    status_data = JobDispatcher.get_job_status(job_id)
    return JobStatusResponse(
        job_id=job_id,
        status=status_data.get("status", "Queued"),
        details=status_data,
    )


@router.get(
    "/status/{job_id}",
    response_model=JobStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Job Status",
    description=(
        "Returns the current status of an asynchronous background job from Redis. "
        "Status values: Queued | running | Completed | Failed | Unknown."
    ),
)
async def get_job_status(
    job_id: str,
    current_user: CurrentUser,
) -> JobStatusResponse:
    status_data = JobDispatcher.get_job_status(job_id)
    return JobStatusResponse(
        job_id=job_id,
        status=status_data.get("status", "Unknown"),
        details=status_data,
    )
