"""
ForgeCRM API — AI Routes

FastAPI REST endpoints for AI chat completions, SSE token streaming,
provider capabilities listing, prompt templates, and token usage analytics.

Documentation: docs/03_Backend/302_API_DESIGN.md
"""

from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user_and_workspace
from app.db.engine import get_db
from app.modules.ai.context import EnterpriseContextBuilder
from app.modules.ai.rag import RAGRetrievalEngine
from app.modules.ai.schemas import AIChatRequest, AIChatResponse, AIProviderCapability
from app.modules.ai.service import AIService
from app.modules.identity.models import User
from app.modules.workspace.models import Workspace

router = APIRouter(prefix="/ai", tags=["AI Copilot Subsystem"])


@router.get(
    "/providers",
    response_model=list[AIProviderCapability],
    status_code=status.HTTP_200_OK,
    summary="List available AI LLM providers and models",
)
async def list_ai_providers(
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> list[AIProviderCapability]:
    service = AIService(db)
    return service.list_capabilities()


@router.post(
    "/chat",
    response_model=AIChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute synchronous AI chat completion",
)
async def chat_completion(
    payload: AIChatRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> AIChatResponse:
    user, workspace = auth
    service = AIService(db)
    ws_name = getattr(workspace, "name", "Default Workspace")
    return await service.chat(payload, workspace_id=workspace.id if workspace else user.id, workspace_name=ws_name, user_id=user.id)


@router.post(
    "/stream",
    status_code=status.HTTP_200_OK,
    summary="Execute streaming Server-Sent Events (SSE) chat completion",
)
async def stream_chat_completion(
    payload: AIChatRequest,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    user, workspace = auth
    service = AIService(db)
    ws_name = getattr(workspace, "name", "Default Workspace")
    ws_id = workspace.id if workspace else user.id

    async def event_generator():
        async for chunk in service.stream(payload, workspace_id=ws_id, workspace_name=ws_name, user_id=user.id):
            yield f"data: {json.dumps(chunk.model_dump(mode='json'))}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post(
    "/rag/query",
    status_code=status.HTTP_200_OK,
    summary="Execute hybrid vector + keyword RAG search over workspace documents",
)
async def query_rag_engine(
    query_text: str,
    top_k: int = 5,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
):
    user, workspace = auth
    engine = RAGRetrievalEngine(db)
    ws_id = workspace.id if workspace else user.id
    return await engine.search(workspace_id=ws_id, user_id=user.id, query=query_text, top_k=top_k)


@router.get(
    "/debug/context",
    status_code=status.HTTP_200_OK,
    summary="Inspect assembled AI context, ranking, quality scores, and snapshot telemetry",
)
async def debug_assembled_context(
    active_route: str | None = None,
    entity_type: str | None = None,
    auth: tuple[User, Workspace] = Depends(get_current_user_and_workspace),
    db: AsyncSession = Depends(get_db),
):
    user, workspace = auth
    ws_name = getattr(workspace, "name", "Default Workspace")
    ws_id = workspace.id if workspace else user.id
    builder = EnterpriseContextBuilder(db)
    return await builder.build(
        workspace_id=ws_id,
        workspace_name=ws_name,
        user_id=user.id,
        user_role="admin",
        active_route=active_route,
        entity_type=entity_type,
        user_prompt="Inspect active workspace context",
    )
