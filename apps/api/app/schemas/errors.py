"""
ForgeCRM API — Error Response Schemas

Consistent error response format for all API errors.
No internal stack traces are ever returned to clients.

Documentation: docs/01_Architecture/101_SYSTEM_ARCHITECTURE.md §18
Standards: MASTER_IMPLEMENTATION_PLAN.md §12.9
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    """Individual field-level error detail."""

    field: str | None = Field(None, description="Field path that caused the error")
    message: str = Field(..., description="Human-readable error message")
    code: str | None = Field(None, description="Machine-readable error code")


class ErrorResponse(BaseModel):
    """
    Standard error response for all API errors.

    Every error returned by the API follows this schema, enabling
    the frontend to handle errors in a consistent and predictable way.
    """

    error_code: str = Field(
        ...,
        description="Machine-readable error code (e.g. NOT_FOUND, VALIDATION_ERROR)",
        examples=["NOT_FOUND"],
    )
    message: str = Field(
        ...,
        description="Human-readable error message",
        examples=["The requested resource was not found."],
    )
    details: list[ErrorDetail] | dict[str, Any] | str | None = Field(
        default=None,
        description="Additional error context (field errors, constraint violations, etc.)",
    )
    request_id: str | None = Field(
        default=None,
        description="Unique request identifier for correlation with server logs",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "error_code": "NOT_FOUND",
                    "message": "The requested resource was not found.",
                    "details": None,
                    "request_id": "req_01j9k8f3g2m0h4n5p6q7r8s9",
                }
            ]
        }
    }


class ValidationErrorDetail(BaseModel):
    """Pydantic validation error detail for a single field."""

    loc: list[str | int] = Field(..., description="Location path of the invalid field")
    msg: str = Field(..., description="Validation error message")
    type: str = Field(..., description="Pydantic error type code")


class ValidationErrorResponse(BaseModel):
    """
    Error response specifically for 422 Unprocessable Entity errors.

    Returned when the request body fails Pydantic schema validation.
    """

    error_code: str = "VALIDATION_ERROR"
    message: str = "Request validation failed."
    details: list[ValidationErrorDetail] = Field(
        ...,
        description="List of field-level validation errors",
    )
    request_id: str | None = None


__all__ = [
    "ErrorDetail",
    "ErrorResponse",
    "ValidationErrorDetail",
    "ValidationErrorResponse",
]
