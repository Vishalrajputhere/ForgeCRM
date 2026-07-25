"""
ForgeCRM API — Workspace Domain Pydantic Schemas

Request and Response DTOs for multi-tenancy, workspace settings, members, teams, and invitations.

Documentation: docs/03_Backend/302_API_DESIGN.md
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.modules.identity.schemas import RoleResponse, UserResponse

# ── Response DTOs ─────────────────────────────────────────────────────────────


class WorkspaceSettingsResponse(BaseModel):
    """Workspace settings DTO."""

    model_config = ConfigDict(from_attributes=True)

    workspace_id: UUID
    timezone: str
    currency: str
    language: str
    date_format: str
    time_format: str
    week_start_day: int
    branding_primary_color: str | None = None
    branding_logo_url: str | None = None


class WorkspaceMemberResponse(BaseModel):
    """Workspace member DTO."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    user_id: UUID
    user: UserResponse
    role: RoleResponse
    status: str
    joined_at: datetime
    last_active_at: datetime | None = None
    is_default_workspace: bool = False


class WorkspaceResponse(BaseModel):
    """Workspace summary DTO."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    logo_url: str | None = None
    industry: str | None = None
    website: str | None = None
    company_size: int | None = None
    subscription_plan: str
    status: str
    created_at: datetime
    role: RoleResponse | None = None  # User's role in this workspace


class TeamResponse(BaseModel):
    """Team DTO."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    name: str
    description: str | None = None
    manager_member_id: UUID | None = None
    created_at: datetime
    members_count: int = 0


class WorkspaceInvitationResponse(BaseModel):
    """Workspace invitation DTO."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    email: str
    role: RoleResponse
    invited_by: UUID
    expires_at: datetime
    created_at: datetime


# ── Request DTOs ──────────────────────────────────────────────────────────────


class WorkspaceCreate(BaseModel):
    """New workspace creation request DTO."""

    name: str = Field(..., min_length=1, max_length=255)
    slug: str | None = Field(None, max_length=150)
    industry: str | None = Field(None, max_length=100)
    website: str | None = None
    company_size: int | None = Field(None, ge=1)


class WorkspaceUpdate(BaseModel):
    """Workspace update request DTO."""

    name: str | None = Field(None, min_length=1, max_length=255)
    logo_url: str | None = None
    industry: str | None = Field(None, max_length=100)
    website: str | None = None
    company_size: int | None = Field(None, ge=1)


class WorkspaceSettingsUpdate(BaseModel):
    """Workspace settings update request DTO."""

    timezone: str | None = Field(None, max_length=100)
    currency: str | None = Field(None, max_length=20)
    language: str | None = Field(None, max_length=20)
    date_format: str | None = Field(None, max_length=20)
    time_format: str | None = Field(None, max_length=20)
    week_start_day: int | None = Field(None, ge=0, le=6)
    branding_primary_color: str | None = Field(None, max_length=20)
    branding_logo_url: str | None = None


class WorkspaceMemberUpdate(BaseModel):
    """Member role or status update request DTO."""

    role_id: UUID | None = None
    status: str | None = Field(None, max_length=30)
    is_default_workspace: bool | None = None


class InviteMemberRequest(BaseModel):
    """Invite member request DTO."""

    email: str = Field(..., min_length=3, max_length=255)
    role_id: UUID


class AcceptInvitationRequest(BaseModel):
    """Accept invitation request DTO."""

    token: str = Field(..., min_length=1)


class TeamCreate(BaseModel):
    """Team creation request DTO."""

    name: str = Field(..., min_length=1, max_length=150)
    description: str | None = None
    manager_member_id: UUID | None = None


class TeamUpdate(BaseModel):
    """Team update request DTO."""

    name: str | None = Field(None, min_length=1, max_length=150)
    description: str | None = None
    manager_member_id: UUID | None = None


__all__ = [
    "AcceptInvitationRequest",
    "InviteMemberRequest",
    "TeamCreate",
    "TeamResponse",
    "TeamUpdate",
    "WorkspaceCreate",
    "WorkspaceInvitationResponse",
    "WorkspaceMemberResponse",
    "WorkspaceMemberUpdate",
    "WorkspaceResponse",
    "WorkspaceSettingsResponse",
    "WorkspaceSettingsUpdate",
    "WorkspaceUpdate",
]
