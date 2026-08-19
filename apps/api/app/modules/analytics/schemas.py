"""
ForgeCRM API — Analytics & Reporting Schemas

Request and Response DTOs for executive dashboards, sales leaderboards, pipeline win rates,
lead conversion funnel, activity productivity, automation telemetry, AI cost tracking,
custom dashboards, saved reports, and CSV export.

Documentation: docs/03_Backend/302_API_DESIGN.md
"""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class StageMetricItem(BaseModel):
    """Pipeline stage metric DTO."""

    stage_id: UUID
    stage_name: str
    sort_order: int
    deal_count: int
    total_value: float
    probability: float
    weighted_value: float


class PipelineAnalyticsResponse(BaseModel):
    """Pipeline performance analytics DTO."""

    pipeline_id: UUID
    pipeline_name: str
    total_deals: int
    total_pipeline_value: float
    total_weighted_forecast: float
    overall_win_rate_percent: float
    stages: list[StageMetricItem]


class LeadMetricsResponse(BaseModel):
    """Lead conversion analytics DTO."""

    total_leads: int
    new_leads: int
    contacted_leads: int
    qualified_leads: int
    converted_leads: int
    unqualified_leads: int
    conversion_rate_percent: float
    avg_conversion_time_days: float


class DealMetricsResponse(BaseModel):
    """Deal revenue and velocity analytics DTO."""

    total_deals: int
    open_deals: int
    won_deals: int
    lost_deals: int
    total_won_revenue: float
    total_lost_revenue: float
    win_rate_percent: float
    avg_deal_size: float


class ExecutiveOverviewResponse(BaseModel):
    """Full executive KPI overview DTO."""

    workspace_id: UUID
    active_companies: int
    active_contacts: int
    total_leads: int
    lead_conversion_rate_percent: float
    open_deals_count: int
    pipeline_total_value: float
    pipeline_forecast_value: float
    deal_win_rate_percent: float
    pending_tasks: int
    overdue_tasks: int
    recent_activities_count: int


# ── Phase 8.5 Domain Schemas ───────────────────────────────────────────────────


class RepLeaderboardItem(BaseModel):
    """Sales representative performance DTO."""

    member_id: UUID
    rep_name: str
    won_revenue: float
    deals_won: int
    deals_open: int
    win_rate_percent: float
    activities_count: int


class SalesPerformanceResponse(BaseModel):
    """Workspace sales performance and leaderboard DTO."""

    total_won_revenue: float
    total_deals_won: int
    avg_deal_size: float
    win_rate_percent: float
    avg_sales_cycle_days: float
    leaderboard: list[RepLeaderboardItem]


class ActivityTypeMetricItem(BaseModel):
    """Activity breakdown by type."""

    activity_type: str
    count: int


class ActivityAnalyticsResponse(BaseModel):
    """Activity volume and task productivity DTO."""

    total_activities: int
    activities_by_type: list[ActivityTypeMetricItem]
    tasks_created: int
    tasks_completed: int
    tasks_overdue: int
    task_completion_rate_percent: float


class TopWorkflowMetricItem(BaseModel):
    """Top automated workflow rule metric DTO."""

    rule_id: UUID
    rule_name: str
    total_runs: int
    success_rate_percent: float


class AutomationAnalyticsResponse(BaseModel):
    """Workflow automation execution telemetry DTO."""

    total_rules: int
    active_rules: int
    total_runs: int
    successful_runs: int
    failed_runs: int
    success_rate_percent: float
    avg_duration_ms: float
    top_workflows: list[TopWorkflowMetricItem]


class AIModelSpendItem(BaseModel):
    """AI spend DTO per provider/model."""

    provider: str
    model: str
    request_count: int
    total_tokens: int
    total_cost_usd: float


class AIAnalyticsResponse(BaseModel):
    """AI telemetry and spend analytics DTO."""

    total_requests: int
    total_tokens_consumed: int
    total_cost_usd: float
    active_budget_usd: float
    usage_by_model: list[AIModelSpendItem]


