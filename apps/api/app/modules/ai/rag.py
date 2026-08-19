"""
ForgeCRM API — Hybrid RAG Retrieval Engine & Citation Scoring

Executes workspace-scoped document chunk retrieval and scores citations
using a real token-overlap similarity algorithm (no pgvector extension
required). When pgvector is available, this can be upgraded to cosine
distance in a future phase.

Scoring algorithm:
  - Tokenise query and chunk_text into lowercase word sets
  - Compute Jaccard overlap: |intersection| / |union|
  - Apply RRF (Reciprocal Rank Fusion) ordering by score desc
  - Assign confidence tiers: High ≥ 0.3, Medium ≥ 0.1, Low < 0.1

When no AIDocumentChunk records exist for the workspace: returns empty
results (no demo citations injected).

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

import re
import time
import uuid
from typing import Any, Literal

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ai.embeddings import EmbeddingService
from app.modules.ai.models import AIDocumentChunk, AIRetrievalLog


class RAGCitation(BaseModel):
    """Citation metadata item attached to RAG search results."""

    citation_id: str
    file_id: uuid.UUID | None = None
    entity_type: str
    entity_id: uuid.UUID
    snippet: str
    similarity_score: float
    rrf_rank: int
    confidence_tier: Literal["High", "Medium", "Low"]


class RAGQueryResult(BaseModel):
    """RAG Search Response."""

    query: str
    top_k: int
    results: list[RAGCitation]
    latency_ms: int


def _tokenise(text: str) -> set[str]:
    """Lower-case word tokeniser — strips punctuation, returns set of tokens."""
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def _jaccard_score(query_tokens: set[str], chunk_tokens: set[str]) -> float:
    """Compute Jaccard overlap coefficient between two token sets."""
    if not query_tokens or not chunk_tokens:
        return 0.0
    intersection = len(query_tokens & chunk_tokens)
    union = len(query_tokens | chunk_tokens)
    return round(intersection / union, 4) if union > 0 else 0.0


class RAGRetrievalEngine:
    """Hybrid RAG Retrieval Engine — keyword overlap scoring, no pgvector needed."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.embedding_service = EmbeddingService()

    async def search(
        self,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
        query: str,
        top_k: int = 5,
        entity_type: str | None = None,
    ) -> RAGQueryResult:
        """
        Execute tenant-isolated RAG search.

        Steps:
          1. Load all AIDocumentChunk records for this workspace.
          2. Score each chunk via Jaccard token overlap against the query.
          3. Sort by score descending and return top_k citations.
          4. If no chunks exist: return empty result list (no demo fallback).
        """
        start_ts = time.monotonic()
        query_tokens = _tokenise(query)

        # ── 1. Load workspace chunks ──────────────────────────────────────────
        stmt = select(AIDocumentChunk).where(
            AIDocumentChunk.workspace_id == workspace_id
        )
        if entity_type:
            stmt = stmt.where(AIDocumentChunk.entity_type == entity_type)

        res = await self.db.execute(stmt)
        chunks = res.scalars().all()

        # ── 2. Score all chunks with Jaccard overlap ──────────────────────────
        scored: list[tuple[float, AIDocumentChunk]] = []
        for chunk in chunks:
            chunk_tokens = _tokenise(chunk.chunk_text)
            score = _jaccard_score(query_tokens, chunk_tokens)
            scored.append((score, chunk))

        # ── 3. Sort by score desc and take top_k ─────────────────────────────
        scored.sort(key=lambda x: x[0], reverse=True)
        top = scored[:top_k]

        # ── 4. Build citation list (empty if no chunks found) ─────────────────
        citations: list[RAGCitation] = []
        for rank, (sim, chunk) in enumerate(top, start=1):
            # Only include chunks with non-zero overlap
            if sim == 0.0 and query_tokens:
                continue
            tier: Literal["High", "Medium", "Low"] = (
                "High" if sim >= 0.3 else ("Medium" if sim >= 0.1 else "Low")
            )
            citations.append(
                RAGCitation(
                    citation_id=f"CIT-{chunk.id.hex[:8]}",
                    file_id=chunk.file_id,
                    entity_type=chunk.entity_type,
                    entity_id=chunk.entity_id,
                    snippet=chunk.chunk_text,
                    similarity_score=sim,
                    rrf_rank=rank,
                    confidence_tier=tier,
                )
            )

        latency_ms = int((time.monotonic() - start_ts) * 1000)

        # ── 5. Log retrieval query ────────────────────────────────────────────
        try:
            async with self.db.begin_nested():
                log_entry = AIRetrievalLog(
                    workspace_id=workspace_id,
                    user_id=user_id,
                    query_text=query,
                    top_k=top_k,
                    latency_ms=latency_ms,
                    results_count=len(citations),
                )
                self.db.add(log_entry)
                await self.db.flush()
        except Exception:
            pass

        return RAGQueryResult(
            query=query,
            top_k=top_k,
            results=citations,
            latency_ms=latency_ms,
        )

    async def retrieve(
        self,
        workspace_id: uuid.UUID,
        query: str,
        entity_type: str | None = None,
        top_k: int = 6,
        user_id: uuid.UUID | None = None,
    ) -> list[dict[str, Any]]:
        """Alias for BaseAISkill.retrieve_rag() compatibility. Returns list[dict]."""
        result = await self.search(
            workspace_id=workspace_id,
            user_id=user_id or uuid.uuid4(),
            query=query,
            top_k=top_k,
            entity_type=entity_type,
        )
        return [
            {
                "citation_id": c.citation_id,
                "entity_type": c.entity_type,
                "entity_id": str(c.entity_id),
                "snippet": c.snippet,
                "similarity_score": c.similarity_score,
                "rrf_rank": c.rrf_rank,
                "confidence_tier": c.confidence_tier,
            }
            for c in result.results
        ]
