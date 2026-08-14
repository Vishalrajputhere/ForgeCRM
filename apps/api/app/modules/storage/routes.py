"""
ForgeCRM API — Storage Domain Routes

FastAPI router for file uploads, upload confirmation, entity document attachments,
presigned download links, and attachment deletion.

Documentation: docs/03_Backend/307_FILE_STORAGE.md
"""

from __future__ import annotations

from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import (
    get_current_workspace_id,
    get_current_workspace_member,
    require_workspace_permission,
)
from app.db.session import get_db_session
from app.modules.storage.schemas import (
    ConfirmUploadRequest,
    DocumentAttachmentResponse,
    PresignedDownloadResponse,
    PresignedUploadResponse,
    RequestUploadUrlRequest,
)
from app.modules.storage.service import StorageService

router = APIRouter(prefix="/storage", tags=["File Storage & Attachments"])

WorkspaceIdDep = Annotated[UUID, Depends(get_current_workspace_id)]
WorkspaceMemberDep = Annotated[Any, Depends(get_current_workspace_member)]


@router.post(
    "/upload-url",
    response_model=PresignedUploadResponse,
    status_code=status.HTTP_200_OK,
    summary="Request Presigned Upload URL",
    description="Validates upload metadata (max 25 MB) and generates presigned URL & storage key.",
    dependencies=[Depends(require_workspace_permission("storage.upload"))],
)
async def request_upload_url(
    payload: RequestUploadUrlRequest,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> PresignedUploadResponse:
    service = StorageService(db)
    return await service.generate_upload_url(workspace_id, payload)


@router.post(
    "/confirm",
    response_model=DocumentAttachmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Confirm File Upload",
    description="Confirms file upload completion and creates DocumentAttachment metadata record.",
    dependencies=[Depends(require_workspace_permission("storage.upload"))],
)
async def confirm_upload(
    payload: ConfirmUploadRequest,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> DocumentAttachmentResponse:
    service = StorageService(db)
    return await service.confirm_upload(workspace_id, member.id, payload)


@router.get(
    "/attachments",
    response_model=list[DocumentAttachmentResponse],
    status_code=status.HTTP_200_OK,
    summary="List Document Attachments",
    description="Lists active document attachments for a workspace, with optional entity or search filters.",
    dependencies=[Depends(require_workspace_permission("storage.read"))],
)
async def list_attachments(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    entity_type: Annotated[str | None, Query(description="Optional filter by target CRM entity type (e.g. Company, Contact, Lead, Deal, Task)")] = None,
    entity_id: Annotated[UUID | None, Query(description="Optional filter by target CRM record ID")] = None,
    search: Annotated[str | None, Query(description="Optional search string by file name")] = None,
) -> list[DocumentAttachmentResponse]:
    service = StorageService(db)
    return await service.list_entity_attachments(
        workspace_id, entity_type=entity_type, entity_id=entity_id, search=search
    )


@router.get(
    "/attachments/{attachment_id}/download-url",
    response_model=PresignedDownloadResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Presigned Download URL",
    description="Generates short-lived presigned download URL for a document attachment.",
    dependencies=[Depends(require_workspace_permission("storage.read"))],
)
async def get_download_url(
    attachment_id: UUID,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> PresignedDownloadResponse:
    service = StorageService(db)
    return await service.generate_download_url(workspace_id, attachment_id)


@router.delete(
    "/attachments/{attachment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Attachment",
    description="Soft deletes a document attachment record.",
    dependencies=[Depends(require_workspace_permission("storage.delete"))],
)
async def delete_attachment(
    attachment_id: UUID,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    service = StorageService(db)
    await service.delete_attachment(workspace_id, attachment_id)
