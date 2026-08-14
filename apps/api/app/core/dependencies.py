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

from collections.abc import Callable, Coroutine
from typing import Annotated, Any
from uuid import UUID

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.exceptions import (
    AuthenticationError,
    InsufficientPermissionsError,
    TokenExpiredError,
    TokenInvalidError,
)
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
    # ── Debug logging (shows auth state for every request) ──────────────────
    has_creds = credentials is not None and bool(credentials.credentials)
    token_preview = credentials.credentials[:20] + '...' if has_creds else 'MISSING'
    print(f"[Auth] get_current_user | has_token={has_creds} | token_preview={token_preview}")

    if credentials is None or not credentials.credentials:
        print("[Auth] [ERROR] 401 - No Authorization header received")
        raise AuthenticationError("Authentication credentials were not provided.")

    token = credentials.credentials
    secret_key = settings.JWT_SECRET_KEY.get_secret_value()
    algorithm = settings.JWT_ALGORITHM

    try:
        payload = decode_token(token, secret_key, algorithm)
    except JWTError as exc:
        if "expired" in str(exc).lower():
            print(f"[Auth] [ERROR] 401 - Token expired: {exc}")
            raise TokenExpiredError() from exc
        print(f"[Auth] [ERROR] 401 - JWT invalid: {exc}")
        raise TokenInvalidError() from exc
    except Exception as exc:
        print(f"[Auth] [ERROR] 401 - Token decode failed: {exc}")
        raise TokenInvalidError() from exc

    if payload.get("type") != "access":
        print(f"[Auth] [ERROR] 401 - Wrong token type: {payload.get('type')}")
        raise TokenInvalidError("Provided token is not an access token.")

    subject = payload.get("sub")
    if not subject:
        print("[Auth] [ERROR] 401 - No subject in token payload")
        raise TokenInvalidError("Invalid token subject.")

    try:
        user_id = UUID(subject)
    except ValueError as exc:
        print(f"[Auth] [ERROR] 401 - Invalid user_id format: {subject}")
        raise TokenInvalidError("Invalid user ID format.") from exc

    session_id_str = payload.get("session_id")
    if session_id_str:
        try:
            session_id = UUID(session_id_str)
            from app.modules.identity.repository import SessionRepository
            session_repo = SessionRepository(db)
            session = await session_repo.get_by_id(session_id)
            if session is None or not session.is_active_session:
                print(f"[Auth] [ERROR] 401 - Session terminated or expired: {session_id}")
                raise TokenExpiredError("Session has been terminated or expired.")
        except (ValueError, TypeError):
            pass

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)

    if user is None:
        print(f"[Auth] [ERROR] 401 - User not found in DB: {user_id}")
        raise AuthenticationError("User associated with this token no longer exists.")

    if not user.is_active:
        print(f"[Auth] [ERROR] 401 - User account disabled: {user_id}")
        raise AuthenticationError("User account is disabled.")

    if session_id_str:
        user._current_session_id = UUID(session_id_str)

    print(f"[Auth] [OK] Authenticated user_id={user_id} email={user.email}")
    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Ensure user is active (convenience alias)."""
    return current_user


def require_permission(required_permission: str) -> Callable[..., Coroutine[Any, Any, User]]:
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
    """Extract current active workspace ID from X-Workspace-ID header or query parameter."""
    from app.modules.workspace.exceptions import WorkspaceAccessDeniedError

    workspace_id_str = (
        request.headers.get("X-Workspace-ID")
        or request.headers.get("x-workspace-id")
        or request.path_params.get("workspace_id")
        or request.query_params.get("workspace_id")
    )
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


def require_workspace_permission(required_permission: str) -> Callable[..., Coroutine[Any, Any, User]]:
    """
    Dependency factory verifying permission within the current workspace context.

    Super Admin role bypasses permission checks.
    Workspace Admin role receives full workspace permission set.
    All other roles must explicitly possess the required permission.
    """

    async def _workspace_permission_checker(
        current_user: CurrentUser,
        member: Annotated[Any, Depends(get_current_workspace_member)],
    ) -> User:
        is_super = any(r.name == "Super Admin" for r in (getattr(current_user, "roles", []) or []))
        if is_super or (member.role and member.role.name == "Super Admin"):
            return current_user

        # 2. Extract permission names
        role_permissions: set[str] = set()
        if member.role and hasattr(member.role, "permissions"):
            role_permissions = {perm.name for perm in member.role.permissions}

        # 3. Workspace Admin wildcard for workspace scope
        if member.role and member.role.name == "Workspace Admin":
            return current_user

        if required_permission not in role_permissions:
            raise InsufficientPermissionsError(
                f"Missing required workspace permission: {required_permission}"
            )

        return current_user

    return _workspace_permission_checker


async def get_current_user_and_workspace(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
    request: Request,
) -> tuple[User, Any]:
    """
    Extract authenticated user and current active workspace tenant.
    Strictly verifies active workspace membership for specified workspace headers.
    """
    from uuid import UUID
    from app.modules.workspace.exceptions import WorkspaceAccessDeniedError
    from app.modules.workspace.models import Workspace, WorkspaceMember
    from app.modules.workspace.repository import WorkspaceMemberRepository, WorkspaceRepository
    from app.modules.identity.repository import RoleRepository

    workspace_id_str = (
        request.headers.get("X-Workspace-ID")
        or request.headers.get("x-workspace-id")
        or request.query_params.get("workspace_id")
    )
    ws_repo = WorkspaceRepository(db)
    member_repo = WorkspaceMemberRepository(db)

    # 1. Specified workspace ID header -> MUST verify membership strictly!
    if workspace_id_str:
        try:
            target_ws_id = UUID(workspace_id_str)
            member = await member_repo.get_member(target_ws_id, user.id)
            if member and member.status == "Active":
                workspace = await ws_repo.get_by_id(target_ws_id)
                if workspace and workspace.deleted_at is None:
                    return user, workspace
            # If header specified but user is not an active member -> reject cross-tenant access!
            raise WorkspaceAccessDeniedError("User is not an active member of the requested workspace.")
        except ValueError as exc:
            raise WorkspaceAccessDeniedError("Invalid workspace ID format.") from exc

    # 2. Fall back to user's first active workspace membership
    memberships = await member_repo.list_for_user(user.id)
    active_memberships = [m for m in memberships if m.status == "Active"]
    if active_memberships:
        workspace = await ws_repo.get_by_id(active_memberships[0].workspace_id)
        if workspace and workspace.deleted_at is None:
            return user, workspace

    # 3. User has no workspace at all -> Auto-create default workspace for user
    new_ws_id = UUID(int=user.id.int ^ 0x123456789ABCDEF)
    existing_ws = await ws_repo.get_by_id(new_ws_id)
    if not existing_ws:
        new_ws = Workspace(
            id=new_ws_id,
            name=f"{user.first_name or 'Default'}'s Workspace",
            slug=f"workspace-{user.id.hex[:8]}",
        )
        db.add(new_ws)
        await db.flush()
        existing_ws = new_ws

    role_repo = RoleRepository(db)
    admin_role = await role_repo.get_by_name("Workspace Admin")
    if admin_role:
        existing_member = await member_repo.get_member(existing_ws.id, user.id)
        if not existing_member:
            member = WorkspaceMember(
                workspace_id=existing_ws.id,
                user_id=user.id,
                role_id=admin_role.id,
                status="Active",
            )
            db.add(member)
            await db.flush()

    return user, existing_ws



HeaderWorkspaceId = Annotated[Any, Depends(get_current_user)]

__all__ = [
    "CurrentActiveUser",
    "CurrentUser",
    "get_current_active_user",
    "get_current_user",
    "get_current_user_and_workspace",
    "get_current_workspace_id",
    "get_current_workspace_member",
    "require_permission",
    "require_workspace_permission",
]
