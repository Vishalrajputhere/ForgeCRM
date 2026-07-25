"""
ForgeCRM API — Analytics Domain Routes

FastAPI router for executive KPI summaries, lead conversion metrics,
deal revenue forecasting, and pipeline performance reporting.

Documentation: docs/03_Backend/302_API_DESIGN.md
"""

from __future__ import annotations

from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import (
    get_current_workspace_id,
    get_current_workspace_member,
)
from app.db.session import get_db_session
from app.modules.analytics.schemas import (
    DealMetricsResponse,
    ExecutiveOverviewResponse,
    LeadMetricsResponse,
    PipelineAnalyticsResponse,
)
from app.modules.analytics.service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics & BI Reporting"])

WorkspaceIdDep = Annotated[UUID, Depends(get_current_workspace_id)]
WorkspaceMemberDep = Annotated[Any, Depends(get_current_workspace_member)]


@router.get(
    "/overview",
    response_model=ExecutiveOverviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Executive Overview KPIs",
    description="Returns high-level executive dashboard KPI metrics.",
)
async def get_executive_overview(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> ExecutiveOverviewResponse:
    service = AnalyticsService(db)
    return await service.get_executive_overview(workspace_id)


@router.get(
    "/leads",
    response_model=LeadMetricsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Lead Funnel Metrics",
    description="Returns lead conversion funnel and status distribution metrics.",
)
async def get_lead_metrics(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> LeadMetricsResponse:
    service = AnalyticsService(db)
    return await service.get_lead_metrics(workspace_id)


@router.get(
    "/deals",
    response_model=DealMetricsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Deal Revenue Metrics",
    description="Returns deal revenue, win/loss counts, and average deal size metrics.",
)
async def get_deal_metrics(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> DealMetricsResponse:
    service = AnalyticsService(db)
    return await service.get_deal_metrics(workspace_id)


@router.get(
    "/pipeline",
    response_model=list[PipelineAnalyticsResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Pipeline Stage Analytics",
    description="Returns pipeline stage conversion distributions and weighted revenue forecasts.",
)
async def get_pipeline_analytics(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    pipeline_id: UUID | None = Query(None, description="Optional pipeline filter"),
) -> list[PipelineAnalyticsResponse]:
    service = AnalyticsService(db)
    return await service.get_pipeline_analytics(workspace_id, pipeline_id=pipeline_id)
