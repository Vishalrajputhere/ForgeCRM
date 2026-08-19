"""
ForgeCRM API — Analytics Domain Service Layer

Calculates workspace-scoped real-time business intelligence KPIs, sales performance leaderboards,
pipeline velocity, weighted revenue forecasting, lead conversion funnels, activity productivity,
automation execution metrics, AI telemetry & cost tracking, custom dashboards, saved reports, and CSV export.

Documentation: docs/01_Architecture/101_SYSTEM_ARCHITECTURE.md §6
"""

from __future__ import annotations

import csv
import io
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.ai.models import AICostRecord, AIProviderSetting, AIUsageMeter
from app.modules.analytics.models import AnalyticsDashboard, AnalyticsDashboardWidget, SavedReport
from app.modules.analytics.schemas import (
    AccountAnalyticsResponse,
    ActivityAnalyticsResponse,
    ActivityTypeMetricItem,
    AIAnalyticsResponse,
    AIModelSpendItem,
    AutomationAnalyticsResponse,
    DashboardCreate,
    DashboardResponse,
    DashboardWidgetSchema,
    DealMetricsResponse,
    ExecutiveOverviewResponse,
    LeadMetricsResponse,
    PipelineAnalyticsResponse,
    ProductAnalyticsResponse,
    ProductCategoryItem,
    ProductPerformanceItem,
    RepLeaderboardItem,
    SalesPerformanceResponse,
    SavedReportCreate,
    SavedReportResponse,
    StageMetricItem,
    TopAccountItem,
    TopWorkflowMetricItem,
)
from app.modules.automation.models import AutomationRule, AutomationRun
from app.modules.crm.models import (
    Activity,
    ActivityType,
    Company,
    Contact,
    Deal,
    DealLineItem,
    Lead,
    Pipeline,
    PipelineStage,
    Product,
    Task,
)
from app.modules.identity.models import Role, User
from app.modules.identity.permissions import SystemRoles
from app.modules.workspace.models import WorkspaceMember


