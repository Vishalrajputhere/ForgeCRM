"""
ForgeCRM API — Analytics & Reporting Schemas

Request and Response DTOs for executive dashboards, pipeline win rates,
lead conversion metrics, deal revenue forecasts, and sales velocity.

Documentation: docs/03_Backend/302_API_DESIGN.md
"""

from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel


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


__all__ = [
    "DealMetricsResponse",
    "ExecutiveOverviewResponse",
    "LeadMetricsResponse",
    "PipelineAnalyticsResponse",
    "StageMetricItem",
]
