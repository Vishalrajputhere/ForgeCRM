# =============================================================================
# ForgeCRM API — Dockerfile
# Multi-stage build: development + production
# =============================================================================
# Architecture: Python 3.13 + FastAPI + Uvicorn
# =============================================================================

# ── Base Stage ────────────────────────────────────────────────────────────────
FROM python:3.13-slim AS base

# Prevent Python from writing .pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --gid 1001 appgroup && \
    useradd --uid 1001 --gid appgroup --shell /bin/bash --create-home appuser

WORKDIR /app

# ── Builder Stage ─────────────────────────────────────────────────────────────
FROM base AS builder

# Install pip tools
RUN pip install --upgrade pip hatchling

# Copy dependency definitions
COPY pyproject.toml .

# Install all dependencies (dev + prod) for builder
RUN pip install -e ".[dev]"

# ── Development Stage ─────────────────────────────────────────────────────────
FROM builder AS development

# Copy application source
COPY . .

# Change ownership to non-root user
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

# Hot-reload development server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--log-level", "info"]

# ── Production Stage ──────────────────────────────────────────────────────────
FROM base AS production

# Install only production dependencies
COPY pyproject.toml .
RUN pip install --upgrade pip && pip install -e "."

# Copy application source
COPY app/ ./app/

# Copy Alembic config
COPY alembic.ini .

# Change ownership to non-root user
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

# Health check
HEALTHCHECK --interval=15s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health/live || exit 1

# Production server with multiple workers
CMD ["uvicorn", "app.main:app", \
    "--host", "0.0.0.0", \
    "--port", "8000", \
    "--workers", "4", \
    "--log-level", "info", \
    "--access-log", \
    "--proxy-headers", \
    "--forwarded-allow-ips", "*"]
