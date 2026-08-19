"""
ForgeCRM API — CRM Domain Repository Layer

Database operations for Companies, Contacts, Leads, Pipelines, Deals, Tasks,
and Timeline Activities with strict workspace isolation.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md §5 (Repository Layer)
"""

from __future__ import annotations

from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.crm.models import (
    Activity,
    ActivityType,
    Company,
    Contact,
    Deal,
    DealLineItem,
    Lead,
    LeadStatus,
    Pipeline,
    PipelineStage,
    Product,
    Task,
)


class CompanyRepository:
    """Repository for Company operations with workspace isolation."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, company: Company) -> Company:
        """Create a new Company record."""
        self.db.add(company)
        await self.db.flush()
        return company

    async def get_by_id(self, workspace_id: UUID, company_id: UUID) -> Company | None:
        """Fetch Company by ID within target workspace."""
        stmt = (
            select(Company)
            .options(
                selectinload(Company.contacts),
                selectinload(Company.deals),
                selectinload(Company.owner_member),
            )
            .where(
                Company.id == company_id,
                Company.workspace_id == workspace_id,
                Company.deleted_at.is_(None),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_name(self, workspace_id: UUID, name: str) -> Company | None:
        """Fetch Company by name within workspace."""
        stmt = (
            select(Company)
            .where(
                Company.workspace_id == workspace_id,
                Company.name == name.strip(),
                Company.deleted_at.is_(None),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_workspace_companies(
        self,
        workspace_id: UUID,
        limit: int = 100,
        offset: int = 0,
    ) -> Sequence[Company]:
        """List active companies in a workspace."""
        stmt = (
            select(Company)
            .options(selectinload(Company.owner_member))
            .where(Company.workspace_id == workspace_id, Company.deleted_at.is_(None))
            .order_by(Company.name.asc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()


class ContactRepository:
    """Repository for Contact operations with workspace isolation."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, contact: Contact) -> Contact:
        """Create a new Contact record."""
        self.db.add(contact)
        await self.db.flush()
        return contact

    async def get_by_id(self, workspace_id: UUID, contact_id: UUID) -> Contact | None:
        """Fetch Contact by ID within workspace."""
        stmt = (
            select(Contact)
            .options(selectinload(Contact.company), selectinload(Contact.owner_member))
            .where(
                Contact.id == contact_id,
                Contact.workspace_id == workspace_id,
                Contact.deleted_at.is_(None),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_company_contacts(self, workspace_id: UUID, company_id: UUID) -> Sequence[Contact]:
        """List all contacts belonging to a company."""
        stmt = (
            select(Contact)
            .where(
                Contact.workspace_id == workspace_id,
                Contact.company_id == company_id,
                Contact.deleted_at.is_(None),
            )
            .order_by(Contact.is_primary.desc(), Contact.first_name.asc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def list_workspace_contacts(self, workspace_id: UUID, limit: int = 100, offset: int = 0) -> Sequence[Contact]:
        """List active contacts in workspace."""
        stmt = (
            select(Contact)
            .where(Contact.workspace_id == workspace_id, Contact.deleted_at.is_(None))
            .order_by(Contact.last_name.asc(), Contact.first_name.asc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()


class LeadRepository:
    """Repository for Lead operations with workspace isolation."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, lead: Lead) -> Lead:
        """Create a new Lead record."""
        self.db.add(lead)
        await self.db.flush()
        return lead

    async def get_by_id(self, workspace_id: UUID, lead_id: UUID) -> Lead | None:
        """Fetch Lead by ID within workspace."""
        stmt = (
            select(Lead)
            .options(selectinload(Lead.status), selectinload(Lead.source), selectinload(Lead.owner_member))
            .where(
                Lead.id == lead_id,
                Lead.workspace_id == workspace_id,
                Lead.deleted_at.is_(None),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_workspace_leads(self, workspace_id: UUID, limit: int = 100, offset: int = 0) -> Sequence[Lead]:
        """List active leads in workspace."""
        stmt = (
            select(Lead)
            .options(selectinload(Lead.status), selectinload(Lead.source))
            .where(Lead.workspace_id == workspace_id, Lead.deleted_at.is_(None))
            .order_by(Lead.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_status_by_id(self, workspace_id: UUID, status_id: UUID) -> LeadStatus | None:
        """Fetch LeadStatus by ID for workspace."""
        stmt = select(LeadStatus).where(LeadStatus.id == status_id, LeadStatus.workspace_id == workspace_id)
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def get_or_create_default_status(self, workspace_id: UUID) -> LeadStatus:
        """Get or create default 'New' lead status for workspace."""
        from uuid import uuid4

        stmt = select(LeadStatus).where(LeadStatus.workspace_id == workspace_id, LeadStatus.name == "New")
        res = await self.db.execute(stmt)
        status_rec = res.scalar_one_or_none()
        if status_rec is None:
            status_rec = LeadStatus(
                id=uuid4(),
                workspace_id=workspace_id,
                name="New",
                color="#3B82F6",
                sort_order=0,
                is_final=False,
            )
            self.db.add(status_rec)
            await self.db.flush()
        return status_rec


class PipelineRepository:
    """Repository for Pipeline and Stage operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_pipeline(self, pipeline: Pipeline) -> Pipeline:
        """Create a new sales pipeline."""
        self.db.add(pipeline)
        await self.db.flush()
        return pipeline

    async def get_by_id(self, workspace_id: UUID, pipeline_id: UUID) -> Pipeline | None:
        """Fetch Pipeline by ID."""
        stmt = (
            select(Pipeline)
            .options(selectinload(Pipeline.stages))
            .where(Pipeline.id == pipeline_id, Pipeline.workspace_id == workspace_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_or_create_default_pipeline(self, workspace_id: UUID) -> Pipeline:
        """Get or create default sales pipeline with standard stages."""
        from uuid import uuid4

        stmt = (
            select(Pipeline)
            .options(selectinload(Pipeline.stages))
            .where(Pipeline.workspace_id == workspace_id, Pipeline.is_default.is_(True))
        )
        res = await self.db.execute(stmt)
        pipeline = res.scalar_one_or_none()

        if pipeline is None:
            pipeline_id = uuid4()
            pipeline = Pipeline(
                id=pipeline_id,
                workspace_id=workspace_id,
                name="Standard Sales Pipeline",
                description="Default sales opportunity pipeline",
                is_default=True,
                is_active=True,
            )
            self.db.add(pipeline)
            await self.db.flush()

            # Seed default stages
            stages = [
                PipelineStage(id=uuid4(), pipeline_id=pipeline_id, name="Qualification", sort_order=0, probability=10, is_closed=False, is_won=False, color="#3B82F6"),
                PipelineStage(id=uuid4(), pipeline_id=pipeline_id, name="Discovery", sort_order=1, probability=25, is_closed=False, is_won=False, color="#8B5CF6"),
                PipelineStage(id=uuid4(), pipeline_id=pipeline_id, name="Proposal", sort_order=2, probability=50, is_closed=False, is_won=False, color="#F59E0B"),
                PipelineStage(id=uuid4(), pipeline_id=pipeline_id, name="Negotiation", sort_order=3, probability=75, is_closed=False, is_won=False, color="#EC4899"),
                PipelineStage(id=uuid4(), pipeline_id=pipeline_id, name="Closed Won", sort_order=4, probability=100, is_closed=True, is_won=True, color="#10B981"),
                PipelineStage(id=uuid4(), pipeline_id=pipeline_id, name="Closed Lost", sort_order=5, probability=0, is_closed=True, is_won=False, color="#EF4444"),
            ]
            self.db.add_all(stages)
            await self.db.flush()

            # Re-fetch with loaded stages
            stmt = select(Pipeline).options(selectinload(Pipeline.stages)).where(Pipeline.id == pipeline_id)
            res = await self.db.execute(stmt)
            pipeline = res.scalar_one()

        return pipeline

    async def list_workspace_pipelines(self, workspace_id: UUID) -> Sequence[Pipeline]:
        """List all active pipelines for workspace."""
        stmt = (
            select(Pipeline)
            .options(selectinload(Pipeline.stages))
            .where(Pipeline.workspace_id == workspace_id, Pipeline.is_active.is_(True))
            .order_by(Pipeline.is_default.desc(), Pipeline.name.asc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_stage_by_id(self, pipeline_id: UUID, stage_id: UUID) -> PipelineStage | None:
        """Fetch PipelineStage by stage_id and pipeline_id."""
        stmt = select(PipelineStage).where(
            PipelineStage.id == stage_id,
            PipelineStage.pipeline_id == pipeline_id,
        )
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def count_deals_in_stage(self, workspace_id: UUID, stage_id: UUID) -> int:
        """Count active deals assigned to a pipeline stage."""
        from sqlalchemy import func
        from app.modules.crm.models import Deal

        stmt = select(func.count(Deal.id)).where(
            Deal.workspace_id == workspace_id,
            Deal.stage_id == stage_id,
            Deal.deleted_at.is_(None),
        )
        res = await self.db.execute(stmt)
        return res.scalar() or 0

    async def count_deals_in_pipeline(self, workspace_id: UUID, pipeline_id: UUID) -> int:
        """Count active deals assigned to a pipeline."""
        from sqlalchemy import func
        from app.modules.crm.models import Deal

        stmt = select(func.count(Deal.id)).where(
            Deal.workspace_id == workspace_id,
            Deal.pipeline_id == pipeline_id,
            Deal.deleted_at.is_(None),
        )
        res = await self.db.execute(stmt)
        return res.scalar() or 0


class DealRepository:
    """Repository for Deal operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, deal: Deal) -> Deal:
        """Create a new Deal record."""
        self.db.add(deal)
        await self.db.flush()
        return deal

    async def get_by_id(self, workspace_id: UUID, deal_id: UUID) -> Deal | None:
        """Fetch Deal by ID with loaded relationships."""
        stmt = (
            select(Deal)
            .options(
                selectinload(Deal.company),
                selectinload(Deal.stage),
                selectinload(Deal.pipeline),
                selectinload(Deal.line_items),
                selectinload(Deal.products),
                selectinload(Deal.owner_member),
            )
            .where(
                Deal.id == deal_id,
                Deal.workspace_id == workspace_id,
                Deal.deleted_at.is_(None),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_workspace_deals(self, workspace_id: UUID, pipeline_id: UUID | None = None) -> Sequence[Deal]:
        """List active deals in workspace, optionally filtered by pipeline."""
        stmt = (
            select(Deal)
            .options(
                selectinload(Deal.company),
                selectinload(Deal.stage),
                selectinload(Deal.line_items),
                selectinload(Deal.products),
            )
            .where(Deal.workspace_id == workspace_id, Deal.deleted_at.is_(None))
        )
        if pipeline_id is not None:
            stmt = stmt.where(Deal.pipeline_id == pipeline_id)

        stmt = stmt.order_by(Deal.created_at.desc())
        result = await self.db.execute(stmt)
        return result.scalars().all()


class ProductRepository:
    """Repository for Product catalog operations with workspace isolation."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, product: Product) -> Product:
        """Create a new Product record."""
        self.db.add(product)
        await self.db.flush()
        return product

    async def get_by_id(self, workspace_id: UUID, product_id: UUID) -> Product | None:
        """Fetch Product by ID."""
        stmt = (
            select(Product)
            .where(
                Product.id == product_id,
                Product.workspace_id == workspace_id,
                Product.deleted_at.is_(None),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_sku(self, workspace_id: UUID, sku: str) -> Product | None:
        """Fetch Product by workspace and SKU."""
        stmt = (
            select(Product)
            .where(
                Product.workspace_id == workspace_id,
                Product.sku == sku,
                Product.deleted_at.is_(None),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_products(
        self,
        workspace_id: UUID,
        search: str | None = None,
        category: str | None = None,
        is_active: bool | None = None,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[Sequence[Product], int]:
        """List products with search, filtering, and pagination."""
        base_stmt = select(Product).where(
            Product.workspace_id == workspace_id,
            Product.deleted_at.is_(None),
        )

        if is_active is not None:
            base_stmt = base_stmt.where(Product.is_active.is_(is_active))

        if category:
            base_stmt = base_stmt.where(Product.category.ilike(f"%{category}%"))

        if search:
            search_filter = or_(
                Product.name.ilike(f"%{search}%"),
                Product.sku.ilike(f"%{search}%"),
                Product.description.ilike(f"%{search}%"),
            )
            base_stmt = base_stmt.where(search_filter)

        # Count total
        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        total_res = await self.db.execute(count_stmt)
        total = total_res.scalar() or 0

        # Paginated results
        offset = (page - 1) * page_size
        items_stmt = base_stmt.order_by(Product.name.asc()).offset(offset).limit(page_size)
        items_res = await self.db.execute(items_stmt)
        items = items_res.scalars().all()

        return items, total

    async def count_deal_references(self, workspace_id: UUID, product_id: UUID) -> int:
        """Count how many deal line items reference this product."""
        stmt = (
            select(func.count(DealLineItem.id))
            .where(
                DealLineItem.workspace_id == workspace_id,
                DealLineItem.product_id == product_id,
            )
        )
        res = await self.db.execute(stmt)
        return res.scalar() or 0

    async def delete(self, product: Product) -> None:
        """Hard delete product if unreferenced."""
        await self.db.delete(product)
        await self.db.flush()


class DealLineItemRepository:
    """Repository for Deal Line Item operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, line_item: DealLineItem) -> DealLineItem:
        """Create a new DealLineItem."""
        self.db.add(line_item)
        await self.db.flush()
        return line_item

    async def get_by_id(
        self, workspace_id: UUID, deal_id: UUID, line_item_id: UUID
    ) -> DealLineItem | None:
        """Fetch line item by ID and Deal."""
        stmt = (
            select(DealLineItem)
            .where(
                DealLineItem.id == line_item_id,
                DealLineItem.deal_id == deal_id,
                DealLineItem.workspace_id == workspace_id,
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_deal_id(self, workspace_id: UUID, deal_id: UUID) -> Sequence[DealLineItem]:
        """List all line items for a deal ordered by created_at."""
        stmt = (
            select(DealLineItem)
            .where(
                DealLineItem.workspace_id == workspace_id,
                DealLineItem.deal_id == deal_id,
            )
            .order_by(DealLineItem.created_at.asc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def delete(self, line_item: DealLineItem) -> None:
        """Delete a line item."""
        await self.db.delete(line_item)
        await self.db.flush()

    async def delete_all_by_deal(self, workspace_id: UUID, deal_id: UUID) -> None:
        """Delete all line items for a deal."""
        line_items = await self.list_by_deal_id(workspace_id, deal_id)
        for item in line_items:
            await self.db.delete(item)
        await self.db.flush()


class TaskRepository:
    """Repository for Task operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, task: Task) -> Task:
        """Create a new Task record."""
        self.db.add(task)
        await self.db.flush()
        return task

    async def get_by_id(self, workspace_id: UUID, task_id: UUID) -> Task | None:
        """Fetch Task by ID."""
        stmt = (
            select(Task)
            .options(selectinload(Task.owner_member), selectinload(Task.assigned_member))
            .where(Task.id == task_id, Task.workspace_id == workspace_id, Task.deleted_at.is_(None))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_workspace_tasks(self, workspace_id: UUID, assigned_member_id: UUID | None = None) -> Sequence[Task]:
        """List tasks in workspace."""
        stmt = (
            select(Task)
            .options(selectinload(Task.owner_member), selectinload(Task.assigned_member))
            .where(Task.workspace_id == workspace_id, Task.deleted_at.is_(None))
        )
        if assigned_member_id is not None:
            stmt = stmt.where(Task.assigned_member_id == assigned_member_id)

        stmt = stmt.order_by(Task.due_date.asc().nulls_last())
        result = await self.db.execute(stmt)
        return result.scalars().all()


class ActivityRepository:
    """Repository for timeline Activity logging."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def log_activity(self, activity: Activity) -> Activity:
        """Log an immutable timeline activity event."""
        self.db.add(activity)
        await self.db.flush()
        return activity

    async def list_entity_timeline(
        self,
        workspace_id: UUID,
        entity_type: str,
        entity_id: UUID,
    ) -> Sequence[Activity]:
        """Fetch timeline events for a CRM entity ordered chronologically descending."""
        stmt = (
            select(Activity)
            .options(selectinload(Activity.activity_type))
            .where(
                Activity.workspace_id == workspace_id,
                Activity.entity_type == entity_type,
                Activity.entity_id == entity_id,
            )
            .order_by(Activity.occurred_at.desc())
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_or_create_activity_type(self, name: str, category: str = "General") -> ActivityType:
        """Get or create an activity event type."""
        from uuid import uuid4

        stmt = select(ActivityType).where(ActivityType.name == name)
        res = await self.db.execute(stmt)
        type_rec = res.scalar_one_or_none()

        if type_rec is None:
            type_rec = ActivityType(id=uuid4(), name=name, category=category)
            self.db.add(type_rec)
            await self.db.flush()

        return type_rec


class BulkRepository:
    """High-performance batch SQL operations repository."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    def _get_model(self, entity_type: str):
        from app.modules.crm.models import Company, Contact, Lead, Deal, Task
        from app.modules.storage.models import DocumentAttachment

        mapping = {
            "company": Company,
            "companies": Company,
            "contact": Contact,
            "contacts": Contact,
            "lead": Lead,
            "leads": Lead,
            "deal": Deal,
            "deals": Deal,
            "task": Task,
            "tasks": Task,
            "storage": DocumentAttachment,
            "attachments": DocumentAttachment,
        }
        model = mapping.get(entity_type.lower())
        if model is None:
            raise ValueError(f"Unsupported entity type '{entity_type}'")
        return model

    async def bulk_soft_delete(self, workspace_id: UUID, entity_type: str, ids: list[UUID]) -> int:
        from datetime import datetime, UTC
        from sqlalchemy import update

        model = self._get_model(entity_type)
        stmt = (
            update(model)
            .where(model.id.in_(ids), model.workspace_id == workspace_id)
            .values(deleted_at=datetime.now(UTC))
        )
        res = await self.db.execute(stmt)
        await self.db.flush()
        return res.rowcount

    async def bulk_restore(self, workspace_id: UUID, entity_type: str, ids: list[UUID]) -> int:
        from sqlalchemy import update

        model = self._get_model(entity_type)
        stmt = (
            update(model)
            .where(model.id.in_(ids), model.workspace_id == workspace_id)
            .values(deleted_at=None)
        )
        res = await self.db.execute(stmt)
        await self.db.flush()
        return res.rowcount

    async def bulk_reassign_owner(self, workspace_id: UUID, entity_type: str, ids: list[UUID], owner_member_id: UUID) -> int:
        from sqlalchemy import update

        model = self._get_model(entity_type)
        if not hasattr(model, "owner_member_id"):
            return 0

        stmt = (
            update(model)
            .where(model.id.in_(ids), model.workspace_id == workspace_id)
            .values(owner_member_id=owner_member_id)
        )
        res = await self.db.execute(stmt)
        await self.db.flush()
        return res.rowcount

    async def bulk_update_status(self, workspace_id: UUID, entity_type: str, ids: list[UUID], status: str) -> int:
        from sqlalchemy import update

        model = self._get_model(entity_type)
        if not hasattr(model, "status"):
            return 0

        stmt = (
            update(model)
            .where(model.id.in_(ids), model.workspace_id == workspace_id)
            .values(status=status)
        )
        res = await self.db.execute(stmt)
        await self.db.flush()
        return res.rowcount

    async def bulk_move_stage(self, workspace_id: UUID, ids: list[UUID], pipeline_id: UUID, stage_id: UUID) -> int:
        from sqlalchemy import update
        from app.modules.crm.models import Deal

        stmt = (
            update(Deal)
            .where(Deal.id.in_(ids), Deal.workspace_id == workspace_id)
            .values(pipeline_id=pipeline_id, stage_id=stage_id)
        )
        res = await self.db.execute(stmt)
        await self.db.flush()
        return res.rowcount


__all__ = [
    "ActivityRepository",
    "BulkRepository",
    "CompanyRepository",
    "ContactRepository",
    "DealRepository",
    "LeadRepository",
    "PipelineRepository",
    "TaskRepository",
]
