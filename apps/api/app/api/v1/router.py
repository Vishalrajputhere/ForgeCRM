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

# Future milestones will register their routers here:
# from app.modules.identity import routes as auth_routes
# api_v1_router.include_router(auth_routes.router, prefix="/auth", tags=["Auth"])
# ...

__all__ = ["api_v1_router"]
