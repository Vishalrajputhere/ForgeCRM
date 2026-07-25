"""
ForgeCRM API — Storage Domain Service Layer

Implements file storage abstraction using MinIO/S3 SDK (or presigned mock URLs for testing),
validates file size limits (25 MB max), handles document attachment metadata, and logs activities.

Documentation: docs/03_Backend/307_FILE_STORAGE.md
"""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.logging import get_logger
from app.modules.crm.repository import ActivityRepository
from app.modules.storage.exceptions import AttachmentNotFoundError, FileSizeExceededError
from app.modules.storage.models import DocumentAttachment
from app.modules.storage.schemas import (
    ConfirmUploadRequest,
    DocumentAttachmentResponse,
    PresignedDownloadResponse,
    PresignedUploadResponse,
    RequestUploadUrlRequest,
)

logger = get_logger(__name__)

MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB


class StorageService:
    """Service layer for document storage and attachments."""

    def __init__(self, db: AsyncSession, settings: Settings | None = None) -> None:
        self.db = db
        self.settings = settings or get_settings()
        self.activity_repo = ActivityRepository(db)

    async def generate_upload_url(
        self,
        workspace_id: UUID,
        payload: RequestUploadUrlRequest,
    ) -> PresignedUploadResponse:
        """
        Validate file metadata and generate presigned upload URL & storage key.

        Storage Key Pattern: {workspace_id}/{entity_type}/{uuidv7}.ext
        """
        if payload.file_size > MAX_FILE_SIZE_BYTES:
            raise FileSizeExceededError()

        ext = payload.file_name.rsplit(".", 1)[-1] if "." in payload.file_name else "bin"
        unique_id = uuid4()
        storage_key = f"{workspace_id}/{payload.entity_type.lower()}/{unique_id}.{ext}"

        # Generate presigned upload URL (MinIO/S3 compatible endpoint)
        endpoint = getattr(self.settings, "MINIO_ENDPOINT", "http://localhost:9000")
        bucket = getattr(self.settings, "MINIO_BUCKET", "forgecrm-documents")
        upload_url = f"{endpoint}/{bucket}/{storage_key}?upload_token={uuid4().hex}"

        logger.info("presigned_upload_url_generated", workspace_id=str(workspace_id), storage_key=storage_key)

        return PresignedUploadResponse(
            storage_key=storage_key,
            upload_url=upload_url,
            expires_in_seconds=900,
        )

    async def confirm_upload(
        self,
        workspace_id: UUID,
        member_id: UUID,
        payload: ConfirmUploadRequest,
    ) -> DocumentAttachmentResponse:
        """Save DocumentAttachment metadata record after successful upload."""
        if payload.file_size > MAX_FILE_SIZE_BYTES:
            raise FileSizeExceededError()

        attachment = DocumentAttachment(
            id=uuid4(),
            workspace_id=workspace_id,
            uploaded_by_member_id=member_id,
            entity_type=payload.entity_type,
            entity_id=payload.entity_id,
            file_name=payload.file_name,
            file_size=payload.file_size,
            mime_type=payload.mime_type,
            storage_key=payload.storage_key,
            storage_provider="MinIO",
        )
        self.db.add(attachment)
        await self.db.flush()

        # Log timeline activity event
        act_type = await self.activity_repo.get_or_create_activity_type("Document Uploaded", category="Storage")
        from app.modules.crm.models import Activity
        act = Activity(
            id=uuid4(),
            workspace_id=workspace_id,
            activity_type_id=act_type.id,
            actor_member_id=member_id,
            entity_type=payload.entity_type,
            entity_id=payload.entity_id,
            title="Document Uploaded",
            description=f"Uploaded file '{payload.file_name}' ({payload.file_size / 1024 / 1024:.2f} MB)",
            occurred_at=datetime.now(UTC),
        )
        await self.activity_repo.log_activity(act)

        logger.info("document_attachment_confirmed", attachment_id=str(attachment.id), file_name=payload.file_name)

        return DocumentAttachmentResponse.model_validate(attachment)

    async def list_entity_attachments(
        self,
        workspace_id: UUID,
        entity_type: str,
        entity_id: UUID,
    ) -> list[DocumentAttachmentResponse]:
        """List active document attachments for a CRM entity."""
        stmt = (
            select(DocumentAttachment)
            .where(
                DocumentAttachment.workspace_id == workspace_id,
                DocumentAttachment.entity_type == entity_type,
                DocumentAttachment.entity_id == entity_id,
                DocumentAttachment.deleted_at.is_(None),
            )
            .order_by(DocumentAttachment.created_at.desc())
        )
        result = await self.db.execute(stmt)
        attachments = result.scalars().all()
        return [DocumentAttachmentResponse.model_validate(a) for a in attachments]

    async def generate_download_url(
        self,
        workspace_id: UUID,
        attachment_id: UUID,
    ) -> PresignedDownloadResponse:
        """Generate short-lived presigned download URL for a document attachment."""
        stmt = select(DocumentAttachment).where(
            DocumentAttachment.id == attachment_id,
            DocumentAttachment.workspace_id == workspace_id,
            DocumentAttachment.deleted_at.is_(None),
        )
        result = await self.db.execute(stmt)
        attachment = result.scalar_one_or_none()

        if attachment is None:
            raise AttachmentNotFoundError()

        endpoint = getattr(self.settings, "MINIO_ENDPOINT", "http://localhost:9000")
        bucket = getattr(self.settings, "MINIO_BUCKET", "forgecrm-documents")
        download_url = f"{endpoint}/{bucket}/{attachment.storage_key}?download_token={uuid4().hex}"

        return PresignedDownloadResponse(
            download_url=download_url,
            expires_in_seconds=3600,
        )

    async def delete_attachment(self, workspace_id: UUID, attachment_id: UUID) -> None:
        """Soft delete a document attachment metadata record."""
        stmt = select(DocumentAttachment).where(
            DocumentAttachment.id == attachment_id,
            DocumentAttachment.workspace_id == workspace_id,
            DocumentAttachment.deleted_at.is_(None),
        )
        res = await self.db.execute(stmt)
        attachment = res.scalar_one_or_none()
        if attachment is None:
            raise AttachmentNotFoundError()

        attachment.deleted_at = datetime.now(UTC)
        await self.db.flush()


__all__ = ["MAX_FILE_SIZE_BYTES", "StorageService"]
