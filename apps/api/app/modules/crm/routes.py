"""
ForgeCRM API — CRM Domain Routes

FastAPI router for Companies, Contacts, Leads, Pipelines, Deals, Tasks,
and Timeline Activity histories with multi-tenant workspace isolation.

Documentation: docs/03_Backend/302_API_DESIGN.md
"""

from __future__ import annotations

from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import (
    CurrentUser,
    get_current_workspace_id,
    get_current_workspace_member,
    require_workspace_permission,
)
from app.db.session import get_db_session
from app.modules.crm.schemas import (
    ActivityResponse,
    BulkArchiveRequest,
    BulkAssignOwnerRequest,
    BulkDeleteRequest,
    BulkDeleteResponse,
    BulkMoveStageRequest,
    BulkRestoreRequest,
    BulkUpdateStatusRequest,
    CSVImportRequest,
    CSVImportSummaryResponse,
    CompanyCreate,
    CompanyResponse,
    CompanyUpdate,
    ContactCreate,
    ContactResponse,
    ContactUpdate,
    DealCreate,
    DealResponse,
    DealStageMoveRequest,
    DealUpdate,
    ExportJobResponse,
    ExportRequest,
    ImportJobResponse,
    LeadConversionResponse,
    LeadConvertRequest,
    LeadCreate,
    LeadResponse,
    LeadUpdate,
    PipelineCreate,
    PipelineResponse,
    PipelineUpdate,
    StageCreate,
    StageReorderRequest,
    StageResponse,
    StageUpdate,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)
from app.modules.crm.service import CRMService

router = APIRouter(prefix="", tags=["CRM Core Operational"])

# Shared Dependency Aliases
WorkspaceIdDep = Annotated[UUID, Depends(get_current_workspace_id)]
WorkspaceMemberDep = Annotated[Any, Depends(get_current_workspace_member)]


# ── Companies ──────────────────────────────────────────────────────────────────


