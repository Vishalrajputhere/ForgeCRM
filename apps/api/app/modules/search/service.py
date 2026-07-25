"""
ForgeCRM API — Global Search Domain Service Layer

Implements workspace-isolated full-text and pattern search across Companies,
Contacts, Leads, Deals, and Tasks.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md §16
"""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.crm.models import Company, Contact, Deal, Lead, Task
from app.modules.search.schemas import GlobalSearchResponse, SearchResultItem


class SearchService:
    """Service layer for multi-entity workspace search."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def search(self, workspace_id: UUID, query_str: str, limit: int = 20) -> GlobalSearchResponse:
        """Perform workspace-isolated search across all CRM entities."""
        q = query_str.strip()
        if len(q) < 2:
            return GlobalSearchResponse(query=q, total=0, results=[])

        pattern = f"%{q}%"
        results: list[SearchResultItem] = []

        # 1. Search Companies
        stmt_comp = (
            select(Company)
            .where(
                Company.workspace_id == workspace_id,
                Company.deleted_at.is_(None),
                or_(Company.name.ilike(pattern), Company.website.ilike(pattern), Company.email.ilike(pattern)),
            )
            .limit(limit)
        )
        comp_res = await self.db.execute(stmt_comp)
        for comp in comp_res.scalars().all():
            results.append(
                SearchResultItem(
                    id=comp.id,
                    entity_type="Company",
                    title=comp.name,
                    subtitle=comp.website or comp.status,
                    url=f"/crm/companies/{comp.id}",
                )
            )

        # 2. Search Contacts
        stmt_cnt = (
            select(Contact)
            .where(
                Contact.workspace_id == workspace_id,
                Contact.deleted_at.is_(None),
                or_(
                    Contact.first_name.ilike(pattern),
                    Contact.last_name.ilike(pattern),
                    Contact.email.ilike(pattern),
                    Contact.phone.ilike(pattern),
                ),
            )
            .limit(limit)
        )
        cnt_res = await self.db.execute(stmt_cnt)
        for cnt in cnt_res.scalars().all():
            results.append(
                SearchResultItem(
                    id=cnt.id,
                    entity_type="Contact",
                    title=f"{cnt.first_name} {cnt.last_name}".strip(),
                    subtitle=cnt.email or cnt.job_title,
                    url=f"/crm/contacts/{cnt.id}",
                )
            )

        # 3. Search Leads
        stmt_lead = (
            select(Lead)
            .where(
                Lead.workspace_id == workspace_id,
                Lead.deleted_at.is_(None),
                or_(
                    Lead.first_name.ilike(pattern),
                    Lead.last_name.ilike(pattern),
                    Lead.company_name.ilike(pattern),
                    Lead.email.ilike(pattern),
                ),
            )
            .limit(limit)
        )
        lead_res = await self.db.execute(stmt_lead)
        for lead in lead_res.scalars().all():
            results.append(
                SearchResultItem(
                    id=lead.id,
                    entity_type="Lead",
                    title=f"{lead.first_name} {lead.last_name or ''}".strip(),
                    subtitle=lead.company_name or lead.email,
                    url=f"/crm/leads/{lead.id}",
                )
            )

        # 4. Search Deals
        stmt_deal = (
            select(Deal)
            .where(
                Deal.workspace_id == workspace_id,
                Deal.deleted_at.is_(None),
                Deal.name.ilike(pattern),
            )
            .limit(limit)
        )
        deal_res = await self.db.execute(stmt_deal)
        for deal in deal_res.scalars().all():
            results.append(
                SearchResultItem(
                    id=deal.id,
                    entity_type="Deal",
                    title=deal.name,
                    subtitle=f"${deal.value:,.2f} — {deal.status}",
                    url=f"/crm/deals/{deal.id}",
                )
            )

        # 5. Search Tasks
        stmt_task = (
            select(Task)
            .where(
                Task.workspace_id == workspace_id,
                Task.deleted_at.is_(None),
                or_(Task.title.ilike(pattern), Task.description.ilike(pattern)),
            )
            .limit(limit)
        )
        task_res = await self.db.execute(stmt_task)
        for task in task_res.scalars().all():
            results.append(
                SearchResultItem(
                    id=task.id,
                    entity_type="Task",
                    title=task.title,
                    subtitle=f"{task.priority} Priority — {task.status}",
                    url=f"/crm/tasks/{task.id}",
                )
            )

        return GlobalSearchResponse(
            query=q,
            total=len(results),
            results=results[:limit],
        )


__all__ = ["SearchService"]
