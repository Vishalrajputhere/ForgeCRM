"""
ForgeCRM API — CRM Core Operational Models

Database models for Companies, Contacts, Leads, Pipelines, Pipeline Stages,
Deals, Deal Products, Activities, Tasks, and lookup tables.

Documentation:
  docs/02_Database/204_CRM_OVERVIEW.md
  docs/02_Database/205_COMPANIES_CONTACTS_SCHEMA.md
  docs/02_Database/206_LEADS_SCHEMA.md
  docs/02_Database/207_DEALS_PIPELINES_SCHEMA.md
  docs/02_Database/208_ACTIVITIES_TASKS_SCHEMA.md
"""

from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import (
    BOOLEAN,
    DATE,
    NUMERIC,
    SMALLINT,
    VARCHAR,
    DateTime,
    ForeignKey,
    Integer,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, BaseModel, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.modules.workspace.models import WorkspaceMember


# ── Lookup Tables ──────────────────────────────────────────────────────────────


class CompanyIndustry(Base):
    """Lookup table for company industry categories."""

    __tablename__ = "company_industries"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    name: Mapped[str] = mapped_column(VARCHAR(150), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)


class LeadSource(Base):
    """Lookup table for lead acquisition sources per workspace."""

    __tablename__ = "lead_sources"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    workspace_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(VARCHAR(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(BOOLEAN, default=True, server_default="true", nullable=False)

    __table_args__ = (
        UniqueConstraint("workspace_id", "name", name="uq_workspace_lead_source_name"),
    )


class LeadStatus(Base):
    """Lookup table for lead qualification statuses per workspace."""

    __tablename__ = "lead_statuses"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    workspace_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(VARCHAR(100), nullable=False)
    color: Mapped[str | None] = mapped_column(VARCHAR(20), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    is_final: Mapped[bool] = mapped_column(BOOLEAN, default=False, server_default="false", nullable=False)


class ActivityType(Base):
    """Lookup table for activity timeline event types."""

    __tablename__ = "activity_types"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    name: Mapped[str] = mapped_column(VARCHAR(120), nullable=False, unique=True)
    category: Mapped[str] = mapped_column(VARCHAR(50), nullable=False)
    icon: Mapped[str | None] = mapped_column(VARCHAR(50), nullable=True)
    color: Mapped[str | None] = mapped_column(VARCHAR(20), nullable=True)


# ── Core CRM Entities ──────────────────────────────────────────────────────────


class Company(BaseModel):
    """Represents a customer organization / account."""

    __tablename__ = "companies"

    workspace_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_member_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("workspace_members.id", ondelete="RESTRICT"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(VARCHAR(255), nullable=False, index=True)
    legal_name: Mapped[str | None] = mapped_column(VARCHAR(255), nullable=True)
    industry_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("company_industries.id", ondelete="SET NULL"), nullable=True, index=True)
    website: Mapped[str | None] = mapped_column(Text, nullable=True, index=True)
    email: Mapped[str | None] = mapped_column(VARCHAR(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(VARCHAR(50), nullable=True)
    annual_revenue: Mapped[float | None] = mapped_column(NUMERIC(18, 2), nullable=True)
    employee_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(VARCHAR(30), default="Active", server_default="Active", nullable=False, index=True)

    __table_args__ = (
        UniqueConstraint("workspace_id", "name", name="uq_workspace_company_name"),
    )

    # Relationships
    contacts: Mapped[list[Contact]] = relationship("Contact", back_populates="company", cascade="all, delete-orphan")
    deals: Mapped[list[Deal]] = relationship("Deal", back_populates="company", cascade="all, delete-orphan")
    owner_member: Mapped[WorkspaceMember] = relationship("WorkspaceMember", foreign_keys=[owner_member_id])


class Contact(BaseModel):
    """Represents an individual person associated with a Company."""

    __tablename__ = "contacts"

    workspace_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_member_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("workspace_members.id", ondelete="RESTRICT"), nullable=False, index=True)
    first_name: Mapped[str] = mapped_column(VARCHAR(100), nullable=False)
    last_name: Mapped[str] = mapped_column(VARCHAR(100), nullable=False)
    job_title: Mapped[str | None] = mapped_column(VARCHAR(150), nullable=True)
    department: Mapped[str | None] = mapped_column(VARCHAR(150), nullable=True)
    email: Mapped[str | None] = mapped_column(VARCHAR(255), nullable=True, index=True)
    phone: Mapped[str | None] = mapped_column(VARCHAR(50), nullable=True, index=True)
    mobile: Mapped[str | None] = mapped_column(VARCHAR(50), nullable=True, index=True)
    linkedin_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    birthday: Mapped[date | None] = mapped_column(DATE, nullable=True)
    is_primary: Mapped[bool] = mapped_column(BOOLEAN, default=False, server_default="false", nullable=False)
    status: Mapped[str] = mapped_column(VARCHAR(30), default="Active", server_default="Active", nullable=False)

    # Relationships
    company: Mapped[Company] = relationship("Company", back_populates="contacts")
    owner_member: Mapped[WorkspaceMember] = relationship("WorkspaceMember", foreign_keys=[owner_member_id])


class Lead(BaseModel):
    """Represents an unqualified sales lead / prospect."""

    __tablename__ = "leads"

    workspace_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_member_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("workspace_members.id", ondelete="RESTRICT"), nullable=False, index=True)
    source_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("lead_sources.id", ondelete="SET NULL"), nullable=True, index=True)
    status_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("lead_statuses.id", ondelete="RESTRICT"), nullable=False, index=True)
    first_name: Mapped[str] = mapped_column(VARCHAR(100), nullable=False)
    last_name: Mapped[str | None] = mapped_column(VARCHAR(100), nullable=True)
    company_name: Mapped[str | None] = mapped_column(VARCHAR(255), nullable=True, index=True)
    job_title: Mapped[str | None] = mapped_column(VARCHAR(150), nullable=True)
    email: Mapped[str | None] = mapped_column(VARCHAR(255), nullable=True, index=True)
    phone: Mapped[str | None] = mapped_column(VARCHAR(50), nullable=True, index=True)
    website: Mapped[str | None] = mapped_column(Text, nullable=True)
    estimated_value: Mapped[float | None] = mapped_column(NUMERIC(18, 2), nullable=True)
    priority: Mapped[str] = mapped_column(VARCHAR(20), default="Medium", server_default="Medium", nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    assigned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    converted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    lost_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    owner_member: Mapped[WorkspaceMember] = relationship("WorkspaceMember", foreign_keys=[owner_member_id])
    status: Mapped[LeadStatus] = relationship("LeadStatus")
    source: Mapped[LeadSource | None] = relationship("LeadSource")


class LeadConversion(Base):
    """Historical audit record of lead conversion into Company, Contact, and Deal."""

    __tablename__ = "lead_conversions"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    lead_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("leads.id", ondelete="RESTRICT"), nullable=False, unique=True)
    company_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("companies.id", ondelete="RESTRICT"), nullable=False)
    contact_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("contacts.id", ondelete="RESTRICT"), nullable=False)
    deal_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("deals.id", ondelete="SET NULL"), nullable=True)
    converted_by: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("workspace_members.id", ondelete="RESTRICT"), nullable=False)
    converted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


