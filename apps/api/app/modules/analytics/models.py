"""
ForgeCRM API — Analytics & Reporting Database Models

SQLAlchemy models for custom persisted dashboards, dashboard widgets,
and saved business intelligence report configurations.

Documentation: docs/03_Backend/302_API_DESIGN.md
"""

from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import BOOLEAN, INTEGER, VARCHAR, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, BaseModel, TimestampMixin, UUIDPrimaryKeyMixin


class AnalyticsDashboard(BaseModel):
    """Custom user-configured dashboard instance per workspace."""

    __tablename__ = "analytics_dashboards"

    workspace_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_by_member_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("workspace_members.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_default: Mapped[bool] = mapped_column(BOOLEAN, default=False, server_default="false", nullable=False)
    layout_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict, server_default="{}")

    # Relationships
    widgets: Mapped[list[AnalyticsDashboardWidget]] = relationship(
        "AnalyticsDashboardWidget",
        back_populates="dashboard",
        cascade="all, delete-orphan",
        order_by="AnalyticsDashboardWidget.position_y, AnalyticsDashboardWidget.position_x",
    )


class AnalyticsDashboardWidget(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Configurable visual widget placed within a custom analytics dashboard."""

    __tablename__ = "analytics_dashboard_widgets"

    dashboard_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("analytics_dashboards.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    widget_type: Mapped[str] = mapped_column(VARCHAR(60), nullable=False)  # kpi_card, revenue_chart, funnel_chart, leaderboard, table, ai_cost
    title: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    position_x: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    position_y: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    width: Mapped[int] = mapped_column(Integer, default=1, server_default="1", nullable=False)
    height: Mapped[int] = mapped_column(Integer, default=1, server_default="1", nullable=False)
    config_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict, server_default="{}")

    # Relationships
    dashboard: Mapped[AnalyticsDashboard] = relationship("AnalyticsDashboard", back_populates="widgets")


class SavedReport(BaseModel):
    """User-saved report query definition."""

    __tablename__ = "analytics_saved_reports"

    workspace_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_by_member_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("workspace_members.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(VARCHAR(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    entity_type: Mapped[str] = mapped_column(VARCHAR(50), nullable=False)  # deal, lead, activity, automation, ai
    metrics_json: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list, server_default="[]")
    dimensions_json: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list, server_default="[]")
    filters_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict, server_default="{}")


__all__ = [
    "AnalyticsDashboard",
    "AnalyticsDashboardWidget",
    "SavedReport",
]
