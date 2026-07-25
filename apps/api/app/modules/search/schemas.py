"""
ForgeCRM API — Global Search Domain Schemas

Request and Response DTOs for workspace-wide full-text and pattern search.

Documentation: docs/03_Backend/302_API_DESIGN.md
"""

from __future__ import annotations

from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SearchResultItem(BaseModel):
    """Individual search result item DTO."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    entity_type: str  # Company, Contact, Lead, Deal, Task
    title: str
    subtitle: str | None = None
    url: str | None = None
    metadata_json: dict[str, Any] | None = None


class GlobalSearchResponse(BaseModel):
    """Global search response wrapper DTO."""

    query: str
    total: int
    results: list[SearchResultItem]


__all__ = ["GlobalSearchResponse", "SearchResultItem"]
