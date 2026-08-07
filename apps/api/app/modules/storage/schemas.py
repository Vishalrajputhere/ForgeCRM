"""
ForgeCRM API — Storage Domain Schemas

Request and Response DTOs for presigned upload URLs, upload confirmation,
document attachment listings, and presigned download URLs.

Documentation: docs/03_Backend/307_FILE_STORAGE.md
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

# ── Response DTOs ─────────────────────────────────────────────────────────────


class PresignedUploadResponse(BaseModel):
    """Presigned upload URL response DTO."""

    storage_key: str
    upload_url: str
    expires_in_seconds: int = 900  # 15 minutes
    cloud_name: str | None = None
    api_key: str | None = None
    timestamp: int | None = None
    signature: str | None = None
    folder: str | None = None
    public_id: str | None = None


class DocumentAttachmentResponse(BaseModel):
    """Document attachment DTO."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    uploaded_by_member_id: UUID
    entity_type: str
    entity_id: UUID
    file_name: str
    file_size: int
    mime_type: str
    storage_key: str
    storage_provider: str
    created_at: datetime


class PresignedDownloadResponse(BaseModel):
    """Presigned download URL response DTO."""

    download_url: str
    expires_in_seconds: int = 3600  # 1 hour


# ── Request DTOs ──────────────────────────────────────────────────────────────


class RequestUploadUrlRequest(BaseModel):
    """Upload request DTO."""

    entity_type: str = Field(..., max_length=50)  # Company, Contact, Lead, Deal, Task
    entity_id: UUID
    file_name: str = Field(..., min_length=1, max_length=255)
    file_size: int = Field(..., ge=1, le=26214400)  # 25 MB max (25 * 1024 * 1024)
    mime_type: str = Field(..., max_length=100)


class ConfirmUploadRequest(BaseModel):
    """Upload confirmation request DTO."""

    storage_key: str
    entity_type: str = Field(..., max_length=50)
    entity_id: UUID
    file_name: str = Field(..., min_length=1, max_length=255)
    file_size: int = Field(..., ge=1)
    mime_type: str = Field(..., max_length=100)


__all__ = [
    "ConfirmUploadRequest",
    "DocumentAttachmentResponse",
    "PresignedDownloadResponse",
    "PresignedUploadResponse",
    "RequestUploadUrlRequest",
]
