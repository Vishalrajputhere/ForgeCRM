# 610 — Production Readiness Checklist

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen / Approved

**Document Type:** Launch Verification Checklist

---

# 1. Purpose

This document defines the mandatory launch verification criteria for deploying ForgeCRM to production.

---

# 2. Production Checklist

## Security & Secrets
- [x] Hardcoded secrets removed; all secrets configured via environment variables or secret managers
- [x] JWT secret key set to high-entropy 256-bit secret in production
- [x] Password policy enforced (minimum 6 characters, upper/lower/number/symbol)
- [x] Refresh token rotation and session tracking operational
- [x] Nginx reverse proxy hardened with security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy)
- [x] CORS configured strictly for allowed production domain origins

## Database & Storage
- [x] PostgreSQL 17 running with UTF-8 encoding and UTC timezone
- [x] Alembic database migrations automated (`scripts/database/migrate.py`)
- [x] Foreign key constraints, unique constraints, and B-tree indexes verified across all 14 CRM core tables
- [x] MinIO / S3 object storage initialized with private bucket policies
- [x] Automated database backup and restore utility created (`scripts/database/backup.py`)

## Performance & Optimization
- [x] FastAPI multi-worker configuration with Gunicorn/Uvicorn
- [x] Next.js standalone multi-stage production Docker build
- [x] Redis caching and background job queue operational
- [x] Nginx gzip compression and rate limiting zones enabled

## Observability & Reliability
- [x] Structured JSON logging with request correlation IDs
- [x] Liveness (`/health/live`), Readiness (`/health/ready`), and Health (`/health`) probes operational
- [x] Prometheus metrics probe (`/health/metrics`) exposing system metrics
- [x] Graceful shutdown handling for container termination signals (SIGTERM/SIGINT)

## Quality Gates & Automated Testing
- [x] Ruff Python linter passing with 0 errors
- [x] mypy type checker passing with 0 errors
- [x] TypeScript compiler (`npx tsc --noEmit`) passing with 0 errors
- [x] Next.js production build (`npm run build`) passing cleanly
- [x] Automated integration test suites passing across identity, workspaces, CRM core, storage, search, background jobs, and analytics
- [x] Production smoke test verification script created (`scripts/deployment/smoke_test.py`)