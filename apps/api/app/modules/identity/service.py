"""
ForgeCRM API — Identity Domain Business Service

Coordinates authentication, registration, token refresh, password hashing,
session lifecycle, and RBAC role assignment.

Documentation:
  docs/03_Backend/301_BACKEND_OVERVIEW.md §5 (Service Layer)
  docs/05_Security/504_IDENTITY_AND_AUTHENTICATION.md
"""

from __future__ import annotations

import hashlib
from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.logging import get_logger
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    needs_password_rehash,
    verify_password,
)
from app.modules.identity.exceptions import (
    AccountDisabledError,
    InvalidCredentialsError,
    InvalidTokenError,
    SessionRevokedError,
    UserAlreadyExistsError,
)
from app.modules.identity.models import RefreshToken, Session, User
from app.modules.identity.permissions import SystemRoles
from app.modules.identity.repository import (
    RefreshTokenRepository,
    RoleRepository,
    SessionRepository,
    UserRepository,
)
from app.modules.identity.schemas import (
    LoginRequest,
    PasswordChangeRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    RegisterRequest,
    SessionResponse,
    TokenResponse,
    UserProfileUpdate,
    UserResponse,
)

logger = get_logger(__name__)


def hash_token(token_str: str) -> str:
    """Hash a token string using SHA-256 for secure storage."""
    return hashlib.sha256(token_str.encode("utf-8")).hexdigest()


