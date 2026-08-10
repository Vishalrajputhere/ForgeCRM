"""
ForgeCRM — Prompt Version Manager (Phase 7.5.4)

Manages prompt template version history, diff comparison, draft approvals, and rollback support.
"""

from __future__ import annotations

import difflib
from dataclasses import dataclass
from typing import Any

from app.modules.ai.skills.shared.prompt_registry import PromptRegistry, PromptTemplate


@dataclass
class PromptDiff:
    template_id: str
    v1: str
    v2: str
    diff_text: str


class PromptVersionManager:
    """Manager handling version history and diffs for PromptRegistry templates."""

    _HISTORY: dict[str, list[PromptTemplate]] = {}

    @classmethod
    def save_version(cls, template: PromptTemplate) -> None:
        """Saves a new prompt template version to history."""
        versions = cls._HISTORY.setdefault(template.template_id, [])
        versions.append(template)
        PromptRegistry.register(template.template_id, template)

    @classmethod
    def get_history(cls, template_id: str) -> list[PromptTemplate]:
        """Retrieves complete version history for template_id."""
        if template_id not in cls._HISTORY:
            try:
                tmpl = PromptRegistry.get(template_id)
                cls._HISTORY[template_id] = [tmpl]
            except KeyError:
                return []
        return cls._HISTORY.get(template_id, [])

    @classmethod
    def compare_versions(cls, template_id: str, v1_str: str, v2_str: str) -> PromptDiff:
        """Generates unified diff text comparing two prompt versions."""
        history = cls.get_history(template_id)
        t1 = next((t for t in history if t.version == v1_str), history[0] if history else None)
        t2 = next((t for t in history if t.version == v2_str), history[-1] if history else None)

        sys1 = t1.system_prompt if t1 else ""
        sys2 = t2.system_prompt if t2 else ""

        diff_lines = list(difflib.unified_diff(sys1.splitlines(), sys2.splitlines(), fromfile=f"v{v1_str}", tofile=f"v{v2_str}"))
        diff_text = "\n".join(diff_lines) if diff_lines else "No changes in system prompt."

        return PromptDiff(template_id=template_id, v1=v1_str, v2=v2_str, diff_text=diff_text)

    @classmethod
    def rollback_to_version(cls, template_id: str, version: str) -> PromptTemplate:
        """Rolls back active prompt template to target version."""
        history = cls.get_history(template_id)
        target = next((t for t in history if t.version == version), None)
        if not target:
            raise KeyError(f"Version '{version}' not found for template '{template_id}'")
        PromptRegistry.register(template_id, target)
        return target
