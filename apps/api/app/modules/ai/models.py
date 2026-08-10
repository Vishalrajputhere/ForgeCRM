"""
ForgeCRM API — AI Subsystem Database Models

Defines SQLAlchemy ORM models for conversations, messages, prompt templates,
provider settings, token usage metering, and vector embeddings.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AIConversation(Base):
    """Stores active chat sessions per workspace & user."""

    __tablename__ = "ai_conversations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, default="New Conversation")
    provider: Mapped[str] = mapped_column(String(64), nullable=False, default="gemini")
    model: Mapped[str] = mapped_column(String(128), nullable=False, default="gemini-1.5-flash")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship("AIMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="AIMessage.created_at")


class AIMessage(Base):
    """Stores individual message turns within a conversation, with branching support."""

    __tablename__ = "ai_messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_message_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("ai_messages.id", ondelete="CASCADE"), nullable=True, index=True)
    role: Mapped[str] = mapped_column(String(32), nullable=False)  # system, user, assistant, tool
    content: Mapped[str] = mapped_column(Text, nullable=False)
    tool_calls: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    tokens_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    conversation = relationship("AIConversation", back_populates="messages")


class AIMemory(Base):
    """Stores workspace & user long-term memories, preferences, and pinned rules."""

    __tablename__ = "ai_memories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    memory_type: Mapped[str] = mapped_column(String(32), nullable=False, default="workspace")  # workspace, user, pinned, preference
    category: Mapped[str] = mapped_column(String(32), nullable=False, default="Sales")  # Sales, Product, Legal, Customer
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="Active")  # Active, Deprecated, Replaced, Archived
    key: Mapped[str] = mapped_column(String(128), nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    importance_score: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.95)
    use_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_pinned: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class AIPendingAction(Base):
    """Stores Tier 3 human approval requests for destructive AI actions."""

    __tablename__ = "ai_pending_actions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    tool_name: Mapped[str] = mapped_column(String(64), nullable=False)
    arguments_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")  # pending, approved, rejected
    resolved_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class AIToolExecutionLog(Base):
    """Audit log for MCP tool invocations and function calls."""

    __tablename__ = "ai_tool_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    tool_name: Mapped[str] = mapped_column(String(64), nullable=False)
    arguments_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    result_json: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="success")  # success, failed, approval_required
    duration_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class AIPromptTemplate(Base):
    """System & custom prompt templates library."""

    __tablename__ = "ai_prompt_templates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=True, index=True)
    slug: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    template_text: Mapped[str] = mapped_column(Text, nullable=False)
    version: Mapped[str] = mapped_column(String(32), nullable=False, default="1.0.0")
    is_system: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class AIProviderSetting(Base):
    """Workspace AI configuration & provider preferences."""

    __tablename__ = "ai_provider_settings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    default_provider: Mapped[str] = mapped_column(String(64), nullable=False, default="gemini")
    default_model: Mapped[str] = mapped_column(String(128), nullable=False, default="gemini-1.5-flash")
    encrypted_api_keys: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    monthly_token_budget: Mapped[int] = mapped_column(Integer, nullable=False, default=1000000)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class AIUsageMeter(Base):
    """Token consumption audit meter."""

    __tablename__ = "ai_usage"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String(64), nullable=False)
    model: Mapped[str] = mapped_column(String(128), nullable=False)
    prompt_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    completion_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    estimated_cost_usd: Mapped[float] = mapped_column(Numeric(10, 6), nullable=False, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class AIDocumentChunk(Base):
    """Stores text chunks and vector embeddings for pgvector RAG retrieval."""

    __tablename__ = "ai_document_chunks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    file_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)  # company, deal, note, file
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    chunk_text: Mapped[str] = mapped_column(Text, nullable=False)
    embedding_model: Mapped[str] = mapped_column(String(64), nullable=False, default="text-embedding-3-small")
    embedding_version: Mapped[str] = mapped_column(String(32), nullable=False, default="1.0.0")
    metadata_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class AIRetrievalLog(Base):
    """Audit log for vector & hybrid RAG queries."""

    __tablename__ = "ai_retrieval_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    query_text: Mapped[str] = mapped_column(Text, nullable=False)
    top_k: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    results_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class AIContextSnapshot(Base):
    """Snapshot audit log for assembled AI context, explainability scores, and metrics."""

    __tablename__ = "ai_context_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    route: Mapped[str | None] = mapped_column(String(255), nullable=True)
    assembled_context: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    discarded_context: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    quality_metrics: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    build_duration_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


# ─── Phase 7.4.1 — Enterprise Sales Copilot Models ───────────────────────────


class AIInsight(Base):
    """Structured AI-generated business insight for a CRM entity."""

    __tablename__ = "ai_insights"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    entity_type: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    insight_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True)  # risk, opportunity, recommendation, alert, trend
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.8)
    priority: Mapped[str] = mapped_column(String(16), nullable=False, default="medium")
    tags_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=list)
    supporting_data_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    skill_type: Mapped[str] = mapped_column(String(64), nullable=False, default="sales_copilot")
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)



class AISuggestion(Base):
    """AI-generated action suggestion for a user (email draft, task, call, meeting)."""

    __tablename__ = "ai_suggestions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    entity_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    suggestion_type: Mapped[str] = mapped_column(String(32), nullable=False)  # email_draft, task, call, meeting
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.8)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")  # pending, accepted, dismissed
    metadata_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


# ─── Phase 7.4.2 — Enterprise Deal Coach Models ──────────────────────────────


class AIDealScore(Base):
    """AI-generated deal health score, win probability, and risk score."""

    __tablename__ = "ai_deal_scores"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    deal_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    win_probability: Mapped[float] = mapped_column(Float, nullable=False, default=0.5)
    health_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.7)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.3)
    forecast_confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.6)
    reasoning_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    model_version: Mapped[str] = mapped_column(String(32), nullable=False, default="1.0.0")
    scored_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


# ─── Phase 7.4.3 — Lead Qualification AI Models ───────────────────────────────


class AILeadScore(Base):
    """AI-generated lead qualification, ICP fit, and intent scores."""

    __tablename__ = "ai_lead_scores"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    fit_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    intent_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    qualification_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    icp_match: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    urgency: Mapped[str] = mapped_column(String(32), nullable=False, default="medium")  # high, medium, low
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.8)
    reasoning_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


# ─── Phase 7.4.4 — Forecast AI & Revenue Intelligence Models ─────────────────


class AIForecast(Base):
    """AI-generated revenue, pipeline, ARR, and scenario forecasts."""

    __tablename__ = "ai_forecasts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    forecast_type: Mapped[str] = mapped_column(String(32), nullable=False)  # revenue, pipeline, quarter, arr, mrr, scenario
    period: Mapped[str] = mapped_column(String(32), nullable=False, default="Q3 2026")
    revenue_prediction: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    pipeline_prediction: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.8)
    best_case: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    expected_case: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    worst_case: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    quota_attainment: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    assumptions_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    reasoning_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


# ─── Phase 7.4.5 — Email Copilot & Communication Models ───────────────────────


class AIEmailDraft(Base):
    """AI-generated email draft, tone, and outreach response."""

    __tablename__ = "ai_email_drafts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    contact_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    tone: Mapped[str] = mapped_column(String(32), nullable=False, default="professional")
    language: Mapped[str] = mapped_column(String(16), nullable=False, default="English")
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.85)
    reasoning_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="draft")  # draft, sent, discarded
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class AIEmailSummary(Base):
    """AI-generated email thread summary, sentiment, and action items."""

    __tablename__ = "ai_email_summaries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    thread_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    sentiment: Mapped[str] = mapped_column(String(32), nullable=False, default="Neutral")
    key_points: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=list)
    action_items: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=list)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


# ─── Phase 7.4.6 — Executive Copilot & Strategic Intelligence Models ──────────


class AIExecutiveReport(Base):
    """AI-generated board reports, quarterly briefings, and executive summaries."""

    __tablename__ = "ai_executive_reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    period: Mapped[str] = mapped_column(String(32), nullable=False, default="Q3 2026")
    report_type: Mapped[str] = mapped_column(String(32), nullable=False, default="dashboard")  # dashboard, board_report, weekly, quarterly
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    kpis_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    risks_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=list)
    opportunities_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=list)
    recommendations_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=list)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.90)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class AIExecutiveInsight(Base):
    """AI-generated strategic C-suite insights and recommendations."""

    __tablename__ = "ai_executive_insights"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    entity_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    priority: Mapped[str] = mapped_column(String(16), nullable=False, default="high")  # critical, high, medium, low
    category: Mapped[str] = mapped_column(String(32), nullable=False, default="growth")  # revenue, risk, opportunity, team, market
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.88)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


# ─── Phase 7.5.1 — AI Evaluation & Benchmarking Models ───────────────────────


class AIEvaluationRun(Base):
    """Execution log and scoring results for AI skill evaluation runs."""

    __tablename__ = "ai_evaluation_runs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_type: Mapped[str] = mapped_column(String(64), nullable=False)
    provider: Mapped[str] = mapped_column(String(32), nullable=False, default="gemini")
    model: Mapped[str] = mapped_column(String(64), nullable=False, default="gemini-2.5-flash")
    accuracy_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.90)
    faithfulness_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.92)
    hallucination_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.04)  # Lower is better
    citation_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.95)
    overall_quality_score: Mapped[float] = mapped_column(Float, nullable=False, default=91.5)  # 0-100 scale
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=450)
    metrics_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    evaluated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class AIBenchmarkResult(Base):
    """Benchmark suite results comparing AI providers and prompt templates."""

    __tablename__ = "ai_benchmark_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    benchmark_name: Mapped[str] = mapped_column(String(128), nullable=False)
    provider: Mapped[str] = mapped_column(String(32), nullable=False)
    model: Mapped[str] = mapped_column(String(64), nullable=False)
    sample_count: Mapped[int] = mapped_column(Integer, nullable=False, default=50)
    passed_count: Mapped[int] = mapped_column(Integer, nullable=False, default=48)
    pass_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.96)
    avg_latency_ms: Mapped[float] = mapped_column(Float, nullable=False, default=320.0)
    total_tokens_used: Mapped[int] = mapped_column(Integer, nullable=False, default=12500)
    total_cost_usd: Mapped[float] = mapped_column(Float, nullable=False, default=0.015)
    results_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    executed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


# ─── Phase 7.5.2 — AI Model Lifecycle & Provider Management Models ───────────


class AIModelConfig(Base):
    """Configuration, lifecycle status, and deployment settings for LLM models."""

    __tablename__ = "ai_model_configs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String(32), nullable=False)  # gemini, openai, ollama
    model_name: Mapped[str] = mapped_column(String(64), nullable=False)
    version: Mapped[str] = mapped_column(String(32), nullable=False, default="1.0.0")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")  # active, deprecated, shadow, canary
    traffic_weight: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)  # 0.0 to 1.0 for A/B testing
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    cost_per_1k_tokens: Mapped[float] = mapped_column(Float, nullable=False, default=0.00015)
    config_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class AIProviderHealth(Base):
    """Health monitor, uptime, and latency log for AI providers."""

    __tablename__ = "ai_provider_health"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="healthy")  # healthy, degraded, offline
    avg_latency_ms: Mapped[float] = mapped_column(Float, nullable=False, default=250.0)
    error_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    last_checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


# ─── Phase 7.5.3 — AI Governance, Security & Prompt Firewall Models ───────────


class AISecurityAuditLog(Base):
    """Audit log for prompt injection detections, PII redactions, and security violations."""

    __tablename__ = "ai_security_audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)  # prompt_injection, jailbreak_attempt, pii_detected, policy_violation
    severity: Mapped[str] = mapped_column(String(16), nullable=False, default="medium")  # critical, high, medium, low
    blocked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    sanitized_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    details_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    logged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class AIGovernancePolicy(Base):
    """Workspace-level AI access control, safety policy, and RBAC rules."""

    __tablename__ = "ai_governance_policies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    policy_name: Mapped[str] = mapped_column(String(128), nullable=False)
    is_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    enforce_pii_masking: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    enforce_prompt_firewall: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    allowed_roles: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=list)
    max_daily_budget_usd: Mapped[float] = mapped_column(Float, nullable=False, default=100.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


# ─── Phase 7.5.4 — Semantic Cache & Prompt Version Management Models ──────────


class AISemanticCacheEntry(Base):
    """Semantic vector cache storing precomputed AI responses for similar prompts."""

    __tablename__ = "ai_semantic_cache_entries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    prompt_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    prompt_text: Mapped[str] = mapped_column(Text, nullable=False)
    response_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    skill_type: Mapped[str] = mapped_column(String(64), nullable=False)
    hit_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    ttl_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=86400)  # 24 hour TTL
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class AIPromptVersionHistory(Base):
    """Version history, diffs, and approval records for PromptRegistry templates."""

    __tablename__ = "ai_prompt_version_histories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    template_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    version: Mapped[str] = mapped_column(String(32), nullable=False, default="1.0.0")
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    user_template: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")  # active, draft, archived
    author_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)












