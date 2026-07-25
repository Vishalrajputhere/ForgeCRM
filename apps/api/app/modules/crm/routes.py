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
)
from app.db.session import get_db_session
from app.modules.crm.schemas import (
    ActivityResponse,
    CompanyCreate,
    CompanyResponse,
    CompanyUpdate,
    ContactCreate,
    ContactResponse,
    DealCreate,
    DealResponse,
    DealStageMoveRequest,
    LeadConversionResponse,
    LeadConvertRequest,
    LeadCreate,
    LeadResponse,
    PipelineCreate,
    PipelineResponse,
    TaskCreate,
    TaskResponse,
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
)
async def get_contact(
    contact_id: UUID,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> ContactResponse:
    service = CRMService(db)
    return await service.get_contact(workspace_id, contact_id)


# ── Leads & Conversion ─────────────────────────────────────────────────────────


@router.post(
    "/leads",
    response_model=LeadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Lead",
    description="Creates an unqualified sales lead.",
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
)
async def list_leads(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[LeadResponse]:
    service = CRMService(db)
    return await service.list_leads(workspace_id)


@router.post(
    "/leads/{lead_id}/convert",
    response_model=LeadConversionResponse,
    status_code=status.HTTP_200_OK,
    summary="Convert Lead",
    description="Transactionally converts a lead into a Company, Primary Contact, and optional Deal.",
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
)
async def create_pipeline(
    payload: PipelineCreate,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> PipelineResponse:
    service = CRMService(db)
    return await service.create_pipeline(workspace_id, payload)


@router.get(
    "/pipelines",
    response_model=list[PipelineResponse],
    status_code=status.HTTP_200_OK,
    summary="List Pipelines",
    description="Returns sales pipelines in workspace.",
)
async def list_pipelines(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[PipelineResponse]:
    service = CRMService(db)
    return await service.list_pipelines(workspace_id)


@router.post(
    "/deals",
    response_model=DealResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Deal",
    description="Creates a sales opportunity deal.",
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
)
async def get_deal(
    deal_id: UUID,
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> DealResponse:
    service = CRMService(db)
    return await service.get_deal(workspace_id, deal_id)


@router.post(
    "/deals/{deal_id}/move-stage",
    response_model=DealResponse,
    status_code=status.HTTP_200_OK,
    summary="Move Deal Stage",
    description="Moves a deal to a new stage in its pipeline.",
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
)
async def list_tasks(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[TaskResponse]:
    service = CRMService(db)
    return await service.list_tasks(workspace_id)


@router.post(
    "/tasks/{task_id}/complete",
    response_model=TaskResponse,
    status_code=status.HTTP_200_OK,
    summary="Complete Task",
    description="Marks task as completed.",
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
