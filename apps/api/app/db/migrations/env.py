"""
ForgeCRM API — Alembic Migration Environment

Configures Alembic to run async migrations against PostgreSQL.
All models must be imported here so Alembic can detect schema changes.

Documentation: docs/02_Database/201_DATABASE_OVERVIEW.md
"""

from __future__ import annotations

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

# Import the base metadata — all models must be imported here for autogenerate
from app.db.base import Base
from app.modules.crm.models import (  # noqa: F401
    Activity,
    ActivityType,
    Company,
    CompanyIndustry,
    Contact,
    Deal,
    DealProduct,
    Lead,
    LeadConversion,
    LeadSource,
    LeadStatus,
    Pipeline,
    PipelineStage,
    Task,
)

# ── Import all models so Alembic can detect them ─────────────────────────────
from app.modules.identity.models import (  # noqa: F401
    EmailVerificationToken,
    OAuthAccount,
    PasswordResetToken,
    Permission,
    RefreshToken,
    Role,
    Session,
    User,
    UserRole,
    role_permissions,
)
from app.modules.storage.models import DocumentAttachment  # noqa: F401
from app.modules.workspace.models import (  # noqa: F401
    Team,
    TeamMember,
    Workspace,
    WorkspaceInvitation,
    WorkspaceMember,
    WorkspaceSettings,
)

# ─────────────────────────────────────────────────────────────────────────────

# Alembic Config object — provides access to .ini file values
config = context.config

# Set up Python logging from the alembic.ini [loggers] config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# The target metadata for 'autogenerate' support
target_metadata = Base.metadata


def get_database_url() -> str:
    """
    Resolve the database URL from settings or environment.

    Priority:
      1. Alembic config file (sqlalchemy.url)
      2. Application settings (DATABASE_URL env var)
    """
    ini_url = config.get_main_option("sqlalchemy.url")
    if ini_url:
        return ini_url

    # Fall back to application settings
    from app.core.config import get_settings

    settings = get_settings()
    return str(settings.DATABASE_URL)


def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode.

    This configures the context with just a URL and not an Engine.
    By skipping the Engine creation, we don't even need a DBAPI to be available.
    """
    url = get_database_url()

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Execute migrations with a live database connection."""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
        # Include schema changes in autogenerate
        include_schemas=False,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """
    Run migrations in 'online' mode using asyncpg.

    Creates an async engine and runs migrations synchronously
    via run_sync() as required by Alembic.
    """
    database_url = get_database_url()

    # Create a temporary configuration dict for the async engine
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = database_url

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,  # No pooling for migrations
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode using asyncio event loop."""
    asyncio.run(run_async_migrations())


# ── Entry Point ───────────────────────────────────────────────────────────────

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
