"""
ForgeCRM API — Test Configuration

Pytest fixtures and test configuration for the FastAPI application.
Uses an in-process test client with a real test database.

Documentation: docs/07_Testing/
"""

from __future__ import annotations

import os

# Set test environment variables BEFORE importing app modules
os.environ["APP_ENV"] = "testing"
os.environ["APP_SECRET_KEY"] = "test_secret_key_that_is_at_least_32_characters_long"
os.environ["DATABASE_URL"] = os.getenv("TEST_DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ["REDIS_URL"] = "redis://:forgecrm_dev_password@localhost:6379/1"
os.environ["JWT_SECRET_KEY"] = "test_jwt_secret_key_that_is_at_least_32_characters_long"

import asyncio
from collections.abc import AsyncGenerator, Generator
from typing import Any

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import Settings, get_settings
from app.db.base import Base
from app.db.session import get_db_session

# ── Test Settings Override ────────────────────────────────────────────────────


def get_test_settings() -> Settings:
    """Return settings configured for the test environment."""
    return get_settings()


# ── Pytest Configuration ──────────────────────────────────────────────────────


@pytest.fixture
def test_settings() -> Settings:
    """Return test settings."""
    return get_test_settings()


@pytest.fixture
def app(test_settings: Settings) -> FastAPI:
    """
    Create a FastAPI test application with settings override.
    """
    from app.main import create_application

    test_app = create_application()
    test_app.dependency_overrides[get_settings] = lambda: test_settings
    return test_app


@pytest_asyncio.fixture
async def test_engine(test_settings: Settings) -> AsyncGenerator[Any]:
    """
    Create and configure the test database engine.

    Creates all tables before the test session and drops them after.
    Uses the test database to avoid polluting development data.
    """
    db_url = str(test_settings.DATABASE_URL)
    kw: dict[str, Any] = {"echo": False}
    if db_url.startswith("sqlite"):
        kw["connect_args"] = {"check_same_thread": False}
    engine = create_async_engine(db_url, **kw)

    # Drop and recreate all tables for a clean test database state
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    # Seed system roles into test database
    from app.modules.identity.repository import RoleRepository
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        role_repo = RoleRepository(session)
        await role_repo.seed_system_roles_and_permissions()
        await session.commit()

    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine: Any) -> AsyncGenerator[AsyncSession]:
    """
    Yield an async database session for each test.

    Each test runs in its own transaction that is rolled back after
    the test completes, ensuring test isolation.
    """
    session_factory = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with session_factory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(app: FastAPI, db_session: AsyncSession) -> AsyncGenerator[AsyncClient]:
    """
    Yield an async HTTP test client for API endpoint testing.

    The database session dependency is overridden to use the test session.
    """

    async def override_get_db() -> AsyncGenerator[AsyncSession]:
        yield db_session

    app.dependency_overrides[get_db_session] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as test_client:
        yield test_client

    app.dependency_overrides.pop(get_db_session, None)
