"""
ForgeCRM API — SQLAlchemy Declarative Base

Defines the shared base model that all database models inherit from.
Provides common columns: id (UUIDv7), created_at, updated_at, deleted_at.

Documentation: docs/02_Database/201_DATABASE_OVERVIEW.md
Standards:
  - UUIDv7 primary keys (§6)
  - UTC timestamps (§7)
  - Soft deletes via deleted_at (§8)
  - snake_case naming (§17)
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import UUID

import uuid6
from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def generate_uuid7() -> UUID:
    """Generate a UUID version 7 (time-ordered) value."""
    return uuid6.uuid7()


class Base(DeclarativeBase):
    """
    SQLAlchemy declarative base for all ForgeCRM models.

    All subclasses automatically inherit the metadata registry
    used by Alembic for migration generation.
    """

    # Let subclasses define their own __tablename__
    __abstract__ = True

    def __repr__(self) -> str:
        columns = {c.name: getattr(self, c.name, None) for c in self.__table__.columns}  # type: ignore[attr-defined]
        attrs = ", ".join(f"{k}={v!r}" for k, v in columns.items())
        return f"{self.__class__.__name__}({attrs})"

    def to_dict(self) -> dict[str, Any]:
        """Return a dictionary representation of the model instance."""
        return {
            c.name: getattr(self, c.name)
            for c in self.__table__.columns  # type: ignore[attr-defined]
        }


class TimestampMixin:
    """
    Mixin that provides created_at and updated_at timestamp columns.

    Both are stored as UTC timestamps per the database standards.
    updated_at is automatically refreshed on every UPDATE.
    """

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        doc="UTC timestamp when the record was created.",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
        doc="UTC timestamp when the record was last updated.",
    )


class SoftDeleteMixin:
    """
    Mixin that provides soft delete functionality via deleted_at.

    When deleted_at is NULL the record is active.
    When deleted_at is set the record is soft-deleted.
    Repositories must filter on deleted_at IS NULL for all active queries.
    """

    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
        index=True,
        doc="UTC timestamp when the record was soft-deleted. NULL means active.",
    )

    @property
    def is_deleted(self) -> bool:
        """Return True if the record has been soft-deleted."""
        return self.deleted_at is not None


class UUIDPrimaryKeyMixin:
    """
    Mixin that adds a UUIDv7 primary key column named 'id'.

    UUIDv7 is time-ordered, which improves B-tree index performance
    over random UUID4 while remaining globally unique.
    """

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid7,
        doc="UUIDv7 primary key — time-ordered for index efficiency.",
    )


class AuditMixin(TimestampMixin):
    """
    Mixin that adds created_by and updated_by tracking columns.

    These reference user IDs but are not foreign-key constrained
    to avoid circular dependencies in the base layer.
    """

    created_by: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=True,
        doc="ID of the user who created this record.",
    )
    updated_by: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=True,
        doc="ID of the user who last updated this record.",
    )


class BaseModel(Base, UUIDPrimaryKeyMixin, AuditMixin, SoftDeleteMixin):
    """
    Abstract base model for all ForgeCRM business entities.

    Provides:
      - UUIDv7 primary key
      - created_at / updated_at timestamps (UTC)
      - created_by / updated_by audit tracking
      - Soft delete via deleted_at

    Every business table should inherit from this class unless there
    is a documented reason to use a more minimal base.
    """

    __abstract__ = True


__all__ = [
    "AuditMixin",
    "Base",
    "BaseModel",
    "SoftDeleteMixin",
    "TimestampMixin",
    "UUIDPrimaryKeyMixin",
    "generate_uuid7",
]
