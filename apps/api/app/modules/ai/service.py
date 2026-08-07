"""
ForgeCRM API — AI Core Service

Orchestrates AI Router, Context Builder, Provider Execution, and Token Metering.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

import uuid
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ai.context import AIContextBuilder
from app.modules.ai.router import AIRouterEngine
from app.modules.ai.schemas import AIChatRequest, AIChatResponse, AIProviderCapability, AIStreamChunk


class AIService:
    """Core AI Service."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.router = AIRouterEngine()
        self.context_builder = AIContextBuilder()

    async def chat(self, request: AIChatRequest, workspace_id: uuid.UUID, user_id: uuid.UUID) -> AIChatResponse:
        provider = self.router.get_provider(request.provider)
        context = await self.context_builder.build_context(
            workspace_id=workspace_id,
            user_id=user_id,
            entity_type=request.entity_type,
            entity_id=request.entity_id,
        )
        return await provider.chat(request)

    async def stream(self, request: AIChatRequest, workspace_id: uuid.UUID, user_id: uuid.UUID) -> AsyncGenerator[AIStreamChunk, None]:
        provider = self.router.get_provider(request.provider)
        context = await self.context_builder.build_context(
            workspace_id=workspace_id,
            user_id=user_id,
            entity_type=request.entity_type,
            entity_id=request.entity_id,
        )
        async for chunk in provider.stream(request):
            yield chunk

    def list_capabilities(self) -> list[AIProviderCapability]:
        return self.router.list_capabilities()
