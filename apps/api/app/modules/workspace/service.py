"""
ForgeCRM API — Workspace Domain Business Service

Coordinates tenant creation, workspace memberships, slug generation,
invitation flows, teams, and workspace settings.

Documentation:
  docs/03_Backend/301_BACKEND_OVERVIEW.md §5 (Service Layer)
  docs/02_Database/203_WORKSPACE_SCHEMA.md
"""

from __future__ import annotations

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.logging import get_logger
from app.modules.identity.permissions import SystemRoles
from app.modules.identity.repository import RoleRepository, UserRepository
from app.modules.identity.schemas import RoleResponse
from app.modules.workspace.exceptions import (
    AlreadyMemberError,
    InvitationExpiredError,
    InvitationNotFoundError,
    WorkspaceAccessDeniedError,
    WorkspaceNotFoundError,
    WorkspaceSlugAlreadyExistsError,
)
from app.modules.workspace.models import (
    Team,
    Workspace,
    WorkspaceInvitation,
    WorkspaceMember,
    WorkspaceSettings,
)
from app.modules.workspace.repository import (
    InvitationRepository,
    TeamRepository,
    WorkspaceMemberRepository,
    WorkspaceRepository,
    WorkspaceSettingsRepository,
)
from app.modules.workspace.schemas import (
    InviteMemberRequest,
    TeamCreate,
    TeamResponse,
    WorkspaceCreate,
    WorkspaceInvitationResponse,
    WorkspaceMemberResponse,
    WorkspaceResponse,
    WorkspaceSettingsResponse,
    WorkspaceSettingsUpdate,
    WorkspaceUpdate,
)
from app.modules.workspace.validators import generate_workspace_slug

logger = get_logger(__name__)


def hash_token(token_str: str) -> str:
    """Hash invitation token using SHA-256."""
    return hashlib.sha256(token_str.encode("utf-8")).hexdigest()