class TopAccountItem(BaseModel):
    """Top customer account by deal revenue DTO."""

    company_id: UUID
    company_name: str
    total_revenue: float
    open_deals_count: int
    contacts_count: int


class AccountAnalyticsResponse(BaseModel):
    """Customer account intelligence analytics DTO."""

    active_companies: int
    active_contacts: int
    new_companies_period: int
    top_accounts: list[TopAccountItem]


# ── Custom Dashboards & Saved Reports Schemas ─────────────────────────────────


class DashboardWidgetSchema(BaseModel):
    """Dashboard widget layout & config DTO."""

    id: UUID | None = None
    widget_type: str
    title: str
    position_x: int = 0
    position_y: int = 0
    width: int = 1
    height: int = 1
    config_json: dict[str, Any] = Field(default_factory=dict)


class DashboardCreate(BaseModel):
    """Payload to create a custom analytics dashboard."""

    name: str
    description: str | None = None
    is_default: bool = False
    layout_json: dict[str, Any] = Field(default_factory=dict)
    widgets: list[DashboardWidgetSchema] = Field(default_factory=list)


class DashboardResponse(BaseModel):
    """Custom dashboard response DTO."""

    id: UUID
    workspace_id: UUID
    created_by_member_id: UUID
    name: str
    description: str | None = None
    is_default: bool
    layout_json: dict[str, Any]
    widgets: list[DashboardWidgetSchema]
    created_at: datetime
    updated_at: datetime


class SavedReportCreate(BaseModel):
    """Payload to create a saved report."""

    name: str
    description: str | None = None
    entity_type: str  # deal, lead, activity, automation, ai
    metrics_json: list[str] = Field(default_factory=list)
    dimensions_json: list[str] = Field(default_factory=list)
    filters_json: dict[str, Any] = Field(default_factory=dict)


class SavedReportResponse(BaseModel):
    """Saved report response DTO."""

    id: UUID
    workspace_id: UUID
    created_by_member_id: UUID
    name: str
    description: str | None = None
    entity_type: str
    metrics_json: list[str]
    dimensions_json: list[str]
    filters_json: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class AnalyticsExportRequest(BaseModel):
    """Request payload to export analytics datasets as CSV."""

    report_type: str  # deals, leads, sales, activities, automation, ai, accounts, products
    start_date: datetime | None = None
    end_date: datetime | None = None
    time_range: str | None = "30d"
    filters: dict[str, Any] = Field(default_factory=dict)


class ProductPerformanceItem(BaseModel):
    """Product performance breakdown item."""

    product_id: UUID | None = None
    product_name: str
    sku: str | None = None
    total_units_sold: float
    total_revenue: float
    deals_count: int
    avg_discount_percent: float


class ProductCategoryItem(BaseModel):
    """Product category analytics breakdown."""

    category: str
    total_revenue: float
    units_sold: float


class ProductAnalyticsResponse(BaseModel):
    """Product catalog analytics DTO."""

    total_revenue: float
    total_units_sold: float
    avg_selling_price: float
    top_products: list[ProductPerformanceItem]
    category_breakdown: list[ProductCategoryItem]


__all__ = [
    "AIAnalyticsResponse",
    "AIModelSpendItem",
    "AccountAnalyticsResponse",
    "ActivityAnalyticsResponse",
    "ActivityTypeMetricItem",
    "AnalyticsExportRequest",
    "AutomationAnalyticsResponse",
    "DashboardCreate",
    "DashboardResponse",
    "DashboardWidgetSchema",
    "DealMetricsResponse",
    "ExecutiveOverviewResponse",
    "LeadMetricsResponse",
    "PipelineAnalyticsResponse",
    "ProductAnalyticsResponse",
    "ProductCategoryItem",
    "ProductPerformanceItem",
    "RepLeaderboardItem",
    "SalesPerformanceResponse",
    "SavedReportCreate",
    "SavedReportResponse",
    "StageMetricItem",
    "TopAccountItem",
    "TopWorkflowMetricItem",
]
