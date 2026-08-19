"""
ForgeCRM API — CRM Domain Exceptions

Domain exceptions for Companies, Contacts, Leads, Pipelines, Deals, Activities, and Tasks.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md §11
"""

from __future__ import annotations

from app.core.exceptions import ConflictError, NotFoundError


class CompanyNotFoundError(NotFoundError):
    """Raised when a company record is not found."""

    error_code = "COMPANY_NOT_FOUND"
    message = "The requested company was not found."


class CompanyNameAlreadyExistsError(ConflictError):
    """Raised when creating a company with a duplicate name within the workspace."""

    error_code = "COMPANY_NAME_ALREADY_EXISTS"
    message = "A company with this name already exists in the workspace."


class ContactNotFoundError(NotFoundError):
    """Raised when a contact record is not found."""

    error_code = "CONTACT_NOT_FOUND"
    message = "The requested contact was not found."


class LeadNotFoundError(NotFoundError):
    """Raised when a lead record is not found."""

    error_code = "LEAD_NOT_FOUND"
    message = "The requested lead was not found."


class LeadAlreadyConvertedError(ConflictError):
    """Raised when attempting to convert an already converted lead."""

    error_code = "LEAD_ALREADY_CONVERTED"
    message = "This lead has already been converted into a Company and Contact."


class PipelineNotFoundError(NotFoundError):
    """Raised when a pipeline is not found."""

    error_code = "PIPELINE_NOT_FOUND"
    message = "The requested pipeline was not found."


class StageNotFoundError(NotFoundError):
    """Raised when a pipeline stage is not found."""

    error_code = "STAGE_NOT_FOUND"
    message = "The requested pipeline stage was not found."


class DealNotFoundError(NotFoundError):
    """Raised when a deal is not found."""

    error_code = "DEAL_NOT_FOUND"
    message = "The requested deal was not found."


class TaskNotFoundError(NotFoundError):
    """Raised when a task is not found."""

    error_code = "TASK_NOT_FOUND"
    message = "The requested task was not found."


class StageHasActiveDealsError(ConflictError):
    """Raised when trying to delete a stage or pipeline with active deals attached."""

    error_code = "STAGE_HAS_ACTIVE_DEALS"
    message = "Cannot delete stage or pipeline because active deals are assigned to it. Reassign or delete deals first."


class DuplicateStageNameError(ConflictError):
    """Raised when creating or updating a stage with a duplicate name within a pipeline."""

    error_code = "DUPLICATE_STAGE_NAME"
    message = "A stage with this name already exists in the pipeline."


class ProductNotFoundError(NotFoundError):
    """Raised when a product record is not found."""

    error_code = "PRODUCT_NOT_FOUND"
    message = "The requested product was not found."


class DuplicateProductSKUError(ConflictError):
    """Raised when creating or updating a product with an SKU already in use in this workspace."""

    error_code = "DUPLICATE_PRODUCT_SKU"
    message = "A product with this SKU already exists in this workspace."


class DealLineItemNotFoundError(NotFoundError):
    """Raised when a deal line item record is not found."""

    error_code = "DEAL_LINE_ITEM_NOT_FOUND"
    message = "The requested deal line item was not found."


__all__ = [
    "CompanyNameAlreadyExistsError",
    "CompanyNotFoundError",
    "ContactNotFoundError",
    "DealLineItemNotFoundError",
    "DealNotFoundError",
    "DuplicateProductSKUError",
    "DuplicateStageNameError",
    "LeadAlreadyConvertedError",
    "LeadNotFoundError",
    "PipelineNotFoundError",
    "ProductNotFoundError",
    "StageHasActiveDealsError",
    "StageNotFoundError",
    "TaskNotFoundError",
]
