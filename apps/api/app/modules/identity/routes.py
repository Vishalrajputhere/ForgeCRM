"""
ForgeCRM API — Identity Domain Routes

FastAPI router exposing authentication, profile, session, and password management endpoints.

Documentation: docs/03_Backend/302_API_DESIGN.md
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Header, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser
from app.db.session import get_db_session
from app.modules.identity.schemas import (
    LoginRequest,
    PasswordChangeRequest,
    RefreshTokenRequest,
    RegisterRequest,
    SessionResponse,
    TokenResponse,
    UserProfileUpdate,
    UserResponse,
)
from app.modules.identity.service import IdentityService

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
    return await service.list_user_sessions(current_user.id)


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
