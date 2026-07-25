"""
ForgeCRM API — Identity Domain Pydantic Schemas

Request DTOs, Response DTOs, and serialization models for identity workflows.

Documentation: docs/03_Backend/302_API_DESIGN.md
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.modules.identity.validators import EmailStrClean, PasswordStr

# ── Response DTOs ─────────────────────────────────────────────────────────────


class PermissionResponse(BaseModel):
    """Permission DTO."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str = Field(..., description="Permission string in format resource.action")
    module: str
    description: str | None = None


class RoleResponse(BaseModel):
    """Role DTO."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None = None
    is_system: bool
    permissions: list[PermissionResponse] = []


class UserResponse(BaseModel):
    """User account DTO."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    first_name: str
    last_name: str
    full_name: str
    email: str
    phone: str | None = None
    avatar_url: str | None = None
    job_title: str | None = None
    timezone: str
    language: str
    is_active: bool
    is_email_verified: bool
    last_login_at: datetime | None = None
    created_at: datetime
    roles: list[RoleResponse] = []


class TokenResponse(BaseModel):
    """Authentication token response DTO."""

    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Access token expiration in seconds")
    refresh_token: str = Field(..., description="JWT refresh token")
    user: UserResponse


class SessionResponse(BaseModel):
    """User session DTO."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    ip_address: str | None = None
    user_agent: str | None = None
    device_name: str | None = None
    platform: str | None = None
    browser: str | None = None
    country: str | None = None
    city: str | None = None
    last_activity_at: datetime
    expires_at: datetime
    created_at: datetime
    is_current: bool = False


# ── Request DTOs ──────────────────────────────────────────────────────────────


class RegisterRequest(BaseModel):
    """New account registration request DTO."""

    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStrClean
    password: PasswordStr
    job_title: str | None = Field(None, max_length=150)
    phone: str | None = Field(None, max_length=30)


class LoginRequest(BaseModel):
    """Login request DTO."""

    email: EmailStrClean
    password: str = Field(..., min_length=1)


class RefreshTokenRequest(BaseModel):
    """Refresh token request DTO."""

    refresh_token: str = Field(..., min_length=1)


class UserProfileUpdate(BaseModel):
    """User profile update request DTO."""

    first_name: str | None = Field(None, min_length=1, max_length=100)
    last_name: str | None = Field(None, min_length=1, max_length=100)
    phone: str | None = Field(None, max_length=30)
    avatar_url: str | None = None
    job_title: str | None = Field(None, max_length=150)
    timezone: str | None = Field(None, max_length=100)
    language: str | None = Field(None, max_length=30)


class PasswordChangeRequest(BaseModel):
    """Change password request DTO for logged-in users."""

    current_password: str = Field(..., min_length=1)
    new_password: PasswordStr


class PasswordResetRequest(BaseModel):
    """Password reset request initiation DTO."""

    email: EmailStrClean


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation DTO."""

    token: str = Field(..., min_length=1)
    new_password: PasswordStr


__all__ = [
    "PermissionResponse",
    "RoleResponse",
    "UserResponse",
    "TokenResponse",
    "SessionResponse",
    "RegisterRequest",
    "LoginRequest",
    "RefreshTokenRequest",
    "UserProfileUpdate",
    "PasswordChangeRequest",
    "PasswordResetRequest",
    "PasswordResetConfirm",
]
