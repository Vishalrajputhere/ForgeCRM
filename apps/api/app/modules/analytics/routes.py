"""
ForgeCRM API — Analytics Domain Routes

FastAPI router for executive KPI summaries, lead conversion metrics, sales performance,
pipeline stage distributions, activity productivity, automation telemetry, AI cost tracking,
custom dashboards, saved reports, and CSV export.

Documentation: docs/03_Backend/302_API_DESIGN.md
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import (
    get_current_workspace_id,
    get_current_workspace_member,
    require_workspace_permission,
)
from app.db.session import get_db_session
from app.modules.analytics.schemas import (
    AccountAnalyticsResponse,
    ActivityAnalyticsResponse,
    AIAnalyticsResponse,
    AnalyticsExportRequest,
    AutomationAnalyticsResponse,
    DashboardCreate,
    DashboardResponse,
    DealMetricsResponse,
    ExecutiveOverviewResponse,
    LeadMetricsResponse,
    PipelineAnalyticsResponse,
    ProductAnalyticsResponse,
    SalesPerformanceResponse,
    SavedReportCreate,
    SavedReportResponse,
)
from app.modules.analytics.service import AnalyticsService
from app.modules.identity.permissions import Permissions

router = APIRouter(prefix="/analytics", tags=["Analytics & BI Reporting"])

WorkspaceIdDep = Annotated[UUID, Depends(get_current_workspace_id)]
WorkspaceMemberDep = Annotated[Any, Depends(get_current_workspace_member)]


@router.get(
    "/overview",
    response_model=ExecutiveOverviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Executive Overview KPIs",
    description="Returns high-level executive dashboard KPI metrics filtered by time range and owner.",
)
async def get_executive_overview(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    time_range: str | None = Query(None, description="Preset timeframe: today, 7d, 30d, 90d, 1y, qtd, ytd"),
    start_date: datetime | None = Query(None, description="Custom interval start date"),
    end_date: datetime | None = Query(None, description="Custom interval end date"),
    owner_id: UUID | None = Query(None, description="Optional representative filter"),
) -> ExecutiveOverviewResponse:
    service = AnalyticsService(db)
    return await service.get_executive_overview(
        workspace_id,
        member=member,
        start_date=start_date,
        end_date=end_date,
        time_range=time_range,
        owner_id=owner_id,
    )


@router.get(
    "/leads",
    response_model=LeadMetricsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Lead Funnel Metrics",
    description="Returns lead conversion funnel, status distributions, and conversion velocity.",
)
async def get_lead_metrics(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    time_range: str | None = Query(None, description="Preset timeframe"),
    start_date: datetime | None = Query(None, description="Custom interval start date"),
    end_date: datetime | None = Query(None, description="Custom interval end date"),
    owner_id: UUID | None = Query(None, description="Optional representative filter"),
) -> LeadMetricsResponse:
    service = AnalyticsService(db)
    return await service.get_lead_metrics(
        workspace_id,
        member=member,
        start_date=start_date,
        end_date=end_date,
        time_range=time_range,
        owner_id=owner_id,
    )


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
    time_range: str | None = Query(None, description="Preset timeframe"),
    start_date: datetime | None = Query(None, description="Custom interval start date"),
    end_date: datetime | None = Query(None, description="Custom interval end date"),
    owner_id: UUID | None = Query(None, description="Optional representative filter"),
) -> DealMetricsResponse:
    service = AnalyticsService(db)
    return await service.get_deal_metrics(
        workspace_id,
        member=member,
        start_date=start_date,
        end_date=end_date,
        time_range=time_range,
        owner_id=owner_id,
    )


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
    time_range: str | None = Query(None, description="Preset timeframe"),
    start_date: datetime | None = Query(None, description="Custom interval start date"),
    end_date: datetime | None = Query(None, description="Custom interval end date"),
) -> list[PipelineAnalyticsResponse]:
    service = AnalyticsService(db)
    return await service.get_pipeline_analytics(
        workspace_id,
        member=member,
        start_date=start_date,
        end_date=end_date,
        time_range=time_range,
        pipeline_id=pipeline_id,
    )


@router.get(
    "/sales",
    response_model=SalesPerformanceResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Sales Performance Leaderboard",
    description="Returns sales representative leaderboard, win rates, and sales cycle lengths.",
)
async def get_sales_performance(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    time_range: str | None = Query(None, description="Preset timeframe"),
    start_date: datetime | None = Query(None, description="Custom interval start date"),
    end_date: datetime | None = Query(None, description="Custom interval end date"),
) -> SalesPerformanceResponse:
    service = AnalyticsService(db)
    return await service.get_sales_performance(
        workspace_id,
        member=member,
        start_date=start_date,
        end_date=end_date,
        time_range=time_range,
    )


@router.get(
    "/activities",
    response_model=ActivityAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Activity & Task Productivity Analytics",
    description="Returns activity volume breakdown by type and task completion rates.",
)
async def get_activity_analytics(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    time_range: str | None = Query(None, description="Preset timeframe"),
    start_date: datetime | None = Query(None, description="Custom interval start date"),
    end_date: datetime | None = Query(None, description="Custom interval end date"),
) -> ActivityAnalyticsResponse:
    service = AnalyticsService(db)
    return await service.get_activity_analytics(
        workspace_id,
        member=member,
        start_date=start_date,
        end_date=end_date,
        time_range=time_range,
    )


@router.get(
    "/automation",
    response_model=AutomationAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Workflow Automation Telemetry",
    description="Returns workflow execution metrics, success/failure rates, and top rules.",
)
async def get_automation_analytics(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    time_range: str | None = Query(None, description="Preset timeframe"),
    start_date: datetime | None = Query(None, description="Custom interval start date"),
    end_date: datetime | None = Query(None, description="Custom interval end date"),
) -> AutomationAnalyticsResponse:
    service = AnalyticsService(db)
    return await service.get_automation_analytics(
        workspace_id,
        member=member,
        start_date=start_date,
        end_date=end_date,
        time_range=time_range,
    )


@router.get(
    "/ai",
    response_model=AIAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get AI Subsystem Telemetry & Cost Analytics",
    description="Returns real AI token consumption, request counts, and cost breakdown by model.",
)
async def get_ai_analytics(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    time_range: str | None = Query(None, description="Preset timeframe"),
    start_date: datetime | None = Query(None, description="Custom interval start date"),
    end_date: datetime | None = Query(None, description="Custom interval end date"),
) -> AIAnalyticsResponse:
    service = AnalyticsService(db)
    return await service.get_ai_analytics(
        workspace_id,
        member=member,
        start_date=start_date,
        end_date=end_date,
        time_range=time_range,
    )


@router.get(
    "/accounts",
    response_model=AccountAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Customer Account Analytics",
    description="Returns customer account growth, active companies, and top accounts by revenue.",
)
async def get_account_analytics(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    time_range: str | None = Query(None, description="Preset timeframe"),
    start_date: datetime | None = Query(None, description="Custom interval start date"),
    end_date: datetime | None = Query(None, description="Custom interval end date"),
) -> AccountAnalyticsResponse:
    service = AnalyticsService(db)
    return await service.get_account_analytics(
        workspace_id,
        member=member,
        start_date=start_date,
        end_date=end_date,
        time_range=time_range,
    )


@router.get(
    "/products",
    response_model=ProductAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Product Catalog Analytics",
    description="Returns product revenue distribution, units sold, and top performing catalog items.",
)
async def get_product_analytics(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    time_range: str | None = Query(None, description="Preset timeframe"),
    start_date: datetime | None = Query(None, description="Custom interval start date"),
    end_date: datetime | None = Query(None, description="Custom interval end date"),
    owner_id: UUID | None = Query(None, description="Filter by deal owner"),
    pipeline_id: UUID | None = Query(None, description="Filter by pipeline"),
) -> ProductAnalyticsResponse:
    service = AnalyticsService(db)
    return await service.get_product_analytics(
        workspace_id,
        member=member,
        start_date=start_date,
        end_date=end_date,
        time_range=time_range,
        owner_id=owner_id,
        pipeline_id=pipeline_id,
    )


# ── Dashboards & Reports CRUD ──────────────────────────────────────────────────


@router.get(
    "/dashboards",
    response_model=list[DashboardResponse],
    status_code=status.HTTP_200_OK,
    summary="List Custom Dashboards",
    description="Returns all custom saved dashboards for the active workspace.",
)
async def list_dashboards(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[DashboardResponse]:
    service = AnalyticsService(db)
    return await service.list_dashboards(workspace_id)


@router.post(
    "/dashboards",
    response_model=DashboardResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Custom Dashboard",
    description="Creates a new custom analytics dashboard with widgets.",
)
async def create_dashboard(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    data: DashboardCreate,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> DashboardResponse:
    service = AnalyticsService(db)
    return await service.create_dashboard(workspace_id, member.id, data)


@router.delete(
    "/dashboards/{dashboard_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Custom Dashboard",
    description="Soft-deletes a custom analytics dashboard.",
)
async def delete_dashboard(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    dashboard_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    service = AnalyticsService(db)
    deleted = await service.delete_dashboard(workspace_id, dashboard_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dashboard not found")


@router.get(
    "/reports",
    response_model=list[SavedReportResponse],
    status_code=status.HTTP_200_OK,
    summary="List Saved Reports",
    description="Returns all saved report query configurations.",
)
async def list_saved_reports(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[SavedReportResponse]:
    service = AnalyticsService(db)
    return await service.list_saved_reports(workspace_id)


@router.post(
    "/reports",
    response_model=SavedReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Saved Report",
    description="Saves a new business intelligence report query definition.",
)
async def create_saved_report(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    data: SavedReportCreate,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> SavedReportResponse:
    service = AnalyticsService(db)
    return await service.create_saved_report(workspace_id, member.id, data)


@router.delete(
    "/reports/{report_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Saved Report",
    description="Soft-deletes a saved report configuration.",
)
async def delete_saved_report(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    report_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    service = AnalyticsService(db)
    deleted = await service.delete_saved_report(workspace_id, report_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")


@router.post(
    "/export",
    summary="Export Analytics Dataset as CSV",
    description="Generates and streams a CSV dataset for the requested analytics domain.",
)
async def export_analytics_csv(
    workspace_id: WorkspaceIdDep,
    member: WorkspaceMemberDep,
    request: AnalyticsExportRequest,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> Response:
    service = AnalyticsService(db)
    csv_content = await service.export_csv(
        workspace_id=workspace_id,
        report_type=request.report_type,
        member=member,
        start_date=request.start_date,
        end_date=request.end_date,
        time_range=request.time_range,
    )
    filename = f"forgecrm_{request.report_type}_export_{datetime.now(UTC).strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


__all__ = ["router"]
