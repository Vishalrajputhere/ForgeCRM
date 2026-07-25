"""
ForgeCRM API — Workspace Domain Models

Database models for multi-tenancy, workspaces, workspace memberships,
teams, invitations, and workspace settings.

Documentation: docs/02_Database/203_WORKSPACE_SCHEMA.md
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import (
    BOOLEAN,
    SMALLINT,
    VARCHAR,
    DateTime,
    ForeignKey,
    Integer,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, BaseModel, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.modules.identity.models import Role, User


class TeamMember(Base):
    """Junction table associating workspace members with teams."""

    __tablename__ = "team_members"

    team_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("teams.id", ondelete="CASCADE"),
        primary_key=True,
    )
    workspace_member_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("workspace_members.id", ondelete="CASCADE"),
        primary_key=True,
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class Workspace(BaseModel):
    """Represents a customer organization / tenant."""

    __tablename__ = "workspaces"

    name: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    slug: Mapped[str] = mapped_column(VARCHAR(150), nullable=False, unique=True, index=True)
    logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    industry: Mapped[str | None] = mapped_column(VARCHAR(100), nullable=True)
    website: Mapped[str | None] = mapped_column(Text, nullable=True)
    company_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    subscription_plan: Mapped[str] = mapped_column(VARCHAR(50), default="Free", server_default="Free", nullable=False)
    status: Mapped[str] = mapped_column(VARCHAR(30), default="Active", server_default="Active", nullable=False, index=True)

    # Relationships
    members: Mapped[list[WorkspaceMember]] = relationship("WorkspaceMember", back_populates="workspace", cascade="all, delete-orphan")
    teams: Mapped[list[Team]] = relationship("Team", back_populates="workspace", cascade="all, delete-orphan")
    invitations: Mapped[list[WorkspaceInvitation]] = relationship("WorkspaceInvitation", back_populates="workspace", cascade="all, delete-orphan")
    settings: Mapped[WorkspaceSettings | None] = relationship("WorkspaceSettings", back_populates="workspace", uselist=False, cascade="all, delete-orphan")


class WorkspaceMember(BaseModel):
    """Associates users with workspaces and defines their role within that workspace."""

    __tablename__ = "workspace_members"

    workspace_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(VARCHAR(30), default="Active", server_default="Active", nullable=False, index=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    invited_by: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    last_active_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_default_workspace: Mapped[bool] = mapped_column(BOOLEAN, default=False, server_default="false", nullable=False)

    __table_args__ = (
        UniqueConstraint("workspace_id", "user_id", name="uq_workspace_member_user"),
    )

    # Relationships
    workspace: Mapped[Workspace] = relationship("Workspace", back_populates="members")
    user: Mapped[User] = relationship("User")
    role: Mapped[Role] = relationship("Role")
    teams: Mapped[list[Team]] = relationship("Team", secondary="team_members", back_populates="members")


class Team(BaseModel):
    """Logical grouping of members within a workspace."""

    __tablename__ = "teams"

    workspace_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(VARCHAR(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    manager_member_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("workspace_members.id", ondelete="SET NULL"), nullable=True)

    __table_args__ = (
        UniqueConstraint("workspace_id", "name", name="uq_workspace_team_name"),
    )

    # Relationships
    workspace: Mapped[Workspace] = relationship("Workspace", back_populates="teams")
    members: Mapped[list[WorkspaceMember]] = relationship("WorkspaceMember", secondary="team_members", back_populates="teams")


class WorkspaceInvitation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Pending email invitations to join a workspace."""

    __tablename__ = "workspace_invitations"

    workspace_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    email: Mapped[str] = mapped_column(VARCHAR(255), nullable=False, index=True)
    role_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False)
    invited_by: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    invitation_token_hash: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    workspace: Mapped[Workspace] = relationship("Workspace", back_populates="invitations")
    role: Mapped[Role] = relationship("Role")

    @property
    def is_valid(self) -> bool:
        """Check if invitation is valid and not expired."""
        now = datetime.now(UTC)
        return self.accepted_at is None and self.expires_at > now


class WorkspaceSettings(Base, TimestampMixin):
    """Organization preferences for a workspace."""

    __tablename__ = "workspace_settings"

    workspace_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), primary_key=True)
    timezone: Mapped[str] = mapped_column(VARCHAR(100), default="UTC", server_default="UTC", nullable=False)
    currency: Mapped[str] = mapped_column(VARCHAR(20), default="USD", server_default="USD", nullable=False)
    language: Mapped[str] = mapped_column(VARCHAR(20), default="en", server_default="en", nullable=False)
    date_format: Mapped[str] = mapped_column(VARCHAR(20), default="YYYY-MM-DD", server_default="YYYY-MM-DD", nullable=False)
    time_format: Mapped[str] = mapped_column(VARCHAR(20), default="24h", server_default="24h", nullable=False)
    week_start_day: Mapped[int] = mapped_column(SMALLINT, default=1, server_default="1", nullable=False)
    branding_primary_color: Mapped[str | None] = mapped_column(VARCHAR(20), nullable=True)
    branding_logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    workspace: Mapped[Workspace] = relationship("Workspace", back_populates="settings")


__all__ = [
    "Team",
    "TeamMember",
    "Workspace",
    "WorkspaceInvitation",
    "WorkspaceMember",
    "WorkspaceSettings",
]
