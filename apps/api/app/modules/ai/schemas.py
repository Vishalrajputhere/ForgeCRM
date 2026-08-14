"""
ForgeCRM API — AI Subsystem Schemas

Defines Pydantic V2 request & response schemas for chat completion,
streaming SSE chunks, prompts, provider registry, and token usage.

Documentation: docs/03_Backend/302_API_DESIGN.md
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class AIToolDefinition(BaseModel):
    """JSON Schema definition for tool/function calling."""

    name: str = Field(..., description="Tool function name (e.g. create_lead)")
    description: str = Field(..., description="Tool purpose and instructions")
    parameters: dict[str, Any] = Field(default_factory=dict, description="JSON Schema parameters object")


class AIMessageTurn(BaseModel):
    """Message payload for chat context."""

    role: Literal["system", "user", "assistant", "tool"]
    content: str
    tool_calls: dict[str, Any] | None = None


class AIChatRequest(BaseModel):
    """Payload for POST /api/v1/ai/chat and /api/v1/ai/stream."""

    conversation_id: uuid.UUID | None = None
    messages: list[AIMessageTurn] = Field(..., min_length=1)
    provider: str | None = None
    model: str | None = None
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int | None = Field(default=2048, ge=1)
    stream: bool = False
    entity_type: str | None = None
    entity_id: uuid.UUID | None = None


class AIChatResponse(BaseModel):
    """Response payload for synchronous chat completion."""

    conversation_id: uuid.UUID
    provider: str
    model: str
    message: AIMessageTurn
    prompt_tokens: int
    completion_tokens: int
    estimated_cost_usd: float
    latency_ms: int = 0


class AIStreamChunk(BaseModel):
    """Server-Sent Event (SSE) payload chunk."""

    type: Literal["content", "tool_call", "done", "error"]
    content: str | None = None
    tool_call: dict[str, Any] | None = None
    conversation_id: uuid.UUID | None = None
    error: str | None = None


class AIProviderCapability(BaseModel):
    """Capabilities metadata for LLM providers."""

    provider: str
    model: str
    streaming: bool = True
    vision: bool = False
    tools: bool = True
    json_mode: bool = True
    max_context_tokens: int = 128000
    cost_per_1k_input_usd: float = 0.0001
    cost_per_1k_output_usd: float = 0.0003


class AIConversationResponse(BaseModel):
    """Conversation session summary."""

    id: uuid.UUID
    workspace_id: uuid.UUID
    user_id: uuid.UUID
    title: str
    provider: str
    model: str
    created_at: datetime
    updated_at: datetime


class AIUsageSummaryResponse(BaseModel):
    """Usage meter summary."""

    total_prompt_tokens: int
    total_completion_tokens: int
    total_cost_usd: float
    token_budget: int
    remaining_tokens: int
