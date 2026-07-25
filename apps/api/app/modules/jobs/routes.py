"""
ForgeCRM API — Background Jobs Routes

FastAPI route for dispatching and querying background job execution status.

Documentation: docs/03_Backend/305_BACKGROUND_JOBS.md
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, status
from pydantic import BaseModel, Field

from app.core.dependencies import CurrentUser
from app.modules.jobs.dispatcher import JobDispatcher

router = APIRouter(prefix="/jobs", tags=["Background Jobs & Automation"])


class DispatchJobRequest(BaseModel):
    """Job dispatch request DTO."""

    job_type: str = Field("email", description="Type of job (e.g. email, cleanup)")
    target_email: str | None = Field(None, description="Destination email address for email jobs")
    subject: str | None = Field(None, description="Email subject line")
    body: str | None = Field(None, description="Email body content")


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
    description="Schedules an asynchronous background task.",
)
async def dispatch_job(
    payload: DispatchJobRequest,
    current_user: CurrentUser,
) -> JobStatusResponse:
    if payload.job_type == "email":
        job_id = JobDispatcher.dispatch_email(
            to_email=payload.target_email or current_user.email,
            subject=payload.subject or "ForgeCRM Notification",
            body=payload.body or "Notification body content",
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
    description="Returns current status of an asynchronous background job.",
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