# ── Pipeline & Deal Entities ───────────────────────────────────────────────────


class Pipeline(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Defines a sales workflow pipeline per workspace."""

    __tablename__ = "pipelines"

    workspace_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(VARCHAR(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_default: Mapped[bool] = mapped_column(BOOLEAN, default=False, server_default="false", nullable=False)
    is_active: Mapped[bool] = mapped_column(BOOLEAN, default=True, server_default="true", nullable=False)

    __table_args__ = (
        UniqueConstraint("workspace_id", "name", name="uq_workspace_pipeline_name"),
    )

    # Relationships
    stages: Mapped[list[PipelineStage]] = relationship("PipelineStage", back_populates="pipeline", order_by="PipelineStage.sort_order", cascade="all, delete-orphan")


class PipelineStage(Base, UUIDPrimaryKeyMixin):
    """Ordered stage within a sales pipeline."""

    __tablename__ = "pipeline_stages"

    pipeline_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("pipelines.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(VARCHAR(120), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False, index=True)
    probability: Mapped[int] = mapped_column(SMALLINT, default=10, server_default="10", nullable=False)
    is_closed: Mapped[bool] = mapped_column(BOOLEAN, default=False, server_default="false", nullable=False)
    is_won: Mapped[bool] = mapped_column(BOOLEAN, default=False, server_default="false", nullable=False)
    color: Mapped[str | None] = mapped_column(VARCHAR(20), nullable=True)

    # Relationships
    pipeline: Mapped[Pipeline] = relationship("Pipeline", back_populates="stages")


class Deal(BaseModel):
    """Represents a sales revenue opportunity."""

    __tablename__ = "deals"

    workspace_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    pipeline_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("pipelines.id", ondelete="RESTRICT"), nullable=False, index=True)
    stage_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("pipeline_stages.id", ondelete="RESTRICT"), nullable=False, index=True)
    company_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    primary_contact_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True)
    owner_member_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("workspace_members.id", ondelete="RESTRICT"), nullable=False, index=True)
    lead_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("leads.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    value: Mapped[float] = mapped_column(NUMERIC(18, 2), default=0.0, server_default="0.0", nullable=False)
    expected_close_date: Mapped[date | None] = mapped_column(DATE, nullable=True, index=True)
    probability: Mapped[int | None] = mapped_column(SMALLINT, nullable=True)
    status: Mapped[str] = mapped_column(VARCHAR(30), default="Open", server_default="Open", nullable=False, index=True)  # Open / Won / Lost
    loss_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    company: Mapped[Company] = relationship("Company", back_populates="deals")
    pipeline: Mapped[Pipeline] = relationship("Pipeline")
    stage: Mapped[PipelineStage] = relationship("PipelineStage")
    primary_contact: Mapped[Contact | None] = relationship("Contact")
    owner_member: Mapped[WorkspaceMember] = relationship("WorkspaceMember", foreign_keys=[owner_member_id])
    products: Mapped[list[DealProduct]] = relationship("DealProduct", back_populates="deal", cascade="all, delete-orphan")


class DealProduct(Base):
    """Line item product Snapshot associated with a Deal."""

    __tablename__ = "deal_products"

    deal_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("deals.id", ondelete="CASCADE"), primary_key=True)
    product_name: Mapped[str] = mapped_column(VARCHAR(255), primary_key=True)
    quantity: Mapped[float] = mapped_column(NUMERIC(12, 2), default=1.0, server_default="1.0", nullable=False)
    unit_price: Mapped[float] = mapped_column(NUMERIC(18, 2), default=0.0, server_default="0.0", nullable=False)
    discount_percent: Mapped[float] = mapped_column(NUMERIC(5, 2), default=0.0, server_default="0.0", nullable=False)
    line_total: Mapped[float] = mapped_column(NUMERIC(18, 2), default=0.0, server_default="0.0", nullable=False)

    # Relationships
    deal: Mapped[Deal] = relationship("Deal", back_populates="products")


# ── Activity & Task Entities ───────────────────────────────────────────────────


class Activity(Base, UUIDPrimaryKeyMixin):
    """Immutable timeline event record for CRM objects."""

    __tablename__ = "activities"

    workspace_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_type_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("activity_types.id", ondelete="RESTRICT"), nullable=False)
    actor_member_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("workspace_members.id", ondelete="SET NULL"), nullable=True, index=True)
    entity_type: Mapped[str] = mapped_column(VARCHAR(50), nullable=False, index=True)  # Company, Contact, Lead, Deal, Task
    entity_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False, index=True)
    title: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[dict[str, Any] | None] = mapped_column("metadata", JSONB, nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    activity_type: Mapped[ActivityType] = relationship("ActivityType")
    actor_member: Mapped[WorkspaceMember | None] = relationship("WorkspaceMember", foreign_keys=[actor_member_id])


class Task(BaseModel):
    """Actionable task item assigned to a workspace member."""

    __tablename__ = "tasks"

    workspace_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_member_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("workspace_members.id", ondelete="RESTRICT"), nullable=False, index=True)
    assigned_member_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("workspace_members.id", ondelete="RESTRICT"), nullable=False, index=True)
    entity_type: Mapped[str | None] = mapped_column(VARCHAR(50), nullable=True)
    entity_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), nullable=True)
    title: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    priority: Mapped[str] = mapped_column(VARCHAR(20), default="Medium", server_default="Medium", nullable=False, index=True)
    status: Mapped[str] = mapped_column(VARCHAR(20), default="Open", server_default="Open", nullable=False, index=True)  # Open, In Progress, Completed, Cancelled
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    owner_member: Mapped[WorkspaceMember] = relationship("WorkspaceMember", foreign_keys=[owner_member_id])
    assigned_member: Mapped[WorkspaceMember] = relationship("WorkspaceMember", foreign_keys=[assigned_member_id])


__all__ = [
    "Activity",
    "ActivityType",
    "Company",
    "CompanyIndustry",
    "Contact",
    "Deal",
    "DealProduct",
    "Lead",
    "LeadConversion",
    "LeadSource",
    "LeadStatus",
    "Pipeline",
    "PipelineStage",
    "Task",
]
