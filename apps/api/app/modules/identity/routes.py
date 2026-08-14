"""
ForgeCRM API — Identity Domain Routes

FastAPI router exposing authentication, profile, session, and password management endpoints.
Includes real-time SSE authorization change stream (Phase 8.X RBAC).

Documentation: docs/03_Backend/302_API_DESIGN.md
"""

from __future__ import annotations

import asyncio
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser
from app.db.session import get_db_session
from app.modules.identity.schemas import (
    EffectiveAuthorizationResponse,
    LoginRequest,
    PasswordChangeRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    RefreshTokenRequest,
    RegisterRequest,
    RoleResponse,
    SessionResponse,
    TokenResponse,
    UserProfileUpdate,
    UserResponse,
)
from app.modules.identity.service import IdentityService
from app.modules.identity.sse import SSE_HEARTBEAT_INTERVAL_SECONDS, authorization_sse_manager

router = APIRouter(prefix="/auth", tags=["Authentication & Identity"])


def _get_client_info(request: Request, user_agent: str | None) -> tuple[str | None, str | None]:
    """Extract client IP and user agent."""
    ip = request.client.host if request.client else None
    return ip, user_agent


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register New Account",
    description="Creates a new user account and returns access + refresh tokens.",
)
async def register(
    payload: RegisterRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    user_agent: Annotated[str | None, Header()] = None,
) -> TokenResponse:
    ip_address, ua = _get_client_info(request, user_agent)
    service = IdentityService(db)
    return await service.register_user(payload, ip_address=ip_address, user_agent=ua)


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate User",
    description="Authenticates user credentials and issues access + refresh tokens.",
)
async def login(
    payload: LoginRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    user_agent: Annotated[str | None, Header()] = None,
) -> TokenResponse:
    ip_address, ua = _get_client_info(request, user_agent)
    service = IdentityService(db)
    return await service.authenticate_user(payload, ip_address=ip_address, user_agent=ua)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Refresh Access Token",
    description="Rotates refresh token and issues a new short-lived access token.",
)
async def refresh_token(
    payload: RefreshTokenRequest,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> TokenResponse:
    service = IdentityService(db)
    return await service.refresh_access_token(payload.refresh_token)


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Current User Profile",
    description="Returns the profile of the currently authenticated user.",
)
async def get_me(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> UserResponse:
    service = IdentityService(db)
    return await service.get_user_profile(current_user.id)


@router.get(
    "/me/permissions",
    response_model=EffectiveAuthorizationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Effective User Authorization & Permissions",
    description="Returns database-derived canonical roles, effective permissions, and authorization version.",
)
async def get_my_effective_permissions(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    x_workspace_id: Annotated[str | None, Header(alias="X-Workspace-ID")] = None,
) -> EffectiveAuthorizationResponse:
    from uuid import UUID
    ws_id = None
    if x_workspace_id:
        try:
            ws_id = UUID(x_workspace_id)
        except ValueError:
            ws_id = None
    service = IdentityService(db)
    return await service.get_effective_permissions(current_user.id, workspace_id=ws_id)


@router.patch(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Profile",
    description="Updates user profile information.",
)
async def update_me(
    payload: UserProfileUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> UserResponse:
    service = IdentityService(db)
    return await service.update_user_profile(current_user.id, payload)


@router.post(
    "/password/change",
    status_code=status.HTTP_200_OK,
    summary="Change Password",
    description="Changes password for current user.",
)
async def change_password(
    payload: PasswordChangeRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict[str, str]:
    service = IdentityService(db)
    await service.change_password(current_user.id, payload)
    return {"message": "Password changed successfully."}


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Logout User Session",
    description="Revokes the current authenticated user session.",
)
async def logout(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    session_id = getattr(current_user, "_current_session_id", None)
    if session_id:
        service = IdentityService(db)
        await service.logout_session(session_id)


@router.post(
    "/password-reset/request",
    status_code=status.HTTP_200_OK,
    summary="Request Password Reset",
    description="Generates a password reset token and sends recovery instructions.",
)
async def request_password_reset(
    payload: PasswordResetRequest,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict[str, str]:
    service = IdentityService(db)
    await service.request_password_reset(payload)
    return {"message": "If an account with that email exists, reset instructions have been sent."}


@router.post(
    "/password-reset/confirm",
    status_code=status.HTTP_200_OK,
    summary="Confirm Password Reset",
    description="Resets user password using single-use recovery token.",
)
async def confirm_password_reset(
    payload: PasswordResetConfirm,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict[str, str]:
    service = IdentityService(db)
    await service.confirm_password_reset(payload)
    return {"message": "Password reset successfully. You can now log in with your new password."}


@router.get(
    "/sessions",
    response_model=list[SessionResponse],
    status_code=status.HTTP_200_OK,
    summary="List Active Sessions",
    description="Returns all active login sessions for the current user.",
)
async def list_sessions(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[SessionResponse]:
    service = IdentityService(db)
    current_session_id = getattr(current_user, "_current_session_id", None)
    return await service.list_user_sessions(current_user.id, current_session_id=current_session_id)


@router.delete(
    "/sessions/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke Session",
    description="Revokes a specific login session.",
)
async def revoke_session(
    session_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    from uuid import UUID

    service = IdentityService(db)
    await service.logout_session(UUID(session_id))


@router.get(
    "/roles",
    response_model=list[RoleResponse],
    status_code=status.HTTP_200_OK,
    summary="List System Roles",
    description="Returns all system roles available for assignment.",
)
async def list_system_roles(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[RoleResponse]:
    service = IdentityService(db)
    return await service.list_roles()


# ── Phase 8.X — Real-Time Authorization SSE Stream ────────────────────────────


@router.get(
    "/me/events",
    status_code=status.HTTP_200_OK,
    summary="Authorization Change Event Stream (SSE)",
    description=(
        "Server-Sent Events stream for real-time authorization change notifications. "
        "Emits 'authorization.changed' events when the authenticated user's role or permissions change. "
        "Clients should immediately re-fetch GET /auth/me/permissions on receipt. "
        "A 'ping' heartbeat is sent every 25 seconds to keep proxy connections alive."
    ),
)
async def authorization_event_stream(
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    x_workspace_id: Annotated[str | None, Header(alias="X-Workspace-ID")] = None,
) -> StreamingResponse:
    """
    SSE endpoint delivering authorization change events in real time.

    Workflow:
      1. Client connects with Authorization header (Bearer token).
      2. Server registers a queue for this user.
      3. When Super Admin changes user's role → backend publishes to queue.
      4. SSE message is streamed to all open browser tabs of the user.
      5. Client hook re-fetches /auth/me/permissions and updates the store.
    """
    user_id = current_user.id
    queue = authorization_sse_manager.connect(user_id)

    async def _event_generator():
        try:
            # Send an initial connected confirmation
            yield (
                "event: connected\n"
                f'data: {{"user_id": "{user_id}", "status": "subscribed"}}\n\n'
            )

            while True:
                # Check if client disconnected
                if await request.is_disconnected():
                    break

                try:
                    # Wait for an event or heartbeat timeout
                    message = await asyncio.wait_for(
                        queue.get(),
                        timeout=SSE_HEARTBEAT_INTERVAL_SECONDS,
                    )
                    if message is None:
                        # Graceful shutdown signal
                        break
                    yield message
                except asyncio.TimeoutError:
                    # Send heartbeat ping to keep connection alive through proxies
                    yield "event: ping\ndata: {}\n\n"
        finally:
            authorization_sse_manager.disconnect(user_id, queue)

    return StreamingResponse(
        _event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Disable Nginx buffering for SSE
            "Connection": "keep-alive",
        },
    )


@router.get(
    "/me/authorization-version",
    status_code=status.HTTP_200_OK,
    summary="Get Current Authorization Version",
    description=(
        "Lightweight endpoint returning only the current authorization_version for the "
        "authenticated user within the specified workspace. Used by the frontend polling "
        "fallback to detect role changes without fetching full permissions on every poll."
    ),
)
async def get_authorization_version(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    x_workspace_id: Annotated[str | None, Header(alias="X-Workspace-ID")] = None,
) -> dict:
    """Returns {authorization_version, workspace_id} — very cheap, no permission calculations."""
    from sqlalchemy import select
    from app.modules.workspace.models import WorkspaceMember

    workspace_id: UUID | None = None
    if x_workspace_id:
        try:
            workspace_id = UUID(x_workspace_id)
        except ValueError:
            workspace_id = None

    auth_version = 1
    resolved_ws_id: str | None = None

    if workspace_id:
        stmt = select(WorkspaceMember.authorization_version, WorkspaceMember.workspace_id).where(
            WorkspaceMember.user_id == current_user.id,
            WorkspaceMember.workspace_id == workspace_id,
        )
        result = await db.execute(stmt)
        row = result.first()
        if row:
            auth_version = row[0] or 1
            resolved_ws_id = str(row[1])
    else:
        # Fall back to first active membership
        stmt = (
            select(WorkspaceMember.authorization_version, WorkspaceMember.workspace_id)
            .where(WorkspaceMember.user_id == current_user.id)
            .order_by(WorkspaceMember.is_default_workspace.desc())
            .limit(1)
        )
        result = await db.execute(stmt)
        row = result.first()
        if row:
            auth_version = row[0] or 1
            resolved_ws_id = str(row[1])

    return {
        "authorization_version": auth_version,
        "workspace_id": resolved_ws_id,
        "user_id": str(current_user.id),
    }

