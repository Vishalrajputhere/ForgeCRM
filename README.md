# ForgeCRM Enterprise

> **Production-Ready, Multi-Tenant Customer Relationship Management & Revenue Operations Platform**

[![Backend Tests](https://img.shields.io/badge/pytest-153%20passed-success?logo=pytest)](apps/api)
[![Frontend Tests](https://img.shields.io/badge/vitest-35%20passed-success?logo=vitest)](apps/web)
[![TypeScript](https://img.shields.io/badge/typescript-strict-blue?logo=typescript)](apps/web)
[![Python](https://img.shields.io/badge/python-3.13%2B-blue?logo=python)](apps/api)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?logo=fastapi)](apps/api)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)](apps/web)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Architecture Overview

ForgeCRM is an enterprise-grade CRM engineered for modern B2B sales organizations, revenue operations teams, and executive leadership. Built on a modular monorepo architecture, it guarantees strict multi-tenant data isolation, database-authoritative dynamic RBAC, asynchronous background job processing, and context-grounded AI capabilities.

```
[ Next.js 15 App Router Frontend (44 Static & Dynamic Routes) ]
                              │
                    (Axios Client / API Layer)
                              │
                              ▼
[ FastAPI Enterprise Gateway (15 Domain Modules) ]
  ├── Identity & Dynamic RBAC (Real-Time SSE Sync)
  ├── Multi-Tenant Isolation (X-Workspace-ID Scoping)
  ├── CRM Domain Services (Companies, Contacts, Leads, Deals, Pipelines)
  ├── Commercial Catalog & Decimal Line Items Engine
  ├── Workflow Automation & Async Event Bus
  ├── Storage & Attachment Service (MinIO S3 Presigned URLs)
  ├── Global Search Engine (Trigram Multi-Entity Indexing)
  ├── Analytics & BI Aggregation Services
  ├── Celery Distributed Task Processing (Redis Queue)
  └── AI Copilot & 18 Enterprise Skills Engine
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
[ PostgreSQL 16 DB ]   [ Redis 7 Queue ]   [ MinIO S3 Store ]
 (38 Domain Tables)     (Broker + State)    (Bucket: forgecrm)
```

---

## Key Platform Capabilities

### 1. CRM & Revenue Operations
- **Account & Contact Management**: Full 360-degree account intelligence with communication timelines, custom fields, and linked opportunities.
- **Lead Intake & Atomic Conversion**: Ingest leads with priority scoring and execute one-click atomic conversions into Company + Contact + Deal.
- **Visual Kanban Pipelines**: Dynamic stage progression with probability-weighted revenue forecasting and stage dwell telemetry.
- **Product Catalog & Line Items**: SKU management with decimal monetary precision, custom discounts/taxes, and historical price snapshot invariance.
- **Task & Activity Tracking**: Polymorphic association across leads, deals, contacts, and companies.

### 2. Workflow Automation & Background Jobs
- **Event-Driven Automation**: Trigger-condition-action workflow engine supporting 14 CRM lifecycle events with execution history.
- **Distributed Celery Queue**: Background task workers for async email dispatch, data imports/exports, and scheduled token maintenance.
- **Resilient Execution**: Redis-backed state tracking with 7-day TTL, idempotency keys, and exponential backoff retry policies.

### 3. Enterprise Security & Dynamic RBAC
- **Multi-Tenant Isolation**: Strict tenant scoping across all repository queries and object storage paths.
- **Dynamic RBAC with Live Push**: Role/permission updates synchronized to clients in real-time via Server-Sent Events (SSE).
- **Session Security**: JWT access/refresh token rotation, session revocation, and immutable compliance audit trails.

### 4. AI Sales Intelligence (18 Enterprise Skills)
- **Enterprise Context Builder**: Assembles live CRM records, conversation history, and RAG document chunks with automated PII masking.
- **Sales Copilot**: Real-time SSE token streaming for sales strategy, account research, and objection handling.
- **Specialized AI Skills**: AI Deal Coach, BANT Lead Qualification, Revenue Forecast AI, Email Assistant, and Executive Briefing Generator.

---

## Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 15.5+ (App Router) | Server Components, Client Hydration, Turbopack |
| **UI & Styling** | React 19, Tailwind CSS, Lucide | Design-system compliant, responsive dark interface |
| **Client State** | TanStack React Query v5, Zustand v5 | Optimistic updates, cache invalidation, global auth |
| **Backend API** | FastAPI 0.115+, Python 3.13+ | Asynchronous REST endpoints, Dependency Injection |
| **ORM & Migrations** | SQLAlchemy 2.0 (Async), Alembic | Asyncpg connection pooling, migration versioning |
| **Primary Database** | PostgreSQL 16 | ACID-compliant transactional relational storage |
| **Cache & Broker** | Redis 7 | Celery task broker, semantic AI cache, SSE state |
| **Object Storage** | MinIO (S3-Compatible) | Presigned upload/download URL asset management |
| **Testing** | Pytest, Vitest, Playwright | 153 backend tests, 35 unit tests, 4 E2E suites |

---

## Repository Structure

```
forgecrm/
├── apps/
│   ├── api/                    # FastAPI Backend Application
│   │   ├── app/
│   │   │   ├── core/           # Security, config, dependencies, middleware
│   │   │   ├── db/             # Engine, base declarative metadata, migrations
│   │   │   └── modules/        # Domain modules (crm, ai, identity, jobs, etc.)
│   │   └── tests/              # Pytest automated test suite (153 tests)
│   └── web/                    # Next.js Frontend Application
│       ├── src/
│       │   ├── app/            # App Router (44 static & dynamic routes)
│       │   ├── components/     # UI design system & CRM domain components
│       │   ├── hooks/          # React Query & mutation hooks
│       │   ├── stores/         # Zustand state stores
│       │   └── types/          # TypeScript domain type definitions
│       ├── e2e/                # Playwright End-to-End test suites
│       └── vitest.config.ts    # Vitest unit test configuration
├── docker/                     # Container configurations (Postgres, MinIO, Nginx)
├── infrastructure/             # Terraform & deployment configurations
├── docs/                       # Architectural Decision Records & specifications
├── docker-compose.yml          # Multi-service local orchestrator
└── Makefile                    # Unified developer task runner
```

---

## Getting Started

### Prerequisites
- [Docker](https://www.docker.com/) & Docker Compose (v2.20+)
- [Node.js](https://nodejs.org/) (v20+ LTS) & `npm`
- [Python](https://www.python.org/) (v3.13+)

### 1. Clone & Configure
```bash
git clone https://github.com/your-org/forgecrm.git
cd forgecrm

# Copy environment configuration template
cp .env.example .env
```

### 2. Launch Infrastructure Services
```bash
# Start PostgreSQL, Redis, and MinIO
docker compose up -d postgres redis minio
```

### 3. Run Backend (FastAPI)
```bash
cd apps/api

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -e .

# Run database migrations
alembic upgrade head

# Start API server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Start Celery Background Worker
```bash
cd apps/api
celery -A app.modules.jobs.worker.celery_app worker --loglevel=info -Q default,email,maintenance,import,export,automation,ai
```

### 5. Run Frontend (Next.js)
```bash
cd apps/web

# Install dependencies
npm install

# Start development server
npm run dev
```

The web application will be accessible at `http://localhost:3000`.  
The API interactive documentation is available at `http://localhost:8000/docs`.

---

## Automated Testing Suite

### Backend Unit & Integration Tests (Pytest)
```bash
cd apps/api
python -m pytest tests/ -v
```
*Current Suite Status:* **153 / 153 Tests Passing (100%)**

### Frontend Unit Tests (Vitest)
```bash
cd apps/web
npm test
```
*Current Suite Status:* **35 / 35 Tests Passing (100%)**

### TypeScript Type Checking & Production Build
```bash
cd apps/web
npx tsc --noEmit
npm run build
```
*Build Status:* **44 / 44 Static and Dynamic Routes Compiled Successfully**

### End-to-End Testing (Playwright)
```bash
cd apps/web
npm run test:e2e
```

---

## Security & Compliance

- **Authentication**: Argon2/bcrypt password hashing, HMAC-SHA256 JWT access tokens (15m TTL), rotating refresh tokens.
- **Authorization**: Granular, role-based capability validation enforced on all API route dependencies.
- **Multi-Tenancy**: Isolated database queries filtered by tenant workspace context; cross-tenant access returns `404/403`.
- **Data Protection**: Parameterized SQL queries via SQLAlchemy 2.0 (SQL injection prevention), XSS mitigation, CORS origin restriction, and PII masking on AI prompts.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
