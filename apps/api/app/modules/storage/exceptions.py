"""
ForgeCRM API — Storage Domain Exceptions

Exceptions for file upload validation, file size limits, and document access.

Documentation: docs/03_Backend/307_FILE_STORAGE.md §8
"""

from __future__ import annotations

from app.core.exceptions import NotFoundError, ValidationError


class AttachmentNotFoundError(NotFoundError):
    """Raised when a document attachment record is not found."""

    error_code = "ATTACHMENT_NOT_FOUND"
    message = "The requested document attachment was not found."


class FileSizeExceededError(ValidationError):
    """Raised when an uploaded file exceeds the 25 MB size limit."""

    error_code = "FILE_SIZE_EXCEEDED"
    message = "File size exceeds the maximum allowed limit of 25 MB."


class InvalidMimeTypeError(ValidationError):
    """Raised when an unsupported file type is uploaded."""

    error_code = "INVALID_MIME_TYPE"
    message = "File MIME type is not supported."


__all__ = [
    "AttachmentNotFoundError",
    "FileSizeExceededError",
    "InvalidMimeTypeError",
]
