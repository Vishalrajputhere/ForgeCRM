"""
ForgeCRM API — Storage Domain Service Layer (Cloudinary Engine)

Implements Cloudinary object storage abstraction, validates file size limits (25 MB max),
generates secure SHA-1 Cloudinary upload signatures and parameters, formats download & preview URLs,
handles document attachment metadata in PostgreSQL, and logs timeline activities.

Documentation: docs/03_Backend/307_FILE_STORAGE.md
"""

from __future__ import annotations

import hashlib
import time
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
    """Service layer for Cloudinary document storage and attachments."""

    def __init__(self, db: AsyncSession, settings: Settings | None = None) -> None:
        self.db = db
        self.settings = settings or get_settings()
        self.activity_repo = ActivityRepository(db)

    def _get_cloudinary_credentials(self) -> tuple[str, str, str]:
        """Extract Cloudinary cloud_name, api_key, and api_secret from environment settings or URL."""
        cloud_name = self.settings.CLOUDINARY_CLOUD_NAME or "dgvpkop35"
        api_key = (
            self.settings.CLOUDINARY_API_KEY.get_secret_value()
            if self.settings.CLOUDINARY_API_KEY
            else "496284229833388"
        )
        api_secret = (
            self.settings.CLOUDINARY_API_SECRET.get_secret_value()
            if self.settings.CLOUDINARY_API_SECRET
            else "hHMrx1sQSOCAWjytZMfbnDJwj38"
        )

        if self.settings.CLOUDINARY_URL:
            raw_url = self.settings.CLOUDINARY_URL.get_secret_value()
            # Format: cloudinary://api_key:api_secret@cloud_name
            if raw_url.startswith("cloudinary://"):
                try:
                    credentials, cname = raw_url.replace("cloudinary://", "").split("@")
                    k, s = credentials.split(":")
                    cloud_name = cname.strip()
                    api_key = k.strip()
                    api_secret = s.strip()
                except Exception as e:
                    logger.warning("cloudinary_url_parse_error", error=str(e))

        return cloud_name, api_key, api_secret

    async def generate_upload_url(
        self,
        workspace_id: UUID,
        payload: RequestUploadUrlRequest,
    ) -> PresignedUploadResponse:
        """
        Validate file metadata and generate Cloudinary signed upload parameters.

        Folder Pattern: {workspace_id}/{entity_type}s/{entity_id}
        """
        if payload.file_size > MAX_FILE_SIZE_BYTES:
            raise FileSizeExceededError()

        cloud_name, api_key, api_secret = self._get_cloudinary_credentials()

        # Sanitize entity folder name
        entity_folder = payload.entity_type.lower()
        if not entity_folder.endswith("s"):
            entity_folder = f"{entity_folder}s"

        folder = f"{workspace_id}/{entity_folder}/{payload.entity_id}"
        
        # Clean public_id
        safe_filename = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in payload.file_name.rsplit(".", 1)[0])
        public_id = f"{safe_filename}_{uuid4().hex[:8]}"
        storage_key = f"{folder}/{public_id}"

        timestamp = int(time.time())

        # Generate Cloudinary SHA-1 upload signature
        params_to_sign = {
            "folder": folder,
            "public_id": public_id,
            "timestamp": str(timestamp),
        }
        sorted_param_str = "&".join(f"{k}={v}" for k, v in sorted(params_to_sign.items()))
        string_to_sign = f"{sorted_param_str}{api_secret}"
        signature = hashlib.sha1(string_to_sign.encode("utf-8")).hexdigest()

        upload_url = f"https://api.cloudinary.com/v1_1/{cloud_name}/auto/upload"

        logger.info(
            "cloudinary_upload_signature_generated",
            workspace_id=str(workspace_id),
            storage_key=storage_key,
            cloud_name=cloud_name,
        )

        return PresignedUploadResponse(
            storage_key=storage_key,
            upload_url=upload_url,
            expires_in_seconds=900,
            cloud_name=cloud_name,
            api_key=api_key,
            timestamp=timestamp,
            signature=signature,
            folder=folder,
            public_id=public_id,
        )

    async def confirm_upload(
        self,
        workspace_id: UUID,
        member_id: UUID,
        payload: ConfirmUploadRequest,
    ) -> DocumentAttachmentResponse:
        """Save DocumentAttachment metadata record in PostgreSQL after successful upload."""
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
            storage_provider="Cloudinary",
        )
        self.db.add(attachment)
        await self.db.flush()

        # Log timeline activity event
        act_type = await self.activity_repo.get_or_create_activity_type(
            "Document Uploaded", category="Storage"
        )
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

        logger.info(
            "document_attachment_confirmed_cloudinary",
            attachment_id=str(attachment.id),
            file_name=payload.file_name,
        )

        return DocumentAttachmentResponse.model_validate(attachment)

    async def list_entity_attachments(
        self,
        workspace_id: UUID,
        entity_type: str | None = None,
        entity_id: UUID | None = None,
        search: str | None = None,
    ) -> list[DocumentAttachmentResponse]:
        """List active document attachments for a workspace, optionally filtered by entity or search."""
        conditions = [
            DocumentAttachment.workspace_id == workspace_id,
            DocumentAttachment.deleted_at.is_(None),
        ]
        if entity_type and entity_type.strip() and entity_type.strip().lower() != "all":
            conditions.append(DocumentAttachment.entity_type == entity_type.strip())
        if entity_id:
            conditions.append(DocumentAttachment.entity_id == entity_id)
        if search:
            conditions.append(DocumentAttachment.file_name.ilike(f"%{search}%"))

        stmt = (
            select(DocumentAttachment)
            .where(*conditions)
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
        """Generate Cloudinary asset download / preview URL for a document attachment."""
        stmt = select(DocumentAttachment).where(
            DocumentAttachment.id == attachment_id,
            DocumentAttachment.workspace_id == workspace_id,
            DocumentAttachment.deleted_at.is_(None),
        )
        result = await self.db.execute(stmt)
        attachment = result.scalar_one_or_none()

        if attachment is None:
            raise AttachmentNotFoundError()

        cloud_name, _, _ = self._get_cloudinary_credentials()

        file_name_lower = (attachment.file_name or "").lower()
        mime_type_lower = (attachment.mime_type or "").lower()
        is_image_or_pdf = (
            mime_type_lower.startswith("image/")
            or mime_type_lower == "application/pdf"
            or file_name_lower.endswith(
                (".pdf", ".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif", ".bmp", ".tiff", ".heic", ".ico")
            )
        )
        resource_type = "image" if is_image_or_pdf else "raw"

        # Generate Cloudinary delivery URL
        download_url = f"https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{attachment.storage_key}"

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
