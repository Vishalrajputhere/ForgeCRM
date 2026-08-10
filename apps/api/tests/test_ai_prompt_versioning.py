"""
ForgeCRM API — Phase 7.5.4 AI Prompt Version Management Unit Tests

Tests for:
  - PromptVersionManager save_version, get_history, compare_versions, and rollback

Documentation: docs/07_Testing/703_INTEGRATION_TESTING.md
"""

from __future__ import annotations

import pytest

from app.modules.ai.prompts.manager import PromptVersionManager
from app.modules.ai.skills.shared.prompt_registry import PromptTemplate


def test_prompt_version_manager_lifecycle() -> None:
    """Verifies PromptVersionManager tracks history, diffs, and rollbacks."""
    t1 = PromptTemplate(
        template_id="TEST_PROMPT_V1",
        version="1.0.0",
        description="Version 1",
        system_prompt="Initial system prompt line 1",
        user_template="User template {focus_areas}",
    )
    t2 = PromptTemplate(
        template_id="TEST_PROMPT_V1",
        version="1.1.0",
        description="Version 2",
        system_prompt="Updated system prompt line 1 with new directives",
        user_template="User template {focus_areas}",
    )

    PromptVersionManager.save_version(t1)
    PromptVersionManager.save_version(t2)

    history = PromptVersionManager.get_history("TEST_PROMPT_V1")
    assert len(history) >= 2

    diff = PromptVersionManager.compare_versions("TEST_PROMPT_V1", "1.0.0", "1.1.0")
    assert diff.template_id == "TEST_PROMPT_V1"
    assert "Updated system prompt" in diff.diff_text or "v1.1.0" in diff.diff_text

    rolled_back = PromptVersionManager.rollback_to_version("TEST_PROMPT_V1", "1.0.0")
    assert rolled_back.version == "1.0.0"
