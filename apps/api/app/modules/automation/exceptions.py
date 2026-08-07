"""
ForgeCRM API — Workflow Automation Exceptions

Domain-specific exceptions for the automation engine.
All inherit from ForgeCRMError for centralized handling.
"""

from __future__ import annotations

from fastapi import status

from app.core.exceptions import ForgeCRMError


class AutomationNotFoundError(ForgeCRMError):
    """Automation rule or template not found in this workspace."""

    status_code = status.HTTP_404_NOT_FOUND
    error_code = "AUTOMATION_NOT_FOUND"

    def __init__(self, automation_id: str | None = None) -> None:
        detail = f"Automation rule '{automation_id}' not found." if automation_id else "Automation rule not found."
        super().__init__(
            message=detail,
            error_code=self.error_code,
        )


class AutomationRunNotFoundError(ForgeCRMError):
    """Automation run record not found."""

    status_code = status.HTTP_404_NOT_FOUND
    error_code = "AUTOMATION_RUN_NOT_FOUND"

    def __init__(self, run_id: str | None = None) -> None:
        detail = f"Automation run '{run_id}' not found." if run_id else "Automation run not found."
        super().__init__(
            message=detail,
            error_code=self.error_code,
        )


class AutomationTemplateNotFoundError(ForgeCRMError):
    """Automation template not found."""

    status_code = status.HTTP_404_NOT_FOUND
    error_code = "AUTOMATION_TEMPLATE_NOT_FOUND"

    def __init__(self, template_id: str | None = None) -> None:
        detail = f"Automation template '{template_id}' not found." if template_id else "Automation template not found."
        super().__init__(
            message=detail,
            error_code=self.error_code,
        )


class AutomationExecutionError(ForgeCRMError):
    """Raised when the automation engine fails to execute an action."""

    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    error_code = "AUTOMATION_EXECUTION_ERROR"

    def __init__(self, message: str = "Automation execution failed.") -> None:
        super().__init__(
            message=message,
            error_code=self.error_code,
        )


class AutomationValidationError(ForgeCRMError):
    """Raised when an automation rule fails structural validation."""

    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    error_code = "AUTOMATION_VALIDATION_ERROR"

    def __init__(self, message: str = "Automation rule configuration is invalid.") -> None:
        super().__init__(
            message=message,
            error_code=self.error_code,
        )


__all__ = [
    "AutomationExecutionError",
    "AutomationNotFoundError",
    "AutomationRunNotFoundError",
    "AutomationTemplateNotFoundError",
    "AutomationValidationError",
]
