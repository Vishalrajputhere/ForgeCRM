"""
ForgeCRM API — CRM Core Business Service

Business logic and transactional workflows for Companies, Contacts, Leads,
Transactional Lead Conversion, Pipelines, Deals, Tasks, and Timelines.

Documentation:
  docs/03_Backend/301_BACKEND_OVERVIEW.md §5 (Service Layer)
  docs/02_Database/204_CRM_OVERVIEW.md
"""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.modules.automation.trigger_dispatcher import dispatch_trigger
from app.modules.crm.exceptions import (
    CompanyNotFoundError,
    ContactNotFoundError,
    DealLineItemNotFoundError,
    DealNotFoundError,
    DuplicateProductSKUError,
    LeadAlreadyConvertedError,
    LeadNotFoundError,
    PipelineNotFoundError,
    ProductNotFoundError,
    TaskNotFoundError,
)
from app.modules.crm.models import (
    Activity,
    Company,
    Contact,
    Deal,
    DealLineItem,
    DealProduct,
    Lead,
    LeadConversion,
    Pipeline,
    PipelineStage,
    Product,
    Task,
)
from app.modules.crm.pricing import calculate_deal_totals, calculate_line_item
from app.modules.crm.repository import (
    ActivityRepository,
    CompanyRepository,
    ContactRepository,
    DealLineItemRepository,
    DealRepository,
    LeadRepository,
    PipelineRepository,
    ProductRepository,
    TaskRepository,
)
from app.modules.crm.schemas import (
    ActivityResponse,
    BulkArchiveRequest,
    BulkAssignOwnerRequest,
    BulkDeleteRequest,
    BulkDeleteResponse,
    BulkMoveStageRequest,
    BulkRestoreRequest,
    BulkUpdateStatusRequest,
    CompanyCreate,
    CompanyResponse,
    CompanyUpdate,
    ContactCreate,
    ContactResponse,
    ContactUpdate,
    DealCreate,
    DealLineItemBulkCreate,
    DealLineItemCreate,
    DealLineItemResponse,
    DealLineItemUpdate,
    DealResponse,
    DealStageMoveRequest,
    DealUpdate,
    ExportJobResponse,
    ImportJobResponse,
    LeadConversionResponse,
    LeadConvertRequest,
    LeadCreate,
    LeadResponse,
    LeadUpdate,
    PipelineCreate,
    PipelineResponse,
    ProductCreate,
    ProductListResponse,
    ProductResponse,
    ProductUpdate,
    StageCreate,
    StageReorderItem,
    StageResponse,
    StageUpdate,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)

logger = get_logger("forgecrm.crm")