class IdentityService:
    """Service layer for Identity domain workflows."""

    def __init__(self, db: AsyncSession, settings: Settings | None = None) -> None:
        self.db = db
        self.settings = settings or get_settings()
        self.user_repo = UserRepository(db)
        self.role_repo = RoleRepository(db)
        self.session_repo = SessionRepository(db)
        self.token_repo = RefreshTokenRepository(db)

    async def register_user(
        self,
        payload: RegisterRequest,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> TokenResponse:
        """
        Register a new user account.

        Checks email uniqueness, hashes password, assigns default system role,
        creates a session, and issues JWT access and refresh tokens.
        """
        # 1. Check if email already exists
        existing_user = await self.user_repo.get_by_email(payload.email)
        if existing_user is not None:
            raise UserAlreadyExistsError()

        # 2. Hash password
        pwd_hash = hash_password(payload.password)

        # 3. Create user entity
        user = User(
            first_name=payload.first_name,
            last_name=payload.last_name,
            email=payload.email,
            password_hash=pwd_hash,
            job_title=payload.job_title,
            phone=payload.phone,
            is_active=True,
            is_email_verified=False,
        )
        user = await self.user_repo.create(user)

        # 4. Assign default system role (Sales Executive)
        sales_exec_role = await self.role_repo.get_by_name(SystemRoles.SALES_EXECUTIVE)
        if sales_exec_role is not None:
            await self.user_repo.assign_role(user.id, sales_exec_role.id)

        # Re-fetch user with roles
        user = await self.user_repo.get_by_id(user.id)  # type: ignore[assignment]

        # 5. Create default workspace for new user
        from app.modules.workspace.schemas import WorkspaceCreate
        from app.modules.workspace.service import WorkspaceService
        ws_service = WorkspaceService(self.db, settings=self.settings)
        default_name = f"{user.first_name}'s Workspace" if user.first_name else "My Workspace"
        await ws_service.create_workspace(
            user_id=user.id,
            payload=WorkspaceCreate(name=default_name),
        )

        # 6. Create session & tokens
        return await self._create_user_session_and_tokens(
            user=user,
            ip_address=ip_address,
            user_agent=user_agent,
        )

    async def authenticate_user(
        self,
        payload: LoginRequest,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> TokenResponse:
        """
        Authenticate user credentials and issue access + refresh tokens.

        Logs security audit events and transparently updates outdated password hashes.
        """
        user = await self.user_repo.get_by_email(payload.email)
        if user is None:
            logger.warning("login_failed_unknown_user", email=payload.email)
            raise InvalidCredentialsError()

        if not user.is_active:
            logger.warning("login_failed_account_disabled", user_id=str(user.id))
            raise AccountDisabledError()

        if user.password_hash is None or not verify_password(payload.password, user.password_hash):
            logger.warning("login_failed_invalid_password", user_id=str(user.id))
            raise InvalidCredentialsError()

        # Upgrade password hash if using outdated parameters
        if needs_password_rehash(user.password_hash):
            user.password_hash = hash_password(payload.password)
            await self.db.flush()

        # Update last login timestamp
        await self.user_repo.update_last_login(user.id)

        logger.info("login_successful", user_id=str(user.id))

        return await self._create_user_session_and_tokens(
            user=user,
            ip_address=ip_address,
            user_agent=user_agent,
        )

    async def refresh_access_token(self, refresh_token_str: str) -> TokenResponse:
        """
        Rotate refresh token and issue a new access token.

        Validates the refresh token hash, checks revocation, revokes the used token,
        and creates a new refresh token (refresh token rotation).
        """
        secret_key = self.settings.JWT_SECRET_KEY.get_secret_value()
        algorithm = self.settings.JWT_ALGORITHM

        try:
            payload = decode_token(refresh_token_str, secret_key, algorithm)
            if payload.get("type") != "refresh":
                raise InvalidTokenError()
        except Exception as exc:
            raise InvalidTokenError() from exc

        # Find token in DB by hash
        token_h = hash_token(refresh_token_str)
        token_record = await self.token_repo.get_by_hash(token_h)
        if token_record is None or not token_record.is_valid:
            raise SessionRevokedError()

        session = token_record.session
        if session is None or not session.is_active_session:
            raise SessionRevokedError()

        user = session.user
        if user is None or not user.is_active:
            raise AccountDisabledError()

        # ── Refresh Token Rotation ──────────────────────────────────────────
        # Revoke old refresh token immediately
        await self.token_repo.revoke_token(token_record.id)

        # Update session activity
        await self.session_repo.update_activity(session.id)

        # Issue new tokens
        access_token_expires = self.settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        refresh_token_expires_days = self.settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS

        new_access_token = create_access_token(
            subject=str(user.id),
            secret_key=secret_key,
            algorithm=algorithm,
            expire_minutes=access_token_expires,
            additional_claims={"session_id": str(session.id)},
        )

        new_refresh_token_str = create_refresh_token(
            subject=str(user.id),
            secret_key=secret_key,
            algorithm=algorithm,
            expire_days=refresh_token_expires_days,
        )

        # Save new refresh token record
        new_token_record = RefreshToken(
            session_id=session.id,
            token_hash=hash_token(new_refresh_token_str),
            expires_at=datetime.now(UTC) + timedelta(days=refresh_token_expires_days),
        )
        await self.token_repo.create_token(new_token_record)

        # Re-fetch user with loaded permissions
        full_user = await self.user_repo.get_by_id(user.id)

        return TokenResponse(
            access_token=new_access_token,
            token_type="bearer",
            expires_in=access_token_expires * 60,
            refresh_token=new_refresh_token_str,
            user=UserResponse.model_validate(full_user),
        )

    async def logout_session(self, session_id: UUID) -> None:
        """Revoke a user session."""
        await self.session_repo.revoke_session(session_id)
        logger.info("session_logout", session_id=str(session_id))

    async def get_user_profile(self, user_id: UUID) -> UserResponse:
        """Get user profile by ID."""
        user = await self.user_repo.get_by_id(user_id)
        if user is None:
            raise InvalidCredentialsError()
        return UserResponse.model_validate(user)

    async def update_user_profile(self, user_id: UUID, payload: UserProfileUpdate) -> UserResponse:
        """Update current user profile."""
        user = await self.user_repo.get_by_id(user_id)
        if user is None:
            raise InvalidCredentialsError()

        if payload.first_name is not None:
            user.first_name = payload.first_name
        if payload.last_name is not None:
            user.last_name = payload.last_name
        if payload.phone is not None:
            user.phone = payload.phone
        if payload.avatar_url is not None:
            user.avatar_url = payload.avatar_url
        if payload.job_title is not None:
            user.job_title = payload.job_title
        if payload.timezone is not None:
            user.timezone = payload.timezone
        if payload.language is not None:
            user.language = payload.language

        await self.db.flush()
        return UserResponse.model_validate(user)

    async def change_password(self, user_id: UUID, payload: PasswordChangeRequest) -> None:
        """Change password for an authenticated user."""
        user = await self.user_repo.get_by_id(user_id)
        if user is None:
            raise InvalidCredentialsError()

        if user.password_hash is None or not verify_password(payload.current_password, user.password_hash):
            raise InvalidCredentialsError("Current password is incorrect.")

        user.password_hash = hash_password(payload.new_password)
        await self.db.flush()

    async def request_password_reset(self, payload: PasswordResetRequest) -> None:
        """
        Initiate password reset process.

        Generates a single-use token and stores its hash. Always succeeds silently
        to prevent user enumeration attacks.
        """
        import secrets

        from app.modules.identity.models import PasswordResetToken
        from app.modules.identity.repository import PasswordResetTokenRepository

        user = await self.user_repo.get_by_email(payload.email)
        if user is None or not user.is_active:
            # Silent return to prevent account enumeration
            logger.info("password_reset_requested_nonexistent_or_disabled", email=payload.email)
            return

        raw_token = secrets.token_urlsafe(32)
        token_h = hash_token(raw_token)
        expires_at = datetime.now(UTC) + timedelta(hours=1)

        reset_token_repo = PasswordResetTokenRepository(self.db)
        reset_record = PasswordResetToken(
            user_id=user.id,
            token_hash=token_h,
            expires_at=expires_at,
        )
        await reset_token_repo.create(reset_record)
        logger.info("password_reset_token_created", user_id=str(user.id))

    async def confirm_password_reset(self, payload: PasswordResetConfirm) -> None:
        """Confirm password reset using single-use token."""
        from app.modules.identity.exceptions import InvalidTokenError
        from app.modules.identity.repository import PasswordResetTokenRepository

        token_h = hash_token(payload.token)
        reset_repo = PasswordResetTokenRepository(self.db)
        reset_record = await reset_repo.get_by_hash(token_h)

        if reset_record is None:
            raise InvalidTokenError("Password reset token is invalid or expired.")

        user = await self.user_repo.get_by_id(reset_record.user_id)
        if user is None or not user.is_active:
            raise InvalidTokenError()

        # Update password
        user.password_hash = hash_password(payload.new_password)

        # Mark token used
        await reset_repo.mark_used(reset_record.id)
        await self.db.flush()

        logger.info("password_reset_confirmed", user_id=str(user.id))

    async def list_user_sessions(self, user_id: UUID, current_session_id: UUID | None = None) -> list[SessionResponse]:
        """List active sessions for user."""
        sessions = await self.session_repo.list_user_sessions(user_id)
        return [
            SessionResponse(
                id=s.id,
                ip_address=s.ip_address,
                user_agent=s.user_agent,
                device_name=s.device_name,
                platform=s.platform,
                browser=s.browser,
                country=s.country,
                city=s.city,
                last_activity_at=s.last_activity_at,
                expires_at=s.expires_at,
                created_at=s.created_at,
                is_current=(s.id == current_session_id),
            )
            for s in sessions
        ]

    # ── Helper Methods ────────────────────────────────────────────────────────

    async def _create_user_session_and_tokens(
        self,
        user: User,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> TokenResponse:
        """Create session, refresh token, and access token for user."""
        secret_key = self.settings.JWT_SECRET_KEY.get_secret_value()
        algorithm = self.settings.JWT_ALGORITHM
        access_token_expires = self.settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        refresh_token_expires_days = self.settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS

        # Create session record
        session_expires_at = datetime.now(UTC) + timedelta(days=refresh_token_expires_days)
        session = Session(
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            last_activity_at=datetime.now(UTC),
            expires_at=session_expires_at,
        )
        session = await self.session_repo.create_session(session)

        # Create JWT access token
        access_token = create_access_token(
            subject=str(user.id),
            secret_key=secret_key,
            algorithm=algorithm,
            expire_minutes=access_token_expires,
            additional_claims={"session_id": str(session.id)},
        )

        # Create JWT refresh token
        refresh_token_str = create_refresh_token(
            subject=str(user.id),
            secret_key=secret_key,
            algorithm=algorithm,
            expire_days=refresh_token_expires_days,
        )

        # Store hashed refresh token in database
        refresh_token_record = RefreshToken(
            session_id=session.id,
            token_hash=hash_token(refresh_token_str),
            expires_at=session_expires_at,
        )
        await self.token_repo.create_token(refresh_token_record)

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=access_token_expires * 60,
            refresh_token=refresh_token_str,
            user=UserResponse.model_validate(user),
        )

    async def list_roles(self) -> list[RoleResponse]:
        """Fetch all system roles."""
        roles = await self.role_repo.list_roles()
        return [RoleResponse.model_validate(r) for r in roles]


__all__ = ["IdentityService", "hash_token"]

