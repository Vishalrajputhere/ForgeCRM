"""
ForgeCRM API — Authentication & Authorization Dependencies

FastAPI dependencies for verifying JWT tokens, extracting current user,
and enforcing Role-Based Access Control (RBAC).

Documentation:
  docs/03_Backend/303_AUTHORIZATION.md
  docs/05_Security/504_IDENTITY_AND_AUTHENTICATION.md
  docs/05_Security/505_AUTHORIZATION_AND_RBAC.md
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Annotated
from uuid import UUID

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.exceptions import AuthenticationError, InsufficientPermissionsError, TokenExpiredError, TokenInvalidError
from app.core.security import JWTError, decode_token
from app.db.session import get_db_session
from app.modules.identity.models import User
from app.modules.identity.repository import UserRepository

# HTTP Bearer scheme
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> User:
    """
    Extract and verify current authenticated user from Bearer JWT access token.

    Raises AuthenticationError if token is missing, invalid, expired, or user is disabled.
    """
    if credentials is None or not credentials.credentials:
        raise AuthenticationError("Authentication credentials were not provided.")

    token = credentials.credentials
    secret_key = settings.JWT_SECRET_KEY.get_secret_value()
    algorithm = settings.JWT_ALGORITHM

    try:
        payload = decode_token(token, secret_key, algorithm)
    except JWTError as exc:
        if "expired" in str(exc).lower():
            raise TokenExpiredError() from exc
        raise TokenInvalidError() from exc
    except Exception as exc:
        raise TokenInvalidError() from exc

    if payload.get("type") != "access":
        raise TokenInvalidError("Provided token is not an access token.")

    subject = payload.get("sub")
    if not subject:
        raise TokenInvalidError("Invalid token subject.")

    try:
        user_id = UUID(subject)
    except ValueError as exc:
        raise TokenInvalidError("Invalid user ID format.") from exc

    session_id_str = payload.get("session_id")
    if session_id_str:
        try:
            session_id = UUID(session_id_str)
            from app.modules.identity.repository import SessionRepository
            session_repo = SessionRepository(db)
            session = await session_repo.get_by_id(session_id)
            if session is None or not session.is_active_session:
                raise TokenExpiredError("Session has been terminated or expired.")
        except (ValueError, TypeError):
            pass

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)

    if user is None:
        raise AuthenticationError("User associated with this token no longer exists.")

    if not user.is_active:
        raise AuthenticationError("User account is disabled.")

    if session_id_str:
        setattr(user, "_current_session_id", UUID(session_id_str))

    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Ensure user is active (convenience alias)."""
    return current_user


def require_permission(required_permission: str) -> Callable[..., User]:
    """
    Dependency factory that enforces a specific permission string (e.g. leads.read).

    Iterates over the user's assigned roles and their permissions.
    """

    async def _permission_checker(
        current_user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        user_permissions: set[str] = set()

        for role in current_user.roles:
            for perm in role.permissions:
                user_permissions.add(perm.name)

        if required_permission not in user_permissions:
            raise InsufficientPermissionsError(
                f"Missing required permission: {required_permission}"
            )

        return current_user

    return _permission_checker


# Convenient Type Aliases
CurrentUser = Annotated[User, Depends(get_current_user)]
CurrentActiveUser = Annotated[User, Depends(get_current_active_user)]


# ── Workspace Isolation & Multi-Tenancy Dependencies ───────────────────────────


async def get_current_workspace_id(
    request: Request,
    current_user: CurrentUser,
) -> UUID:
    """Extract current active workspace ID from X-Workspace-ID header."""
    from app.modules.workspace.exceptions import WorkspaceAccessDeniedError

    workspace_id_str = request.headers.get("X-Workspace-ID") or request.headers.get("x-workspace-id")
    if not workspace_id_str:
        raise WorkspaceAccessDeniedError("X-Workspace-ID header is required for multi-tenant requests.")

    try:
        return UUID(workspace_id_str)
    except ValueError as exc:
        raise WorkspaceAccessDeniedError("Invalid X-Workspace-ID header format.") from exc


async def get_current_workspace_member(
    workspace_id: Annotated[UUID, Depends(get_current_workspace_id)],
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> Any:
    """
    Ensure the current user is an active member of the target workspace.

    Returns the WorkspaceMember entity with loaded role and permissions.
    """
    from app.modules.workspace.exceptions import WorkspaceAccessDeniedError
    from app.modules.workspace.repository import WorkspaceMemberRepository

    member_repo = WorkspaceMemberRepository(db)
    member = await member_repo.get_member(workspace_id, current_user.id)

    if member is None or member.status != "Active":
        raise WorkspaceAccessDeniedError("User is not an active member of this workspace.")

    return member


def require_workspace_permission(required_permission: str) -> Callable[..., User]:
    """
    Dependency factory verifying permission within the current workspace context.
    """

    async def _workspace_permission_checker(
        current_user: CurrentUser,
        member: Annotated[Any, Depends(get_current_workspace_member)],
    ) -> User:
        role_permissions = {perm.name for perm in member.role.permissions}

        if required_permission not in role_permissions:
            raise InsufficientPermissionsError(
                f"Missing required workspace permission: {required_permission}"
            )

        return current_user

    return _workspace_permission_checker


HeaderWorkspaceId = Annotated[Any, Depends(get_current_user)]

__all__ = [
    "get_current_user",
    "get_current_active_user",
    "get_current_workspace_id",
    "get_current_workspace_member",
    "require_permission",
    "require_workspace_permission",
    "CurrentUser",
    "CurrentActiveUser",
]