class AnalyticsService:
    """Service layer for business analytics and reporting."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── Time Range & RBAC Helpers ──────────────────────────────────────────────

    def parse_time_range(
        self,
        time_range: str | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple[datetime | None, datetime | None]:
        """Convert time_range string or custom date boundaries to UTC datetime interval."""
        now = datetime.now(UTC)

        if start_date or end_date:
            return start_date, end_date or now

        if not time_range:
            return None, None

        tr = time_range.lower()
        if tr == "today":
            start = datetime(now.year, now.month, now.day, tzinfo=UTC)
            return start, now
        elif tr == "yesterday":
            yesterday = now - timedelta(days=1)
            start = datetime(yesterday.year, yesterday.month, yesterday.day, tzinfo=UTC)
            end = datetime(now.year, now.month, now.day, tzinfo=UTC)
            return start, end
        elif tr == "7d":
            return now - timedelta(days=7), now
        elif tr == "30d":
            return now - timedelta(days=30), now
        elif tr == "90d":
            return now - timedelta(days=90), now
        elif tr in ("1y", "365d"):
            return now - timedelta(days=365), now
        elif tr in ("this_month", "month"):
            start = datetime(now.year, now.month, 1, tzinfo=UTC)
            return start, now
        elif tr == "last_month":
            first_day_current_month = datetime(now.year, now.month, 1, tzinfo=UTC)
            last_day_prev_month = first_day_current_month - timedelta(days=1)
            first_day_prev_month = datetime(last_day_prev_month.year, last_day_prev_month.month, 1, tzinfo=UTC)
            return first_day_prev_month, first_day_current_month
        elif tr in ("qtd", "this_quarter"):
            quarter_month = ((now.month - 1) // 3) * 3 + 1
            start = datetime(now.year, quarter_month, 1, tzinfo=UTC)
            return start, now
        elif tr in ("ytd", "this_year"):
            start = datetime(now.year, 1, 1, tzinfo=UTC)
            return start, now

        return None, None

    def resolve_effective_owner_id(
        self,
        member: WorkspaceMember | Any,
        requested_owner_id: UUID | None = None,
    ) -> UUID | None:
        """Apply strict RBAC scoping. Sales Executive can only see own records unless elevated."""
        role_name = getattr(getattr(member, "role", None), "name", "")
        is_elevated = role_name in (
            SystemRoles.SUPER_ADMIN,
            SystemRoles.WORKSPACE_ADMIN,
            SystemRoles.SALES_MANAGER,
        )

        if not is_elevated and hasattr(member, "id"):
            return member.id

        return requested_owner_id

    # ── 1. Executive Overview ──────────────────────────────────────────────────

    async def get_executive_overview(
        self,
        workspace_id: UUID,
        member: WorkspaceMember | Any = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        time_range: str | None = None,
        owner_id: UUID | None = None,
    ) -> ExecutiveOverviewResponse:
        """Fetch overall executive KPI summary for workspace."""
        start_dt, end_dt = self.parse_time_range(time_range, start_date, end_date)
        eff_owner_id = self.resolve_effective_owner_id(member, owner_id)

        # 1. Companies count
        comp_stmt = select(func.count(Company.id)).where(
            Company.workspace_id == workspace_id,
            Company.deleted_at.is_(None),
        )
        if eff_owner_id:
            comp_stmt = comp_stmt.where(Company.owner_member_id == eff_owner_id)
        if start_dt:
            comp_stmt = comp_stmt.where(Company.created_at >= start_dt)
        if end_dt:
            comp_stmt = comp_stmt.where(Company.created_at <= end_dt)
        comp_count = (await self.db.execute(comp_stmt)).scalar() or 0

        # 2. Contacts count
        cnt_stmt = select(func.count(Contact.id)).where(
            Contact.workspace_id == workspace_id,
            Contact.deleted_at.is_(None),
        )
        if eff_owner_id:
            cnt_stmt = cnt_stmt.where(Contact.owner_member_id == eff_owner_id)
        if start_dt:
            cnt_stmt = cnt_stmt.where(Contact.created_at >= start_dt)
        if end_dt:
            cnt_stmt = cnt_stmt.where(Contact.created_at <= end_dt)
        cnt_count = (await self.db.execute(cnt_stmt)).scalar() or 0

        # 3. Lead metrics
        lead_metrics = await self.get_lead_metrics(
            workspace_id, member=member, start_date=start_date, end_date=end_date, time_range=time_range, owner_id=owner_id
        )

        # 4. Deal metrics
        deal_metrics = await self.get_deal_metrics(
            workspace_id, member=member, start_date=start_date, end_date=end_date, time_range=time_range, owner_id=owner_id
        )

        # 5. Open / Total Pipeline value
        pipe_stmt = select(func.coalesce(func.sum(Deal.value), 0.0)).where(
            Deal.workspace_id == workspace_id,
            Deal.deleted_at.is_(None),
            Deal.status == "Open",
        )
        if eff_owner_id:
            pipe_stmt = pipe_stmt.where(Deal.owner_member_id == eff_owner_id)
        if start_dt:
            pipe_stmt = pipe_stmt.where(Deal.created_at >= start_dt)
        if end_dt:
            pipe_stmt = pipe_stmt.where(Deal.created_at <= end_dt)
        open_pipeline_val = float((await self.db.execute(pipe_stmt)).scalar() or 0.0)

        # 6. Tasks metrics
        now = datetime.now(UTC)
        task_pending_stmt = select(func.count(Task.id)).where(
            Task.workspace_id == workspace_id,
            Task.deleted_at.is_(None),
            Task.status != "Completed",
        )
        task_overdue_stmt = select(func.count(Task.id)).where(
            Task.workspace_id == workspace_id,
            Task.deleted_at.is_(None),
            Task.status != "Completed",
            Task.due_date.is_not(None),
            Task.due_date < now,
        )
        if eff_owner_id:
            task_pending_stmt = task_pending_stmt.where(Task.assigned_member_id == eff_owner_id)
            task_overdue_stmt = task_overdue_stmt.where(Task.assigned_member_id == eff_owner_id)
        if start_dt:
            task_pending_stmt = task_pending_stmt.where(Task.created_at >= start_dt)
            task_overdue_stmt = task_overdue_stmt.where(Task.created_at >= start_dt)
        if end_dt:
            task_pending_stmt = task_pending_stmt.where(Task.created_at <= end_dt)
            task_overdue_stmt = task_overdue_stmt.where(Task.created_at <= end_dt)

        pending_tasks = (await self.db.execute(task_pending_stmt)).scalar() or 0
        overdue_tasks = (await self.db.execute(task_overdue_stmt)).scalar() or 0

        # 7. Activities count
        act_stmt = select(func.count(Activity.id)).where(Activity.workspace_id == workspace_id)
        if eff_owner_id:
            act_stmt = act_stmt.where(Activity.actor_member_id == eff_owner_id)
        if start_dt:
            act_stmt = act_stmt.where(Activity.occurred_at >= start_dt)
        if end_dt:
            act_stmt = act_stmt.where(Activity.occurred_at <= end_dt)
        act_count = (await self.db.execute(act_stmt)).scalar() or 0

        return ExecutiveOverviewResponse(
            workspace_id=workspace_id,
            active_companies=comp_count,
            active_contacts=cnt_count,
            total_leads=lead_metrics.total_leads,
            lead_conversion_rate_percent=lead_metrics.conversion_rate_percent,
            open_deals_count=deal_metrics.open_deals,
            pipeline_total_value=round(open_pipeline_val, 2),
            pipeline_forecast_value=round(open_pipeline_val * 0.75, 2),
            deal_win_rate_percent=deal_metrics.win_rate_percent,
            pending_tasks=pending_tasks,
            overdue_tasks=overdue_tasks,
            recent_activities_count=act_count,
        )

    # ── 2. Lead Metrics ────────────────────────────────────────────────────────

    async def get_lead_metrics(
        self,
        workspace_id: UUID,
        member: WorkspaceMember | Any = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        time_range: str | None = None,
        owner_id: UUID | None = None,
    ) -> LeadMetricsResponse:
        """Calculate lead conversion funnel, status distributions, and velocity."""
        start_dt, end_dt = self.parse_time_range(time_range, start_date, end_date)
        eff_owner_id = self.resolve_effective_owner_id(member, owner_id)

        stmt = select(Lead).where(Lead.workspace_id == workspace_id, Lead.deleted_at.is_(None))
        if eff_owner_id:
            stmt = stmt.where(Lead.owner_member_id == eff_owner_id)
        if start_dt:
            stmt = stmt.where(Lead.created_at >= start_dt)
        if end_dt:
            stmt = stmt.where(Lead.created_at <= end_dt)

        res = await self.db.execute(stmt)
        leads = res.scalars().all()

        total = len(leads)
        if total == 0:
            return LeadMetricsResponse(
                total_leads=0,
                new_leads=0,
                contacted_leads=0,
                qualified_leads=0,
                converted_leads=0,
                unqualified_leads=0,
                conversion_rate_percent=0.0,
                avg_conversion_time_days=0.0,
            )

        converted_leads = [l for l in leads if l.converted_at is not None]
        converted = len(converted_leads)
        conv_rate = (converted / total) * 100.0

        # Calculate average conversion velocity (days from created_at to converted_at)
        total_conv_days = 0.0
        for l in converted_leads:
            if l.converted_at and l.created_at:
                delta = (l.converted_at - l.created_at).total_seconds() / 86400.0
                total_conv_days += max(0.1, delta)
        avg_conv_days = (total_conv_days / converted) if converted > 0 else 0.0

        return LeadMetricsResponse(
            total_leads=total,
            new_leads=sum(1 for l in leads if l.converted_at is None and l.priority != "Disqualified"),
            contacted_leads=sum(1 for l in leads if l.assigned_at is not None),
            qualified_leads=sum(1 for l in leads if l.priority in ("High", "Urgent")),
            converted_leads=converted,
            unqualified_leads=sum(1 for l in leads if l.priority == "Disqualified"),
            conversion_rate_percent=round(conv_rate, 2),
            avg_conversion_time_days=round(avg_conv_days, 1),
        )

    # ── 3. Deal Metrics ────────────────────────────────────────────────────────

    async def get_deal_metrics(
        self,
        workspace_id: UUID,
        member: WorkspaceMember | Any = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        time_range: str | None = None,
        owner_id: UUID | None = None,
    ) -> DealMetricsResponse:
        """Calculate deal revenue, win/loss ratio, and average deal size."""
        start_dt, end_dt = self.parse_time_range(time_range, start_date, end_date)
        eff_owner_id = self.resolve_effective_owner_id(member, owner_id)

        stmt = select(Deal).where(Deal.workspace_id == workspace_id, Deal.deleted_at.is_(None))
        if eff_owner_id:
            stmt = stmt.where(Deal.owner_member_id == eff_owner_id)
        if start_dt:
            stmt = stmt.where(Deal.created_at >= start_dt)
        if end_dt:
            stmt = stmt.where(Deal.created_at <= end_dt)

        res = await self.db.execute(stmt)
        deals = res.scalars().all()

        total = len(deals)
        if total == 0:
            return DealMetricsResponse(
                total_deals=0,
                open_deals=0,
                won_deals=0,
                lost_deals=0,
                total_won_revenue=0.0,
                total_lost_revenue=0.0,
                win_rate_percent=0.0,
                avg_deal_size=0.0,
            )

        open_deals = [d for d in deals if d.status == "Open"]
        won_deals = [d for d in deals if d.status == "Won"]
        lost_deals = [d for d in deals if d.status == "Lost"]

        total_won_val = sum(float(d.value) for d in won_deals)
        total_lost_val = sum(float(d.value) for d in lost_deals)
        closed_count = len(won_deals) + len(lost_deals)
        win_rate = (len(won_deals) / closed_count * 100.0) if closed_count > 0 else 0.0
        avg_size = (sum(float(d.value) for d in deals) / total) if total > 0 else 0.0

        return DealMetricsResponse(
            total_deals=total,
            open_deals=len(open_deals),
            won_deals=len(won_deals),
            lost_deals=len(lost_deals),
            total_won_revenue=round(total_won_val, 2),
            total_lost_revenue=round(total_lost_val, 2),
            win_rate_percent=round(win_rate, 2),
            avg_deal_size=round(avg_size, 2),
        )

    # ── 4. Pipeline Analytics ──────────────────────────────────────────────────

    async def get_pipeline_analytics(
        self,
        workspace_id: UUID,
        member: WorkspaceMember | Any = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        time_range: str | None = None,
        pipeline_id: UUID | None = None,
    ) -> list[PipelineAnalyticsResponse]:
        """Calculate pipeline stage distributions and probability-weighted forecasts."""
        start_dt, end_dt = self.parse_time_range(time_range, start_date, end_date)

        pipe_stmt = (
            select(Pipeline)
            .options(selectinload(Pipeline.stages))
            .where(Pipeline.workspace_id == workspace_id, Pipeline.is_active.is_(True))
        )
        if pipeline_id:
            pipe_stmt = pipe_stmt.where(Pipeline.id == pipeline_id)

        res = await self.db.execute(pipe_stmt)
        pipelines = res.scalars().all()

        analytics_list: list[PipelineAnalyticsResponse] = []

        for pipe in pipelines:
            deal_stmt = select(Deal).where(
                Deal.workspace_id == workspace_id,
                Deal.pipeline_id == pipe.id,
                Deal.deleted_at.is_(None),
            )
            if start_dt:
                deal_stmt = deal_stmt.where(Deal.created_at >= start_dt)
            if end_dt:
                deal_stmt = deal_stmt.where(Deal.created_at <= end_dt)

            deals_res = await self.db.execute(deal_stmt)
            deals = deals_res.scalars().all()

            stage_items: list[StageMetricItem] = []
            total_val = 0.0
            total_weighted = 0.0

            sorted_stages = sorted(pipe.stages, key=lambda s: s.sort_order)
            for st in sorted_stages:
                st_deals = [d for d in deals if d.stage_id == st.id]
                st_count = len(st_deals)
                st_val = sum(float(d.value) for d in st_deals)
                st_prob = float(st.probability)
                st_weighted = st_val * (st_prob / 100.0)

                total_val += st_val
                total_weighted += st_weighted

                stage_items.append(
                    StageMetricItem(
                        stage_id=st.id,
                        stage_name=st.name,
                        sort_order=st.sort_order,
                        deal_count=st_count,
                        total_value=round(st_val, 2),
                        probability=st_prob,
                        weighted_value=round(st_weighted, 2),
                    )
                )

            won_count = sum(1 for d in deals if d.status == "Won")
            closed_count = sum(1 for d in deals if d.status in ("Won", "Lost"))
            win_rate = (won_count / closed_count * 100.0) if closed_count > 0 else 0.0

            analytics_list.append(
                PipelineAnalyticsResponse(
                    pipeline_id=pipe.id,
                    pipeline_name=pipe.name,
                    total_deals=len(deals),
                    total_pipeline_value=round(total_val, 2),
                    total_weighted_forecast=round(total_weighted, 2),
                    overall_win_rate_percent=round(win_rate, 2),
                    stages=stage_items,
                )
            )

        return analytics_list

    # ── 5. Sales Performance & Leaderboard ────────────────────────────────────

    async def get_sales_performance(
        self,
        workspace_id: UUID,
        member: WorkspaceMember | Any = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        time_range: str | None = None,
    ) -> SalesPerformanceResponse:
        """Calculate revenue leaderboard, individual rep win rates, and sales cycle length."""
        start_dt, end_dt = self.parse_time_range(time_range, start_date, end_date)

        # 1. Fetch workspace members
        mem_stmt = (
            select(WorkspaceMember)
            .options(selectinload(WorkspaceMember.user), selectinload(WorkspaceMember.role))
            .where(WorkspaceMember.workspace_id == workspace_id, WorkspaceMember.deleted_at.is_(None))
        )
        members_res = await self.db.execute(mem_stmt)
        all_members = members_res.scalars().all()

        # 2. Fetch deals within timeframe
        deal_stmt = select(Deal).where(Deal.workspace_id == workspace_id, Deal.deleted_at.is_(None))
        if start_dt:
            deal_stmt = deal_stmt.where(Deal.created_at >= start_dt)
        if end_dt:
            deal_stmt = deal_stmt.where(Deal.created_at <= end_dt)
        deals = (await self.db.execute(deal_stmt)).scalars().all()

        # 3. Fetch activities within timeframe
        act_stmt = select(Activity).where(Activity.workspace_id == workspace_id)
        if start_dt:
            act_stmt = act_stmt.where(Activity.occurred_at >= start_dt)
        if end_dt:
            act_stmt = act_stmt.where(Activity.occurred_at <= end_dt)
        activities = (await self.db.execute(act_stmt)).scalars().all()

        total_won_revenue = 0.0
        total_deals_won = 0
        cycle_durations: list[float] = []

        leaderboard: list[RepLeaderboardItem] = []

        for m in all_members:
            m_deals = [d for d in deals if d.owner_member_id == m.id]
            m_won = [d for d in m_deals if d.status == "Won"]
            m_open = [d for d in m_deals if d.status == "Open"]
            m_lost = [d for d in m_deals if d.status == "Lost"]

            m_won_val = sum(float(d.value) for d in m_won)
            m_closed = len(m_won) + len(m_lost)
            m_win_rate = (len(m_won) / m_closed * 100.0) if m_closed > 0 else 0.0

            m_activities = sum(1 for a in activities if a.actor_member_id == m.id)

            total_won_revenue += m_won_val
            total_deals_won += len(m_won)

            for d in m_won:
                if d.created_at and d.updated_at:
                    dur = max(0.5, (d.updated_at - d.created_at).total_seconds() / 86400.0)
                    cycle_durations.append(dur)

            user_name = f"{m.user.first_name} {m.user.last_name}".strip() if m.user else "Unknown Member"
            leaderboard.append(
                RepLeaderboardItem(
                    member_id=m.id,
                    rep_name=user_name,
                    won_revenue=round(m_won_val, 2),
                    deals_won=len(m_won),
                    deals_open=len(m_open),
                    win_rate_percent=round(m_win_rate, 2),
                    activities_count=m_activities,
                )
            )

        leaderboard.sort(key=lambda r: r.won_revenue, reverse=True)

        all_closed = sum(1 for d in deals if d.status in ("Won", "Lost"))
        overall_win_rate = (total_deals_won / all_closed * 100.0) if all_closed > 0 else 0.0
        avg_size = (total_won_revenue / total_deals_won) if total_deals_won > 0 else 0.0
        avg_cycle = (sum(cycle_durations) / len(cycle_durations)) if cycle_durations else 0.0

        return SalesPerformanceResponse(
            total_won_revenue=round(total_won_revenue, 2),
            total_deals_won=total_deals_won,
            avg_deal_size=round(avg_size, 2),
            win_rate_percent=round(overall_win_rate, 2),
            avg_sales_cycle_days=round(avg_cycle, 1),
            leaderboard=leaderboard,
        )

    # ── 6. Activity & Productivity Analytics ───────────────────────────────────

    async def get_activity_analytics(
        self,
        workspace_id: UUID,
        member: WorkspaceMember | Any = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        time_range: str | None = None,
    ) -> ActivityAnalyticsResponse:
        """Calculate activity breakdown and task completion productivity."""
        start_dt, end_dt = self.parse_time_range(time_range, start_date, end_date)

        # 1. Activities by type
        act_stmt = (
            select(ActivityType.name, func.count(Activity.id))
            .join(ActivityType, Activity.activity_type_id == ActivityType.id)
            .where(Activity.workspace_id == workspace_id)
        )
        if start_dt:
            act_stmt = act_stmt.where(Activity.occurred_at >= start_dt)
        if end_dt:
            act_stmt = act_stmt.where(Activity.occurred_at <= end_dt)

        act_stmt = act_stmt.group_by(ActivityType.name)
        act_rows = (await self.db.execute(act_stmt)).all()

        act_items = [ActivityTypeMetricItem(activity_type=r[0], count=r[1]) for r in act_rows]
        total_acts = sum(item.count for item in act_items)

        # 2. Tasks productivity
        now = datetime.now(UTC)
        task_stmt = select(Task).where(Task.workspace_id == workspace_id, Task.deleted_at.is_(None))
        if start_dt:
            task_stmt = task_stmt.where(Task.created_at >= start_dt)
        if end_dt:
            task_stmt = task_stmt.where(Task.created_at <= end_dt)

        tasks = (await self.db.execute(task_stmt)).scalars().all()
        created_count = len(tasks)
        completed_count = sum(1 for t in tasks if t.status == "Completed")
        overdue_count = sum(
            1 for t in tasks if t.status != "Completed" and t.due_date and t.due_date < now
        )
        completion_rate = (completed_count / created_count * 100.0) if created_count > 0 else 0.0

        return ActivityAnalyticsResponse(
            total_activities=total_acts,
            activities_by_type=act_items,
            tasks_created=created_count,
            tasks_completed=completed_count,
            tasks_overdue=overdue_count,
            task_completion_rate_percent=round(completion_rate, 2),
        )

    # ── 7. Workflow Automation Telemetry ───────────────────────────────────────

    async def get_automation_analytics(
        self,
        workspace_id: UUID,
        member: WorkspaceMember | Any = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        time_range: str | None = None,
    ) -> AutomationAnalyticsResponse:
        """Calculate workflow automation execution metrics and error rates."""
        start_dt, end_dt = self.parse_time_range(time_range, start_date, end_date)

        # 1. Automation rules
        rules_stmt = select(AutomationRule).where(
            AutomationRule.workspace_id == workspace_id,
            AutomationRule.deleted_at.is_(None),
        )
        rules = (await self.db.execute(rules_stmt)).scalars().all()
        total_rules = len(rules)
        active_rules = sum(1 for r in rules if r.is_active)

        # 2. Automation runs
        runs_stmt = select(AutomationRun).where(AutomationRun.workspace_id == workspace_id)
        if start_dt:
            runs_stmt = runs_stmt.where(AutomationRun.started_at >= start_dt)
        if end_dt:
            runs_stmt = runs_stmt.where(AutomationRun.started_at <= end_dt)

        runs = (await self.db.execute(runs_stmt)).scalars().all()
        total_runs = len(runs)
        succ_runs = sum(1 for r in runs if r.status == "success")
        fail_runs = sum(1 for r in runs if r.status in ("failed", "error"))
        succ_rate = (succ_runs / total_runs * 100.0) if total_runs > 0 else 100.0

        durations = [r.duration_ms for r in runs if r.duration_ms is not None]
        avg_dur = (sum(durations) / len(durations)) if durations else 0.0

        # Top workflows
        top_workflows = [
            TopWorkflowMetricItem(
                rule_id=r.id,
                rule_name=r.name,
                total_runs=r.total_runs,
                success_rate_percent=round((r.successful_runs / r.total_runs * 100.0), 2)
                if r.total_runs > 0
                else 100.0,
            )
            for r in sorted(rules, key=lambda x: x.total_runs, reverse=True)[:5]
        ]

        return AutomationAnalyticsResponse(
            total_rules=total_rules,
            active_rules=active_rules,
            total_runs=total_runs,
            successful_runs=succ_runs,
            failed_runs=fail_runs,
            success_rate_percent=round(succ_rate, 2),
            avg_duration_ms=round(avg_dur, 2),
            top_workflows=top_workflows,
        )

    # ── 8. AI Subsystem Telemetry & Cost ───────────────────────────────────────

    async def get_ai_analytics(
        self,
        workspace_id: UUID,
        member: WorkspaceMember | Any = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        time_range: str | None = None,
    ) -> AIAnalyticsResponse:
        """Calculate real token usage, cost distribution, and latency from persisted records."""
        start_dt, end_dt = self.parse_time_range(time_range, start_date, end_date)

        # Query AI usage records
        usage_stmt = select(AIUsageMeter).where(AIUsageMeter.workspace_id == workspace_id)
        if start_dt:
            usage_stmt = usage_stmt.where(AIUsageMeter.created_at >= start_dt)
        if end_dt:
            usage_stmt = usage_stmt.where(AIUsageMeter.created_at <= end_dt)

        records = (await self.db.execute(usage_stmt)).scalars().all()

        total_reqs = len(records)
        total_tokens = sum(r.prompt_tokens + r.completion_tokens for r in records)
        total_cost = sum(float(r.estimated_cost_usd) for r in records)

        # Group by provider/model
        models_map: dict[tuple[str, str], dict[str, Any]] = {}
        for r in records:
            key = (r.provider, r.model)
            if key not in models_map:
                models_map[key] = {"requests": 0, "tokens": 0, "cost": 0.0}
            models_map[key]["requests"] += 1
            models_map[key]["tokens"] += r.prompt_tokens + r.completion_tokens
            models_map[key]["cost"] += float(r.estimated_cost_usd)

        usage_items = [
            AIModelSpendItem(
                provider=k[0],
                model=k[1],
                request_count=v["requests"],
                total_tokens=v["tokens"],
                total_cost_usd=round(v["cost"], 4),
            )
            for k, v in models_map.items()
        ]

        # Fetch configured budget
        sett_stmt = select(AIProviderSetting).where(AIProviderSetting.workspace_id == workspace_id)
        sett = (await self.db.execute(sett_stmt)).scalar_one_or_none()
        budget = float(getattr(sett, "monthly_token_budget", 1000000)) / 1000.0 * 0.00015

        return AIAnalyticsResponse(
            total_requests=total_reqs,
            total_tokens_consumed=total_tokens,
            total_cost_usd=round(total_cost, 4),
            active_budget_usd=round(budget, 2),
            usage_by_model=usage_items,
        )

    # ── 9. Accounts & Growth Analytics ─────────────────────────────────────────

    async def get_account_analytics(
        self,
        workspace_id: UUID,
        member: WorkspaceMember | Any = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        time_range: str | None = None,
    ) -> AccountAnalyticsResponse:
        """Calculate customer account growth and top accounts by revenue."""
        start_dt, end_dt = self.parse_time_range(time_range, start_date, end_date)

        # 1. Total companies & contacts
        comp_stmt = select(Company).options(selectinload(Company.deals), selectinload(Company.contacts)).where(
            Company.workspace_id == workspace_id,
            Company.deleted_at.is_(None),
        )
        companies = (await self.db.execute(comp_stmt)).scalars().all()

        cnt_count_stmt = select(func.count(Contact.id)).where(
            Contact.workspace_id == workspace_id,
            Contact.deleted_at.is_(None),
        )
        total_contacts = (await self.db.execute(cnt_count_stmt)).scalar() or 0

        new_comp_stmt = select(func.count(Company.id)).where(
            Company.workspace_id == workspace_id,
            Company.deleted_at.is_(None),
        )
        if start_dt:
            new_comp_stmt = new_comp_stmt.where(Company.created_at >= start_dt)
        if end_dt:
            new_comp_stmt = new_comp_stmt.where(Company.created_at <= end_dt)
        new_comp_period = (await self.db.execute(new_comp_stmt)).scalar() or 0

        top_accounts: list[TopAccountItem] = []
        for comp in companies:
            won_deals = [d for d in comp.deals if d.status == "Won"]
            open_deals = [d for d in comp.deals if d.status == "Open"]
            rev = sum(float(d.value) for d in won_deals)

            top_accounts.append(
                TopAccountItem(
                    company_id=comp.id,
                    company_name=comp.name,
                    total_revenue=round(rev, 2),
                    open_deals_count=len(open_deals),
                    contacts_count=len(comp.contacts),
                )
            )

        top_accounts.sort(key=lambda a: a.total_revenue, reverse=True)

        return AccountAnalyticsResponse(
            active_companies=len(companies),
            active_contacts=total_contacts,
            new_companies_period=new_comp_period,
            top_accounts=top_accounts[:10],
        )

    # ── 9b. Product Catalog Analytics ──────────────────────────────────────────

    async def get_product_analytics(
        self,
        workspace_id: UUID,
        member: WorkspaceMember | Any = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        time_range: str | None = None,
        owner_id: UUID | None = None,
        pipeline_id: UUID | None = None,
    ) -> ProductAnalyticsResponse:
        """Aggregate product catalog sales, top products, category distribution, and units sold."""
        start_dt, end_dt = self.parse_time_range(time_range, start_date, end_date)

        stmt = (
            select(DealLineItem)
            .join(Deal, DealLineItem.deal_id == Deal.id)
            .options(selectinload(DealLineItem.product))
            .where(
                DealLineItem.workspace_id == workspace_id,
                Deal.deleted_at.is_(None),
            )
        )
        if start_dt:
            stmt = stmt.where(DealLineItem.created_at >= start_dt)
        if end_dt:
            stmt = stmt.where(DealLineItem.created_at <= end_dt)
        if owner_id:
            stmt = stmt.where(Deal.owner_member_id == owner_id)
        if pipeline_id:
            stmt = stmt.where(Deal.pipeline_id == pipeline_id)

        if member and hasattr(member, "role") and member.role and getattr(member.role, "name", "") == "Sales Executive":
            stmt = stmt.where(Deal.owner_member_id == member.id)

        line_items = (await self.db.execute(stmt)).scalars().all()

        total_revenue = 0.0
        total_units = 0.0

        prod_map: dict[str, dict[str, Any]] = {}
        category_map: dict[str, dict[str, float]] = {}

        for item in line_items:
            p_name = item.product_name_snapshot
            rev = float(item.total)
            units = float(item.quantity)
            disc = float(item.discount_percent)

            total_revenue += rev
            total_units += units

            cat = item.product.category if (item.product and item.product.category) else "Standard"
            if cat not in category_map:
                category_map[cat] = {"revenue": 0.0, "units": 0.0}
            category_map[cat]["revenue"] += rev
            category_map[cat]["units"] += units

            if p_name not in prod_map:
                prod_map[p_name] = {
                    "product_id": item.product_id,
                    "product_name": p_name,
                    "sku": item.sku_snapshot,
                    "units": 0.0,
                    "revenue": 0.0,
                    "deals": set(),
                    "discounts": [],
                }
            prod_map[p_name]["units"] += units
            prod_map[p_name]["revenue"] += rev
            prod_map[p_name]["deals"].add(item.deal_id)
            prod_map[p_name]["discounts"].append(disc)

        top_products: list[ProductPerformanceItem] = []
        for p_name, p_data in prod_map.items():
            avg_disc = sum(p_data["discounts"]) / len(p_data["discounts"]) if p_data["discounts"] else 0.0
            top_products.append(
                ProductPerformanceItem(
                    product_id=p_data["product_id"],
                    product_name=p_data["product_name"],
                    sku=p_data["sku"],
                    total_units_sold=round(p_data["units"], 2),
                    total_revenue=round(p_data["revenue"], 2),
                    deals_count=len(p_data["deals"]),
                    avg_discount_percent=round(avg_disc, 2),
                )
            )
        top_products.sort(key=lambda x: x.total_revenue, reverse=True)

        categories: list[ProductCategoryItem] = [
            ProductCategoryItem(category=k, total_revenue=round(v["revenue"], 2), units_sold=round(v["units"], 2))
            for k, v in category_map.items()
        ]
        categories.sort(key=lambda x: x.total_revenue, reverse=True)

        avg_price = (total_revenue / total_units) if total_units > 0 else 0.0

        return ProductAnalyticsResponse(
            total_revenue=round(total_revenue, 2),
            total_units_sold=round(total_units, 2),
            avg_selling_price=round(avg_price, 2),
            top_products=top_products[:15],
            category_breakdown=categories,
        )

    # ── 10. Custom Dashboards CRUD ─────────────────────────────────────────────

    async def list_dashboards(self, workspace_id: UUID) -> list[DashboardResponse]:
        """List all custom analytics dashboards for a workspace."""
        stmt = (
            select(AnalyticsDashboard)
            .options(selectinload(AnalyticsDashboard.widgets))
            .where(AnalyticsDashboard.workspace_id == workspace_id, AnalyticsDashboard.deleted_at.is_(None))
            .order_by(AnalyticsDashboard.is_default.desc(), AnalyticsDashboard.created_at.asc())
        )
        dashboards = (await self.db.execute(stmt)).scalars().all()

        return [
            DashboardResponse(
                id=d.id,
                workspace_id=d.workspace_id,
                created_by_member_id=d.created_by_member_id,
                name=d.name,
                description=d.description,
                is_default=d.is_default,
                layout_json=d.layout_json,
                widgets=[
                    DashboardWidgetSchema(
                        id=w.id,
                        widget_type=w.widget_type,
                        title=w.title,
                        position_x=w.position_x,
                        position_y=w.position_y,
                        width=w.width,
                        height=w.height,
                        config_json=w.config_json,
                    )
                    for w in d.widgets
                ],
                created_at=d.created_at,
                updated_at=d.updated_at,
            )
            for d in dashboards
        ]

    async def create_dashboard(
        self,
        workspace_id: UUID,
        member_id: UUID,
        data: DashboardCreate,
    ) -> DashboardResponse:
        """Create a new custom dashboard with initial widgets."""
        dashboard = AnalyticsDashboard(
            workspace_id=workspace_id,
            created_by_member_id=member_id,
            name=data.name,
            description=data.description,
            is_default=data.is_default,
            layout_json=data.layout_json,
        )
        self.db.add(dashboard)
        await self.db.flush()

        for w in data.widgets:
            widget = AnalyticsDashboardWidget(
                dashboard_id=dashboard.id,
                widget_type=w.widget_type,
                title=w.title,
                position_x=w.position_x,
                position_y=w.position_y,
                width=w.width,
                height=w.height,
                config_json=w.config_json,
            )
            self.db.add(widget)

        await self.db.commit()
        await self.db.refresh(dashboard)

        stmt = (
            select(AnalyticsDashboard)
            .options(selectinload(AnalyticsDashboard.widgets))
            .where(AnalyticsDashboard.id == dashboard.id)
        )
        d = (await self.db.execute(stmt)).scalar_one()

        return DashboardResponse(
            id=d.id,
            workspace_id=d.workspace_id,
            created_by_member_id=d.created_by_member_id,
            name=d.name,
            description=d.description,
            is_default=d.is_default,
            layout_json=d.layout_json,
            widgets=[
                DashboardWidgetSchema(
                    id=w.id,
                    widget_type=w.widget_type,
                    title=w.title,
                    position_x=w.position_x,
                    position_y=w.position_y,
                    width=w.width,
                    height=w.height,
                    config_json=w.config_json,
                )
                for w in d.widgets
            ],
            created_at=d.created_at,
            updated_at=d.updated_at,
        )

    async def delete_dashboard(self, workspace_id: UUID, dashboard_id: UUID) -> bool:
        """Soft-delete a custom dashboard."""
        stmt = select(AnalyticsDashboard).where(
            AnalyticsDashboard.workspace_id == workspace_id,
            AnalyticsDashboard.id == dashboard_id,
            AnalyticsDashboard.deleted_at.is_(None),
        )
        dash = (await self.db.execute(stmt)).scalar_one_or_none()
        if not dash:
            return False

        dash.deleted_at = datetime.now(UTC)
        await self.db.commit()
        return True

    # ── 11. Saved Reports CRUD ─────────────────────────────────────────────────

    async def list_saved_reports(self, workspace_id: UUID) -> list[SavedReportResponse]:
        """List all saved reports for a workspace."""
        stmt = (
            select(SavedReport)
            .where(SavedReport.workspace_id == workspace_id, SavedReport.deleted_at.is_(None))
            .order_by(SavedReport.created_at.desc())
        )
        reports = (await self.db.execute(stmt)).scalars().all()

        return [
            SavedReportResponse(
                id=r.id,
                workspace_id=r.workspace_id,
                created_by_member_id=r.created_by_member_id,
                name=r.name,
                description=r.description,
                entity_type=r.entity_type,
                metrics_json=r.metrics_json,
                dimensions_json=r.dimensions_json,
                filters_json=r.filters_json,
                created_at=r.created_at,
                updated_at=r.updated_at,
            )
            for r in reports
        ]

    async def create_saved_report(
        self,
        workspace_id: UUID,
        member_id: UUID,
        data: SavedReportCreate,
    ) -> SavedReportResponse:
        """Create and save a report definition."""
        report = SavedReport(
            workspace_id=workspace_id,
            created_by_member_id=member_id,
            name=data.name,
            description=data.description,
            entity_type=data.entity_type,
            metrics_json=data.metrics_json,
            dimensions_json=data.dimensions_json,
            filters_json=data.filters_json,
        )
        self.db.add(report)
        await self.db.commit()
        await self.db.refresh(report)

        return SavedReportResponse(
            id=report.id,
            workspace_id=report.workspace_id,
            created_by_member_id=report.created_by_member_id,
            name=report.name,
            description=report.description,
            entity_type=report.entity_type,
            metrics_json=report.metrics_json,
            dimensions_json=report.dimensions_json,
            filters_json=report.filters_json,
            created_at=report.created_at,
            updated_at=report.updated_at,
        )

    async def delete_saved_report(self, workspace_id: UUID, report_id: UUID) -> bool:
        """Soft-delete a saved report."""
        stmt = select(SavedReport).where(
            SavedReport.workspace_id == workspace_id,
            SavedReport.id == report_id,
            SavedReport.deleted_at.is_(None),
        )
        rep = (await self.db.execute(stmt)).scalar_one_or_none()
        if not rep:
            return False

        rep.deleted_at = datetime.now(UTC)
        await self.db.commit()
        return True

    # ── 12. CSV Export Engine ──────────────────────────────────────────────────

    async def export_csv(
        self,
        workspace_id: UUID,
        report_type: str,
        member: WorkspaceMember | Any = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        time_range: str | None = None,
    ) -> str:
        """Generate structured CSV dataset for the requested analytics report."""
        output = io.StringIO()
        writer = csv.writer(output)

        rt = report_type.lower()
        if rt == "sales":
            data = await self.get_sales_performance(
                workspace_id, member=member, start_date=start_date, end_date=end_date, time_range=time_range
            )
            writer.writerow(["Representative", "Won Revenue", "Deals Won", "Deals Open", "Win Rate %", "Activities"])
            for r in data.leaderboard:
                writer.writerow([r.rep_name, f"{r.won_revenue:.2f}", r.deals_won, r.deals_open, f"{r.win_rate_percent:.2f}%", r.activities_count])

        elif rt == "leads":
            start_dt, end_dt = self.parse_time_range(time_range, start_date, end_date)
            eff_owner_id = self.resolve_effective_owner_id(member)
            stmt = select(Lead).where(Lead.workspace_id == workspace_id, Lead.deleted_at.is_(None))
            if eff_owner_id:
                stmt = stmt.where(Lead.owner_member_id == eff_owner_id)
            if start_dt:
                stmt = stmt.where(Lead.created_at >= start_dt)
            if end_dt:
                stmt = stmt.where(Lead.created_at <= end_dt)

            leads = (await self.db.execute(stmt)).scalars().all()
            writer.writerow(["Lead Name", "Company", "Email", "Estimated Value", "Priority", "Status", "Created At"])
            for l in leads:
                status = "Converted" if l.converted_at else "Open"
                name = f"{l.first_name} {l.last_name or ''}".strip()
                writer.writerow([name, l.company_name or "", l.email or "", f"{l.estimated_value or 0:.2f}", l.priority, status, l.created_at.isoformat() if l.created_at else ""])

        elif rt == "deals":
            start_dt, end_dt = self.parse_time_range(time_range, start_date, end_date)
            eff_owner_id = self.resolve_effective_owner_id(member)
            stmt = select(Deal).where(Deal.workspace_id == workspace_id, Deal.deleted_at.is_(None))
            if eff_owner_id:
                stmt = stmt.where(Deal.owner_member_id == eff_owner_id)
            if start_dt:
                stmt = stmt.where(Deal.created_at >= start_dt)
            if end_dt:
                stmt = stmt.where(Deal.created_at <= end_dt)

            deals = (await self.db.execute(stmt)).scalars().all()
            writer.writerow(["Deal Name", "Value", "Status", "Expected Close", "Created At"])
            for d in deals:
                writer.writerow([d.name, f"{d.value:.2f}", d.status, d.expected_close_date.isoformat() if d.expected_close_date else "", d.created_at.isoformat() if d.created_at else ""])

        elif rt == "accounts":
            data = await self.get_account_analytics(
                workspace_id, member=member, start_date=start_date, end_date=end_date, time_range=time_range
            )
            writer.writerow(["Account / Company", "Total Revenue", "Open Deals", "Contacts Count"])
            for a in data.top_accounts:
                writer.writerow([a.company_name, f"{a.total_revenue:.2f}", a.open_deals_count, a.contacts_count])

        elif rt == "ai":
            data = await self.get_ai_analytics(
                workspace_id, member=member, start_date=start_date, end_date=end_date, time_range=time_range
            )
            writer.writerow(["Provider", "Model", "Requests", "Tokens Consumed", "Estimated Cost USD"])
            for u in data.usage_by_model:
                writer.writerow([u.provider, u.model, u.request_count, u.total_tokens, f"${u.total_cost_usd:.4f}"])

        elif rt == "products":
            data = await self.get_product_analytics(
                workspace_id, member=member, start_date=start_date, end_date=end_date, time_range=time_range
            )
            writer.writerow(["Product Name", "SKU", "Units Sold", "Total Revenue", "Deals Count", "Avg Discount %"])
            for p in data.top_products:
                writer.writerow([p.product_name, p.sku or "", f"{p.total_units_sold:.2f}", f"{p.total_revenue:.2f}", p.deals_count, f"{p.avg_discount_percent:.2f}%"])

        else:
            # Fallback overview
            ov = await self.get_executive_overview(
                workspace_id, member=member, start_date=start_date, end_date=end_date, time_range=time_range
            )
            writer.writerow(["Metric", "Value"])
            writer.writerow(["Active Companies", ov.active_companies])
            writer.writerow(["Active Contacts", ov.active_contacts])
            writer.writerow(["Total Leads", ov.total_leads])
            writer.writerow(["Lead Conversion Rate", f"{ov.lead_conversion_rate_percent:.2f}%"])
            writer.writerow(["Open Deals", ov.open_deals_count])
            writer.writerow(["Pipeline Total Value", f"{ov.pipeline_total_value:.2f}"])
            writer.writerow(["Deal Win Rate", f"{ov.deal_win_rate_percent:.2f}%"])
            writer.writerow(["Pending Tasks", ov.pending_tasks])

        return output.getvalue()


__all__ = ["AnalyticsService"]
