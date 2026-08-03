"""
ForgeCRM API — Workspace Domain Repository Layer

Database operations for multi-tenancy, workspace memberships, teams,
invitations, and workspace settings.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md §5 (Repository Layer)
"""

from __future__ import annotations

from collections.abc import Sequence
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.identity.models import Role
from app.modules.workspace.models import (
    Team,
    Workspace,
    WorkspaceInvitation,
    WorkspaceMember,
    WorkspaceSettings,
)


class WorkspaceRepository:
    """Repository for Workspace database operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, workspace: Workspace) -> Workspace:
        """Create a new workspace entity."""
        self.db.add(workspace)
        await self.db.flush()
        return workspace

    async def get_by_id(self, workspace_id: UUID) -> Workspace | None:
        """Fetch active workspace by ID with settings."""
        stmt = (
            select(Workspace)
            .options(selectinload(Workspace.settings))
            .where(Workspace.id == workspace_id, Workspace.deleted_at.is_(None))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Workspace | None:
        """Fetch workspace by unique URL slug."""
        stmt = (
            select(Workspace)
            .where(Workspace.slug == slug.strip().lower(), Workspace.deleted_at.is_(None))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_user_workspaces(self, user_id: UUID) -> Sequence[tuple[Workspace, Role]]:
        """List all active workspaces that a user belongs to along with their role."""
        stmt = (
            select(Workspace, Role)
            .options(selectinload(Role.permissions))
            .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
            .join(Role, Role.id == WorkspaceMember.role_id)
            .where(
                WorkspaceMember.user_id == user_id,
                WorkspaceMember.status == "Active",
                Workspace.deleted_at.is_(None),
            )
            .order_by(Workspace.name.asc())
        )
        result = await self.db.execute(stmt)
        return [(row[0], row[1]) for row in result.all()]


class WorkspaceMemberRepository:
    """Repository for WorkspaceMember operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def add_member(self, member: WorkspaceMember) -> WorkspaceMember:
        """Add a member to a workspace."""
        self.db.add(member)
        await self.db.flush()
        return member

    async def get_member(self, workspace_id: UUID, user_id: UUID) -> WorkspaceMember | None:
        """Fetch workspace member record with role and user loaded."""
        stmt = (
            select(WorkspaceMember)
            .options(
                selectinload(WorkspaceMember.role).selectinload(Role.permissions),
                selectinload(WorkspaceMember.user),
            )
            .where(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user_id,
                WorkspaceMember.deleted_at.is_(None),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id(self, member_id: UUID) -> WorkspaceMember | None:
        """Fetch member by member ID."""
        stmt = (
            select(WorkspaceMember)
            .options(
                selectinload(WorkspaceMember.role).selectinload(Role.permissions),
                selectinload(WorkspaceMember.user),
            )
            .where(WorkspaceMember.id == member_id, WorkspaceMember.deleted_at.is_(None))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_workspace_members(self, workspace_id: UUID) -> Sequence[WorkspaceMember]:
        """List all members belonging to a workspace."""
        stmt = (
            select(WorkspaceMember)
            .options(
                selectinload(WorkspaceMember.role).selectinload(Role.permissions),
                selectinload(WorkspaceMember.user),
            )
            .where(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.deleted_at.is_(None),
            )
            .order_by(WorkspaceMember.joined_at.asc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()


class TeamRepository:
    """Repository for Team operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, team: Team) -> Team:
        """Create a team entity."""
        self.db.add(team)
        await self.db.flush()
        return team

    async def get_by_id(self, team_id: UUID) -> Team | None:
        """Fetch team by ID."""
        stmt = (
            select(Team)
            .options(selectinload(Team.members))
            .where(Team.id == team_id, Team.deleted_at.is_(None))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_workspace_teams(self, workspace_id: UUID) -> Sequence[Team]:
        """List all teams within a workspace."""
        stmt = (
            select(Team)
            .options(selectinload(Team.members))
            .where(Team.workspace_id == workspace_id, Team.deleted_at.is_(None))
            .order_by(Team.name.asc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()


class InvitationRepository:
    """Repository for WorkspaceInvitation operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, invitation: WorkspaceInvitation) -> WorkspaceInvitation:
        """Create an invitation record."""
        self.db.add(invitation)
        await self.db.flush()
        return invitation

    async def get_by_token_hash(self, token_hash: str) -> WorkspaceInvitation | None:
        """Fetch invitation by token hash."""
        stmt = (
            select(WorkspaceInvitation)
            .options(
                selectinload(WorkspaceInvitation.workspace),
                selectinload(WorkspaceInvitation.role),
            )
            .where(
                WorkspaceInvitation.invitation_token_hash == token_hash,
                WorkspaceInvitation.accepted_at.is_(None),
                WorkspaceInvitation.expires_at > datetime.now(UTC),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def mark_accepted(self, invitation_id: UUID) -> None:
        """Mark invitation as accepted."""
        stmt = (
            update(WorkspaceInvitation)
            .where(WorkspaceInvitation.id == invitation_id)
            .values(accepted_at=datetime.now(UTC))
        )
        await self.db.execute(stmt)


class WorkspaceSettingsRepository:
    """Repository for WorkspaceSettings operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_or_update(self, settings: WorkspaceSettings) -> WorkspaceSettings:
        """Save workspace settings."""
        self.db.add(settings)
        await self.db.flush()
        return settings

    async def get_by_workspace_id(self, workspace_id: UUID) -> WorkspaceSettings | None:
        """Fetch settings for workspace."""
        stmt = select(WorkspaceSettings).where(WorkspaceSettings.workspace_id == workspace_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()


__all__ = [
    "InvitationRepository",
    "TeamRepository",
    "WorkspaceMemberRepository",
    "WorkspaceRepository",
    "WorkspaceSettingsRepository",
]
