"""
ForgeCRM API — Database Session Dependency

Provides FastAPI dependency injection for database sessions.
Each request gets its own session that is committed on success
or rolled back on error.

Documentation: docs/03_Backend/301_BACKEND_OVERVIEW.md §10 (Transactions)
"""

from __future__ import annotations

from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.engine import get_session_factory


async def get_db_session() -> AsyncGenerator[AsyncSession]:
    """
    Async generator that yields an SQLAlchemy session for a single request.

    The session is automatically committed on success and rolled back
    on any unhandled exception, then closed after the response is sent.

    Usage in route handlers:
        @router.get("/example")
        async def example(db: DbSession) -> ...:
            ...
    """
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# Alias for dependency injection
get_db = get_db_session

# Type alias for cleaner route annotations
DbSession = Annotated[AsyncSession, Depends(get_db_session)]



__all__ = ["DbSession", "get_db_session"]
