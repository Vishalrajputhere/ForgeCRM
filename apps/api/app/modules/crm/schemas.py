"""
ForgeCRM API — CRM Domain Pydantic Schemas

Request and Response DTOs for Companies, Contacts, Leads, Pipelines, Stages,
Deals, Deal Products, Tasks, and Activity Timelines.

Documentation: docs/03_Backend/302_API_DESIGN.md
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

# ── Company Schemas ────────────────────────────────────────────────────────────


class CompanyResponse(BaseModel):
    """Company response DTO."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    owner_member_id: UUID
    name: str
    legal_name: str | None = None
    industry_id: UUID | None = None
    website: str | None = None
    email: str | None = None
    phone: str | None = None
    annual_revenue: float | None = None
    employee_count: int | None = None
    description: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime


class CompanyCreate(BaseModel):
    """Company creation request DTO."""

    name: str = Field(..., min_length=1, max_length=255)
    legal_name: str | None = Field(None, max_length=255)
    industry_id: UUID | None = None
    website: str | None = None
    email: str | None = Field(None, max_length=255)
    phone: str | None = Field(None, max_length=50)
    annual_revenue: float | None = Field(None, ge=0)
    employee_count: int | None = Field(None, ge=0)
    description: str | None = None
    owner_member_id: UUID | None = None


class CompanyUpdate(BaseModel):
    """Company update request DTO."""

    name: str | None = Field(None, min_length=1, max_length=255)
    legal_name: str | None = Field(None, max_length=255)
    industry_id: UUID | None = None
    website: str | None = None
    email: str | None = Field(None, max_length=255)
    phone: str | None = Field(None, max_length=50)
    annual_revenue: float | None = Field(None, ge=0)
    employee_count: int | None = Field(None, ge=0)
    description: str | None = None
    status: str | None = Field(None, max_length=30)
    owner_member_id: UUID | None = None


# ── Contact Schemas ────────────────────────────────────────────────────────────


class ContactResponse(BaseModel):
    """Contact response DTO."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    company_id: UUID
    owner_member_id: UUID
    first_name: str
    last_name: str
    job_title: str | None = None
    department: str | None = None
    email: str | None = None
    phone: str | None = None
    mobile: str | None = None
    linkedin_url: str | None = None
    birthday: date | None = None
    is_primary: bool = False
    status: str
    created_at: datetime
    updated_at: datetime


class ContactCreate(BaseModel):
    """Contact creation request DTO."""

    company_id: UUID
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    job_title: str | None = Field(None, max_length=150)
    department: str | None = Field(None, max_length=150)
    email: str | None = Field(None, max_length=255)
    phone: str | None = Field(None, max_length=50)
    mobile: str | None = Field(None, max_length=50)
    linkedin_url: str | None = None
    birthday: date | None = None
    is_primary: bool = False
    owner_member_id: UUID | None = None


class ContactUpdate(BaseModel):
    """Contact update request DTO."""

    first_name: str | None = Field(None, min_length=1, max_length=100)
    last_name: str | None = Field(None, min_length=1, max_length=100)
    job_title: str | None = Field(None, max_length=150)
    department: str | None = Field(None, max_length=150)
    email: str | None = Field(None, max_length=255)
    phone: str | None = Field(None, max_length=50)
    mobile: str | None = Field(None, max_length=50)
    linkedin_url: str | None = None
    birthday: date | None = None
    is_primary: bool | None = None
    status: str | None = Field(None, max_length=30)
    owner_member_id: UUID | None = None


# ── Lead Schemas ───────────────────────────────────────────────────────────────


class LeadResponse(BaseModel):
    """Lead response DTO."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    owner_member_id: UUID
    source_id: UUID | None = None
    status_id: UUID
    first_name: str
    last_name: str | None = None
    company_name: str | None = None
    job_title: str | None = None
    email: str | None = None
    phone: str | None = None
    website: str | None = None
    estimated_value: float | None = None
    priority: str
    description: str | None = None
    converted_at: datetime | None = None
    created_at: datetime


class LeadCreate(BaseModel):
    """Lead creation request DTO."""

    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str | None = Field(None, max_length=100)
    company_name: str | None = Field(None, max_length=255)
    job_title: str | None = Field(None, max_length=150)
    email: str | None = Field(None, max_length=255)
    phone: str | None = Field(None, max_length=50)
    website: str | None = None
    estimated_value: float | None = Field(None, ge=0)
    priority: str = Field("Medium", max_length=20)
    description: str | None = None
    source_id: UUID | None = None
    status_id: UUID | None = None
    owner_member_id: UUID | None = None


class LeadUpdate(BaseModel):
    """Lead update request DTO."""

    first_name: str | None = Field(None, min_length=1, max_length=100)
    last_name: str | None = Field(None, max_length=100)
    company_name: str | None = Field(None, max_length=255)
    job_title: str | None = Field(None, max_length=150)
    email: str | None = Field(None, max_length=255)
    phone: str | None = Field(None, max_length=50)
    website: str | None = None
    estimated_value: float | None = Field(None, ge=0)
    priority: str | None = Field(None, max_length=20)
    description: str | None = None
    status_id: UUID | None = None
    owner_member_id: UUID | None = None


