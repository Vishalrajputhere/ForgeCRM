"""
ForgeCRM — AI Skills Shared Citation Manager

Maps RAG retrieval snippets and CRM entity references to structured Citation objects.
Every AI Skill response includes a citations list for full source traceability.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any
import uuid


@dataclass
class Citation:
    """Structured source citation from RAG retrieval or CRM context."""

    citation_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    source: str = ""           # e.g. "CRM Document", "Lead Record", "Deal Note"
    entity_type: str = ""      # company, deal, lead, contact, note, file
    entity_id: str | None = None
    entity_name: str = ""
    excerpt: str = ""          # Relevant text snippet
    relevance_score: float = 0.0
    page_number: int | None = None
    url: str | None = None


class CitationManager:
    """Extracts structured citations from RAG snippets and CRM entity context."""

    @staticmethod
    def from_rag_snippets(snippets: list[dict[str, Any]]) -> list[Citation]:
        """Converts RAG retrieval results into Citation objects."""
        citations: list[Citation] = []
        seen_excerpts: set[str] = set()

        for snippet in snippets:
            excerpt = snippet.get("chunk_text", snippet.get("text", ""))[:300]
            if excerpt in seen_excerpts:
                continue
            seen_excerpts.add(excerpt)

            citations.append(
                Citation(
                    source=snippet.get("source", snippet.get("entity_type", "CRM Document")),
                    entity_type=snippet.get("entity_type", "document"),
                    entity_id=str(snippet.get("entity_id")) if snippet.get("entity_id") else None,
                    entity_name=snippet.get("entity_name", snippet.get("title", "")),
                    excerpt=excerpt,
                    relevance_score=round(snippet.get("relevance_score", snippet.get("score", 0.0)), 3),
                    page_number=snippet.get("page_number"),
                )
            )

        # Sort by relevance descending
        citations.sort(key=lambda c: c.relevance_score, reverse=True)
        return citations[:8]  # Cap at 8 citations per response

    @staticmethod
    def from_crm_entity(entity_type: str, entity_id: str, entity_name: str, description: str) -> Citation:
        """Creates a citation from a directly referenced CRM entity."""
        return Citation(
            source=f"CRM {entity_type.title()} Record",
            entity_type=entity_type,
            entity_id=entity_id,
            entity_name=entity_name,
            excerpt=description[:300],
            relevance_score=1.0,
        )

    @staticmethod
    def deduplicate(citations: list[Citation]) -> list[Citation]:
        """Removes near-duplicate citations by entity_id."""
        seen_ids: set[str] = set()
        unique: list[Citation] = []
        for c in citations:
            key = c.entity_id or c.excerpt[:50]
            if key not in seen_ids:
                seen_ids.add(key)
                unique.append(c)
        return unique
