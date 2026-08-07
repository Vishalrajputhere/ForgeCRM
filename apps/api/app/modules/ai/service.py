"""
ForgeCRM API — AI Core Service

Orchestrates AI Router, Context Builder, Provider Execution, and Token Metering.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

import uuid
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ai.context import EnterpriseContextBuilder
from app.modules.ai.router import AIRouterEngine
from app.modules.ai.schemas import AIChatRequest, AIChatResponse, AIProviderCapability, AIStreamChunk
from app.modules.ai.security import AISecuritySanitizer


class AIService:
    """Core AI Service with Enterprise Context Integration."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.router = AIRouterEngine()
        self.context_builder = EnterpriseContextBuilder(db)

    async def chat(
        self,
        request: AIChatRequest,
        workspace_id: uuid.UUID,
        workspace_name: str,
        user_id: uuid.UUID,
        user_role: str = "member",
    ) -> AIChatResponse:
        # Sanitize prompt
        if request.messages:
            request.messages[-1].content = AISecuritySanitizer.sanitize_prompt(request.messages[-1].content)

        provider = self.router.get_provider(request.provider)
        context = await self.context_builder.build(
            workspace_id=workspace_id,
            workspace_name=workspace_name,
            user_id=user_id,
            user_role=user_role,
            entity_type=request.entity_type,
            entity_id=request.entity_id,
            model_name=request.model or "gemini-1.5-flash",
        )
        return await provider.chat(request)

    async def stream(
        self,
        request: AIChatRequest,
        workspace_id: uuid.UUID,
        workspace_name: str,
        user_id: uuid.UUID,
        user_role: str = "member",
    ) -> AsyncGenerator[AIStreamChunk, None]:
        # Sanitize prompt
        if request.messages:
            request.messages[-1].content = AISecuritySanitizer.sanitize_prompt(request.messages[-1].content)

        provider = self.router.get_provider(request.provider)
        context = await self.context_builder.build(
            workspace_id=workspace_id,
            workspace_name=workspace_name,
            user_id=user_id,
            user_role=user_role,
            entity_type=request.entity_type,
            entity_id=request.entity_id,
            model_name=request.model or "gemini-1.5-flash",
        )
        async for chunk in provider.stream(request):
            yield chunk

    def list_capabilities(self) -> list[AIProviderCapability]:
        return self.router.list_capabilities()
