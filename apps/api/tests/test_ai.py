"""
ForgeCRM API — AI Subsystem Unit Test Suite

Tests for AI Provider Router, Gemini Provider, OpenAI Provider, AI Context Builder, and REST API Endpoints.

Documentation: docs/07_Testing/703_INTEGRATION_TESTING.md
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.modules.ai.providers.gemini import GeminiProvider
from app.modules.ai.providers.openai import OpenAIProvider
from app.modules.ai.router import AIRouterEngine
from app.modules.ai.schemas import AIChatRequest, AIMessageTurn


@pytest.mark.asyncio
async def test_ai_provider_capabilities() -> None:
    gemini = GeminiProvider()
    openai = OpenAIProvider()
    assert gemini.capability.provider == "gemini"
    assert openai.capability.provider == "openai"
    assert gemini.capability.streaming is True
    assert openai.capability.tools is True


@pytest.mark.asyncio
async def test_ai_router_engine() -> None:
    router = AIRouterEngine()
    provider = router.get_provider("gemini")
    assert provider.capability.provider == "gemini"

    caps = router.list_capabilities()
    assert len(caps) >= 2


@pytest.mark.asyncio
async def test_gemini_provider_chat_and_stream() -> None:
    gemini = GeminiProvider()
    req = AIChatRequest(
        messages=[AIMessageTurn(role="user", content="Analyze lead renewal risk")],
        provider="gemini",
    )
    res = await gemini.chat(req)
    assert res.provider == "gemini"
    assert res.message.role == "assistant"

    chunks = [chunk async for chunk in gemini.stream(req)]
    assert len(chunks) > 0
    assert chunks[-1].type == "done"
