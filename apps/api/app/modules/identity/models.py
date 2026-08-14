"""
ForgeCRM API — Identity Domain Models

Database models for authentication, authorization, user management,
sessions, tokens, roles, and permissions.

Documentation: docs/02_Database/202_IDENTITY_SCHEMA.md
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import (
    BOOLEAN,
    VARCHAR,
    Column,
    DateTime,
    ForeignKey,
    Table,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, BaseModel, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    pass

# ── Junction Tables ───────────────────────────────────────────────────────────

role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", PG_UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", PG_UUID(as_uuid=True), ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)


class UserRole(Base):
    """Junction table associating users with roles."""

    __tablename__ = "user_roles"

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    role_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("roles.id", ondelete="CASCADE"),
        primary_key=True,
    )
    assigned_by: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


# ── Core Entity Models ────────────────────────────────────────────────────────


class User(BaseModel):
    """
    Represents an authenticated user account.

    Users own authentication credentials and personal settings.
    Workspace membership and permissions are linked via separate domains/junctions.
    """

    __tablename__ = "users"

    first_name: Mapped[str] = mapped_column(VARCHAR(100), nullable=False)
    last_name: Mapped[str] = mapped_column(VARCHAR(100), nullable=False)
    email: Mapped[str] = mapped_column(VARCHAR(255), nullable=False, unique=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone: Mapped[str | None] = mapped_column(VARCHAR(30), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    job_title: Mapped[str | None] = mapped_column(VARCHAR(150), nullable=True)
    timezone: Mapped[str] = mapped_column(VARCHAR(100), default="UTC", server_default="UTC", nullable=False)
    language: Mapped[str] = mapped_column(VARCHAR(30), default="en", server_default="en", nullable=False)
    is_active: Mapped[bool] = mapped_column(BOOLEAN, default=True, server_default="true", nullable=False, index=True)
    is_email_verified: Mapped[bool] = mapped_column(BOOLEAN, default=False, server_default="false", nullable=False)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    sessions: Mapped[list[Session]] = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    oauth_accounts: Mapped[list[OAuthAccount]] = relationship("OAuthAccount", back_populates="user", cascade="all, delete-orphan")
    roles: Mapped[list[Role]] = relationship("Role", secondary="user_roles", primaryjoin="User.id == UserRole.user_id", secondaryjoin="Role.id == UserRole.role_id", back_populates="users")

    __allow_unmapped__ = True

    # Transient state
    _current_session_id: UUID | None = None

    @property
    def full_name(self) -> str:
        """Return full name of user."""
        return f"{self.first_name} {self.last_name}"


class Role(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Defines a collection of permissions."""

    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(VARCHAR(100), nullable=False, unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_system: Mapped[bool] = mapped_column(BOOLEAN, default=False, server_default="false", nullable=False)

    # Relationships
    permissions: Mapped[list[Permission]] = relationship("Permission", secondary=role_permissions, back_populates="roles")
    users: Mapped[list[User]] = relationship("User", secondary="user_roles", primaryjoin="Role.id == UserRole.role_id", secondaryjoin="User.id == UserRole.user_id", back_populates="roles")


class Permission(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Defines an atomic permission in the format resource.action (e.g. leads.read)."""

    __tablename__ = "permissions"

    name: Mapped[str] = mapped_column(VARCHAR(150), nullable=False, unique=True, index=True)
    module: Mapped[str] = mapped_column(VARCHAR(100), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    roles: Mapped[list[Role]] = relationship("Role", secondary=role_permissions, back_populates="permissions")


class Session(BaseModel):
    """Tracks active user authentication sessions."""

    __tablename__ = "sessions"

    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    ip_address: Mapped[str | None] = mapped_column(VARCHAR(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    device_name: Mapped[str | None] = mapped_column(VARCHAR(255), nullable=True)
    platform: Mapped[str | None] = mapped_column(VARCHAR(100), nullable=True)
    browser: Mapped[str | None] = mapped_column(VARCHAR(100), nullable=True)
    country: Mapped[str | None] = mapped_column(VARCHAR(100), nullable=True)
    city: Mapped[str | None] = mapped_column(VARCHAR(100), nullable=True)
    last_activity_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    user: Mapped[User] = relationship("User", back_populates="sessions")
    refresh_tokens: Mapped[list[RefreshToken]] = relationship("RefreshToken", back_populates="session", cascade="all, delete-orphan")

    @property
    def is_active_session(self) -> bool:
        """Check if session is active (not revoked and not expired)."""
        now = datetime.now(UTC)
        # Normalize expires_at: SQLite returns timezone-naive datetimes even for
        # DateTime(timezone=True) columns; attach UTC so comparison is safe.
        expires = self.expires_at
        if expires is not None and expires.tzinfo is None:
            expires = expires.replace(tzinfo=UTC)
        return self.revoked_at is None and expires is not None and expires > now


class RefreshToken(BaseModel):
    """Stores hashed refresh tokens associated with a session."""

    __tablename__ = "refresh_tokens"

    session_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    session: Mapped[Session] = relationship("Session", back_populates="refresh_tokens")

    @property
    def is_valid(self) -> bool:
        """Check if refresh token is valid."""
        now = datetime.now(UTC)
        # Normalize expires_at: SQLite returns timezone-naive datetimes even for
        # DateTime(timezone=True) columns; attach UTC so comparison is safe.
        expires = self.expires_at
        if expires is not None and expires.tzinfo is None:
            expires = expires.replace(tzinfo=UTC)
        return self.revoked_at is None and expires is not None and expires > now


class OAuthAccount(BaseModel):
    """Links user account to an external OAuth provider (e.g. Google)."""

    __tablename__ = "oauth_accounts"

    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider: Mapped[str] = mapped_column(VARCHAR(50), nullable=False)
    provider_user_id: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    email: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)

    __table_args__ = (
        UniqueConstraint("provider", "provider_user_id", name="uq_oauth_provider_user_id"),
    )

    # Relationships
    user: Mapped[User] = relationship("User", back_populates="oauth_accounts")


class PasswordResetToken(BaseModel):
    """One-time tokens for password recovery."""

    __tablename__ = "password_reset_tokens"

    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class EmailVerificationToken(BaseModel):
    """One-time tokens for email verification."""

    __tablename__ = "email_verification_tokens"

    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


__all__ = [
    "EmailVerificationToken",
    "OAuthAccount",
    "PasswordResetToken",
    "Permission",
    "RefreshToken",
    "Role",
    "Session",
    "User",
    "UserRole",
    "role_permissions",
]
