"""
ForgeCRM API — Workspace Domain Validators

Slug generator and validation rules for workspace URLs.

Documentation: docs/02_Database/203_WORKSPACE_SCHEMA.md §5
"""

from __future__ import annotations

import re


def generate_workspace_slug(name: str) -> str:
    """
    Generate a URL-friendly slug from a workspace name.

    Example: "Acme Technologies Pvt Ltd!" -> "acme-technologies-pvt-ltd"
    """
    slug = name.strip().lower()
    # Replace non-alphanumeric characters with hyphen
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    slug = slug.strip("-")
    return slug or "workspace"
