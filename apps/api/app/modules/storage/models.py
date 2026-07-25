"""
ForgeCRM API — Storage Domain Models

Database models for Document Attachments linked to CRM Entities.

Documentation: docs/03_Backend/307_FILE_STORAGE.md
"""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import (
    BIGINT,
    VARCHAR,
    ForeignKey,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import BaseModel

if TYPE_CHECKING:
    from app.modules.workspace.models import WorkspaceMember


class DocumentAttachment(BaseModel):
    """Represents file metadata attached to a CRM record."""

    __tablename__ = "document_attachments"

    workspace_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    uploaded_by_member_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("workspace_members.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    entity_type: Mapped[str] = mapped_column(
        VARCHAR(50),
        nullable=False,
        index=True,
    )  # Company, Contact, Lead, Deal, Task
    entity_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    file_name: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    file_size: Mapped[int] = mapped_column(BIGINT, nullable=False)  # in bytes
    mime_type: Mapped[str] = mapped_column(VARCHAR(100), nullable=False)
    storage_key: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    storage_provider: Mapped[str] = mapped_column(VARCHAR(30), default="MinIO", server_default="MinIO", nullable=False)

    # Relationships
    uploaded_by_member: Mapped[WorkspaceMember] = relationship("WorkspaceMember")


__all__ = ["DocumentAttachment"]
