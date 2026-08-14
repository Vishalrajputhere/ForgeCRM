"""
ForgeCRM API — V1 Router

Registers all API v1 route modules.
New modules are registered here as they are implemented.

Documentation: docs/03_Backend/302_API_DESIGN.md
"""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import health

# Main v1 router — all routes prefixed with /api/v1
api_v1_router = APIRouter(prefix="/api/v1")

# ── Register Route Modules ────────────────────────────────────────────────────

# Health checks (no auth required)
api_v1_router.include_router(health.router)

# Authentication & Identity
from app.modules.identity import routes as auth_routes  # noqa: E402

api_v1_router.include_router(auth_routes.router)

# Workspace Isolation & Multi-Tenancy
from app.modules.workspace import routes as workspace_routes  # noqa: E402
from app.modules.workspace import admin_routes as workspace_admin_routes  # noqa: E402

api_v1_router.include_router(workspace_routes.router)
api_v1_router.include_router(workspace_admin_routes.router)

# CRM Core Operational
from app.modules.crm import routes as crm_routes  # noqa: E402

api_v1_router.include_router(crm_routes.router)

# Document Storage & Attachments
from app.modules.storage import routes as storage_routes  # noqa: E402

api_v1_router.include_router(storage_routes.router)

# Global Search
from app.modules.search import routes as search_routes  # noqa: E402

api_v1_router.include_router(search_routes.router)

# Background Jobs
from app.modules.jobs import routes as job_routes  # noqa: E402

api_v1_router.include_router(job_routes.router)

# Analytics & BI Reporting
from app.modules.analytics import routes as analytics_routes  # noqa: E402

api_v1_router.include_router(analytics_routes.router)

# AI Productivity & Insights
from app.modules.ai import routes as ai_routes  # noqa: E402

api_v1_router.include_router(ai_routes.router)

# Workflow Automation Engine
from app.modules.automation import routes as automation_routes  # noqa: E402

api_v1_router.include_router(automation_routes.router)

# AI Skills — Enterprise Copilot, Sales Intelligence (Phase 7.4)
from app.modules.ai.skills import routes as ai_skills_routes  # noqa: E402

api_v1_router.include_router(ai_skills_routes.router)

# AI Agent Runtime — Autonomous Execution (Phase 7.3)
from app.modules.ai.agents import routes as ai_agent_routes  # noqa: E402

api_v1_router.include_router(ai_agent_routes.router)

# Enterprise Deal Coach (Phase 7.4.2)
from app.modules.ai.skills import deal_coach_routes  # noqa: E402

api_v1_router.include_router(deal_coach_routes.router)

# Enterprise Lead Qualification (Phase 7.4.3)
from app.modules.ai.skills import lead_qualification_routes  # noqa: E402

api_v1_router.include_router(lead_qualification_routes.router)

# Enterprise Forecast AI & Revenue Intelligence (Phase 7.4.4)
from app.modules.ai.skills import forecast_routes  # noqa: E402

api_v1_router.include_router(forecast_routes.router)

# Enterprise Communication Assistant & Email Copilot (Phase 7.4.5)
from app.modules.ai.skills import email_routes  # noqa: E402

api_v1_router.include_router(email_routes.router)

# Enterprise Executive Copilot & Strategic Intelligence (Phase 7.4.6)
from app.modules.ai.skills import executive_routes  # noqa: E402

api_v1_router.include_router(executive_routes.router)

# Enterprise AI Admin Console & Operations (Phase 7.5.5)
from app.modules.ai.ops import admin_routes  # noqa: E402

api_v1_router.include_router(admin_routes.router)


__all__ = ["api_v1_router"]
