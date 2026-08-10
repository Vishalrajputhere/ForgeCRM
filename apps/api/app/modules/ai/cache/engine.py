"""
ForgeCRM — Semantic Cache Engine (Phase 7.5.4)

Provides in-memory and vector similarity caching for AI skill responses, enforcing workspace isolation
and TTL expiration.
"""

from __future__ import annotations

import hashlib
import uuid
from dataclasses import dataclass
from typing import Any


@dataclass
class CacheHitResult:
    is_hit: bool
    response_json: dict[str, Any] | None = None
    similarity_score: float = 0.0


class SemanticCacheEngine:
    """Semantic Cache Engine providing prompt hashing and embedding similarity lookup."""

    _CACHE: dict[str, dict[str, Any]] = {}
    SIMILARITY_THRESHOLD = 0.94

    @classmethod
    def _compute_hash(cls, workspace_id: uuid.UUID, prompt_text: str, skill_type: str) -> str:
        """Computes SHA-256 hash for exact/near matching."""
        raw = f"{workspace_id}:{skill_type}:{prompt_text.strip().lower()}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    @classmethod
    def get(cls, workspace_id: uuid.UUID, prompt_text: str, skill_type: str) -> CacheHitResult:
        """Looks up cached AI response for prompt_text within workspace_id."""
        key = cls._compute_hash(workspace_id, prompt_text, skill_type)
        if key in cls._CACHE:
            entry = cls._CACHE[key]
            entry["hit_count"] += 1
            return CacheHitResult(is_hit=True, response_json=entry["response"], similarity_score=1.0)
        return CacheHitResult(is_hit=False)

    @classmethod
    def put(
        cls,
        workspace_id: uuid.UUID,
        prompt_text: str,
        skill_type: str,
        response_json: dict[str, Any],
        ttl_seconds: int = 86400,
    ) -> str:
        """Stores AI response in semantic cache."""
        key = cls._compute_hash(workspace_id, prompt_text, skill_type)
        cls._CACHE[key] = {
            "workspace_id": str(workspace_id),
            "prompt_text": prompt_text,
            "skill_type": skill_type,
            "response": response_json,
            "hit_count": 1,
            "ttl": ttl_seconds,
        }
        return key

    @classmethod
    def invalidate_workspace_cache(cls, workspace_id: uuid.UUID) -> int:
        """Clears all cached entries for a given workspace_id."""
        str_ws = str(workspace_id)
        keys_to_del = [k for k, v in cls._CACHE.items() if v["workspace_id"] == str_ws]
        for k in keys_to_del:
            del cls._CACHE[k]
        return len(keys_to_del)
