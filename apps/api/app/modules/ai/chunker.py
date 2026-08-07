"""
ForgeCRM API — Document Chunker Engine

Splits raw documents, notes, CSVs, and emails into overlapping text chunks
optimized for vector embedding and pgvector RAG indexing.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

import re
from typing import Any

from pydantic import BaseModel


class TextChunk(BaseModel):
    """Chunk unit payload."""

    chunk_index: int
    chunk_text: str
    token_count: int
    metadata: dict[str, Any] = {}


class DocumentChunker:
    """Document Chunker with sliding window overlap."""

    def __init__(self, chunk_size: int = 512, chunk_overlap: int = 64) -> None:
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_text(self, text: str, metadata: dict[str, Any] | None = None) -> list[TextChunk]:
        """Splits raw text into sliding window overlapping chunks."""
        cleaned = re.sub(r"\s+", " ", text).strip()
        if not cleaned:
            return []

        words = cleaned.split(" ")
        # Estimate ~4 characters per token -> ~128 words per 512 tokens
        words_per_chunk = max(20, self.chunk_size // 4)
        words_overlap = max(5, self.chunk_overlap // 4)

        chunks: list[TextChunk] = []
        start = 0
        chunk_idx = 0

        meta = metadata or {}

        while start < len(words):
            end = min(len(words), start + words_per_chunk)
            chunk_words = words[start:end]
            chunk_str = " ".join(chunk_words)

            chunks.append(
                TextChunk(
                    chunk_index=chunk_idx,
                    chunk_text=chunk_str,
                    token_count=max(1, len(chunk_str) // 4),
                    metadata=meta,
                )
            )

            chunk_idx += 1
            if end >= len(words):
                break
            start += words_per_chunk - words_overlap

        return chunks
