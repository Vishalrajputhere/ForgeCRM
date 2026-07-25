"""
ForgeCRM API — Workspace Domain Routes

FastAPI router for workspace creation, multi-tenancy management, membership,
invitation acceptance, teams, and organization settings.

Documentation: docs/03_Backend/302_API_DESIGN.md
"""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser
from app.db.session import get_db_session
from app.modules.workspace.schemas import (
    AcceptInvitationRequest,
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
from app.modules.workspace.service import WorkspaceService

router = APIRouter(prefix="/workspaces", tags=["Workspaces & Multi-Tenancy"])


@router.post(
    "",
    response_model=WorkspaceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Workspace",
    description="Creates a new workspace customer organization and assigns the user as Workspace Admin.",
)
async def create_workspace(
    payload: WorkspaceCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> WorkspaceResponse:
    service = WorkspaceService(db)
    return await service.create_workspace(current_user.id, payload)


@router.get(
    "",
    response_model=list[WorkspaceResponse],
    status_code=status.HTTP_200_OK,
    summary="List User Workspaces",
    description="Lists all active workspaces that the current user belongs to.",
)
async def list_workspaces(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[WorkspaceResponse]:
    service = WorkspaceService(db)
    return await service.list_user_workspaces(current_user.id)


@router.get(
    "/invitations/accept",
    status_code=status.HTTP_200_OK,
    response_model=WorkspaceMemberResponse,
    summary="Accept Invitation",
    description="Accepts a workspace invitation using a single-use token.",
)
async def accept_invitation(
    token: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> WorkspaceMemberResponse:
    service = WorkspaceService(db)
    return await service.accept_invitation(current_user.id, token)


@router.post(
    "/invitations/accept",
    status_code=status.HTTP_200_OK,
    response_model=WorkspaceMemberResponse,
    summary="Accept Invitation (POST)",
    description="Accepts a workspace invitation with JSON body.",
)
async def accept_invitation_post(
    payload: AcceptInvitationRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> WorkspaceMemberResponse:
    service = WorkspaceService(db)
    return await service.accept_invitation(current_user.id, payload.token)


@router.get(
    "/{workspace_id}",
    response_model=WorkspaceResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Workspace Details",
    description="Returns workspace details if user is an active member.",
)
async def get_workspace(
    workspace_id: UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> WorkspaceResponse:
    service = WorkspaceService(db)
    return await service.get_workspace_details(current_user.id, workspace_id)


@router.patch(
    "/{workspace_id}",
    response_model=WorkspaceResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Workspace",
    description="Updates workspace details.",
)
async def update_workspace(
    workspace_id: UUID,
    payload: WorkspaceUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> WorkspaceResponse:
    service = WorkspaceService(db)
    return await service.update_workspace(current_user.id, workspace_id, payload)


@router.get(
    "/{workspace_id}/members",
    response_model=list[WorkspaceMemberResponse],
    status_code=status.HTTP_200_OK,
    summary="List Workspace Members",
    description="Returns all active members in the specified workspace.",
)
async def list_members(
    workspace_id: UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[WorkspaceMemberResponse]:
    service = WorkspaceService(db)
    return await service.list_workspace_members(current_user.id, workspace_id)


@router.post(
    "/{workspace_id}/invitations",
    response_model=WorkspaceInvitationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Invite Member to Workspace",
    description="Generates an invitation token for a user to join the workspace.",
)
async def invite_member(
    workspace_id: UUID,
    payload: InviteMemberRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> WorkspaceInvitationResponse:
    service = WorkspaceService(db)
    return await service.invite_member(current_user.id, workspace_id, payload)


@router.get(
    "/{workspace_id}/teams",
    response_model=list[TeamResponse],
    status_code=status.HTTP_200_OK,
    summary="List Teams",
    description="Returns all teams within the specified workspace.",
)
async def list_teams(
    workspace_id: UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[TeamResponse]:
    service = WorkspaceService(db)
    return await service.list_workspace_teams(current_user.id, workspace_id)


@router.post(
    "/{workspace_id}/teams",
    response_model=TeamResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Team",
    description="Creates a new organizational team in the workspace.",
)
async def create_team(
    workspace_id: UUID,
    payload: TeamCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> TeamResponse:
    service = WorkspaceService(db)
    return await service.create_team(current_user.id, workspace_id, payload)


@router.get(
    "/{workspace_id}/settings",
    response_model=WorkspaceSettingsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Workspace Settings",
    description="Returns settings for the workspace.",
)
async def get_settings(
    workspace_id: UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> WorkspaceSettingsResponse:
    service = WorkspaceService(db)
    return await service.get_workspace_settings(current_user.id, workspace_id)


@router.patch(
    "/{workspace_id}/settings",
    response_model=WorkspaceSettingsResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Workspace Settings",
    description="Updates workspace settings.",
)
async def update_settings(
    workspace_id: UUID,
    payload: WorkspaceSettingsUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> WorkspaceSettingsResponse:
    service = WorkspaceService(db)
    return await service.update_workspace_settings(current_user.id, workspace_id, payload)