@router.post(
    "/companies",
    response_model=CompanyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Company",
    description="Creates a new company account within the active workspace.",
    dependencies=[Depends(require_workspace_permission("companies.create"))],
)
async def create_company(
    payload: CompanyCreate,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> CompanyResponse:
    service = CRMService(db)
    return await service.create_company(workspace_id, member.id, payload)


@router.get(
    "/companies",
    response_model=list[CompanyResponse],
    status_code=status.HTTP_200_OK,
    summary="List Companies",
    description="Returns all active companies within the active workspace.",
    dependencies=[Depends(require_workspace_permission("companies.read"))],
)
async def list_companies(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[CompanyResponse]:
    service = CRMService(db)
    return await service.list_companies(workspace_id)


@router.get(
    "/companies/{company_id}",
    response_model=CompanyResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Company Details",
    description="Returns company account details.",
    dependencies=[Depends(require_workspace_permission("companies.read"))],
)
async def get_company(
    company_id: UUID,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> CompanyResponse:
    service = CRMService(db)
    return await service.get_company(workspace_id, company_id)


@router.patch(
    "/companies/{company_id}",
    response_model=CompanyResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Company",
    description="Updates company account details.",
    dependencies=[Depends(require_workspace_permission("companies.update"))],
)
async def update_company(
    company_id: UUID,
    payload: CompanyUpdate,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> CompanyResponse:
    service = CRMService(db)
    return await service.update_company(workspace_id, company_id, payload)


# ── Contacts ───────────────────────────────────────────────────────────────────


@router.post(
    "/contacts",
    response_model=ContactResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Contact",
    description="Creates a new individual contact associated with a company.",
    dependencies=[Depends(require_workspace_permission("contacts.create"))],
)
async def create_contact(
    payload: ContactCreate,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> ContactResponse:
    service = CRMService(db)
    return await service.create_contact(workspace_id, member.id, payload)


@router.get(
    "/contacts",
    response_model=list[ContactResponse],
    status_code=status.HTTP_200_OK,
    summary="List Contacts",
    description="Returns contacts in the active workspace.",
    dependencies=[Depends(require_workspace_permission("contacts.read"))],
)
async def list_contacts(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    company_id: UUID | None = Query(None, description="Optional company filter"),
) -> list[ContactResponse]:
    service = CRMService(db)
    return await service.list_contacts(workspace_id, company_id=company_id)


@router.get(
    "/contacts/{contact_id}",
    response_model=ContactResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Contact Details",
    description="Returns contact details.",
    dependencies=[Depends(require_workspace_permission("contacts.read"))],
)
async def get_contact(
    contact_id: UUID,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> ContactResponse:
    service = CRMService(db)
    return await service.get_contact(workspace_id, contact_id)


@router.patch(
    "/contacts/{contact_id}",
    response_model=ContactResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Contact",
    description="Updates contact details.",
    dependencies=[Depends(require_workspace_permission("contacts.update"))],
)
async def update_contact(
    contact_id: UUID,
    payload: ContactUpdate,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> ContactResponse:
    service = CRMService(db)
    return await service.update_contact(workspace_id, member.id, contact_id, payload)


@router.delete(
    "/contacts/{contact_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Contact",
    description="Soft-deletes a contact (sets status to Inactive).",
    dependencies=[Depends(require_workspace_permission("contacts.delete"))],
)
async def delete_contact(
    contact_id: UUID,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    service = CRMService(db)
    await service.delete_contact(workspace_id, member.id, contact_id)


# ── Leads & Conversion ─────────────────────────────────────────────────────────


@router.post(
    "/leads",
    response_model=LeadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Lead",
    description="Creates an unqualified sales lead.",
    dependencies=[Depends(require_workspace_permission("leads.create"))],
)
async def create_lead(
    payload: LeadCreate,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> LeadResponse:
    service = CRMService(db)
    return await service.create_lead(workspace_id, member.id, payload)


@router.get(
    "/leads",
    response_model=list[LeadResponse],
    status_code=status.HTTP_200_OK,
    summary="List Leads",
    description="Returns active leads in the workspace.",
    dependencies=[Depends(require_workspace_permission("leads.read"))],
)
async def list_leads(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[LeadResponse]:
    service = CRMService(db)
    return await service.list_leads(workspace_id)


@router.get(
    "/leads/{lead_id}",
    response_model=LeadResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Lead Details",
    description="Returns lead details.",
    dependencies=[Depends(require_workspace_permission("leads.read"))],
)
async def get_lead(
    lead_id: UUID,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> LeadResponse:
    service = CRMService(db)
    return await service.get_lead(workspace_id, lead_id)


@router.patch(
    "/leads/{lead_id}",
    response_model=LeadResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Lead",
    description="Updates lead details.",
    dependencies=[Depends(require_workspace_permission("leads.update"))],
)
async def update_lead(
    lead_id: UUID,
    payload: LeadUpdate,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> LeadResponse:
    service = CRMService(db)
    return await service.update_lead(workspace_id, member.id, lead_id, payload)


@router.delete(
    "/leads/{lead_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Lead",
    description="Soft-deletes a lead (marks as disqualified).",
    dependencies=[Depends(require_workspace_permission("leads.delete"))],
)
async def delete_lead(
    lead_id: UUID,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    service = CRMService(db)
    await service.delete_lead(workspace_id, member.id, lead_id)


@router.post(
    "/leads/{lead_id}/convert",
    response_model=LeadConversionResponse,
    status_code=status.HTTP_200_OK,
    summary="Convert Lead",
    description="Transactionally converts a lead into a Company, Primary Contact, and optional Deal.",
    dependencies=[Depends(require_workspace_permission("leads.convert"))],
)
async def convert_lead(
    lead_id: UUID,
    payload: LeadConvertRequest,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> LeadConversionResponse:
    service = CRMService(db)
    return await service.convert_lead(workspace_id, member.id, lead_id, payload)


# ── Pipelines & Deals ──────────────────────────────────────────────────────────


@router.post(
    "/pipelines",
    response_model=PipelineResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Pipeline",
    description="Creates a sales pipeline with stages.",
    dependencies=[Depends(require_workspace_permission("workspace.update"))],
)
async def create_pipeline(
    payload: PipelineCreate,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> PipelineResponse:
    service = CRMService(db)
    return await service.create_pipeline(workspace_id, member.id, payload)


@router.get(
    "/pipelines",
    response_model=list[PipelineResponse],
    status_code=status.HTTP_200_OK,
    summary="List Pipelines",
    description="Returns sales pipelines in workspace.",
    dependencies=[Depends(require_workspace_permission("deals.read"))],
)
async def list_pipelines(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[PipelineResponse]:
    service = CRMService(db)
    return await service.list_pipelines(workspace_id)


@router.patch(
    "/pipelines/{pipeline_id}",
    response_model=PipelineResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Pipeline",
    description="Updates a sales pipeline name, description, or default status.",
    dependencies=[Depends(require_workspace_permission("workspace.update"))],
)
async def update_pipeline(
    pipeline_id: UUID,
    payload: PipelineUpdate,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> PipelineResponse:
    service = CRMService(db)
    return await service.update_pipeline(workspace_id, member.id, pipeline_id, payload)


@router.delete(
    "/pipelines/{pipeline_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Archive Pipeline",
    description="Soft archives a sales pipeline if no active deals are assigned to it.",
    dependencies=[Depends(require_workspace_permission("workspace.update"))],
)
async def delete_pipeline(
    pipeline_id: UUID,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    service = CRMService(db)
    await service.delete_pipeline(workspace_id, member.id, pipeline_id)


@router.post(
    "/pipelines/{pipeline_id}/duplicate",
    response_model=PipelineResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Duplicate Pipeline",
    description="Duplicates a sales pipeline along with all its stages.",
    dependencies=[Depends(require_workspace_permission("workspace.update"))],
)
async def duplicate_pipeline(
    pipeline_id: UUID,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> PipelineResponse:
    service = CRMService(db)
    return await service.duplicate_pipeline(workspace_id, member.id, pipeline_id)


@router.post(
    "/pipelines/{pipeline_id}/stages",
    response_model=StageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Stage",
    description="Adds a new stage to a sales pipeline.",
    dependencies=[Depends(require_workspace_permission("workspace.update"))],
)
async def create_stage(
    pipeline_id: UUID,
    payload: StageCreate,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> StageResponse:
    service = CRMService(db)
    return await service.create_stage(workspace_id, member.id, pipeline_id, payload)


@router.patch(
    "/pipelines/{pipeline_id}/stages/{stage_id}",
    response_model=StageResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Stage",
    description="Updates stage details (name, color, probability, flags).",
)
async def update_stage(
    pipeline_id: UUID,
    stage_id: UUID,
    payload: StageUpdate,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> StageResponse:
    service = CRMService(db)
    return await service.update_stage(workspace_id, member.id, pipeline_id, stage_id, payload)


@router.delete(
    "/pipelines/{pipeline_id}/stages/{stage_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Stage",
    description="Deletes a stage from a pipeline if no active deals are assigned.",
)
async def delete_stage(
    pipeline_id: UUID,
    stage_id: UUID,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    service = CRMService(db)
    await service.delete_stage(workspace_id, member.id, pipeline_id, stage_id)


@router.post(
    "/pipelines/{pipeline_id}/stages/reorder",
    response_model=PipelineResponse,
    status_code=status.HTTP_200_OK,
    summary="Reorder Stages",
    description="Batch reorders stages within a pipeline.",
)
async def reorder_stages(
    pipeline_id: UUID,
    payload: StageReorderRequest,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> PipelineResponse:
    service = CRMService(db)
    return await service.reorder_stages(workspace_id, member.id, pipeline_id, payload)


@router.post(
    "/deals",
    response_model=DealResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Deal",
    description="Creates a sales opportunity deal.",
    dependencies=[Depends(require_workspace_permission("deals.create"))],
)
async def create_deal(
    payload: DealCreate,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> DealResponse:
    service = CRMService(db)
    return await service.create_deal(workspace_id, member.id, payload)


@router.get(
    "/deals",
    response_model=list[DealResponse],
    status_code=status.HTTP_200_OK,
    summary="List Deals",
    description="Returns active sales deals in workspace.",
    dependencies=[Depends(require_workspace_permission("deals.read"))],
)
async def list_deals(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    pipeline_id: UUID | None = Query(None, description="Filter by pipeline"),
) -> list[DealResponse]:
    service = CRMService(db)
    return await service.list_deals(workspace_id, pipeline_id=pipeline_id)


@router.get(
    "/deals/{deal_id}",
    response_model=DealResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Deal Details",
    description="Returns deal details.",
    dependencies=[Depends(require_workspace_permission("deals.read"))],
)
async def get_deal(
    deal_id: UUID,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> DealResponse:
    service = CRMService(db)
    return await service.get_deal(workspace_id, deal_id)


@router.patch(
    "/deals/{deal_id}",
    response_model=DealResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Deal",
    description="Updates deal details.",
    dependencies=[Depends(require_workspace_permission("deals.update"))],
)
async def update_deal(
    deal_id: UUID,
    payload: DealUpdate,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> DealResponse:
    service = CRMService(db)
    return await service.update_deal(workspace_id, member.id, deal_id, payload)


@router.delete(
    "/deals/{deal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Deal",
    description="Soft-deletes a deal (sets status to Cancelled).",
    dependencies=[Depends(require_workspace_permission("deals.delete"))],
)
async def delete_deal(
    deal_id: UUID,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    service = CRMService(db)
    await service.delete_deal(workspace_id, member.id, deal_id)


@router.post(
    "/deals/{deal_id}/move-stage",
    response_model=DealResponse,
    status_code=status.HTTP_200_OK,
    summary="Move Deal Stage",
    description="Moves a deal to a new stage in its pipeline.",
    dependencies=[Depends(require_workspace_permission("deals.move_stage"))],
)
async def move_deal_stage(
    deal_id: UUID,
    payload: DealStageMoveRequest,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> DealResponse:
    service = CRMService(db)
    return await service.move_deal_stage(workspace_id, member.id, deal_id, payload)


# ── Tasks ──────────────────────────────────────────────────────────────────────


@router.post(
    "/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Task",
    description="Creates an actionable task item.",
    dependencies=[Depends(require_workspace_permission("tasks.create"))],
)
async def create_task(
    payload: TaskCreate,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> TaskResponse:
    service = CRMService(db)
    return await service.create_task(workspace_id, member.id, payload)


@router.get(
    "/tasks",
    response_model=list[TaskResponse],
    status_code=status.HTTP_200_OK,
    summary="List Tasks",
    description="Returns tasks in workspace.",
    dependencies=[Depends(require_workspace_permission("tasks.read"))],
)
async def list_tasks(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[TaskResponse]:
    service = CRMService(db)
    return await service.list_tasks(workspace_id)


@router.get(
    "/tasks/{task_id}",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Task Details",
    description="Returns task details.",
    dependencies=[Depends(require_workspace_permission("tasks.read"))],
)
async def get_task(
    task_id: UUID,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> TaskResponse:
    service = CRMService(db)
    return await service.get_task(workspace_id, task_id)


@router.patch(
    "/tasks/{task_id}",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Task",
    description="Updates task details.",
    dependencies=[Depends(require_workspace_permission("tasks.update"))],
)
async def update_task(
    task_id: UUID,
    payload: TaskUpdate,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> TaskResponse:
    service = CRMService(db)
    return await service.update_task(workspace_id, member.id, task_id, payload)


@router.delete(
    "/tasks/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Task",
    description="Soft-deletes a task (sets status to Cancelled).",
    dependencies=[Depends(require_workspace_permission("tasks.delete"))],
)
async def delete_task(
    task_id: UUID,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    service = CRMService(db)
    await service.delete_task(workspace_id, member.id, task_id)


@router.post(
    "/tasks/{task_id}/complete",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Complete Task",
    description="Marks task as completed.",
    dependencies=[Depends(require_workspace_permission("tasks.update"))],
)
async def complete_task(
    task_id: UUID,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> TaskResponse:
    service = CRMService(db)
    return await service.complete_task(workspace_id, member.id, task_id)


# ── Timeline Activities ───────────────────────────────────────────────────────


@router.get(
    "/timeline",
    response_model=list[ActivityResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Entity Timeline",
    description="Returns immutable timeline activities for a CRM entity.",
    dependencies=[Depends(require_workspace_permission("companies.read"))],
)
async def list_timeline(
    entity_type: str,
    entity_id: UUID,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[ActivityResponse]:
    service = CRMService(db)
    return await service.list_timeline(workspace_id, entity_type, entity_id)


# ── Bulk Operations Engine Endpoints ──────────────────────────────────────────


@router.post(
    "/bulk/delete",
    response_model=BulkDeleteResponse,
    status_code=status.HTTP_200_OK,
    summary="Bulk Delete Records",
    description="Batch deletes records with Protected Records dependency validation.",
    dependencies=[Depends(require_workspace_permission("deals.delete"))],
)
async def bulk_delete(
    payload: BulkDeleteRequest,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> BulkDeleteResponse:
    service = CRMService(db)
    return await service.bulk_delete_service(workspace_id, member.id, payload)


@router.post(
    "/bulk/archive",
    status_code=status.HTTP_200_OK,
    summary="Bulk Archive Records",
    dependencies=[Depends(require_workspace_permission("deals.delete"))],
)
async def bulk_archive(
    payload: BulkArchiveRequest,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict[str, int]:
    service = CRMService(db)
    count = await service.bulk_archive_service(workspace_id, member.id, payload)
    return {"archived_count": count}


@router.post(
    "/bulk/restore",
    status_code=status.HTTP_200_OK,
    summary="Bulk Restore Records",
    dependencies=[Depends(require_workspace_permission("deals.update"))],
)
async def bulk_restore(
    payload: BulkRestoreRequest,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict[str, int]:
    service = CRMService(db)
    count = await service.bulk_restore_service(workspace_id, member.id, payload)
    return {"restored_count": count}


@router.post(
    "/bulk/assign-owner",
    status_code=status.HTTP_200_OK,
    summary="Bulk Reassign Owner",
    dependencies=[Depends(require_workspace_permission("tasks.assign"))],
)
async def bulk_assign_owner(
    payload: BulkAssignOwnerRequest,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict[str, int]:
    service = CRMService(db)
    count = await service.bulk_reassign_owner_service(workspace_id, member.id, payload)
    return {"reassigned_count": count}


@router.post(
    "/bulk/update-status",
    status_code=status.HTTP_200_OK,
    summary="Bulk Update Status",
    dependencies=[Depends(require_workspace_permission("deals.update"))],
)
async def bulk_update_status(
    payload: BulkUpdateStatusRequest,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict[str, int]:
    service = CRMService(db)
    count = await service.bulk_update_status_service(workspace_id, member.id, payload)
    return {"updated_count": count}


@router.post(
    "/bulk/move-stage",
    status_code=status.HTTP_200_OK,
    summary="Bulk Move Deal Stage",
    dependencies=[Depends(require_workspace_permission("deals.move_stage"))],
)
async def bulk_move_stage(
    payload: BulkMoveStageRequest,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict[str, int]:
    service = CRMService(db)
    count = await service.bulk_move_stage_service(workspace_id, member.id, payload)
    return {"moved_count": count}


# ── Import / Export Engine Endpoints ──────────────────────────────────────────


@router.post(
    "/import/csv",
    response_model=CSVImportSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Process CSV Import",
    dependencies=[Depends(require_workspace_permission("companies.create"))],
)
async def import_csv(
    payload: CSVImportRequest,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> CSVImportSummaryResponse:
    from app.modules.crm.csv_processor import process_csv_import
    return await process_csv_import(db, workspace_id, member.id, payload)


@router.post(
    "/export/dataset",
    status_code=status.HTTP_200_OK,
    summary="Export Dataset",
)
async def export_dataset(
    payload: ExportRequest,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
):
    from fastapi.responses import Response
    from app.modules.crm.export_service import generate_dataset_export
    from app.core.exceptions import InsufficientPermissionsError

    # Dynamic permission validation based on entity_type
    is_super = any(r.name == "Super Admin" for r in (getattr(current_user, "roles", []) or []))
    is_admin = is_super or (member.role and member.role.name in ("Super Admin", "Workspace Admin"))

    if not is_admin:
        raw_entity = payload.entity_type.lower()
        entity_base = "companies" if raw_entity in ("company", "companies") else (
            "contacts" if raw_entity in ("contact", "contacts") else (
                "leads" if raw_entity in ("lead", "leads") else (
                    "deals" if raw_entity in ("deal", "deals") else (
                        "tasks" if raw_entity in ("task", "tasks") else (
                            "storage" if raw_entity in ("storage", "file", "files", "document", "documents", "attachment", "attachments") else "workspace"
                        )
                    )
                )
            )
        )
        required_read = f"{entity_base}.read"
        required_export = f"{entity_base}.export"
        member_perms = {p.name for p in (member.role.permissions or [])} if (member.role and hasattr(member.role, "permissions")) else set()

        if required_read not in member_perms and required_export not in member_perms:
            raise InsufficientPermissionsError(f"Missing required permission to export {payload.entity_type}.")

    file_bytes, media_type, _ = await generate_dataset_export(db, workspace_id, member.id, payload)
    filename = f"{payload.entity_type.lower()}_export.{payload.format}"

    return Response(
        content=file_bytes,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get(
    "/import/history",
    response_model=list[ImportJobResponse],
    status_code=status.HTTP_200_OK,
    summary="List Import History",
)
async def list_import_history(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[ImportJobResponse]:
    service = CRMService(db)
    return await service.list_import_jobs(workspace_id)


@router.get(
    "/export/history",
    response_model=list[ExportJobResponse],
    status_code=status.HTTP_200_OK,
    summary="List Export History",
)
async def list_export_history(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[ExportJobResponse]:
    service = CRMService(db)
    return await service.list_export_jobs(workspace_id)
