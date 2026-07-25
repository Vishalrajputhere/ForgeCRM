"""
ForgeCRM API — Seed Default Roles & Permissions

Populates default system permissions and roles on application startup.

Documentation: docs/05_Security/505_AUTHORIZATION_AND_RBAC.md
"""

from __future__ import annotations

from app.core.logging import get_logger
from app.db.engine import get_session_factory
from app.modules.identity.repository import RoleRepository

logger = get_logger(__name__)


async def seed_identity_defaults() -> None:
    """Seed default permissions and system roles if they do not exist."""
    session_factory = get_session_factory()
    async with session_factory() as db:
        role_repo = RoleRepository(db)
        await role_repo.seed_system_roles_and_permissions()
        await db.commit()
        logger.info("identity_defaults_seeded")
