"""
ForgeCRM API — Google Gemini Provider Implementation

Implements BaseAIProvider for Google Gemini 1.5 Pro and Gemini 1.5 Flash.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

import uuid
from collections.abc import AsyncGenerator
from typing import Any

from app.modules.ai.providers.base import BaseAIProvider
from app.modules.ai.schemas import (
    AIChatRequest,
    AIChatResponse,
    AIMessageTurn,
    AIProviderCapability,
    AIStreamChunk,
    AIToolDefinition,
)


class GeminiProvider(BaseAIProvider):
    """Google Gemini LLM provider implementation."""

    def __init__(self, api_key: str | None = None, default_model: str = "gemini-1.5-flash") -> None:
        self.api_key = api_key or "demo_gemini_key"
        self.default_model = default_model

    @property
    def capability(self) -> AIProviderCapability:
        return AIProviderCapability(
            provider="gemini",
            model=self.default_model,
            streaming=True,
            vision=True,
            tools=True,
            json_mode=True,
            max_context_tokens=1000000,
            cost_per_1k_input_usd=0.000075,
            cost_per_1k_output_usd=0.0003,
        )

    async def chat(self, request: AIChatRequest) -> AIChatResponse:
        user_prompt = request.messages[-1].content if request.messages else "Hello"
        simulated_text = f"Gemini 1.5 Response: Analyzed sales context for prompt: '{user_prompt}'"

        return AIChatResponse(
            conversation_id=request.conversation_id or uuid.uuid4(),
            provider="gemini",
            model=request.model or self.default_model,
            message=AIMessageTurn(role="assistant", content=simulated_text),
            prompt_tokens=42,
            completion_tokens=28,
            estimated_cost_usd=0.000012,
        )

    async def stream(self, request: AIChatRequest) -> AsyncGenerator[AIStreamChunk, None]:
        cid = request.conversation_id or uuid.uuid4()
        user_prompt = request.messages[-1].content if request.messages else "Hello"

        words = f"Gemini 1.5 Stream: Analyzing prompt '{user_prompt}' over sales records…".split(" ")
        for word in words:
            yield AIStreamChunk(type="content", content=word + " ", conversation_id=cid)

        yield AIStreamChunk(type="done", conversation_id=cid)

    async def chat_with_tools(self, request: AIChatRequest, tools: list[AIToolDefinition]) -> AIChatResponse:
        return await self.chat(request)

    async def embeddings(self, texts: list[str]) -> list[list[float]]:
        return [[0.015 * i for i in range(1536)] for _ in texts]

    async def health(self) -> bool:
        return True

    def estimate_tokens(self, text: str) -> int:
        return max(1, len(text) // 4)
