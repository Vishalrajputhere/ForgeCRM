"""
ForgeCRM API — Identity Domain Exceptions

Domain-specific exceptions for authentication, authorization,
registration, token validation, and password reset.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md §11
"""

from __future__ import annotations

from http import HTTPStatus

from app.core.exceptions import AuthenticationError, ConflictError, ForgeCRMError, ValidationError


class UserAlreadyExistsError(ConflictError):
    """Raised when registering an email that already exists."""

    error_code = "USER_ALREADY_EXISTS"
    message = "An account with this email address already exists."


class AccountDisabledError(AuthenticationError):
    """Raised when an inactive account attempts to log in."""

    error_code = "ACCOUNT_DISABLED"
    message = "This account has been disabled. Please contact support."


class EmailNotVerifiedError(AuthenticationError):
    """Raised when an unverified account attempts to access restricted features."""

    error_code = "EMAIL_NOT_VERIFIED"
    message = "Email address has not been verified."


class InvalidTokenError(AuthenticationError):
    """Raised when a refresh or reset token is invalid or expired."""

    error_code = "INVALID_TOKEN"
    message = "The provided token is invalid or has expired."


class TokenRevokedError(AuthenticationError):
    """Raised when a revoked refresh token is presented."""

    error_code = "TOKEN_REVOKED"
    message = "The token has been revoked."


class SessionExpiredError(AuthenticationError):
    """Raised when a session has expired."""

    error_code = "SESSION_EXPIRED"
    message = "Your session has expired. Please log in again."


class SessionRevokedError(AuthenticationError):
    """Raised when a session has been revoked."""

    error_code = "SESSION_REVOKED"
    message = "Your session was terminated. Please log in again."


class PasswordPolicyError(ValidationError):
    """Raised when a password fails policy checks."""

    error_code = "PASSWORD_POLICY_VIOLATION"
    message = "Password does not meet the minimum security requirements."


__all__ = [
    "UserAlreadyExistsError",
    "AccountDisabledError",
    "EmailNotVerifiedError",
    "InvalidTokenError",
    "TokenRevokedError",
    "SessionExpiredError",
    "SessionRevokedError",
    "PasswordPolicyError",
]
