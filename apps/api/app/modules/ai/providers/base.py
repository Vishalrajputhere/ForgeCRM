"""
ForgeCRM API — Base AI Provider Abstract Interface

Defines the contract for LLM providers (OpenAI, Gemini, Claude, Ollama).

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator
from typing import Any

from app.modules.ai.schemas import AIChatRequest, AIChatResponse, AIProviderCapability, AIStreamChunk, AIToolDefinition


class BaseAIProvider(ABC):
    """Abstract Base Class for AI Providers."""

    @property
    @abstractmethod
    def capability(self) -> AIProviderCapability:
        """Returns provider capabilities metadata."""
        ...

    @abstractmethod
    async def chat(self, request: AIChatRequest) -> AIChatResponse:
        """Executes synchronous chat completion."""
        ...

    @abstractmethod
    async def stream(self, request: AIChatRequest) -> AsyncGenerator[AIStreamChunk, None]:
        """Executes Server-Sent Events (SSE) streaming chat completion."""
        ...

    @abstractmethod
    async def chat_with_tools(self, request: AIChatRequest, tools: list[AIToolDefinition]) -> AIChatResponse:
        """Executes chat completion with JSON schema tool definitions."""
        ...

    @abstractmethod
    async def embeddings(self, texts: list[str]) -> list[list[float]]:
        """Generates vector embeddings."""
        ...

    @abstractmethod
    async def health(self) -> bool:
        """Pings provider API endpoint for availability check."""
        ...

    @abstractmethod
    def estimate_tokens(self, text: str) -> int:
        """Estimates token count for prompt budgeting."""
        ...