class LeadConvertRequest(BaseModel):
    """Transactional lead conversion request DTO."""

    create_deal: bool = True
    deal_name: str | None = Field(None, max_length=255)
    deal_value: float | None = Field(None, ge=0)
    pipeline_id: UUID | None = None
    stage_id: UUID | None = None


class LeadConversionResponse(BaseModel):
    """Result of transactional lead conversion."""

    company: CompanyResponse
    contact: ContactResponse
    deal: DealResponse | None = None
    converted_at: datetime


# ── Pipeline & Deal Schemas ────────────────────────────────────────────────────


class StageResponse(BaseModel):
    """Pipeline stage DTO."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    pipeline_id: UUID
    name: str
    sort_order: int
    probability: int
    is_closed: bool
    is_won: bool
    color: str | None = None


class StageCreate(BaseModel):
    """Pipeline stage creation request DTO."""

    name: str = Field(..., min_length=1, max_length=120)
    sort_order: int = Field(0, ge=0)
    probability: int = Field(10, ge=0, le=100)
    is_closed: bool = False
    is_won: bool = False
    color: str | None = Field(None, max_length=20)


class StageUpdate(BaseModel):
    """Pipeline stage update request DTO."""

    name: str | None = Field(None, min_length=1, max_length=120)
    sort_order: int | None = Field(None, ge=0)
    probability: int | None = Field(None, ge=0, le=100)
    is_closed: bool | None = None
    is_won: bool | None = None
    color: str | None = Field(None, max_length=20)


class StageReorderItem(BaseModel):
    """Single stage order item in reorder request."""

    id: UUID
    sort_order: int = Field(..., ge=0)


class StageReorderRequest(BaseModel):
    """Pipeline stage batch reorder request DTO."""

    stages: list[StageReorderItem] = Field(..., min_length=1)


class PipelineResponse(BaseModel):
    """Pipeline response DTO with stages."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    name: str
    description: str | None = None
    is_default: bool
    is_active: bool
    stages: list[StageResponse] = []


class PipelineCreate(BaseModel):
    """Pipeline creation request DTO."""

    name: str = Field(..., min_length=1, max_length=150)
    description: str | None = None
    is_default: bool = False
    stages: list[StageCreate] = []


class PipelineUpdate(BaseModel):
    """Pipeline update request DTO."""

    name: str | None = Field(None, min_length=1, max_length=150)
    description: str | None = None
    is_default: bool | None = None
    is_active: bool | None = None


class DealProductSchema(BaseModel):
    """Deal product line item DTO."""

    model_config = ConfigDict(from_attributes=True)

    product_name: str = Field(..., min_length=1, max_length=255)
    quantity: float = Field(1.0, ge=0.01)
    unit_price: float = Field(0.0, ge=0.0)
    discount_percent: float = Field(0.0, ge=0.0, le=100.0)
    line_total: float = Field(0.0, ge=0.0)


class DealResponse(BaseModel):
    """Deal response DTO."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    pipeline_id: UUID
    stage_id: UUID
    company_id: UUID
    primary_contact_id: UUID | None = None
    owner_member_id: UUID
    name: str
    value: float
    expected_close_date: date | None = None
    probability: int | None = None
    status: str
    loss_reason: str | None = None
    description: str | None = None
    created_at: datetime
    products: list[DealProductSchema] = []


class DealCreate(BaseModel):
    """Deal creation request DTO."""

    name: str = Field(..., min_length=1, max_length=255)
    company_id: UUID
    pipeline_id: UUID | None = None
    stage_id: UUID | None = None
    primary_contact_id: UUID | None = None
    value: float = Field(0.0, ge=0.0)
    expected_close_date: date | None = None
    probability: int | None = Field(None, ge=0, le=100)
    description: str | None = None
    owner_member_id: UUID | None = None
    products: list[DealProductSchema] = []


class DealUpdate(BaseModel):
    """Deal update request DTO."""

    name: str | None = Field(None, min_length=1, max_length=255)
    company_id: UUID | None = None
    stage_id: UUID | None = None
    primary_contact_id: UUID | None = None
    value: float | None = Field(None, ge=0.0)
    expected_close_date: date | None = None
    probability: int | None = Field(None, ge=0, le=100)
    status: str | None = Field(None, max_length=30)
    loss_reason: str | None = None
    description: str | None = None
    owner_member_id: UUID | None = None


class DealStageMoveRequest(BaseModel):
    """Request DTO to move a deal to a new stage."""

    stage_id: UUID
    loss_reason: str | None = None


# ── Task & Activity Schemas ───────────────────────────────────────────────────


class TaskResponse(BaseModel):
    """Task response DTO."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    owner_member_id: UUID
    assigned_member_id: UUID
    entity_type: str | None = None
    entity_id: UUID | None = None
    title: str
    description: str | None = None
    priority: str
    status: str
    due_date: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime


