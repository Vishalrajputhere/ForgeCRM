# ForgeCRM

> Enterprise-grade, multi-tenant CRM platform built for modern businesses.

[![CI](https://github.com/your-org/forgecrm/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/forgecrm/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Overview

ForgeCRM is a production-grade CRM platform that provides:

- Multi-workspace (multi-tenant) support
- Company, Contact, Lead, Deal, and Pipeline management
- Task and Activity tracking
- Document management
- AI-assisted productivity features
- Real-time notifications via WebSockets
- Role-Based Access Control (RBAC)

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.13 + FastAPI |
| ORM | SQLAlchemy 2.x (async) |
| Migrations | Alembic |
| Validation | Pydantic v2 |
| Database | PostgreSQL 17 |
| Cache / Queue | Redis 8 |
| Object Storage | MinIO (dev) / AWS S3 (prod) |
| Frontend | Next.js + React + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State | TanStack Query + Zustand |
| Auth | JWT + Refresh Tokens |
| Containerization | Docker + Docker Compose |

---

## Repository Structure

```
forgecrm/
├── apps/
│   ├── api/          # FastAPI backend
│   └── web/          # Next.js frontend
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── ui/           # Shared UI components
│   └── config/       # Shared configuration
├── docker/
│   ├── nginx/        # Nginx configuration
│   └── postgres/     # PostgreSQL initialization
├── infrastructure/   # Terraform, monitoring, backups
├── scripts/          # Development and deployment scripts
├── docs/             # Architecture documentation
├── planning/         # Implementation plans
├── standards/        # Engineering standards
├── .github/          # CI/CD workflows
├── .env.example      # Environment variable reference
├── docker-compose.yml
├── Makefile
└── README.md
```

---

## Quick Start

### Prerequisites

- Docker Desktop (latest stable)
- Docker Compose (latest stable)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/your-org/forgecrm.git
cd forgecrm
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start all services

```bash
make up-build
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- MinIO on port 9000 (console: 9001)
- FastAPI backend on port 8000
- Next.js frontend on port 3000
- Nginx on port 80

### 4. Run database migrations

```bash
make migrate
```

### 5. Verify health

```bash
curl http://localhost:8000/health
curl http://localhost:8000/health/ready
```

Open the application: [http://localhost:3000](http://localhost:3000)

---

## Development Commands

```bash
make help           # Show all available commands

# Services
make up             # Start services
make down           # Stop services
make logs-api       # Tail API logs

# Backend
make test           # Run tests
make lint           # Run ruff linter
make format         # Run formatter
make typecheck      # Run mypy
make migrate        # Run migrations
make migrate-create MSG="add users table"

# Database
make shell-db       # Open psql
make reset-db       # Reset dev database

# Frontend
make lint-web       # Run ESLint
make typecheck-web  # TypeScript check
```

---

## API Documentation

Once the API is running, interactive documentation is available at:

- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- OpenAPI JSON: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

---

## Health Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Overall health summary |
| `GET /health/live` | Liveness probe (API running) |
| `GET /health/ready` | Readiness probe (all services ready) |

---

## Environment Variables

See [`.env.example`](.env.example) for a complete reference of all required environment variables.

---

## Architecture Documentation

All architecture decisions and documentation live in [`docs/`](docs/).

| Directory | Contents |
|-----------|---------|
| `docs/00_Project/` | Vision, requirements, roadmap |
| `docs/01_Architecture/` | System and domain architecture |
| `docs/02_Database/` | Database schema documentation |
| `docs/03_Backend/` | Backend architecture guides |
| `docs/04_Frontend/` | Frontend architecture guides |
| `docs/05_Security/` | Security model and policies |
| `docs/06_Deployment/` | Deployment and infrastructure |
| `docs/07_Testing/` | Testing strategy |
| `docs/08_Operations/` | Operational runbooks |
| `docs/09_ADRs/` | Architecture Decision Records |

---

## Testing

```bash
# Run all backend tests
make test

# Run with coverage
make test-cov
```

---

## Security

- All passwords are hashed with bcrypt
- JWT access tokens expire in 15 minutes
- Refresh tokens rotate on every use
- All endpoints require authentication (except public routes)
- RBAC enforced on every business operation
- All inputs validated via Pydantic v2

See [`docs/05_Security/`](docs/05_Security/) for complete security documentation.

---

## Contributing

1. Read [`docs/MASTER_IMPLEMENTATION_PLAN.md`](docs/MASTER_IMPLEMENTATION_PLAN.md)
2. Create a feature branch: `feature/your-feature`
3. Follow coding standards in [`standards/`](standards/)
4. Write tests for all new features
5. Run `make check-all` before submitting a PR
6. Open a Pull Request against `develop`

---

## License

MIT License — see [LICENSE](LICENSE)

---

## Status

> **Current Milestone:** 01 — Foundation  
> **Architecture:** Frozen  
> **Status:** In Development