class WorkspaceService:
    """Service layer for Workspace domain workflows."""

    def __init__(self, db: AsyncSession, settings: Settings | None = None) -> None:
        self.db = db
        self.settings = settings or get_settings()
        self.workspace_repo = WorkspaceRepository(db)
        self.member_repo = WorkspaceMemberRepository(db)
        self.team_repo = TeamRepository(db)
        self.invitation_repo = InvitationRepository(db)
        self.settings_repo = WorkspaceSettingsRepository(db)
        self.role_repo = RoleRepository(db)
        self.user_repo = UserRepository(db)

    async def create_workspace(self, user_id: UUID, payload: WorkspaceCreate) -> WorkspaceResponse:
        """
        Create a new customer workspace / organization.

        Creates the workspace entity, initializes default workspace settings,
        and assigns the creating user as Workspace Admin.
        """
        # 1. Slug generation and uniqueness validation
        slug = payload.slug if payload.slug else generate_workspace_slug(payload.name)
        existing = await self.workspace_repo.get_by_slug(slug)
        if existing is not None:
            # If slug exists and was auto-generated, append random suffix
            if not payload.slug:
                slug = f"{slug}-{secrets.token_hex(3)}"
            else:
                raise WorkspaceSlugAlreadyExistsError()

        # 2. Create Workspace entity
        workspace = Workspace(
            name=payload.name,
            slug=slug,
            industry=payload.industry,
            website=payload.website,
            company_size=payload.company_size,
            subscription_plan="Free",
            status="Active",
            created_by=user_id,
        )
        workspace = await self.workspace_repo.create(workspace)

        # 3. Create default WorkspaceSettings record
        settings = WorkspaceSettings(
            workspace_id=workspace.id,
            timezone="UTC",
            currency="USD",
            language="en",
        )
        await self.settings_repo.create_or_update(settings)

        # 4. Fetch Workspace Admin system role
        admin_role = await self.role_repo.get_by_name(SystemRoles.WORKSPACE_ADMIN)
        if admin_role is None:
            # Fallback to Super Admin or first available role if not seeded
            roles = await self.role_repo.get_by_name(SystemRoles.SUPER_ADMIN)
            admin_role = roles

        # 5. Create Owner Membership record
        member = WorkspaceMember(
            workspace_id=workspace.id,
            user_id=user_id,
            role_id=admin_role.id,  # type: ignore[union-attr]
            status="Active",
            is_default_workspace=True,
        )
        await self.member_repo.add_member(member)
        await self.db.commit()

        logger.info("workspace_created", workspace_id=str(workspace.id), user_id=str(user_id))

        return WorkspaceResponse(
            id=workspace.id,
            name=workspace.name,
            slug=workspace.slug,
            logo_url=workspace.logo_url,
            industry=workspace.industry,
            website=workspace.website,
            company_size=workspace.company_size,
            subscription_plan=workspace.subscription_plan,
            status=workspace.status,
            created_at=workspace.created_at,
            role=RoleResponse.model_validate(admin_role) if admin_role else None,
        )

    async def list_user_workspaces(self, user_id: UUID) -> list[WorkspaceResponse]:
        """List all workspaces that a user is an active member of. Auto-creates a default workspace if user has none."""
        rows = await self.workspace_repo.list_user_workspaces(user_id)
        if not rows:
            user = await self.user_repo.get_by_id(user_id)
            if user:
                default_name = f"{user.first_name}'s Workspace" if user.first_name else "My Workspace"
                await self.create_workspace(
                    user_id=user_id,
                    payload=WorkspaceCreate(name=default_name),
                )
                await self.db.commit()
                rows = await self.workspace_repo.list_user_workspaces(user_id)

        return [
            WorkspaceResponse(
                id=ws.id,
                name=ws.name,
                slug=ws.slug,
                logo_url=ws.logo_url,
                industry=ws.industry,
                website=ws.website,
                company_size=ws.company_size,
                subscription_plan=ws.subscription_plan,
                status=ws.status,
                created_at=ws.created_at,
                role=RoleResponse.model_validate(role),
            )
            for ws, role in rows
        ]

    async def get_workspace_details(self, user_id: UUID, workspace_id: UUID) -> WorkspaceResponse:
        """Get details for a workspace if user is a member."""
        member = await self.member_repo.get_member(workspace_id, user_id)
        if member is None or member.status != "Active":
            raise WorkspaceAccessDeniedError()

        workspace = await self.workspace_repo.get_by_id(workspace_id)
        if workspace is None:
            raise WorkspaceNotFoundError()

        return WorkspaceResponse(
            id=workspace.id,
            name=workspace.name,
            slug=workspace.slug,
            logo_url=workspace.logo_url,
            industry=workspace.industry,
            website=workspace.website,
            company_size=workspace.company_size,
            subscription_plan=workspace.subscription_plan,
            status=workspace.status,
            created_at=workspace.created_at,
            role=RoleResponse.model_validate(member.role),
        )

    async def update_workspace(
        self,
        user_id: UUID,
        workspace_id: UUID,
        payload: WorkspaceUpdate,
    ) -> WorkspaceResponse:
        """Update workspace details."""
        member = await self.member_repo.get_member(workspace_id, user_id)
        if member is None or member.status != "Active":
            raise WorkspaceAccessDeniedError()

        workspace = await self.workspace_repo.get_by_id(workspace_id)
        if workspace is None:
            raise WorkspaceNotFoundError()

        if payload.name is not None:
            workspace.name = payload.name
        if payload.logo_url is not None:
            workspace.logo_url = payload.logo_url
        if payload.industry is not None:
            workspace.industry = payload.industry
        if payload.website is not None:
            workspace.website = payload.website
        if payload.company_size is not None:
            workspace.company_size = payload.company_size

        await self.db.flush()

        return WorkspaceResponse(
            id=workspace.id,
            name=workspace.name,
            slug=workspace.slug,
            logo_url=workspace.logo_url,
            industry=workspace.industry,
            website=workspace.website,
            company_size=workspace.company_size,
            subscription_plan=workspace.subscription_plan,
            status=workspace.status,
            created_at=workspace.created_at,
            role=RoleResponse.model_validate(member.role),
        )

    async def invite_member(
        self,
        invited_by_id: UUID,
        workspace_id: UUID,
        payload: InviteMemberRequest,
    ) -> WorkspaceInvitationResponse:
        """Invite a user to join a workspace by email."""
        # 1. Verify inviter is an active workspace member
        inviter = await self.member_repo.get_member(workspace_id, invited_by_id)
        if inviter is None or inviter.status != "Active":
            raise WorkspaceAccessDeniedError()

        # 2. Check if invited user is already a member
        target_user = await self.user_repo.get_by_email(payload.email)
        if target_user is not None:
            existing_member = await self.member_repo.get_member(workspace_id, target_user.id)
            if existing_member is not None and existing_member.status == "Active":
                raise AlreadyMemberError()

        # 3. Create single-use invitation token
        raw_token = secrets.token_urlsafe(32)
        token_h = hash_token(raw_token)
        expires_at = datetime.now(UTC) + timedelta(days=7)

        invitation = WorkspaceInvitation(
            workspace_id=workspace_id,
            email=payload.email.lower().strip(),
            role_id=payload.role_id,
            invited_by=invited_by_id,
            invitation_token_hash=token_h,
            expires_at=expires_at,
        )
        invitation = await self.invitation_repo.create(invitation)

        logger.info("workspace_invitation_created", workspace_id=str(workspace_id), email=payload.email)

        # Re-fetch with loaded role
        full_inv = await self.invitation_repo.get_by_token_hash(token_h)
        res = WorkspaceInvitationResponse.model_validate(full_inv)
        res.raw_token = raw_token
        return res

    async def accept_invitation(self, user_id: UUID, token_str: str) -> WorkspaceMemberResponse:
        """Accept a workspace invitation with token."""
        token_h = hash_token(token_str)
        invitation = await self.invitation_repo.get_by_token_hash(token_h)

        if invitation is None:
            raise InvitationNotFoundError()

        if not invitation.is_valid:
            raise InvitationExpiredError()

        workspace_id = invitation.workspace_id

        # Check if already a member
        existing_member = await self.member_repo.get_member(workspace_id, user_id)
        if existing_member is not None:

            if existing_member.status == "Active":
                raise AlreadyMemberError()

            existing_member.status = "Active"
            existing_member.role_id = invitation.role_id
            await self.db.flush()
            member = existing_member

        else:
            member = WorkspaceMember(
                workspace_id=workspace_id,
                user_id=user_id,
                role_id=invitation.role_id,
                status="Active",
                invited_by=invitation.invited_by,
            )
            member = await self.member_repo.add_member(member)

        # Mark invitation accepted
        await self.invitation_repo.mark_accepted(invitation.id)

        full_member = await self.member_repo.get_member(workspace_id, user_id)
        return WorkspaceMemberResponse.model_validate(full_member)

    async def list_workspace_members(self, user_id: UUID, workspace_id: UUID) -> list[WorkspaceMemberResponse]:
        """List members of a workspace."""
        member = await self.member_repo.get_member(workspace_id, user_id)
        if member is None or member.status != "Active":
            raise WorkspaceAccessDeniedError()

        members = await self.member_repo.list_workspace_members(workspace_id)
        return [WorkspaceMemberResponse.model_validate(m) for m in members]

    async def create_team(self, user_id: UUID, workspace_id: UUID, payload: TeamCreate) -> TeamResponse:
        """Create a team in a workspace."""
        member = await self.member_repo.get_member(workspace_id, user_id)
        if member is None or member.status != "Active":
            raise WorkspaceAccessDeniedError()

        team = Team(
            workspace_id=workspace_id,
            name=payload.name,
            description=payload.description,
            manager_member_id=payload.manager_member_id,
        )
        team = await self.team_repo.create(team)
        return TeamResponse.model_validate(team)

    async def list_workspace_teams(self, user_id: UUID, workspace_id: UUID) -> list[TeamResponse]:
        """List all teams in a workspace."""
        member = await self.member_repo.get_member(workspace_id, user_id)
        if member is None or member.status != "Active":
            raise WorkspaceAccessDeniedError()

        teams = await self.team_repo.list_workspace_teams(workspace_id)
        return [
            TeamResponse(
                id=t.id,
                workspace_id=t.workspace_id,
                name=t.name,
                description=t.description,
                manager_member_id=t.manager_member_id,
                created_at=t.created_at,
                members_count=len(t.members),
            )
            for t in teams
        ]

    async def get_workspace_settings(self, user_id: UUID, workspace_id: UUID) -> WorkspaceSettingsResponse:
        """Get settings for a workspace."""
        member = await self.member_repo.get_member(workspace_id, user_id)
        if member is None or member.status != "Active":
            raise WorkspaceAccessDeniedError()

        settings = await self.settings_repo.get_by_workspace_id(workspace_id)
        if settings is None:
            settings = WorkspaceSettings(workspace_id=workspace_id)
            settings = await self.settings_repo.create_or_update(settings)

        return WorkspaceSettingsResponse.model_validate(settings)

    async def update_workspace_settings(
        self,
        user_id: UUID,
        workspace_id: UUID,
        payload: WorkspaceSettingsUpdate,
    ) -> WorkspaceSettingsResponse:
        """Update workspace settings."""
        member = await self.member_repo.get_member(workspace_id, user_id)
        if member is None or member.status != "Active":
            raise WorkspaceAccessDeniedError()

        settings = await self.settings_repo.get_by_workspace_id(workspace_id)
        if settings is None:
            settings = WorkspaceSettings(workspace_id=workspace_id)

        if payload.timezone is not None:
            settings.timezone = payload.timezone
        if payload.currency is not None:
            settings.currency = payload.currency
        if payload.language is not None:
            settings.language = payload.language
        if payload.date_format is not None:
            settings.date_format = payload.date_format
        if payload.time_format is not None:
            settings.time_format = payload.time_format
        if payload.week_start_day is not None:
            settings.week_start_day = payload.week_start_day
        if payload.branding_primary_color is not None:
            settings.branding_primary_color = payload.branding_primary_color
        if payload.branding_logo_url is not None:
            settings.branding_logo_url = payload.branding_logo_url

        settings = await self.settings_repo.create_or_update(settings)
        return WorkspaceSettingsResponse.model_validate(settings)


__all__ = ["WorkspaceService", "hash_token"]
