"""
ForgeCRM — AI Skill Registry

Central registry for registering, discovering, and dispatching AI Skills across the platform.
Instead of multiple REST endpoints or giant if/else dispatch blocks, all requests pass
through `SkillRegistry.dispatch(request, workspace_id, ...)` to the mapped skill.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md
"""

from __future__ import annotations

import uuid
from typing import Callable, Type

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ai.skills.base import BaseAISkill
from app.modules.ai.skills.schemas import SkillRequest, SkillResponse


class SkillRegistry:
    """Central registry mapping skill identifiers to skill handler instances."""

    _registry: dict[str, Type[BaseAISkill]] = {}

    @classmethod
    def register(cls, skill_key: str, skill_cls: Type[BaseAISkill]) -> None:
        """Registers a skill class under a specific skill key."""
        cls._registry[skill_key.lower()] = skill_cls

    @classmethod
    def register_many(cls, keys: list[str], skill_cls: Type[BaseAISkill]) -> None:
        """Registers a skill class under multiple alias keys."""
        for k in keys:
            cls._registry[k.lower()] = skill_cls

    @classmethod
    def get(cls, skill_key: str) -> Type[BaseAISkill]:
        """Retrieves a skill class by key. Raises KeyError if not found."""
        key = skill_key.lower() if skill_key else "crm_qa"
        if key not in cls._registry:
            # Fallback to CRM Q&A if registered, else raise
            if "crm_qa" in cls._registry:
                return cls._registry["crm_qa"]
            available = ", ".join(sorted(cls._registry.keys()))
            raise KeyError(f"Skill '{skill_key}' not found in SkillRegistry. Available: {available}")
        return cls._registry[key]

    @classmethod
    async def dispatch(
        cls,
        request: SkillRequest,
        workspace_id: uuid.UUID,
        workspace_name: str,
        user_id: uuid.UUID,
        user_role: str = "member",
        db: AsyncSession | None = None,
    ) -> SkillResponse:
        """Instantiates the registered skill and executes its pipeline."""
        if db is None:
            raise ValueError("AsyncSession `db` is required for skill execution.")

        skill_key = request.skill or request.skill_type or "crm_qa"
        skill_cls = cls.get(skill_key)
        instance = skill_cls(db)
        return await instance.execute(
            request=request,
            workspace_id=workspace_id,
            workspace_name=workspace_name,
            user_id=user_id,
            user_role=user_role,
        )

    @classmethod
    def list_skills(cls) -> list[dict[str, str]]:
        """Lists all registered skill aliases and metadata."""
        items: list[dict[str, str]] = []
        seen = set()
        for key, skill_cls in cls._registry.items():
            stype = getattr(skill_cls, "skill_type", key)
            if key not in seen:
                seen.add(key)
                items.append({
                    "skill": key,
                    "skill_type": stype,
                    "class_name": skill_cls.__name__,
                })
        return items
