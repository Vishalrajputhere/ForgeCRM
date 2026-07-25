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
from app.modules.crm.exceptions import (
    CompanyNotFoundError,
    ContactNotFoundError,
    DealNotFoundError,
    LeadAlreadyConvertedError,
    LeadNotFoundError,
    PipelineNotFoundError,
    TaskNotFoundError,
)
from app.modules.crm.models import (
    Activity,
    Company,
    Contact,
    Deal,
    DealProduct,
    Lead,
    LeadConversion,
    Pipeline,
    PipelineStage,
    Task,
)
from app.modules.crm.repository import (
    ActivityRepository,
    CompanyRepository,
    ContactRepository,
    DealRepository,
    LeadRepository,
    PipelineRepository,
    TaskRepository,
)
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

logger = get_logger(__name__)


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
        return LeadResponse.model_validate(lead)

    async def list_leads(self, workspace_id: UUID) -> list[LeadResponse]:
        """List active leads in workspace."""
        leads = await self.lead_repo.list_workspace_leads(workspace_id)
        return [LeadResponse.model_validate(lead) for lead in leads]

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

        return LeadConversionResponse(
            company=CompanyResponse.model_validate(company),
            contact=ContactResponse.model_validate(contact),
            deal=DealResponse.model_validate(deal) if deal else None,
            converted_at=now,
        )

    # ── Pipelines & Deals ──────────────────────────────────────────────────────

    async def create_pipeline(self, workspace_id: UUID, payload: PipelineCreate) -> PipelineResponse:
        """Create a sales pipeline with stages."""
        pipeline_id = uuid4()
        pipeline = Pipeline(
            id=pipeline_id,
            workspace_id=workspace_id,
            name=payload.name,
            description=payload.description,
            is_default=payload.is_default,
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
                    color=stg.color,
                )
                self.db.add(stage_obj)
            await self.db.flush()

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

        if payload.products:
            for prd in payload.products:
                dp = DealProduct(
                    deal_id=deal.id,
                    product_name=prd.product_name,
                    quantity=prd.quantity,
                    unit_price=prd.unit_price,
                    discount_percent=prd.discount_percent,
                    line_total=prd.quantity * prd.unit_price * (1 - prd.discount_percent / 100.0),
                )
                self.db.add(dp)
            await self.db.flush()

        await self._log_timeline_activity(
            workspace_id=workspace_id,
            actor_member_id=member_id,
            entity_type="Deal",
            entity_id=deal.id,
            title="Deal Created",
            description=f"Created deal '{deal.name}' with value ${deal.value:,.2f}",
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
        return TaskResponse.model_validate(task)

    async def list_tasks(self, workspace_id: UUID) -> list[TaskResponse]:
        """List tasks in workspace."""
        tasks = await self.task_repo.list_workspace_tasks(workspace_id)
        return [TaskResponse.model_validate(t) for t in tasks]

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

        return TaskResponse.model_validate(task)

    # ── Activity Timeline ─────────────────────────────────────────────────────

    async def list_timeline(self, workspace_id: UUID, entity_type: str, entity_id: UUID) -> list[ActivityResponse]:
        """Fetch immutable timeline for a CRM entity."""
        activities = await self.activity_repo.list_entity_timeline(workspace_id, entity_type, entity_id)
        return [ActivityResponse.model_validate(a) for a in activities]


__all__ = ["CRMService"]