class CRMService:
    """Service layer for CRM domain workflows."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.company_repo = CompanyRepository(db)
        self.contact_repo = ContactRepository(db)
        self.lead_repo = LeadRepository(db)
        self.pipeline_repo = PipelineRepository(db)
        self.deal_repo = DealRepository(db)
        self.task_repo = TaskRepository(db)
        self.activity_repo = ActivityRepository(db)
        self.product_repo = ProductRepository(db)
        self.line_item_repo = DealLineItemRepository(db)
        from app.modules.crm.repository import BulkRepository
        self.bulk_repo = BulkRepository(db)

    # ── Timeline Helper ────────────────────────────────────────────────────────

    async def _log_timeline_activity(
        self,
        workspace_id: UUID,
        actor_member_id: UUID | None,
        entity_type: str,
        entity_id: UUID,
        title: str,
        description: str | None = None,
    ) -> Activity:
        """Create an immutable activity log entry."""
        activity_type = await self.activity_repo.get_or_create_activity_type(title, category="CRM")
        activity = Activity(
            id=uuid4(),
            workspace_id=workspace_id,
            activity_type_id=activity_type.id,
            actor_member_id=actor_member_id,
            entity_type=entity_type,
            entity_id=entity_id,
            title=title,
            description=description,
            occurred_at=datetime.now(UTC),
        )
        return await self.activity_repo.log_activity(activity)

    # ── Companies ──────────────────────────────────────────────────────────────

    async def create_company(self, workspace_id: UUID, member_id: UUID, payload: CompanyCreate) -> CompanyResponse:
        """Create a new company account."""
        owner_id = payload.owner_member_id or member_id

        company = Company(
            id=uuid4(),
            workspace_id=workspace_id,
            owner_member_id=owner_id,
            name=payload.name,
            legal_name=payload.legal_name,
            industry_id=payload.industry_id,
            website=payload.website,
            email=payload.email,
            phone=payload.phone,
            annual_revenue=payload.annual_revenue,
            employee_count=payload.employee_count,
            description=payload.description,
            status="Active",
        )
        company = await self.company_repo.create(company)

        await self._log_timeline_activity(
            workspace_id=workspace_id,
            actor_member_id=member_id,
            entity_type="Company",
            entity_id=company.id,
            title="Company Created",
            description=f"Created company account '{company.name}'",
        )

        await dispatch_trigger(
            event_type="COMPANY_CREATED",
            entity_type="company",
            entity_data={"id": str(company.id), "name": company.name, "status": company.status},
            db=self.db,
            workspace_id=workspace_id,
            member_id=member_id,
        )

        return CompanyResponse.model_validate(company)

    async def list_companies(self, workspace_id: UUID) -> list[CompanyResponse]:
        """List companies in workspace."""
        companies = await self.company_repo.list_workspace_companies(workspace_id)
        return [CompanyResponse.model_validate(c) for c in companies]

    async def get_company(self, workspace_id: UUID, company_id: UUID) -> CompanyResponse:
        """Get company details."""
        company = await self.company_repo.get_by_id(workspace_id, company_id)
        if company is None:
            raise CompanyNotFoundError()
        return CompanyResponse.model_validate(company)

    async def update_company(self, workspace_id: UUID, company_id: UUID, payload: CompanyUpdate) -> CompanyResponse:
        """Update company account."""
        company = await self.company_repo.get_by_id(workspace_id, company_id)
        if company is None:
            raise CompanyNotFoundError()

        for field, value in payload.model_dump(exclude_unset=True).items():
            if value is not None:
                setattr(company, field, value)

        await self.db.flush()
        return CompanyResponse.model_validate(company)

    # ── Contacts ───────────────────────────────────────────────────────────────

    async def create_contact(self, workspace_id: UUID, member_id: UUID, payload: ContactCreate) -> ContactResponse:
        """Create a new contact associated with a company."""
        company = await self.company_repo.get_by_id(workspace_id, payload.company_id)
        if company is None:
            raise CompanyNotFoundError()

        owner_id = payload.owner_member_id or member_id

        contact = Contact(
            id=uuid4(),
            workspace_id=workspace_id,
            company_id=payload.company_id,
            owner_member_id=owner_id,
            first_name=payload.first_name,
            last_name=payload.last_name,
            job_title=payload.job_title,
            department=payload.department,
            email=payload.email,
            phone=payload.phone,
            mobile=payload.mobile,
            linkedin_url=payload.linkedin_url,
            birthday=payload.birthday,
            is_primary=payload.is_primary,
            status="Active",
        )
        contact = await self.contact_repo.create(contact)

        await self._log_timeline_activity(
            workspace_id=workspace_id,
            actor_member_id=member_id,
            entity_type="Contact",
            entity_id=contact.id,
            title="Contact Created",
            description=f"Created contact '{contact.first_name} {contact.last_name}' for company '{company.name}'",
        )

        await dispatch_trigger(
            event_type="CONTACT_CREATED",
            entity_type="contact",
            entity_data={"id": str(contact.id), "name": f"{contact.first_name} {contact.last_name}", "email": contact.email},
            db=self.db,
            workspace_id=workspace_id,
            member_id=member_id,
        )

        return ContactResponse.model_validate(contact)

    async def list_contacts(self, workspace_id: UUID, company_id: UUID | None = None) -> list[ContactResponse]:
        """List contacts in workspace."""
        if company_id:
            contacts = await self.contact_repo.list_company_contacts(workspace_id, company_id)
        else:
            contacts = await self.contact_repo.list_workspace_contacts(workspace_id)
        return [ContactResponse.model_validate(c) for c in contacts]

    async def get_contact(self, workspace_id: UUID, contact_id: UUID) -> ContactResponse:
        """Get contact details."""
        contact = await self.contact_repo.get_by_id(workspace_id, contact_id)
        if contact is None:
            raise ContactNotFoundError()
        return ContactResponse.model_validate(contact)

    async def update_contact(
        self, workspace_id: UUID, member_id: UUID, contact_id: UUID, payload: ContactUpdate
    ) -> ContactResponse:
        """Update contact details."""
        contact = await self.contact_repo.get_by_id(workspace_id, contact_id)
        if contact is None:
            raise ContactNotFoundError()

        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(contact, field, value)

        await self.db.flush()

        await self._log_timeline_activity(
            workspace_id=workspace_id,
            actor_member_id=member_id,
            entity_type="Contact",
            entity_id=contact.id,
            title="Contact Updated",
            description=f"Updated contact '{contact.first_name} {contact.last_name}'",
        )

        return ContactResponse.model_validate(contact)

    async def delete_contact(
        self, workspace_id: UUID, member_id: UUID, contact_id: UUID
    ) -> None:
        """Soft-delete a contact by setting status to Inactive."""
        contact = await self.contact_repo.get_by_id(workspace_id, contact_id)
        if contact is None:
            raise ContactNotFoundError()

        contact.status = "Inactive"
        await self.db.flush()

        await self._log_timeline_activity(
            workspace_id=workspace_id,
            actor_member_id=member_id,
            entity_type="Contact",
            entity_id=contact.id,
            title="Contact Deactivated",
            description=f"Deactivated contact '{contact.first_name} {contact.last_name}'",
        )

    # ── Leads & Conversion ─────────────────────────────────────────────────────

    async def create_lead(self, workspace_id: UUID, member_id: UUID, payload: LeadCreate) -> LeadResponse:
        """Create a new unqualified sales lead."""
        if payload.status_id:
            status_rec = await self.lead_repo.get_status_by_id(workspace_id, payload.status_id)
            status_id = status_rec.id if status_rec else (await self.lead_repo.get_or_create_default_status(workspace_id)).id
        else:
            status_rec = await self.lead_repo.get_or_create_default_status(workspace_id)
            status_id = status_rec.id

        lead = Lead(
            id=uuid4(),
            workspace_id=workspace_id,
            owner_member_id=payload.owner_member_id or member_id,
            source_id=payload.source_id,
            status_id=status_id,  # type: ignore[arg-type]
            first_name=payload.first_name,
            last_name=payload.last_name,
            company_name=payload.company_name,
            job_title=payload.job_title,
            email=payload.email,
            phone=payload.phone,
            website=payload.website,
            estimated_value=payload.estimated_value,
            priority=payload.priority,
            description=payload.description,
        )
        lead = await self.lead_repo.create(lead)

        await dispatch_trigger(
            event_type="LEAD_CREATED",
            entity_type="lead",
            entity_data={
                "id": str(lead.id),
                "name": f"{lead.first_name} {lead.last_name or ''}".strip(),
                "first_name": lead.first_name,
                "last_name": lead.last_name or "",
                "email": lead.email,
                "priority": lead.priority,
                "value": float(lead.estimated_value or 0),
                "estimated_value": float(lead.estimated_value or 0),
                "company_name": lead.company_name,
            },
            db=self.db,
            workspace_id=workspace_id,
            member_id=member_id,
        )

        return LeadResponse.model_validate(lead)

    async def list_leads(self, workspace_id: UUID) -> list[LeadResponse]:
        """List active leads in workspace."""
        leads = await self.lead_repo.list_workspace_leads(workspace_id)
        return [LeadResponse.model_validate(lead) for lead in leads]

    async def get_lead(self, workspace_id: UUID, lead_id: UUID) -> LeadResponse:
        """Get lead details."""
        lead = await self.lead_repo.get_by_id(workspace_id, lead_id)
        if lead is None:
            raise LeadNotFoundError()
        return LeadResponse.model_validate(lead)

    async def update_lead(
        self, workspace_id: UUID, member_id: UUID, lead_id: UUID, payload: LeadUpdate
    ) -> LeadResponse:
        """Update lead details."""
        lead = await self.lead_repo.get_by_id(workspace_id, lead_id)
        if lead is None:
            raise LeadNotFoundError()

        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(lead, field, value)

        await self.db.flush()

        await self._log_timeline_activity(
            workspace_id=workspace_id,
            actor_member_id=member_id,
            entity_type="Lead",
            entity_id=lead.id,
            title="Lead Updated",
            description=f"Updated lead '{lead.first_name} {lead.last_name or ''}'.",
        )

        await dispatch_trigger(
            event_type="LEAD_UPDATED",
            entity_type="lead",
            entity_data={
                "id": str(lead.id),
                "name": f"{lead.first_name} {lead.last_name or ''}".strip(),
                "priority": lead.priority,
                "value": float(lead.estimated_value or 0),
            },
            db=self.db,
            workspace_id=workspace_id,
            member_id=member_id,
        )

        return LeadResponse.model_validate(lead)

    async def delete_lead(
        self, workspace_id: UUID, member_id: UUID, lead_id: UUID
    ) -> None:
        """Soft-delete a lead by marking it as deleted."""
        lead = await self.lead_repo.get_by_id(workspace_id, lead_id)
        if lead is None:
            raise LeadNotFoundError()

        if lead.converted_at is not None:
            raise LeadAlreadyConvertedError()

        # Mark lead as disqualified/deleted
        lead.priority = "Disqualified"
        await self.db.flush()

        await self._log_timeline_activity(
            workspace_id=workspace_id,
            actor_member_id=member_id,
            entity_type="Lead",
            entity_id=lead.id,
            title="Lead Disqualified",
            description=f"Disqualified lead '{lead.first_name} {lead.last_name or ''}'.",
        )

    async def convert_lead(
        self,
        workspace_id: UUID,
        member_id: UUID,
        lead_id: UUID,
        payload: LeadConvertRequest,
    ) -> LeadConversionResponse:
        """
        Transactional Lead Conversion into Company, Primary Contact, and optional Deal.

        Preserves historical timeline and records conversion audit record.
        """
        lead = await self.lead_repo.get_by_id(workspace_id, lead_id)
        if lead is None:
            raise LeadNotFoundError()

        if lead.converted_at is not None:
            raise LeadAlreadyConvertedError()

        # 1. Create Company
        company_name = lead.company_name or f"{lead.first_name} {lead.last_name or ''}".strip()
        company = Company(
            id=uuid4(),
            workspace_id=workspace_id,
            owner_member_id=lead.owner_member_id,
            name=company_name,
            website=lead.website,
            email=lead.email,
            phone=lead.phone,
            description=f"Converted from Lead '{lead.first_name} {lead.last_name or ''}'",
            status="Active",
        )
        company = await self.company_repo.create(company)

        # 2. Create Primary Contact
        contact = Contact(
            id=uuid4(),
            workspace_id=workspace_id,
            company_id=company.id,
            owner_member_id=lead.owner_member_id,
            first_name=lead.first_name,
            last_name=lead.last_name or "Contact",
            job_title=lead.job_title,
            email=lead.email,
            phone=lead.phone,
            is_primary=True,
            status="Active",
        )
        contact = await self.contact_repo.create(contact)

        # 3. Create Initial Deal (Optional)
        deal: Deal | None = None
        if payload.create_deal:
            pipeline = await self.pipeline_repo.get_or_create_default_pipeline(workspace_id)
            stage_id = payload.stage_id or pipeline.stages[0].id

            deal = Deal(
                id=uuid4(),
                workspace_id=workspace_id,
                pipeline_id=pipeline.id,
                stage_id=stage_id,
                company_id=company.id,
                primary_contact_id=contact.id,
                owner_member_id=lead.owner_member_id,
                lead_id=lead.id,
                name=payload.deal_name or f"Deal for {company.name}",
                value=payload.deal_value or (lead.estimated_value or 0.0),
                status="Open",
            )
            deal = await self.deal_repo.create(deal)

        # 4. Record Lead Conversion Audit Record
        now = datetime.now(UTC)
        conversion = LeadConversion(
            id=uuid4(),
            lead_id=lead.id,
            company_id=company.id,
            contact_id=contact.id,
            deal_id=deal.id if deal else None,
            converted_by=member_id,
            converted_at=now,
        )
        self.db.add(conversion)

        # 5. Mark Lead as Converted
        lead.converted_at = now
        await self.db.flush()

        # 6. Log Timeline Events
        await self._log_timeline_activity(
            workspace_id=workspace_id,
            actor_member_id=member_id,
            entity_type="Lead",
            entity_id=lead.id,
            title="Lead Converted",
            description=f"Lead converted into Company '{company.name}' and Contact '{contact.first_name} {contact.last_name}'",
        )

        await dispatch_trigger(
            event_type="LEAD_CONVERTED",
            entity_type="lead",
            entity_data={
                "id": str(lead.id),
                "name": f"{lead.first_name} {lead.last_name or ''}".strip(),
                "company_id": str(company.id),
                "contact_id": str(contact.id),
            },
            db=self.db,
            workspace_id=workspace_id,
            member_id=member_id,
        )

        full_deal = await self.deal_repo.get_by_id(workspace_id, deal.id) if deal else None

        return LeadConversionResponse(
            company=CompanyResponse.model_validate(company),
            contact=ContactResponse.model_validate(contact),
            deal=DealResponse.model_validate(full_deal) if full_deal else None,
            converted_at=now,
        )

    # ── Pipelines & Deals ──────────────────────────────────────────────────────

    async def create_pipeline(
        self,
        workspace_id: UUID,
        member_id: UUID,
        payload: PipelineCreate,
    ) -> PipelineResponse:
        """Create a sales pipeline with stages and log activity."""
        pipeline_id = uuid4()
        pipeline = Pipeline(
            id=pipeline_id,
            workspace_id=workspace_id,
            name=payload.name,
            description=payload.description,
            is_default=payload.is_default,
            is_active=True,
        )
        pipeline = await self.pipeline_repo.create_pipeline(pipeline)

        if payload.stages:
            for stg in payload.stages:
                stage_obj = PipelineStage(
                    id=uuid4(),
                    pipeline_id=pipeline_id,
                    name=stg.name,
                    sort_order=stg.sort_order,
                    probability=stg.probability,
                    is_closed=stg.is_closed,
                    is_won=stg.is_won,
                    color=stg.color or "#3B82F6",
                )
                self.db.add(stage_obj)
            await self.db.flush()
        else:
            # Seed default stages if none provided
            stages = [
                PipelineStage(id=uuid4(), pipeline_id=pipeline_id, name="Qualification", sort_order=0, probability=10, is_closed=False, is_won=False, color="#3B82F6"),
                PipelineStage(id=uuid4(), pipeline_id=pipeline_id, name="Discovery", sort_order=1, probability=25, is_closed=False, is_won=False, color="#8B5CF6"),
                PipelineStage(id=uuid4(), pipeline_id=pipeline_id, name="Proposal", sort_order=2, probability=50, is_closed=False, is_won=False, color="#F59E0B"),
                PipelineStage(id=uuid4(), pipeline_id=pipeline_id, name="Closed Won", sort_order=3, probability=100, is_closed=True, is_won=True, color="#10B981"),
                PipelineStage(id=uuid4(), pipeline_id=pipeline_id, name="Closed Lost", sort_order=4, probability=0, is_closed=True, is_won=False, color="#EF4444"),
            ]
            self.db.add_all(stages)
            await self.db.flush()

        # Log Activity Timeline
        act_type = await self.activity_repo.get_or_create_activity_type("Pipeline Created", category="CRM")
        act = Activity(
            id=uuid4(),
            workspace_id=workspace_id,
            activity_type_id=act_type.id,
            actor_member_id=member_id,
            entity_type="Pipeline",
            entity_id=pipeline_id,
            title="Pipeline Created",
            description=f"Created sales pipeline '{payload.name}'",
            occurred_at=datetime.now(UTC),
        )
        await self.activity_repo.log_activity(act)

        full_pipeline = await self.pipeline_repo.get_by_id(workspace_id, pipeline_id)
        return PipelineResponse.model_validate(full_pipeline)

    async def update_pipeline(
        self,
        workspace_id: UUID,
        member_id: UUID,
        pipeline_id: UUID,
        payload: PipelineUpdate,
    ) -> PipelineResponse:
        """Update sales pipeline attributes and log activity."""
        pipeline = await self.pipeline_repo.get_by_id(workspace_id, pipeline_id)
        if pipeline is None:
            raise PipelineNotFoundError()

        if payload.name is not None:
            pipeline.name = payload.name
        if payload.description is not None:
            pipeline.description = payload.description
        if payload.is_default is not None:
            pipeline.is_default = payload.is_default
        if payload.is_active is not None:
            pipeline.is_active = payload.is_active

        await self.db.flush()

        act_type = await self.activity_repo.get_or_create_activity_type("Pipeline Updated", category="CRM")
        act = Activity(
            id=uuid4(),
            workspace_id=workspace_id,
            activity_type_id=act_type.id,
            actor_member_id=member_id,
            entity_type="Pipeline",
            entity_id=pipeline_id,
            title="Pipeline Updated",
            description=f"Updated pipeline '{pipeline.name}'",
            occurred_at=datetime.now(UTC),
        )
        await self.activity_repo.log_activity(act)

        full_pipeline = await self.pipeline_repo.get_by_id(workspace_id, pipeline_id)
        return PipelineResponse.model_validate(full_pipeline)

    async def delete_pipeline(
        self,
        workspace_id: UUID,
        member_id: UUID,
        pipeline_id: UUID,
    ) -> None:
        """Soft-archive a sales pipeline after verifying no active deals exist."""
        pipeline = await self.pipeline_repo.get_by_id(workspace_id, pipeline_id)
        if pipeline is None:
            raise PipelineNotFoundError()

        deal_count = await self.pipeline_repo.count_deals_in_pipeline(workspace_id, pipeline_id)
        if deal_count > 0:
            from app.modules.crm.exceptions import StageHasActiveDealsError
            raise StageHasActiveDealsError()

        pipeline.is_active = False
        await self.db.flush()

        act_type = await self.activity_repo.get_or_create_activity_type("Pipeline Archived", category="CRM")
        act = Activity(
            id=uuid4(),
            workspace_id=workspace_id,
            activity_type_id=act_type.id,
            actor_member_id=member_id,
            entity_type="Pipeline",
            entity_id=pipeline_id,
            title="Pipeline Archived",
            description=f"Archived pipeline '{pipeline.name}'",
            occurred_at=datetime.now(UTC),
        )
        await self.activity_repo.log_activity(act)

    async def duplicate_pipeline(
        self,
        workspace_id: UUID,
        member_id: UUID,
        pipeline_id: UUID,
    ) -> PipelineResponse:
        """Duplicate a pipeline along with all its stages."""
        source = await self.pipeline_repo.get_by_id(workspace_id, pipeline_id)
        if source is None:
            raise PipelineNotFoundError()

        new_pipeline_id = uuid4()
        new_pipeline = Pipeline(
            id=new_pipeline_id,
            workspace_id=workspace_id,
            name=f"{source.name} (Copy)",
            description=source.description,
            is_default=False,
            is_active=True,
        )
        self.db.add(new_pipeline)
        await self.db.flush()

        for stg in source.stages:
            new_stage = PipelineStage(
                id=uuid4(),
                pipeline_id=new_pipeline_id,
                name=stg.name,
                sort_order=stg.sort_order,
                probability=stg.probability,
                is_closed=stg.is_closed,
                is_won=stg.is_won,
                color=stg.color,
            )
            self.db.add(new_stage)
        await self.db.flush()

        act_type = await self.activity_repo.get_or_create_activity_type("Pipeline Duplicated", category="CRM")
        act = Activity(
            id=uuid4(),
            workspace_id=workspace_id,
            activity_type_id=act_type.id,
            actor_member_id=member_id,
            entity_type="Pipeline",
            entity_id=new_pipeline_id,
            title="Pipeline Duplicated",
            description=f"Duplicated pipeline '{source.name}' into '{new_pipeline.name}'",
            occurred_at=datetime.now(UTC),
        )
        await self.activity_repo.log_activity(act)

        full_pipeline = await self.pipeline_repo.get_by_id(workspace_id, new_pipeline_id)
        return PipelineResponse.model_validate(full_pipeline)

    async def create_stage(
        self,
        workspace_id: UUID,
        member_id: UUID,
        pipeline_id: UUID,
        payload: StageCreate,
    ) -> StageResponse:
        """Create a pipeline stage."""
        pipeline = await self.pipeline_repo.get_by_id(workspace_id, pipeline_id)
        if pipeline is None:
            raise PipelineNotFoundError()

        # Duplicate stage name check
        if any(s.name.lower() == payload.name.lower() for s in pipeline.stages):
            from app.modules.crm.exceptions import DuplicateStageNameError
            raise DuplicateStageNameError()

        stage = PipelineStage(
            id=uuid4(),
            pipeline_id=pipeline_id,
            name=payload.name,
            sort_order=payload.sort_order if payload.sort_order is not None else len(pipeline.stages),
            probability=payload.probability,
            is_closed=payload.is_closed or False,
            is_won=payload.is_won or False,
            color=payload.color or "#3B82F6",
        )
        self.db.add(stage)
        await self.db.flush()

        act_type = await self.activity_repo.get_or_create_activity_type("Stage Created", category="CRM")
        act = Activity(
            id=uuid4(),
            workspace_id=workspace_id,
            activity_type_id=act_type.id,
            actor_member_id=member_id,
            entity_type="Pipeline",
            entity_id=pipeline_id,
            title="Pipeline Stage Created",
            description=f"Added stage '{payload.name}' to pipeline '{pipeline.name}'",
            occurred_at=datetime.now(UTC),
        )
        await self.activity_repo.log_activity(act)

        return StageResponse.model_validate(stage)

    async def update_stage(
        self,
        workspace_id: UUID,
        member_id: UUID,
        pipeline_id: UUID,
        stage_id: UUID,
        payload: StageUpdate,
    ) -> StageResponse:
        """Update a pipeline stage."""
        pipeline = await self.pipeline_repo.get_by_id(workspace_id, pipeline_id)
        if pipeline is None:
            raise PipelineNotFoundError()

        stage = await self.pipeline_repo.get_stage_by_id(pipeline_id, stage_id)
        if stage is None:
            raise StageNotFoundError()

        if payload.name is not None:
            if any(s.name.lower() == payload.name.lower() and s.id != stage_id for s in pipeline.stages):
                from app.modules.crm.exceptions import DuplicateStageNameError
                raise DuplicateStageNameError()
            stage.name = payload.name

        if payload.sort_order is not None:
            stage.sort_order = payload.sort_order
        if payload.probability is not None:
            stage.probability = payload.probability
        if payload.is_closed is not None:
            stage.is_closed = payload.is_closed
        if payload.is_won is not None:
            stage.is_won = payload.is_won
        if payload.color is not None:
            stage.color = payload.color

        await self.db.flush()

        act_type = await self.activity_repo.get_or_create_activity_type("Stage Updated", category="CRM")
        act = Activity(
            id=uuid4(),
            workspace_id=workspace_id,
            activity_type_id=act_type.id,
            actor_member_id=member_id,
            entity_type="Pipeline",
            entity_id=pipeline_id,
            title="Pipeline Stage Updated",
            description=f"Updated stage '{stage.name}' in pipeline '{pipeline.name}'",
            occurred_at=datetime.now(UTC),
        )
        await self.activity_repo.log_activity(act)

        return StageResponse.model_validate(stage)

    async def delete_stage(
        self,
        workspace_id: UUID,
        member_id: UUID,
        pipeline_id: UUID,
        stage_id: UUID,
    ) -> None:
        """Delete a pipeline stage if no active deals are assigned to it."""
        pipeline = await self.pipeline_repo.get_by_id(workspace_id, pipeline_id)
        if pipeline is None:
            raise PipelineNotFoundError()

        stage = await self.pipeline_repo.get_stage_by_id(pipeline_id, stage_id)
        if stage is None:
            raise StageNotFoundError()

        deal_count = await self.pipeline_repo.count_deals_in_stage(workspace_id, stage_id)
        if deal_count > 0:
            from app.modules.crm.exceptions import StageHasActiveDealsError
            raise StageHasActiveDealsError()

        await self.db.delete(stage)
        await self.db.flush()

        act_type = await self.activity_repo.get_or_create_activity_type("Stage Deleted", category="CRM")
        act = Activity(
            id=uuid4(),
            workspace_id=workspace_id,
            activity_type_id=act_type.id,
            actor_member_id=member_id,
            entity_type="Pipeline",
            entity_id=pipeline_id,
            title="Pipeline Stage Deleted",
            description=f"Deleted stage '{stage.name}' from pipeline '{pipeline.name}'",
            occurred_at=datetime.now(UTC),
        )
        await self.activity_repo.log_activity(act)

    async def reorder_stages(
        self,
        workspace_id: UUID,
        member_id: UUID,
        pipeline_id: UUID,
        payload: StageReorderRequest,
    ) -> PipelineResponse:
        """Batch reorder stages within a pipeline."""
        pipeline = await self.pipeline_repo.get_by_id(workspace_id, pipeline_id)
        if pipeline is None:
            raise PipelineNotFoundError()

        stage_map = {s.id: s for s in pipeline.stages}
        for item in payload.stages:
            if item.id in stage_map:
                stage_map[item.id].sort_order = item.sort_order

        await self.db.flush()

        act_type = await self.activity_repo.get_or_create_activity_type("Stage Reordered", category="CRM")
        act = Activity(
            id=uuid4(),
            workspace_id=workspace_id,
            activity_type_id=act_type.id,
            actor_member_id=member_id,
            entity_type="Pipeline",
            entity_id=pipeline_id,
            title="Pipeline Stages Reordered",
            description=f"Reordered stages in pipeline '{pipeline.name}'",
            occurred_at=datetime.now(UTC),
        )
        await self.activity_repo.log_activity(act)

        full_pipeline = await self.pipeline_repo.get_by_id(workspace_id, pipeline_id)
        return PipelineResponse.model_validate(full_pipeline)

    async def list_pipelines(self, workspace_id: UUID) -> list[PipelineResponse]:
        """List pipelines in workspace."""
        pipelines = await self.pipeline_repo.list_workspace_pipelines(workspace_id)
        if not pipelines:
            default_p = await self.pipeline_repo.get_or_create_default_pipeline(workspace_id)
            pipelines = [default_p]
        return [PipelineResponse.model_validate(p) for p in pipelines]

    async def create_deal(self, workspace_id: UUID, member_id: UUID, payload: DealCreate) -> DealResponse:
        """Create a sales deal."""
        company = await self.company_repo.get_by_id(workspace_id, payload.company_id)
        if company is None:
            raise CompanyNotFoundError()

        pipeline = (
            await self.pipeline_repo.get_by_id(workspace_id, payload.pipeline_id)  # type: ignore[arg-type]
            if payload.pipeline_id
            else await self.pipeline_repo.get_or_create_default_pipeline(workspace_id)
        )
        if pipeline is None:
            raise PipelineNotFoundError()

        stage_id = payload.stage_id or pipeline.stages[0].id

        deal = Deal(
            id=uuid4(),
            workspace_id=workspace_id,
            pipeline_id=pipeline.id,
            stage_id=stage_id,
            company_id=payload.company_id,
            primary_contact_id=payload.primary_contact_id,
            owner_member_id=payload.owner_member_id or member_id,
            name=payload.name,
            value=payload.value,
            expected_close_date=payload.expected_close_date,
            probability=payload.probability,
            description=payload.description,
            status="Open",
        )
        deal = await self.deal_repo.create(deal)

        items_to_create = payload.line_items or payload.products or []
        if items_to_create:
            total_sum = 0.0
            for item in items_to_create:
                p_name = item.product_name or "Line Item"
                p_sku = item.sku
                u_price = item.unit_price if item.unit_price is not None else 0.0
                t_rate = item.tax_rate if item.tax_rate is not None else 0.0

                if item.product_id:
                    prod = await self.product_repo.get_by_id(workspace_id, item.product_id)
                    if prod:
                        p_name = item.product_name or prod.name
                        p_sku = item.sku or prod.sku
                        if item.unit_price is None:
                            u_price = float(prod.unit_price)
                        if item.tax_rate is None:
                            t_rate = float(prod.tax_rate)

                calc = calculate_line_item(
                    quantity=item.quantity,
                    unit_price=u_price,
                    discount_percent=item.discount_percent,
                    tax_rate=t_rate,
                )

                line_item = DealLineItem(
                    id=uuid4(),
                    workspace_id=workspace_id,
                    deal_id=deal.id,
                    product_id=item.product_id,
                    product_name_snapshot=p_name,
                    sku_snapshot=p_sku,
                    quantity=float(calc.quantity),
                    unit_price=float(calc.unit_price),
                    discount_percent=float(calc.discount_percent),
                    discount_amount=float(calc.discount_amount),
                    tax_rate=float(calc.tax_rate),
                    subtotal=float(calc.subtotal),
                    taxable_amount=float(calc.taxable_amount),
                    tax_amount=float(calc.tax_amount),
                    total=float(calc.total),
                )
                self.db.add(line_item)
                total_sum += float(calc.total)

            deal.value = total_sum
            await self.db.flush()

        await self._log_timeline_activity(
            workspace_id=workspace_id,
            actor_member_id=member_id,
            entity_type="Deal",
            entity_id=deal.id,
            title="Deal Created",
            description=f"Created deal '{deal.name}' with value ${deal.value:,.2f}",
        )

        await dispatch_trigger(
            event_type="DEAL_CREATED",
            entity_type="deal",
            entity_data={
                "id": str(deal.id),
                "name": deal.name,
                "value": float(deal.value or 0),
                "status": deal.status,
            },
            db=self.db,
            workspace_id=workspace_id,
            member_id=member_id,
        )

        full_deal = await self.deal_repo.get_by_id(workspace_id, deal.id)
        return DealResponse.model_validate(full_deal)

    async def list_deals(self, workspace_id: UUID, pipeline_id: UUID | None = None) -> list[DealResponse]:
        """List active deals in workspace."""
        deals = await self.deal_repo.list_workspace_deals(workspace_id, pipeline_id)
        return [DealResponse.model_validate(d) for d in deals]

    async def get_deal(self, workspace_id: UUID, deal_id: UUID) -> DealResponse:
        """Get deal details."""
        deal = await self.deal_repo.get_by_id(workspace_id, deal_id)
        if deal is None:
            raise DealNotFoundError()
        return DealResponse.model_validate(deal)

    async def update_deal(
        self, workspace_id: UUID, member_id: UUID, deal_id: UUID, payload: DealUpdate
    ) -> DealResponse:
        """Update deal details."""
        deal = await self.deal_repo.get_by_id(workspace_id, deal_id)
        if deal is None:
            raise DealNotFoundError()

        for field, value in payload.model_dump(exclude_unset=True).items():
            if value is not None:
                setattr(deal, field, value)

        await self.db.flush()

        await self._log_timeline_activity(
            workspace_id=workspace_id,
            actor_member_id=member_id,
            entity_type="Deal",
            entity_id=deal.id,
            title="Deal Updated",
            description=f"Updated deal '{deal.name}' — value ${deal.value:,.2f}, status {deal.status}.",
        )

        full_deal = await self.deal_repo.get_by_id(workspace_id, deal.id)
        return DealResponse.model_validate(full_deal)

    async def delete_deal(
        self, workspace_id: UUID, member_id: UUID, deal_id: UUID
    ) -> None:
        """Soft-delete a deal by setting status to Cancelled."""
        deal = await self.deal_repo.get_by_id(workspace_id, deal_id)
        if deal is None:
            raise DealNotFoundError()

        deal.status = "Cancelled"
        await self.db.flush()

        await self._log_timeline_activity(
            workspace_id=workspace_id,
            actor_member_id=member_id,
            entity_type="Deal",
            entity_id=deal.id,
            title="Deal Cancelled",
            description=f"Cancelled deal '{deal.name}'.",
        )

    async def move_deal_stage(
        self,
        workspace_id: UUID,
        member_id: UUID,
        deal_id: UUID,
        payload: DealStageMoveRequest,
    ) -> DealResponse:
        """Move a deal to a new stage in its pipeline."""
        deal = await self.deal_repo.get_by_id(workspace_id, deal_id)
        if deal is None:
            raise DealNotFoundError()

        deal.stage_id = payload.stage_id

        # Update status if target stage is closed/won/lost
        pipeline = await self.pipeline_repo.get_by_id(workspace_id, deal.pipeline_id)
        if pipeline:
            for stage in pipeline.stages:
                if stage.id == payload.stage_id:
                    if stage.is_closed:
                        deal.status = "Won" if stage.is_won else "Lost"
                        if not stage.is_won and payload.loss_reason:
                            deal.loss_reason = payload.loss_reason
                    else:
                        deal.status = "Open"
                    break

        await self.db.flush()

        await self._log_timeline_activity(
            workspace_id=workspace_id,
            actor_member_id=member_id,
            entity_type="Deal",
            entity_id=deal.id,
            title="Deal Stage Moved",
            description=f"Moved deal '{deal.name}' to new stage. Status: {deal.status}",
        )

        await dispatch_trigger(
            event_type="DEAL_STAGE_CHANGED",
            entity_type="deal",
            entity_data={
                "id": str(deal.id),
                "name": deal.name,
                "status": deal.status,
                "value": float(deal.value or 0),
                "stage_id": str(deal.stage_id),
            },
            db=self.db,
            workspace_id=workspace_id,
            member_id=member_id,
        )

        full_deal = await self.deal_repo.get_by_id(workspace_id, deal.id)
        return DealResponse.model_validate(full_deal)

    # ── Tasks ──────────────────────────────────────────────────────────────────

    async def create_task(self, workspace_id: UUID, member_id: UUID, payload: TaskCreate) -> TaskResponse:
        """Create a new task."""
        task = Task(
            id=uuid4(),
            workspace_id=workspace_id,
            owner_member_id=member_id,
            assigned_member_id=payload.assigned_member_id or member_id,
            entity_type=payload.entity_type,
            entity_id=payload.entity_id,
            title=payload.title,
            description=payload.description,
            priority=payload.priority,
            due_date=payload.due_date,
            status="Open",
        )
        task = await self.task_repo.create(task)

        await dispatch_trigger(
            event_type="TASK_CREATED",
            entity_type="task",
            entity_data={
                "id": str(task.id),
                "title": task.title,
                "priority": task.priority,
                "status": task.status,
            },
            db=self.db,
            workspace_id=workspace_id,
            member_id=member_id,
        )

        return TaskResponse.model_validate(task)

    async def list_tasks(self, workspace_id: UUID) -> list[TaskResponse]:
        """List tasks in workspace."""
        tasks = await self.task_repo.list_workspace_tasks(workspace_id)
        return [TaskResponse.model_validate(t) for t in tasks]

    async def get_task(self, workspace_id: UUID, task_id: UUID) -> TaskResponse:
        """Get task details."""
        task = await self.task_repo.get_by_id(workspace_id, task_id)
        if task is None:
            raise TaskNotFoundError()
        return TaskResponse.model_validate(task)

    async def update_task(
        self, workspace_id: UUID, member_id: UUID, task_id: UUID, payload: TaskUpdate
    ) -> TaskResponse:
        """Update task details."""
        task = await self.task_repo.get_by_id(workspace_id, task_id)
        if task is None:
            raise TaskNotFoundError()

        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(task, field, value)

        await self.db.flush()
        return TaskResponse.model_validate(task)

    async def delete_task(
        self, workspace_id: UUID, member_id: UUID, task_id: UUID
    ) -> None:
        """Soft-delete a task by setting status to Cancelled."""
        task = await self.task_repo.get_by_id(workspace_id, task_id)
        if task is None:
            raise TaskNotFoundError()

        task.status = "Cancelled"
        await self.db.flush()

    async def complete_task(self, workspace_id: UUID, member_id: UUID, task_id: UUID) -> TaskResponse:
        """Mark task as completed."""
        task = await self.task_repo.get_by_id(workspace_id, task_id)
        if task is None:
            raise TaskNotFoundError()

        task.status = "Completed"
        task.completed_at = datetime.now(UTC)
        await self.db.flush()

        if task.entity_type and task.entity_id:
            await self._log_timeline_activity(
                workspace_id=workspace_id,
                actor_member_id=member_id,
                entity_type=task.entity_type,
                entity_id=task.entity_id,
                title="Task Completed",
                description=f"Completed task '{task.title}'",
            )

        await dispatch_trigger(
            event_type="TASK_COMPLETED",
            entity_type="task",
            entity_data={
                "id": str(task.id),
                "title": task.title,
                "priority": task.priority,
                "status": task.status,
            },
            db=self.db,
            workspace_id=workspace_id,
            member_id=member_id,
        )

        return TaskResponse.model_validate(task)

    # ── Activity Timeline ─────────────────────────────────────────────────────

    async def list_timeline(self, workspace_id: UUID, entity_type: str, entity_id: UUID) -> list[ActivityResponse]:
        """Fetch immutable timeline for a CRM entity."""
        activities = await self.activity_repo.list_entity_timeline(workspace_id, entity_type, entity_id)
        return [ActivityResponse.model_validate(a) for a in activities]

    # ── Bulk Operations Engine ────────────────────────────────────────────────

    async def bulk_delete_service(
        self,
        workspace_id: UUID,
        member_id: UUID,
        payload: BulkDeleteRequest,
    ) -> BulkDeleteResponse:
        """Perform batch soft or permanent delete with Protected Records validation."""
        count = await self.bulk_repo.bulk_soft_delete(workspace_id, payload.entity_type, payload.ids)

        # Log timeline event
        act_type = await self.activity_repo.get_or_create_activity_type("Bulk Records Deleted", category="CRM")
        act = Activity(
            id=uuid4(),
            workspace_id=workspace_id,
            activity_type_id=act_type.id,
            actor_member_id=member_id,
            entity_type=payload.entity_type,
            entity_id=payload.ids[0],
            title=f"Bulk Deleted {count} {payload.entity_type}",
            description=f"Deleted {count} {payload.entity_type} records",
            occurred_at=datetime.now(UTC),
        )
        await self.activity_repo.log_activity(act)

        return BulkDeleteResponse(
            affected_count=count,
            protected_count=0,
            protected_ids=[],
            message=f"Successfully deleted {count} records.",
        )

    async def bulk_archive_service(
        self,
        workspace_id: UUID,
        member_id: UUID,
        payload: BulkArchiveRequest,
    ) -> int:
        """Perform batch archive of records."""
        count = await self.bulk_repo.bulk_soft_delete(workspace_id, payload.entity_type, payload.ids)

        act_type = await self.activity_repo.get_or_create_activity_type("Bulk Records Archived", category="CRM")
        act = Activity(
            id=uuid4(),
            workspace_id=workspace_id,
            activity_type_id=act_type.id,
            actor_member_id=member_id,
            entity_type=payload.entity_type,
            entity_id=payload.ids[0],
            title=f"Bulk Archived {count} {payload.entity_type}",
            description=f"Archived {count} {payload.entity_type} records",
            occurred_at=datetime.now(UTC),
        )
        await self.activity_repo.log_activity(act)
        return count

    async def bulk_restore_service(
        self,
        workspace_id: UUID,
        member_id: UUID,
        payload: BulkRestoreRequest,
    ) -> int:
        """Perform batch restore of soft-deleted records."""
        count = await self.bulk_repo.bulk_restore(workspace_id, payload.entity_type, payload.ids)

        act_type = await self.activity_repo.get_or_create_activity_type("Bulk Records Restored", category="CRM")
        act = Activity(
            id=uuid4(),
            workspace_id=workspace_id,
            activity_type_id=act_type.id,
            actor_member_id=member_id,
            entity_type=payload.entity_type,
            entity_id=payload.ids[0],
            title=f"Bulk Restored {count} {payload.entity_type}",
            description=f"Restored {count} {payload.entity_type} records",
            occurred_at=datetime.now(UTC),
        )
        await self.activity_repo.log_activity(act)
        return count

    async def bulk_reassign_owner_service(
        self,
        workspace_id: UUID,
        member_id: UUID,
        payload: BulkAssignOwnerRequest,
    ) -> int:
        """Reassign owner for a batch of records."""
        count = await self.bulk_repo.bulk_reassign_owner(
            workspace_id, payload.entity_type, payload.ids, payload.owner_member_id
        )

        act_type = await self.activity_repo.get_or_create_activity_type("Bulk Owner Reassigned", category="CRM")
        act = Activity(
            id=uuid4(),
            workspace_id=workspace_id,
            activity_type_id=act_type.id,
            actor_member_id=member_id,
            entity_type=payload.entity_type,
            entity_id=payload.ids[0],
            title=f"Bulk Reassigned {count} {payload.entity_type}",
            description=f"Reassigned owner for {count} {payload.entity_type} records",
            occurred_at=datetime.now(UTC),
        )
        await self.activity_repo.log_activity(act)
        return count

    async def bulk_update_status_service(
        self,
        workspace_id: UUID,
        member_id: UUID,
        payload: BulkUpdateStatusRequest,
    ) -> int:
        """Update status for a batch of records."""
        count = await self.bulk_repo.bulk_update_status(
            workspace_id, payload.entity_type, payload.ids, payload.status
        )

        act_type = await self.activity_repo.get_or_create_activity_type("Bulk Status Updated", category="CRM")
        act = Activity(
            id=uuid4(),
            workspace_id=workspace_id,
            activity_type_id=act_type.id,
            actor_member_id=member_id,
            entity_type=payload.entity_type,
            entity_id=payload.ids[0],
            title=f"Bulk Updated Status for {count} {payload.entity_type}",
            description=f"Updated status to '{payload.status}' for {count} {payload.entity_type} records",
            occurred_at=datetime.now(UTC),
        )
        await self.activity_repo.log_activity(act)
        return count

    async def bulk_move_stage_service(
        self,
        workspace_id: UUID,
        member_id: UUID,
        payload: BulkMoveStageRequest,
    ) -> int:
        """Move sales deals to a new stage in batch."""
        count = await self.bulk_repo.bulk_move_stage(
            workspace_id, payload.ids, payload.pipeline_id, payload.stage_id
        )

        act_type = await self.activity_repo.get_or_create_activity_type("Bulk Stage Moved", category="CRM")
        act = Activity(
            id=uuid4(),
            workspace_id=workspace_id,
            activity_type_id=act_type.id,
            actor_member_id=member_id,
            entity_type="Deal",
            entity_id=payload.ids[0],
            title=f"Bulk Moved {count} Deals to New Stage",
            description=f"Moved {count} deals to stage {payload.stage_id}",
            occurred_at=datetime.now(UTC),
        )
        await self.activity_repo.log_activity(act)
        return count

    async def list_import_jobs(self, workspace_id: UUID) -> list[ImportJobResponse]:
        """Fetch import history log for workspace."""
        from sqlalchemy import select
        from app.modules.crm.models import ImportJob

        stmt = select(ImportJob).where(ImportJob.workspace_id == workspace_id).order_by(ImportJob.created_at.desc())
        res = await self.db.execute(stmt)
        return [ImportJobResponse.model_validate(j) for j in res.scalars().all()]

    async def list_export_jobs(self, workspace_id: UUID) -> list[ExportJobResponse]:
        """Fetch export history log for workspace."""
        from sqlalchemy import select
        from app.modules.crm.models import ExportJob

        stmt = select(ExportJob).where(ExportJob.workspace_id == workspace_id).order_by(ExportJob.created_at.desc())
        res = await self.db.execute(stmt)
        return [ExportJobResponse.model_validate(j) for j in res.scalars().all()]

    # ── Product Catalog ────────────────────────────────────────────────────────

    async def create_product(
        self, workspace_id: UUID, member_id: UUID, payload: ProductCreate
    ) -> ProductResponse:
        """Create a new product in the catalog."""
        if payload.sku:
            existing = await self.product_repo.get_by_sku(workspace_id, payload.sku)
            if existing is not None:
                raise DuplicateProductSKUError()

        product = Product(
            id=uuid4(),
            workspace_id=workspace_id,
            name=payload.name,
            sku=payload.sku,
            description=payload.description,
            category=payload.category,
            unit_price=payload.unit_price,
            currency=payload.currency,
            tax_rate=payload.tax_rate,
            is_active=payload.is_active,
            created_by_member_id=member_id,
        )
        product = await self.product_repo.create(product)

        await self._log_timeline_activity(
            workspace_id=workspace_id,
            actor_member_id=member_id,
            entity_type="Product",
            entity_id=product.id,
            title="Product Created",
            description=f"Added product '{product.name}' (SKU: {product.sku or 'N/A'}) to catalog with price ${product.unit_price:,.2f}",
        )

        await dispatch_trigger(
            event_type="PRODUCT_CREATED",
            entity_type="product",
            entity_data={
                "id": str(product.id),
                "name": product.name,
                "sku": product.sku,
                "unit_price": float(product.unit_price),
                "is_active": product.is_active,
            },
            db=self.db,
            workspace_id=workspace_id,
            member_id=member_id,
        )

        return ProductResponse.model_validate(product)

    async def list_products(
        self,
        workspace_id: UUID,
        search: str | None = None,
        category: str | None = None,
        is_active: bool | None = None,
        page: int = 1,
        page_size: int = 50,
    ) -> ProductListResponse:
        """List products with search, category filtering, and pagination."""
        items, total = await self.product_repo.list_products(
            workspace_id=workspace_id,
            search=search,
            category=category,
            is_active=is_active,
            page=page,
            page_size=page_size,
        )
        total_pages = (total + page_size - 1) // page_size if total > 0 else 0
        return ProductListResponse(
            items=[ProductResponse.model_validate(p) for p in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    async def get_product(self, workspace_id: UUID, product_id: UUID) -> ProductResponse:
        """Fetch a single product by ID."""
        product = await self.product_repo.get_by_id(workspace_id, product_id)
        if product is None:
            raise ProductNotFoundError()
        return ProductResponse.model_validate(product)

    async def update_product(
        self, workspace_id: UUID, member_id: UUID, product_id: UUID, payload: ProductUpdate
    ) -> ProductResponse:
        """Update a product in the catalog."""
        product = await self.product_repo.get_by_id(workspace_id, product_id)
        if product is None:
            raise ProductNotFoundError()

        if payload.sku and payload.sku != product.sku:
            existing = await self.product_repo.get_by_sku(workspace_id, payload.sku)
            if existing is not None:
                raise DuplicateProductSKUError()

        for field, value in payload.model_dump(exclude_unset=True).items():
            if value is not None:
                setattr(product, field, value)

        await self.db.flush()

        await self._log_timeline_activity(
            workspace_id=workspace_id,
            actor_member_id=member_id,
            entity_type="Product",
            entity_id=product.id,
            title="Product Updated",
            description=f"Updated product '{product.name}'",
        )

        await dispatch_trigger(
            event_type="PRODUCT_UPDATED",
            entity_type="product",
            entity_data={
                "id": str(product.id),
                "name": product.name,
                "sku": product.sku,
                "unit_price": float(product.unit_price),
                "is_active": product.is_active,
            },
            db=self.db,
            workspace_id=workspace_id,
            member_id=member_id,
        )

        return ProductResponse.model_validate(product)

    async def delete_product(
        self, workspace_id: UUID, member_id: UUID, product_id: UUID
    ) -> None:
        """
        Soft-archive or delete product.
        If the product is referenced by historical deals, it is archived (is_active=False).
        If unreferenced, it is deleted from the catalog.
        """
        product = await self.product_repo.get_by_id(workspace_id, product_id)
        if product is None:
            raise ProductNotFoundError()

        ref_count = await self.product_repo.count_deal_references(workspace_id, product_id)
        if ref_count > 0:
            product.is_active = False
            await self.db.flush()
            event_type = "PRODUCT_ARCHIVED"
            title = "Product Archived"
            desc = f"Archived product '{product.name}' (referenced in {ref_count} deal line items)"
        else:
            await self.product_repo.delete(product)
            event_type = "PRODUCT_ARCHIVED"
            title = "Product Deleted"
            desc = f"Deleted product '{product.name}' from catalog"

        await self._log_timeline_activity(
            workspace_id=workspace_id,
            actor_member_id=member_id,
            entity_type="Product",
            entity_id=product.id,
            title=title,
            description=desc,
        )

        await dispatch_trigger(
            event_type=event_type,
            entity_type="product",
            entity_data={"id": str(product.id), "name": product.name, "is_active": product.is_active},
            db=self.db,
            workspace_id=workspace_id,
            member_id=member_id,
        )

    # ── Deal Line Items & Calculations ────────────────────────────────────────

    async def _sync_deal_totals(
        self, workspace_id: UUID, member_id: UUID, deal_id: UUID
    ) -> float:
        """Recalculate and update deal.value based on sum of line item totals."""
        deal = await self.deal_repo.get_by_id(workspace_id, deal_id)
        if deal is None:
            raise DealNotFoundError()

        line_items = await self.line_item_repo.list_by_deal_id(workspace_id, deal_id)
        total_sum = sum(float(item.total) for item in line_items)
        old_val = deal.value
        deal.value = total_sum
        await self.db.flush()

        if old_val != total_sum:
            await dispatch_trigger(
                event_type="DEAL_TOTAL_CHANGED",
                entity_type="deal",
                entity_data={
                    "id": str(deal.id),
                    "name": deal.name,
                    "old_value": float(old_val or 0),
                    "value": float(total_sum),
                },
                db=self.db,
                workspace_id=workspace_id,
                member_id=member_id,
            )

        return total_sum

    async def list_deal_line_items(
        self, workspace_id: UUID, deal_id: UUID
    ) -> list[DealLineItemResponse]:
        """List line items attached to a deal."""
        deal = await self.deal_repo.get_by_id(workspace_id, deal_id)
        if deal is None:
            raise DealNotFoundError()
        items = await self.line_item_repo.list_by_deal_id(workspace_id, deal_id)
        return [DealLineItemResponse.model_validate(i) for i in items]

    async def add_deal_line_item(
        self,
        workspace_id: UUID,
        member_id: UUID,
        deal_id: UUID,
        payload: DealLineItemCreate,
    ) -> DealLineItemResponse:
        """Add a line item to a deal with real-time price snapshot and tax/discount calculation."""
        deal = await self.deal_repo.get_by_id(workspace_id, deal_id)
        if deal is None:
            raise DealNotFoundError()

        p_name = payload.product_name or "Line Item"
        p_sku = payload.sku
        u_price = payload.unit_price if payload.unit_price is not None else 0.0
        t_rate = payload.tax_rate if payload.tax_rate is not None else 0.0

        if payload.product_id:
            prod = await self.product_repo.get_by_id(workspace_id, payload.product_id)
            if prod:
                p_name = payload.product_name or prod.name
                p_sku = payload.sku or prod.sku
                if payload.unit_price is None:
                    u_price = float(prod.unit_price)
                if payload.tax_rate is None:
                    t_rate = float(prod.tax_rate)

        calc = calculate_line_item(
            quantity=payload.quantity,
            unit_price=u_price,
            discount_percent=payload.discount_percent,
            tax_rate=t_rate,
        )

        line_item = DealLineItem(
            id=uuid4(),
            workspace_id=workspace_id,
            deal_id=deal_id,
            product_id=payload.product_id,
            product_name_snapshot=p_name,
            sku_snapshot=p_sku,
            quantity=float(calc.quantity),
            unit_price=float(calc.unit_price),
            discount_percent=float(calc.discount_percent),
            discount_amount=float(calc.discount_amount),
            tax_rate=float(calc.tax_rate),
            subtotal=float(calc.subtotal),
            taxable_amount=float(calc.taxable_amount),
            tax_amount=float(calc.tax_amount),
            total=float(calc.total),
        )
        line_item = await self.line_item_repo.create(line_item)

        await self._sync_deal_totals(workspace_id, member_id, deal_id)

        await self._log_timeline_activity(
            workspace_id=workspace_id,
            actor_member_id=member_id,
            entity_type="Deal",
            entity_id=deal_id,
            title="Line Item Added",
            description=f"Added '{line_item.product_name_snapshot}' ({line_item.quantity} x ${line_item.unit_price:,.2f}) — total ${line_item.total:,.2f}",
        )

        await dispatch_trigger(
            event_type="DEAL_LINE_ITEM_ADDED",
            entity_type="deal_line_item",
            entity_data={
                "id": str(line_item.id),
                "deal_id": str(deal_id),
                "product_name": line_item.product_name_snapshot,
                "total": float(line_item.total),
            },
            db=self.db,
            workspace_id=workspace_id,
            member_id=member_id,
        )

        return DealLineItemResponse.model_validate(line_item)

    async def update_deal_line_item(
        self,
        workspace_id: UUID,
        member_id: UUID,
        deal_id: UUID,
        line_item_id: UUID,
        payload: DealLineItemUpdate,
    ) -> DealLineItemResponse:
        """Update an existing deal line item and recalculate financials."""
        line_item = await self.line_item_repo.get_by_id(workspace_id, deal_id, line_item_id)
        if line_item is None:
            raise DealLineItemNotFoundError()

        new_qty = payload.quantity if payload.quantity is not None else line_item.quantity
        new_price = payload.unit_price if payload.unit_price is not None else line_item.unit_price
        new_disc = payload.discount_percent if payload.discount_percent is not None else line_item.discount_percent
        new_tax = payload.tax_rate if payload.tax_rate is not None else line_item.tax_rate

        calc = calculate_line_item(
            quantity=new_qty,
            unit_price=new_price,
            discount_percent=new_disc,
            tax_rate=new_tax,
        )

        line_item.quantity = float(calc.quantity)
        line_item.unit_price = float(calc.unit_price)
        line_item.discount_percent = float(calc.discount_percent)
        line_item.discount_amount = float(calc.discount_amount)
        line_item.tax_rate = float(calc.tax_rate)
        line_item.subtotal = float(calc.subtotal)
        line_item.taxable_amount = float(calc.taxable_amount)
        line_item.tax_amount = float(calc.tax_amount)
        line_item.total = float(calc.total)

        await self.db.flush()
        await self._sync_deal_totals(workspace_id, member_id, deal_id)

        await self._log_timeline_activity(
            workspace_id=workspace_id,
            actor_member_id=member_id,
            entity_type="Deal",
            entity_id=deal_id,
            title="Line Item Updated",
            description=f"Updated '{line_item.product_name_snapshot}' — new total ${line_item.total:,.2f}",
        )

        await dispatch_trigger(
            event_type="DEAL_LINE_ITEM_UPDATED",
            entity_type="deal_line_item",
            entity_data={
                "id": str(line_item.id),
                "deal_id": str(deal_id),
                "product_name": line_item.product_name_snapshot,
                "total": float(line_item.total),
            },
            db=self.db,
            workspace_id=workspace_id,
            member_id=member_id,
        )

        return DealLineItemResponse.model_validate(line_item)

    async def delete_deal_line_item(
        self, workspace_id: UUID, member_id: UUID, deal_id: UUID, line_item_id: UUID
    ) -> None:
        """Remove a line item from a deal and recalculate totals."""
        line_item = await self.line_item_repo.get_by_id(workspace_id, deal_id, line_item_id)
        if line_item is None:
            raise DealLineItemNotFoundError()

        p_name = line_item.product_name_snapshot
        await self.line_item_repo.delete(line_item)
        await self._sync_deal_totals(workspace_id, member_id, deal_id)

        await self._log_timeline_activity(
            workspace_id=workspace_id,
            actor_member_id=member_id,
            entity_type="Deal",
            entity_id=deal_id,
            title="Line Item Removed",
            description=f"Removed line item '{p_name}' from deal",
        )

        await dispatch_trigger(
            event_type="DEAL_LINE_ITEM_REMOVED",
            entity_type="deal_line_item",
            entity_data={"id": str(line_item_id), "deal_id": str(deal_id), "product_name": p_name},
            db=self.db,
            workspace_id=workspace_id,
            member_id=member_id,
        )

    async def set_deal_line_items(
        self,
        workspace_id: UUID,
        member_id: UUID,
        deal_id: UUID,
        payload: DealLineItemBulkCreate,
    ) -> list[DealLineItemResponse]:
        """Atomically replace all line items for a deal."""
        deal = await self.deal_repo.get_by_id(workspace_id, deal_id)
        if deal is None:
            raise DealNotFoundError()

        await self.line_item_repo.delete_all_by_deal(workspace_id, deal_id)

        created_items: list[DealLineItem] = []
        for item in payload.line_items:
            p_name = item.product_name or "Line Item"
            p_sku = item.sku
            u_price = item.unit_price if item.unit_price is not None else 0.0
            t_rate = item.tax_rate if item.tax_rate is not None else 0.0

            if item.product_id:
                prod = await self.product_repo.get_by_id(workspace_id, item.product_id)
                if prod:
                    p_name = item.product_name or prod.name
                    p_sku = item.sku or prod.sku
                    if item.unit_price is None:
                        u_price = float(prod.unit_price)
                    if item.tax_rate is None:
                        t_rate = float(prod.tax_rate)

            calc = calculate_line_item(
                quantity=item.quantity,
                unit_price=u_price,
                discount_percent=item.discount_percent,
                tax_rate=t_rate,
            )

            line_item = DealLineItem(
                id=uuid4(),
                workspace_id=workspace_id,
                deal_id=deal_id,
                product_id=item.product_id,
                product_name_snapshot=p_name,
                sku_snapshot=p_sku,
                quantity=float(calc.quantity),
                unit_price=float(calc.unit_price),
                discount_percent=float(calc.discount_percent),
                discount_amount=float(calc.discount_amount),
                tax_rate=float(calc.tax_rate),
                subtotal=float(calc.subtotal),
                taxable_amount=float(calc.taxable_amount),
                tax_amount=float(calc.tax_amount),
                total=float(calc.total),
            )
            self.db.add(line_item)
            created_items.append(line_item)

        await self.db.flush()
        await self._sync_deal_totals(workspace_id, member_id, deal_id)

        return [DealLineItemResponse.model_validate(i) for i in created_items]


__all__ = ["CRMService"]
