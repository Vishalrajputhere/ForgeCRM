"""
ForgeCRM API — Global Search Domain Routes

FastAPI route for workspace-isolated full-text and pattern search across all CRM entities.

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
from app.modules.search.schemas import GlobalSearchResponse
from app.modules.search.service import SearchService

router = APIRouter(prefix="/search", tags=["Global Search"])

WorkspaceIdDep = Annotated[UUID, Depends(get_current_workspace_id)]
WorkspaceMemberDep = Annotated[Any, Depends(get_current_workspace_member)]


@router.get(
    "",
    response_model=GlobalSearchResponse,
    status_code=status.HTTP_200_OK,
    summary="Global Workspace Search",
    description="Performs pattern search across Companies, Contacts, Leads, Deals, and Tasks.",
)
async def search(
    q: str = Query(..., min_length=2, description="Search query string"),
    workspace_id: WorkspaceIdDep = Depends(get_current_workspace_id),
    member: WorkspaceMemberDep = Depends(get_current_workspace_member),
    db: AsyncSession = Depends(get_db_session),
) -> GlobalSearchResponse:
    service = SearchService(db)
    return await service.search(workspace_id, q)
