"""
ForgeCRM API — Workspace Domain Exceptions

Exceptions for multi-tenancy, workspace access, memberships, and invitations.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md §11
"""

from __future__ import annotations

from app.core.exceptions import AuthorizationError, ConflictError, NotFoundError, ValidationError


class WorkspaceNotFoundError(NotFoundError):
    """Raised when a workspace is not found."""

    error_code = "WORKSPACE_NOT_FOUND"
    message = "The requested workspace was not found."


class WorkspaceAccessDeniedError(AuthorizationError):
    """Raised when a user attempts to access a workspace they do not belong to."""

    error_code = "WORKSPACE_ACCESS_DENIED"
    message = "You do not have access to this workspace."


class WorkspaceSlugAlreadyExistsError(ConflictError):
    """Raised when attempting to create a workspace with a non-unique slug."""

    error_code = "WORKSPACE_SLUG_ALREADY_EXISTS"
    message = "A workspace with this URL slug already exists."


class InvitationNotFoundError(NotFoundError):
    """Raised when an invitation token is invalid."""

    error_code = "INVITATION_NOT_FOUND"
    message = "The invitation was not found or is invalid."


class InvitationExpiredError(ValidationError):
    """Raised when an invitation token has expired."""

    error_code = "INVITATION_EXPIRED"
    message = "This invitation has expired."


class AlreadyMemberError(ConflictError):
    """Raised when inviting a user who is already a member of the workspace."""

    error_code = "ALREADY_MEMBER"
    message = "User is already a member of this workspace."


__all__ = [
    "AlreadyMemberError",
    "InvitationExpiredError",
    "InvitationNotFoundError",
    "WorkspaceAccessDeniedError",
    "WorkspaceNotFoundError",
    "WorkspaceSlugAlreadyExistsError",
]
