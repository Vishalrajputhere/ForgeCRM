"""
ForgeCRM API — Workflow Automation Repository Layer

Database operations for AutomationRule, AutomationRun, AutomationLog,
and AutomationTemplate with strict workspace isolation.
"""

from __future__ import annotations

from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.automation.models import (
    AutomationAction,
    AutomationCondition,
    AutomationLog,
    AutomationRule,
    AutomationRun,
    AutomationTemplate,
)


class AutomationRuleRepository:
    """CRUD operations for AutomationRule with workspace isolation."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, rule: AutomationRule) -> AutomationRule:
        self.db.add(rule)
        await self.db.flush()
        return rule

    async def add_condition(self, condition: AutomationCondition) -> AutomationCondition:
        self.db.add(condition)
        await self.db.flush()
        return condition

    async def add_action(self, action: AutomationAction) -> AutomationAction:
        self.db.add(action)
        await self.db.flush()
        return action

    async def get_by_id(self, workspace_id: UUID, rule_id: UUID) -> AutomationRule | None:
        """Fetch rule with conditions and actions eagerly loaded."""
        stmt = (
            select(AutomationRule)
            .options(
                selectinload(AutomationRule.conditions),
                selectinload(AutomationRule.actions),
            )
            .where(
                AutomationRule.id == rule_id,
                AutomationRule.workspace_id == workspace_id,
                AutomationRule.deleted_at.is_(None),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_workspace_rules(
        self,
        workspace_id: UUID,
        limit: int = 100,
        offset: int = 0,
        search: str | None = None,
        is_active: bool | None = None,
    ) -> Sequence[AutomationRule]:
        stmt = (
            select(AutomationRule)
            .where(
                AutomationRule.workspace_id == workspace_id,
                AutomationRule.deleted_at.is_(None),
            )
            .order_by(AutomationRule.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        if search:
            stmt = stmt.where(AutomationRule.name.ilike(f"%{search}%"))
        if is_active is not None:
            stmt = stmt.where(AutomationRule.is_active == is_active)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def count_workspace_rules(
        self,
        workspace_id: UUID,
        search: str | None = None,
        is_active: bool | None = None,
    ) -> int:
        from sqlalchemy import func
        stmt = (
            select(func.count(AutomationRule.id))
            .where(
                AutomationRule.workspace_id == workspace_id,
                AutomationRule.deleted_at.is_(None),
            )
        )
        if search:
            stmt = stmt.where(AutomationRule.name.ilike(f"%{search}%"))
        if is_active is not None:
            stmt = stmt.where(AutomationRule.is_active == is_active)
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def get_active_rules_for_event(
        self,
        workspace_id: UUID,
        trigger_event: str,
    ) -> Sequence[AutomationRule]:
        """
        Fetch all active automation rules matching a trigger event for a workspace.
        Used by the trigger dispatcher on every CRM event.
        Eagerly loads conditions and actions to avoid N+1.
        """
        stmt = (
            select(AutomationRule)
            .options(
                selectinload(AutomationRule.conditions),
                selectinload(AutomationRule.actions),
            )
            .where(
                AutomationRule.workspace_id == workspace_id,
                AutomationRule.trigger_event == trigger_event,
                AutomationRule.is_active.is_(True),
                AutomationRule.deleted_at.is_(None),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def save(self, rule: AutomationRule) -> AutomationRule:
        self.db.add(rule)
        await self.db.flush()
        return rule

    async def delete_conditions_for_rule(self, rule_id: UUID) -> None:
        """Delete all existing conditions for a rule (before replacing with new set)."""
        from sqlalchemy import delete as sa_delete
        stmt = sa_delete(AutomationCondition).where(AutomationCondition.rule_id == rule_id)
        await self.db.execute(stmt)

    async def delete_actions_for_rule(self, rule_id: UUID) -> None:
        """Delete all existing actions for a rule (before replacing with new set)."""
        from sqlalchemy import delete as sa_delete
        stmt = sa_delete(AutomationAction).where(AutomationAction.rule_id == rule_id)
        await self.db.execute(stmt)

    async def increment_run_stats(
        self,
        rule_id: UUID,
        success: bool,
        last_run_at: object,
    ) -> None:
        """Atomically increment run statistics on the rule record."""
        from datetime import datetime
        from sqlalchemy import case
        stmt = (
            update(AutomationRule)
            .where(AutomationRule.id == rule_id)
            .values(
                total_runs=AutomationRule.total_runs + 1,
                successful_runs=AutomationRule.successful_runs + (1 if success else 0),
                failed_runs=AutomationRule.failed_runs + (0 if success else 1),
                last_run_at=last_run_at,
            )
        )
        await self.db.execute(stmt)


class AutomationRunRepository:
    """Operations for AutomationRun records."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, run: AutomationRun) -> AutomationRun:
        self.db.add(run)
        await self.db.flush()
        return run

    async def get_by_id(self, run_id: UUID) -> AutomationRun | None:
        stmt = (
            select(AutomationRun)
            .options(selectinload(AutomationRun.logs))
            .where(AutomationRun.id == run_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_rule(
        self,
        rule_id: UUID,
        limit: int = 50,
        offset: int = 0,
    ) -> Sequence[AutomationRun]:
        stmt = (
            select(AutomationRun)
            .where(AutomationRun.rule_id == rule_id)
            .order_by(AutomationRun.started_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def save(self, run: AutomationRun) -> AutomationRun:
        self.db.add(run)
        await self.db.flush()
        return run


class AutomationLogRepository:
    """Operations for AutomationLog per-step records."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, log: AutomationLog) -> AutomationLog:
        self.db.add(log)
        await self.db.flush()
        return log

    async def list_by_run(self, run_id: UUID) -> Sequence[AutomationLog]:
        stmt = (
            select(AutomationLog)
            .where(AutomationLog.run_id == run_id)
            .order_by(AutomationLog.position)
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()


class AutomationTemplateRepository:
    """Read-only operations for AutomationTemplate (global, not workspace-scoped)."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, template_id: UUID) -> AutomationTemplate | None:
        stmt = select(AutomationTemplate).where(AutomationTemplate.id == template_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(self, category: str | None = None) -> Sequence[AutomationTemplate]:
        stmt = select(AutomationTemplate).order_by(AutomationTemplate.is_featured.desc(), AutomationTemplate.name)
        if category:
            stmt = stmt.where(AutomationTemplate.category == category)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def count_all(self) -> int:
        from sqlalchemy import func
        result = await self.db.execute(select(func.count(AutomationTemplate.id)))
        return result.scalar_one()

    async def create(self, template: AutomationTemplate) -> AutomationTemplate:
        self.db.add(template)
        await self.db.flush()
        return template

    async def increment_use_count(self, template_id: UUID) -> None:
        stmt = (
            update(AutomationTemplate)
            .where(AutomationTemplate.id == template_id)
            .values(use_count=AutomationTemplate.use_count + 1)
        )
        await self.db.execute(stmt)


__all__ = [
    "AutomationLogRepository",
    "AutomationRuleRepository",
    "AutomationRunRepository",
    "AutomationTemplateRepository",
]
