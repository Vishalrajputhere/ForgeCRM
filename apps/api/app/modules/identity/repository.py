"""
ForgeCRM API — Identity Domain Repository Layer

Encapsulates all database operations for users, roles, permissions,
sessions, and tokens. Repositories contain no business logic.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md §5 (Repository Layer)
"""

from __future__ import annotations

from collections.abc import Sequence
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.identity.models import (
    PasswordResetToken,
    Permission,
    RefreshToken,
    Role,
    Session,
    User,
    UserRole,
)
from app.modules.identity.permissions import DEFAULT_ROLE_PERMISSIONS


class UserRepository:
    """Repository for User database operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, user_id: UUID) -> User | None:
        """Fetch a active user by ID with roles and permissions loaded."""
        stmt = (
            select(User)
            .options(
                selectinload(User.roles).selectinload(Role.permissions)
            )
            .where(User.id == user_id, User.deleted_at.is_(None))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        """Fetch a user by email (case-insensitive) with roles loaded."""
        stmt = (
            select(User)
            .options(
                selectinload(User.roles).selectinload(Role.permissions)
            )
            .where(
                User.email == email.strip().lower(),
                User.deleted_at.is_(None),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, user: User) -> User:
        """Persist a new user entity."""
        self.db.add(user)
        await self.db.flush()
        return user

    async def update_last_login(self, user_id: UUID) -> None:
        """Update last_login_at timestamp for user."""
        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(last_login_at=datetime.now(UTC))
        )
        await self.db.execute(stmt)

    async def assign_role(self, user_id: UUID, role_id: UUID, assigned_by: UUID | None = None) -> None:
        """Assign a role to a user."""
        user_role = UserRole(
            user_id=user_id,
            role_id=role_id,
            assigned_by=assigned_by,
        )
        self.db.add(user_role)
        await self.db.flush()


class RoleRepository:
    """Repository for Role & Permission database operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_name(self, name: str) -> Role | None:
        """Fetch role by name."""
        stmt = (
            select(Role)
            .options(selectinload(Role.permissions))
            .where(Role.name == name)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def seed_system_roles_and_permissions(self) -> None:
        """Seed standard permissions and system roles into database."""
        # 1. Collect all permissions from DEFAULT_ROLE_PERMISSIONS
        all_perm_names: set[str] = set()
        for perms in DEFAULT_ROLE_PERMISSIONS.values():
            all_perm_names.update(perms)

        # 2. Insert missing permissions
        for perm_name in all_perm_names:
            module_name = perm_name.split(".")[0] if "." in perm_name else "system"
            stmt = select(Permission).where(Permission.name == perm_name)
            res = await self.db.execute(stmt)
            perm_obj = res.scalar_one_or_none()
            if not perm_obj:
                perm_obj = Permission(
                    name=perm_name,
                    module=module_name,
                    description=f"Permission for {perm_name}",
                )
                self.db.add(perm_obj)
        await self.db.flush()

        # 3. Create or update system roles
        for role_name, perm_names in DEFAULT_ROLE_PERMISSIONS.items():
            role_stmt = select(Role).options(selectinload(Role.permissions)).where(Role.name == role_name)
            role_res = await self.db.execute(role_stmt)
            role_obj: Role | None = role_res.scalar_one_or_none()

            # Fetch matching permission objects
            perm_stmt = select(Permission).where(Permission.name.in_(perm_names))
            perm_res = await self.db.execute(perm_stmt)
            matching_perms = list(perm_res.scalars().all())

            if not role_obj:
                role_obj = Role(
                    name=role_name,
                    description=f"System role: {role_name}",
                    is_system=True,
                    permissions=matching_perms,
                )
                self.db.add(role_obj)
            else:
                role_obj.permissions = matching_perms

        await self.db.flush()


class SessionRepository:
    """Repository for Session database operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_session(self, session: Session) -> Session:
        """Create and persist a user session."""
        self.db.add(session)
        await self.db.flush()
        return session

    async def get_by_id(self, session_id: UUID) -> Session | None:
        """Fetch session by ID."""
        stmt = (
            select(Session)
            .options(selectinload(Session.user))
            .where(Session.id == session_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_user_sessions(self, user_id: UUID) -> Sequence[Session]:
        """List all active non-revoked sessions for a user."""
        stmt = (
            select(Session)
            .where(
                Session.user_id == user_id,
                Session.revoked_at.is_(None),
                Session.expires_at > datetime.now(UTC),
            )
            .order_by(Session.last_activity_at.desc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def update_activity(self, session_id: UUID) -> None:
        """Update last_activity_at timestamp."""
        stmt = (
            update(Session)
            .where(Session.id == session_id)
            .values(last_activity_at=datetime.now(UTC))
        )
        await self.db.execute(stmt)

    async def revoke_session(self, session_id: UUID) -> None:
        """Revoke a session."""
        stmt = (
            update(Session)
            .where(Session.id == session_id)
            .values(revoked_at=datetime.now(UTC))
        )
        await self.db.execute(stmt)


class RefreshTokenRepository:
    """Repository for RefreshToken database operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_token(self, refresh_token: RefreshToken) -> RefreshToken:
        """Store a new refresh token."""
        self.db.add(refresh_token)
        await self.db.flush()
        return refresh_token

    async def get_by_hash(self, token_hash: str) -> RefreshToken | None:
        """Fetch refresh token by hash."""
        stmt = (
            select(RefreshToken)
            .options(selectinload(RefreshToken.session).selectinload(Session.user))
            .where(RefreshToken.token_hash == token_hash)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def revoke_token(self, token_id: UUID) -> None:
        """Revoke a specific refresh token."""
        stmt = (
            update(RefreshToken)
            .where(RefreshToken.id == token_id)
            .values(revoked_at=datetime.now(UTC))
        )
        await self.db.execute(stmt)


class PasswordResetTokenRepository:
    """Repository for PasswordResetToken operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, reset_token: PasswordResetToken) -> PasswordResetToken:
        """Create a new password reset token record."""
        self.db.add(reset_token)
        await self.db.flush()
        return reset_token

    async def get_by_hash(self, token_hash: str) -> PasswordResetToken | None:
        """Fetch valid password reset token by hash."""
        stmt = (
            select(PasswordResetToken)
            .where(
                PasswordResetToken.token_hash == token_hash,
                PasswordResetToken.used_at.is_(None),
                PasswordResetToken.expires_at > datetime.now(UTC),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def mark_used(self, token_id: UUID) -> None:
        """Mark reset token as used."""
        stmt = (
            update(PasswordResetToken)
            .where(PasswordResetToken.id == token_id)
            .values(used_at=datetime.now(UTC))
        )
        await self.db.execute(stmt)


__all__ = [
    "PasswordResetTokenRepository",
    "RefreshTokenRepository",
    "RoleRepository",
    "SessionRepository",
    "UserRepository",
]
