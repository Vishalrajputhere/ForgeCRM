"""
ForgeCRM API — Domain Exception Classes

Centralized exception hierarchy for all application errors.
Every exception maps to a specific HTTP status code and error code.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md §11
Architecture:  docs/01_Architecture/101_SYSTEM_ARCHITECTURE.md §18
"""

from __future__ import annotations

from http import HTTPStatus


class ForgeCRMError(Exception):
    """Base exception for all ForgeCRM application errors."""

    status_code: int = HTTPStatus.INTERNAL_SERVER_ERROR
    error_code: str = "INTERNAL_ERROR"
    message: str = "An unexpected error occurred."

    def __init__(
        self,
        message: str | None = None,
        error_code: str | None = None,
        detail: dict | list | str | None = None,
    ) -> None:
        self.message = message or self.__class__.message
        self.error_code = error_code or self.__class__.error_code
        self.detail = detail
        super().__init__(self.message)

    def __repr__(self) -> str:
        return (
            f"{self.__class__.__name__}("
            f"error_code={self.error_code!r}, "
            f"message={self.message!r})"
        )


# ── 400 — Validation & Business Rule Errors ───────────────────────────────────


class ValidationError(ForgeCRMError):
    """Request data failed schema or business rule validation."""

    status_code = HTTPStatus.UNPROCESSABLE_ENTITY
    error_code = "VALIDATION_ERROR"
    message = "Request validation failed."


class BusinessRuleError(ForgeCRMError):
    """A business rule was violated (e.g. cannot convert an already-converted lead)."""

    status_code = HTTPStatus.BAD_REQUEST
    error_code = "BUSINESS_RULE_VIOLATION"
    message = "The requested operation violates a business rule."


class DuplicateError(ForgeCRMError):
    """A unique constraint violation (e.g. duplicate email)."""

    status_code = HTTPStatus.CONFLICT
    error_code = "DUPLICATE_RECORD"
    message = "A record with this value already exists."


# ── 401 — Authentication Errors ──────────────────────────────────────────────


class AuthenticationError(ForgeCRMError):
    """User is not authenticated or credentials are invalid."""

    status_code = HTTPStatus.UNAUTHORIZED
    error_code = "AUTHENTICATION_REQUIRED"
    message = "Authentication is required to access this resource."


class InvalidCredentialsError(AuthenticationError):
    """Username/password combination is incorrect."""

    error_code = "INVALID_CREDENTIALS"
    message = "The provided credentials are incorrect."


class TokenExpiredError(AuthenticationError):
    """The provided JWT token has expired."""

    error_code = "TOKEN_EXPIRED"
    message = "The authentication token has expired."


class TokenInvalidError(AuthenticationError):
    """The provided JWT token is malformed or invalid."""

    error_code = "TOKEN_INVALID"
    message = "The authentication token is invalid."


class TokenRevokedError(AuthenticationError):
    """The provided token has been revoked (e.g. after logout)."""

    error_code = "TOKEN_REVOKED"
    message = "The authentication token has been revoked."


# ── 403 — Authorization Errors ───────────────────────────────────────────────


class AuthorizationError(ForgeCRMError):
    """User is authenticated but lacks permission to perform this action."""

    status_code = HTTPStatus.FORBIDDEN
    error_code = "FORBIDDEN"
    message = "You do not have permission to perform this action."


class WorkspaceAccessError(AuthorizationError):
    """User is not a member of the requested workspace."""

    error_code = "WORKSPACE_ACCESS_DENIED"
    message = "You do not have access to this workspace."


class InsufficientPermissionsError(AuthorizationError):
    """User's role does not include the required permission."""

    error_code = "INSUFFICIENT_PERMISSIONS"
    message = "Your role does not have the required permissions for this operation."


# ── 404 — Not Found Errors ────────────────────────────────────────────────────


class NotFoundError(ForgeCRMError):
    """The requested resource was not found."""

    status_code = HTTPStatus.NOT_FOUND
    error_code = "NOT_FOUND"
    message = "The requested resource was not found."


class UserNotFoundError(NotFoundError):
    """A specific user record was not found."""

    error_code = "USER_NOT_FOUND"
    message = "User not found."


class WorkspaceNotFoundError(NotFoundError):
    """A specific workspace record was not found."""

    error_code = "WORKSPACE_NOT_FOUND"
    message = "Workspace not found."


# ── 409 — Conflict Errors ─────────────────────────────────────────────────────


class ConflictError(ForgeCRMError):
    """The operation conflicts with the current state of the resource."""

    status_code = HTTPStatus.CONFLICT
    error_code = "CONFLICT"
    message = "The operation conflicts with the current state of the resource."


# ── 429 — Rate Limit Errors ───────────────────────────────────────────────────


class RateLimitError(ForgeCRMError):
    """The client has exceeded the allowed request rate."""

    status_code = HTTPStatus.TOO_MANY_REQUESTS
    error_code = "RATE_LIMIT_EXCEEDED"
    message = "Too many requests. Please try again later."


# ── 500 — Infrastructure / External Errors ────────────────────────────────────


class DatabaseError(ForgeCRMError):
    """An unexpected database error occurred."""

    status_code = HTTPStatus.INTERNAL_SERVER_ERROR
    error_code = "DATABASE_ERROR"
    message = "A database error occurred."


class StorageError(ForgeCRMError):
    """An error occurred while accessing object storage."""

    status_code = HTTPStatus.INTERNAL_SERVER_ERROR
    error_code = "STORAGE_ERROR"
    message = "A storage error occurred."


class ExternalServiceError(ForgeCRMError):
    """An error occurred while communicating with an external service."""

    status_code = HTTPStatus.BAD_GATEWAY
    error_code = "EXTERNAL_SERVICE_ERROR"
    message = "An external service is currently unavailable."


__all__ = [
    "ForgeCRMError",
    "ValidationError",
    "BusinessRuleError",
    "DuplicateError",
    "AuthenticationError",
    "InvalidCredentialsError",
    "TokenExpiredError",
    "TokenInvalidError",
    "TokenRevokedError",
    "AuthorizationError",
    "WorkspaceAccessError",
    "InsufficientPermissionsError",
    "NotFoundError",
    "UserNotFoundError",
    "WorkspaceNotFoundError",
    "ConflictError",
    "RateLimitError",
    "DatabaseError",
    "StorageError",
    "ExternalServiceError",
]
