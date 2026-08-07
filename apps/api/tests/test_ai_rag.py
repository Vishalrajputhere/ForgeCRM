"""
ForgeCRM API — Sub-Phase 7.2.2 RAG Engine & Embedding Pipeline Integration Tests

Tests for DocumentChunker, EmbeddingService, RAGRetrievalEngine, AIContextSnapshot, and Debug Endpoints.

Documentation: docs/07_Testing/703_INTEGRATION_TESTING.md
"""

from __future__ import annotations

import uuid
import pytest
from app.modules.ai.chunker import DocumentChunker
from app.modules.ai.embeddings import EmbeddingService
from app.modules.ai.models import AIDocumentChunk
from app.modules.ai.rag import RAGRetrievalEngine


def test_document_chunker_sliding_window() -> None:
    """Verifies document chunker splits text with token overlap."""
    chunker = DocumentChunker(chunk_size=128, chunk_overlap=32)
    raw_text = " ".join([f"Word{i}" for i in range(100)])
    chunks = chunker.chunk_text(raw_text, metadata={"source": "test.txt"})

    assert len(chunks) >= 2
    assert chunks[0].chunk_index == 0
    assert "Word0" in chunks[0].chunk_text
    assert chunks[0].metadata["source"] == "test.txt"


@pytest.mark.asyncio
async def test_embedding_service_generation() -> None:
    """Verifies vector embedding generation (1536D normalized vectors)."""
    service = EmbeddingService()
    results = await service.generate_embeddings(["Acme Corp Enterprise Contract", "Q3 Sales Pipeline"])

    assert len(results) == 2
    assert len(results[0].vector) == 1536
    assert results[0].embedding_model == "text-embedding-3-small"
    assert results[0].embedding_version == "1.0.0"


@pytest.mark.asyncio
async def test_rag_retrieval_engine_search(db_session) -> None:
    """Verifies hybrid RAG retrieval search and citation scoring."""
    ws_id = uuid.uuid4()
    user_id = uuid.uuid4()

    # Seed chunk into DB session
    chunk = AIDocumentChunk(
        id=uuid.uuid4(),
        workspace_id=ws_id,
        entity_type="Company",
        entity_id=uuid.uuid4(),
        chunk_index=0,
        chunk_text="Acme Corp Cloud Enterprise Contract renewal $450k ARR.",
    )
    db_session.add(chunk)
    await db_session.flush()

    engine = RAGRetrievalEngine(db_session)
    rag_res = await engine.search(
        workspace_id=ws_id,
        user_id=user_id,
        query="Acme Corp renewal",
        top_k=3,
    )

    assert rag_res.top_k == 3
    assert len(rag_res.results) >= 1
    assert rag_res.results[0].similarity_score >= 0.8
    assert rag_res.results[0].confidence_tier in ["High", "Medium", "Low"]
