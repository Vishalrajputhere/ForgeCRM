"""
ForgeCRM API — Database Engine

Async SQLAlchemy engine and session factory configuration.
Uses asyncpg driver for PostgreSQL 17.

Documentation: docs/02_Database/201_DATABASE_OVERVIEW.md
"""

from __future__ import annotations

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.logging import get_logger

logger = get_logger(__name__)

# Module-level engine and session factory — initialized once on startup.
_engine: AsyncEngine | None = None
_async_session_factory: async_sessionmaker[AsyncSession] | None = None


def create_engine(
    database_url: str,
    pool_size: int = 10,
    max_overflow: int = 20,
    pool_timeout: int = 30,
    pool_recycle: int = 3600,
    echo: bool = False,
) -> AsyncEngine:
    """
    Create the async SQLAlchemy engine for PostgreSQL.

    Args:
        database_url: Async-compatible PostgreSQL URL (asyncpg driver).
        pool_size: Number of connections to maintain in the pool.
        max_overflow: Max connections beyond pool_size allowed temporarily.
        pool_timeout: Seconds to wait before giving up on acquiring a connection.
        pool_recycle: Seconds before recycling a connection to prevent stale connections.
        echo: Log all SQL statements (development only).

    Returns:
        Configured AsyncEngine instance.
    """
    engine = create_async_engine(
        database_url,
        pool_size=pool_size,
        max_overflow=max_overflow,
        pool_timeout=pool_timeout,
        pool_recycle=pool_recycle,
        pool_pre_ping=True,  # Verify connections before use
        echo=echo,
        # JSON serialization via orjson for performance
        json_serializer=_json_serializer,
        json_deserializer=_json_deserializer,
    )

    logger.info(
        "database_engine_created",
        pool_size=pool_size,
        max_overflow=max_overflow,
    )

    return engine


def create_session_factory(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    """
    Create the async session factory bound to an engine.

    Args:
        engine: The AsyncEngine instance to bind sessions to.

    Returns:
        Configured async_sessionmaker.
    """
    return async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,  # Prevent lazy-load issues after commit
        autoflush=False,
        autocommit=False,
    )


def init_db(
    database_url: str,
    pool_size: int = 10,
    max_overflow: int = 20,
    pool_timeout: int = 30,
    pool_recycle: int = 3600,
    echo: bool = False,
) -> tuple[AsyncEngine, async_sessionmaker[AsyncSession]]:
    """
    Initialize the database engine and session factory.

    Called once during application startup via the lifespan context.

    Returns:
        Tuple of (engine, session_factory).
    """
    global _engine, _async_session_factory

    _engine = create_engine(
        database_url=database_url,
        pool_size=pool_size,
        max_overflow=max_overflow,
        pool_timeout=pool_timeout,
        pool_recycle=pool_recycle,
        echo=echo,
    )
    _async_session_factory = create_session_factory(_engine)

    return _engine, _async_session_factory


def get_engine() -> AsyncEngine:
    """
    Return the initialized database engine.

    Raises:
        RuntimeError: If the database engine has not been initialized.
    """
    if _engine is None:
        raise RuntimeError(
            "Database engine is not initialized. "
            "Call init_db() during application startup."
        )
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """
    Return the initialized async session factory.

    Raises:
        RuntimeError: If the session factory has not been initialized.
    """
    if _async_session_factory is None:
        raise RuntimeError(
            "Session factory is not initialized. "
            "Call init_db() during application startup."
        )
    return _async_session_factory


async def dispose_engine() -> None:
    """
    Gracefully dispose of the database engine on application shutdown.

    Closes all connections in the pool.
    """
    global _engine

    if _engine is not None:
        await _engine.dispose()
        logger.info("database_engine_disposed")
        _engine = None


# ── JSON Serialization ────────────────────────────────────────────────────────


def _json_serializer(obj: object) -> str:
    """Serialize Python objects to JSON using orjson for performance."""
    import orjson

    return orjson.dumps(obj).decode()


def _json_deserializer(obj: str) -> object:
    """Deserialize JSON strings using orjson for performance."""
    import orjson

    return orjson.loads(obj)


__all__ = [
    "create_engine",
    "create_session_factory",
    "dispose_engine",
    "get_engine",
    "get_session_factory",
    "init_db",
]
