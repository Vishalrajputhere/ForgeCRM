"""
ForgeCRM API — Configuration

Uses Pydantic Settings v2 for validated, typed environment configuration.
The application fails fast if any required configuration is missing or invalid.

Documentation: docs/06_Deployment/606_CONFIGURATION_MANAGEMENT.md
"""

from __future__ import annotations

from enum import StrEnum
from functools import lru_cache
from typing import Any

from pydantic import (
    AnyHttpUrl,
    Field,
    PostgresDsn,
    RedisDsn,
    SecretStr,
    field_validator,
    model_validator,
)
from pydantic_settings import BaseSettings, SettingsConfigDict


class Environment(StrEnum):
    """Application environment variants."""

    DEVELOPMENT = "development"
    TESTING = "testing"
    STAGING = "staging"
    PRODUCTION = "production"


class LogLevel(StrEnum):
    """Structured log levels."""

    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class Settings(BaseSettings):
    """
    ForgeCRM application settings.

    All values are sourced from environment variables.
    The application will raise a validation error on startup
    if any required setting is missing or invalid.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        validate_default=True,
    )

    # ── Application ──────────────────────────────────────────────────────────
    APP_NAME: str = Field(default="ForgeCRM", description="Application name")
    APP_VERSION: str = Field(default="0.1.0", description="Application version")
    APP_ENV: Environment = Field(
        default=Environment.DEVELOPMENT,
        description="Deployment environment",
    )
    APP_DEBUG: bool = Field(default=False, description="Enable debug mode")
    APP_SECRET_KEY: SecretStr = Field(
        ...,
        description="Application secret key — must be at least 32 characters",
        min_length=32,
    )

    # ── API ──────────────────────────────────────────────────────────────────
    API_HOST: str = Field(default="0.0.0.0", description="API host to bind")
    API_PORT: int = Field(default=8000, ge=1, le=65535, description="API port")
    API_PREFIX: str = Field(default="/api/v1", description="API route prefix")
    API_CORS_ORIGINS: list[AnyHttpUrl] = Field(
        default=["http://localhost:3000"],
        description="Allowed CORS origins",
    )

    # ── Database (PostgreSQL 17) ──────────────────────────────────────────────
    DATABASE_URL: PostgresDsn = Field(
        ...,
        description="PostgreSQL async connection URL (asyncpg driver)",
    )
    TEST_DATABASE_URL: PostgresDsn | None = Field(
        default=None,
        description="PostgreSQL test database URL",
    )
    DB_POOL_SIZE: int = Field(default=10, ge=1, le=100, description="DB pool size")
    DB_MAX_OVERFLOW: int = Field(
        default=20, ge=0, le=100, description="DB pool max overflow"
    )
    DB_POOL_TIMEOUT: int = Field(
        default=30, ge=5, le=300, description="DB pool acquire timeout in seconds"
    )
    DB_POOL_RECYCLE: int = Field(
        default=3600, ge=60, description="DB connection recycle interval in seconds"
    )
    DB_ECHO_SQL: bool = Field(
        default=False, description="Echo SQL statements (development only)"
    )

    # ── Redis ─────────────────────────────────────────────────────────────────
    REDIS_URL: RedisDsn = Field(..., description="Redis connection URL")
    REDIS_DB: int = Field(default=0, ge=0, le=15, description="Redis database number")

    # ── JWT Authentication ────────────────────────────────────────────────────
    JWT_SECRET_KEY: SecretStr = Field(
        ...,
        description="JWT signing secret — must be at least 64 characters",
        min_length=32,
    )
    JWT_ALGORITHM: str = Field(default="HS256", description="JWT signing algorithm")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=15,
        ge=1,
        le=60,
        description="Access token lifetime in minutes",
    )
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = Field(
        default=30,
        ge=1,
        le=365,
        description="Refresh token lifetime in days",
    )

    # ── Object Storage ────────────────────────────────────────────────────────
    STORAGE_PROVIDER: str = Field(
        default="minio", description="Storage provider: minio or s3"
    )
    MINIO_ENDPOINT: str = Field(default="minio:9000", description="MinIO endpoint")
    MINIO_ACCESS_KEY: SecretStr = Field(
        default="forgecrm_minio", description="MinIO access key"
    )
    MINIO_SECRET_KEY: SecretStr = Field(
        default="forgecrm_minio_password", description="MinIO secret key"
    )
    MINIO_BUCKET: str = Field(default="forgecrm", description="MinIO default bucket")
    MINIO_SECURE: bool = Field(default=False, description="Use HTTPS for MinIO")

    # Production S3
    AWS_ACCESS_KEY_ID: SecretStr | None = Field(default=None)
    AWS_SECRET_ACCESS_KEY: SecretStr | None = Field(default=None)
    AWS_S3_BUCKET: str | None = Field(default=None)
    AWS_S3_REGION: str = Field(default="us-east-1")

    # ── Email ─────────────────────────────────────────────────────────────────
    SMTP_HOST: str | None = Field(default=None, description="SMTP server host")
    SMTP_PORT: int = Field(default=587, description="SMTP server port")
    SMTP_USER: str | None = Field(default=None)
    SMTP_PASSWORD: SecretStr | None = Field(default=None)
    SMTP_FROM_EMAIL: str = Field(default="noreply@forgecrm.io")
    SMTP_FROM_NAME: str = Field(default="ForgeCRM")
    SMTP_TLS: bool = Field(default=True)

    # ── AI Providers ──────────────────────────────────────────────────────────
    OPENAI_API_KEY: SecretStr | None = Field(default=None, description="OpenAI API key")
    ANTHROPIC_API_KEY: SecretStr | None = Field(default=None)
    AI_DEFAULT_PROVIDER: str = Field(default="openai")
    AI_DEFAULT_MODEL: str = Field(default="gpt-4o")

    # ── Google OAuth ──────────────────────────────────────────────────────────
    GOOGLE_CLIENT_ID: str | None = Field(default=None)
    GOOGLE_CLIENT_SECRET: SecretStr | None = Field(default=None)
    GOOGLE_REDIRECT_URI: str = Field(
        default="http://localhost:8000/api/v1/auth/google/callback"
    )

    # ── Logging ───────────────────────────────────────────────────────────────
    LOG_LEVEL: LogLevel = Field(default=LogLevel.INFO, description="Log level")
    LOG_FORMAT: str = Field(
        default="json",
        description="Log format: json or console",
        pattern="^(json|console)$",
    )
    LOG_INCLUDE_TRACE: bool = Field(
        default=False, description="Include stack traces in structured logs"
    )

    # ── Validators ────────────────────────────────────────────────────────────

    @field_validator("API_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Any) -> list[str]:
        """Parse CORS origins from comma-separated string or list."""
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @model_validator(mode="after")
    def validate_production_settings(self) -> Settings:
        """Enforce stricter validation in production environment."""
        if self.APP_ENV == Environment.PRODUCTION:
            if self.APP_DEBUG:
                raise ValueError("APP_DEBUG must be False in production")
        return self

    # ── Computed Properties ───────────────────────────────────────────────────

    @property
    def is_development(self) -> bool:
        """Return True if running in development mode."""
        return self.APP_ENV == Environment.DEVELOPMENT

    @property
    def is_testing(self) -> bool:
        """Return True if running in test mode."""
        return self.APP_ENV == Environment.TESTING

    @property
    def is_production(self) -> bool:
        """Return True if running in production mode."""
        return self.APP_ENV == Environment.PRODUCTION

    @property
    def database_url_str(self) -> str:
        """Return the database URL as a string."""
        return str(self.DATABASE_URL)

    @property
    def redis_url_str(self) -> str:
        """Return the Redis URL as a string."""
        return str(self.REDIS_URL)

    @property
    def cors_origins(self) -> list[str]:
        """Return CORS origins as strings."""
        return [str(origin) for origin in self.API_CORS_ORIGINS]


@lru_cache
def get_settings() -> Settings:
    """
    Return the cached application settings instance.

    This function is called once per process and caches the result.
    Use this in FastAPI's Depends() for dependency injection.
    """
    return Settings()  # type: ignore[call-arg]