class TaskCreate(BaseModel):
    """Task creation request DTO."""

    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    priority: str = Field("Medium", max_length=20)
    due_date: datetime | None = None
    assigned_member_id: UUID | None = None
    entity_type: str | None = Field(None, max_length=50)
    entity_id: UUID | None = None


class TaskUpdate(BaseModel):
    """Task update request DTO."""

    title: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    priority: str | None = Field(None, max_length=20)
    status: str | None = Field(None, max_length=20)
    due_date: datetime | None = None
    assigned_member_id: UUID | None = None


class ActivityResponse(BaseModel):
    """Timeline activity response DTO."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    activity_type_id: UUID
    actor_member_id: UUID | None = None
    entity_type: str
    entity_id: UUID
    title: str
    description: str | None = None
    metadata_json: dict[str, Any] | None = None
    occurred_at: datetime


class ActivityResponse(BaseModel):
    """Timeline activity response DTO."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    activity_type_id: UUID
    actor_member_id: UUID | None = None
    entity_type: str
    entity_id: UUID
    title: str
    description: str | None = None
    metadata_json: dict[str, Any] | None = None
    occurred_at: datetime


# ── Bulk Operations & Import/Export DTOs ──────────────────────────────────────


class BulkDeleteRequest(BaseModel):
    entity_type: str = Field(..., description="Company, Contact, Lead, Deal, Task, Storage")
    ids: list[UUID] = Field(..., min_length=1)
    permanent: bool = Field(False, description="Soft delete if false, permanent delete if true")


class BulkDeleteResponse(BaseModel):
    affected_count: int
    protected_count: int = 0
    protected_ids: list[UUID] = []
    message: str


class BulkArchiveRequest(BaseModel):
    entity_type: str
    ids: list[UUID] = Field(..., min_length=1)


class BulkRestoreRequest(BaseModel):
    entity_type: str
    ids: list[UUID] = Field(..., min_length=1)


class BulkAssignOwnerRequest(BaseModel):
    entity_type: str
    ids: list[UUID] = Field(..., min_length=1)
    owner_member_id: UUID


class BulkUpdateStatusRequest(BaseModel):
    entity_type: str
    ids: list[UUID] = Field(..., min_length=1)
    status: str


class BulkMoveStageRequest(BaseModel):
    ids: list[UUID] = Field(..., min_length=1)
    pipeline_id: UUID
    stage_id: UUID


class BulkTagRequest(BaseModel):
    entity_type: str
    ids: list[UUID] = Field(..., min_length=1)
    tags: list[str] = Field(..., min_length=1)
    action: str = Field("add", description="add or remove")


class CSVImportRow(BaseModel):
    row_index: int
    data: dict[str, Any]


class CSVImportRequest(BaseModel):
    entity_type: str
    rows: list[CSVImportRow]
    duplicate_resolution: str = Field("skip", description="skip, update, merge, create")
    dry_run: bool = Field(False)


class CSVImportSummaryResponse(BaseModel):
    job_id: UUID | None = None
    imported_rows: int
    skipped_rows: int
    error_rows: int
    total_rows: int
    duration_seconds: float
    error_details: list[dict[str, Any]] = []


class ExportRequest(BaseModel):
    entity_type: str
    format: str = Field("csv", description="csv or xlsx")
    scope: str = Field("selected", description="selected, filtered, workspace")
    selected_ids: list[UUID] = []
    search_query: str | None = None
    status_filter: str | None = None


class ImportJobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    created_by_member_id: UUID
    entity_type: str
    filename: str
    status: str
    total_rows: int
    imported_rows: int
    skipped_rows: int
    error_rows: int
    duration_seconds: float
    created_at: datetime


class ExportJobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    created_by_member_id: UUID
    entity_type: str
    export_format: str
    filter_scope: str
    total_records: int
    download_url: str | None = None
    created_at: datetime


__all__ = [
    "ActivityResponse",
    "BulkArchiveRequest",
    "BulkAssignOwnerRequest",
    "BulkDeleteRequest",
    "BulkDeleteResponse",
    "BulkMoveStageRequest",
    "BulkRestoreRequest",
    "BulkTagRequest",
    "BulkUpdateStatusRequest",
    "CSVImportRequest",
    "CSVImportSummaryResponse",
    "CompanyCreate",
    "CompanyResponse",
    "CompanyUpdate",
    "ContactCreate",
    "ContactResponse",
    "ContactUpdate",
    "DealCreate",
    "DealProductSchema",
    "DealResponse",
    "DealStageMoveRequest",
    "DealUpdate",
    "ExportJobResponse",
    "ExportRequest",
    "ImportJobResponse",
    "LeadConversionResponse",
    "LeadConvertRequest",
    "LeadCreate",
    "LeadResponse",
    "LeadUpdate",
    "PipelineCreate",
    "PipelineResponse",
    "StageCreate",
    "StageResponse",
    "TaskCreate",
    "TaskResponse",
    "TaskUpdate",
]
