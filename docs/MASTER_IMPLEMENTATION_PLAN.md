# ForgeCRM Master Implementation Plan

> Version: 1.0
> Status: Approved
> Architecture Status: Frozen
> Last Updated: 2026-07-25

---

# 1. Purpose

This document is the single source of truth for implementing ForgeCRM.

The architecture has been finalized through the Architecture Documentation and ADR process. From this point onward, implementation must follow the approved architecture. Architectural deviations require an approved Architecture Decision Record (ADR).

This document defines:

- Implementation order
- Engineering standards
- Repository structure
- Development workflow
- Quality gates
- Testing expectations
- AI-assisted development workflow
- Production readiness requirements

Every contributor, whether human or AI, must follow this document.

---

# 2. Project Vision

ForgeCRM is an enterprise-grade, multi-tenant Customer Relationship Management (CRM) platform designed for modern businesses.

The platform emphasizes:

- Performance
- Maintainability
- Security
- Scalability
- Extensibility
- Excellent user experience
- AI-assisted productivity

ForgeCRM is not intended to be a clone of an existing CRM. It should provide a clean, modern experience while remaining modular enough for future expansion.

---

# 3. Product Goals

The implementation should achieve the following goals:

## Functional Goals

- Manage companies and organizations
- Manage contacts
- Track leads
- Convert leads into deals
- Manage sales pipelines
- Schedule tasks and activities
- Store documents
- Generate reports
- Support multiple workspaces
- Provide AI-assisted productivity features

## Technical Goals

- Modular architecture
- Clean codebase
- Strong type safety
- Comprehensive automated testing
- Minimal technical debt
- Cloud-native deployment
- High observability
- Secure-by-default implementation

---

# 4. Non-Goals

The following are intentionally out of scope for the first production release unless explicitly approved:

- Native mobile applications
- Marketplace for third-party plugins
- Public extension SDK
- Offline-first synchronization
- Real-time collaborative editing
- Multi-region active-active deployment
- Event sourcing
- Microservices architecture

These features may be considered in future versions after the core CRM reaches production maturity.

---

# 5. Architecture Freeze Policy

The architecture is considered frozen.

Implementation teams must follow the approved documentation located under:

docs/

Changes affecting architecture require:

1. Identification of the problem.
2. Impact analysis.
3. Proposed solution.
4. Approval through a new ADR.
5. Documentation updates before implementation.

Implementation shortcuts that violate the architecture are not permitted.

---

# 6. Success Criteria

The project will be considered successful when:

- All planned milestones are complete.
- All automated tests pass.
- CI/CD pipelines remain green.
- Docker deployment works without manual intervention.
- Production monitoring is operational.
- Security review passes.
- Performance targets are met.
- Documentation is complete.
- The application is deployable to production at any time.

---

# 7. Engineering Philosophy

ForgeCRM follows these engineering principles:

- Simplicity over unnecessary complexity
- Readability over cleverness
- Composition over inheritance
- Explicit behavior over hidden behavior
- Convention over configuration where appropriate
- Automation over manual processes
- Testing as an integral part of development
- Security by default
- Observability from day one
- Incremental delivery through vertical slices

Every implementation decision should reinforce these principles.

---

# 8. Vertical Slice Development

Features are implemented as complete vertical slices.

A feature is not complete until it includes:

- Database schema
- Migration
- Repository
- Business service
- API endpoints
- Validation
- Authorization
- Frontend UI
- Error handling
- Logging
- Audit logging
- Automated tests
- Documentation

Partial implementations should not be merged into the main development branch.

---

# 9. Guiding Rule

The repository should remain in a deployable state throughout development.

Every milestone must produce a working application that can be built, tested, and run using the documented setup process.


---

# 10. Repository Structure & Monorepo Design

## 10.1 Repository Philosophy

ForgeCRM is maintained as a single Git repository (monorepo).

The repository contains all application code, infrastructure, documentation, automation, and engineering standards required to build and operate the product.

A monorepo was selected because it provides:

- Simplified dependency management
- Consistent versioning
- Easier cross-project refactoring
- Shared tooling
- Unified CI/CD
- Better developer experience
- Simplified onboarding
- Atomic commits across frontend and backend

The repository should remain the single source of truth for the entire platform.

---

# 10.2 Top-Level Directory Structure

```
forgecrm/
│
├── apps/
├── packages/
├── infrastructure/
├── docker/
├── scripts/
├── docs/
├── planning/
├── standards/
├── .github/
│
├── .env.example
├── docker-compose.yml
├── Makefile
├── README.md
├── LICENSE
└── .gitignore
```

Every top-level directory has a clearly defined responsibility.

No application code should exist outside the designated application folders.

---

# 10.3 Applications

```
apps/
│
├── api/
│
└── web/
```

### api/

Contains the FastAPI backend.

Responsibilities include:

- REST API
- Authentication
- Business logic
- Database access
- Background jobs
- AI integration
- Event handling

No frontend code belongs here.

---

### web/

Contains the Next.js frontend.

Responsibilities include:

- User interface
- Routing
- Forms
- Dashboards
- Client-side state
- API communication
- Responsive layouts

No backend business logic belongs here.

---

# 10.4 Shared Packages

```
packages/
│
├── types/
├── ui/
├── config/
├── eslint/
└── tooling/
```

Shared packages eliminate duplication across applications.

---

## packages/types

Contains shared TypeScript types.

Examples:

- API contracts
- DTOs
- Shared enums
- Shared constants

---

## packages/ui

Reusable UI components.

Examples:

- Buttons
- Cards
- Tables
- Dialogs
- Icons
- Layout primitives

Business-specific components remain inside the web application.

---

## packages/config

Centralized configuration.

Examples:

- Environment schemas
- Shared constants
- Build configuration
- Feature flags

---

## packages/eslint

Shared linting configuration.

One configuration should be used across every TypeScript project.

---

## packages/tooling

Developer tooling.

Examples:

- Shared scripts
- Build helpers
- Code generation
- Development utilities

---

# 10.5 Infrastructure

```
infrastructure/
│
├── nginx/
├── monitoring/
├── backups/
├── terraform/
└── production/
```

Infrastructure files remain independent from application code.

Infrastructure changes should be version controlled.

---

# 10.6 Docker

```
docker/
│
├── api/
├── web/
├── postgres/
├── redis/
├── minio/
└── nginx/
```

Each service owns its own Docker configuration.

Avoid creating one oversized Dockerfile for unrelated services.

---

# 10.7 Scripts

```
scripts/
│
├── setup/
├── database/
├── deployment/
├── maintenance/
└── development/
```

Scripts automate repetitive work.

Examples:

- Local setup
- Database reset
- Seed data
- Backup creation
- Deployment helpers
- Log cleanup

Manual processes should be minimized whenever automation is practical.

---

# 10.8 Documentation

```
docs/
```

Contains the approved architecture documentation.

Developers should never implement features that contradict these documents without an approved ADR.

---

# 10.9 Planning

```
planning/
```

Contains implementation plans.

This directory is execution-focused rather than architecture-focused.

---

# 10.10 Standards

```
standards/
```

Contains engineering standards.

Examples:

- Coding standards
- API conventions
- Review checklists
- Definition of Done

These documents evolve independently of the architecture.

---

# 10.11 GitHub Configuration

```
.github/
│
├── workflows/
├── ISSUE_TEMPLATE/
├── PULL_REQUEST_TEMPLATE.md
└── CODEOWNERS
```

GitHub automation should include:

- CI pipelines
- Pull request validation
- Issue templates
- Release workflows

---

# 10.12 Backend Directory Structure

```
apps/api/

app/
│
├── api/
├── core/
├── db/
├── modules/
├── services/
├── events/
├── workers/
├── storage/
├── ai/
├── middleware/
├── schemas/
├── utils/
└── main.py
```

Responsibilities:

- `api/` → Route registration
- `core/` → Configuration, security, shared utilities
- `db/` → Database engine, sessions, migrations
- `modules/` → Business domains
- `services/` → Cross-module services
- `events/` → Domain events and handlers
- `workers/` → Background processing
- `storage/` → Object storage abstraction
- `ai/` → AI provider abstraction
- `middleware/` → HTTP middleware
- `schemas/` → Shared request and response models
- `utils/` → Generic helpers

---

# 10.13 Module Layout

Every business module follows the same structure.

```
modules/

companies/

├── models.py
├── schemas.py
├── repository.py
├── service.py
├── routes.py
├── permissions.py
├── events.py
├── exceptions.py
├── validators.py
└── tests/
```

Predictable structure reduces onboarding time and simplifies navigation.

---

# 10.14 Frontend Directory Structure

```
apps/web/

src/

├── app/
├── components/
├── modules/
├── hooks/
├── services/
├── lib/
├── store/
├── styles/
├── types/
└── utils/
```

The frontend should organize code by feature rather than by file type whenever practical.

---

# 10.15 Dependency Rules

Dependencies must always point inward toward stable abstractions.

The following rules apply:

- UI never accesses the database directly.
- Routes never contain business logic.
- Services never depend on UI.
- Repositories never know about HTTP.
- Modules communicate through services or domain events.
- Shared packages must not depend on application code.
- Circular dependencies are prohibited.

Any dependency cycle must be resolved before merging.

---

# 10.16 Import Rules

Prefer absolute imports within applications.

Examples:

- `app.modules.leads.service`
- `@/modules/contacts/components`

Avoid deeply nested relative imports.

Imports should clearly communicate ownership and module boundaries.

---

# 10.17 Repository Health Rules

The repository should always satisfy the following conditions:

- Builds successfully
- Tests pass
- Formatting passes
- Linting passes
- Docker starts successfully
- Documentation remains current
- No dead code
- No unused dependencies
- No circular imports
- No duplicated business logic

Repository quality is everyone's responsibility.

---

# 10.18 Exit Criteria

This section is complete when:

- Repository structure has been created.
- Every top-level directory exists.
- Folder responsibilities are documented.
- Dependency rules are understood.
- Module templates are standardized.
- Backend and frontend layouts are established.

Only after these criteria are met should implementation of Milestone 01 (Foundation) begin.


---

# 11. Development Workflow & Git Strategy

## 11.1 Purpose

A consistent development workflow ensures that ForgeCRM remains stable, maintainable, and deployable throughout its lifecycle.

Every change, regardless of size, should follow the same engineering process.

The objectives are to:

- Maintain a deployable codebase
- Minimize integration conflicts
- Improve code quality
- Enable predictable releases
- Simplify debugging
- Preserve architectural integrity

---

# 11.2 Branching Model

ForgeCRM follows a simplified Git Flow model.

```
main
│
├── develop
│
├── feature/foundation
├── feature/auth
├── feature/workspaces
├── feature/companies
├── feature/contacts
├── feature/leads
├── feature/deals
├── feature/tasks
├── feature/notifications
└── feature/ai
```

### main

Production-ready code only.

Rules:

- Protected branch
- No direct commits
- Every commit must originate from a reviewed Pull Request
- CI must pass before merge

---

### develop

Integration branch.

Rules:

- All completed features merge into develop
- Must remain deployable
- Used for integration testing

---

### feature/*

Short-lived feature branches.

Examples:

```
feature/auth
feature/companies
feature/leads
feature/dashboard
feature/ai-email
```

Rules:

- One feature per branch
- Keep branches focused
- Merge promptly after review
- Delete merged branches

---

# 11.3 Feature Development Lifecycle

Every feature follows the same lifecycle.

```
Requirement
      │
      ▼
Architecture Review
      │
      ▼
Create Feature Branch
      │
      ▼
Database
      │
      ▼
Backend
      │
      ▼
Frontend
      │
      ▼
Tests
      │
      ▼
Documentation
      │
      ▼
Pull Request
      │
      ▼
Review
      │
      ▼
Merge into develop
```

Skipping steps is not permitted.

---

# 11.4 Vertical Slice Development

Features are completed end-to-end before starting unrelated work.

Example:

❌ Wrong

- Database for 10 modules
- APIs for 10 modules
- UI for 10 modules

✔ Correct

Lead Module

- Database
- Migration
- Repository
- Service
- API
- Frontend
- Tests
- Documentation

Then proceed to the next module.

---

# 11.5 Commit Strategy

Commits should be:

- Small
- Atomic
- Reversible
- Easy to understand

Avoid mixing unrelated changes.

Examples:

Good:

```
Add lead repository

Implement JWT refresh endpoint

Fix task validation

Add company search API
```

Bad:

```
Update project

Fix stuff

Changes

Final updates
```

---

# 11.6 Commit Message Convention

Recommended format:

```
type(scope): summary
```

Examples:

```
feat(auth): add refresh token rotation

fix(leads): prevent duplicate conversion

refactor(tasks): simplify service layer

docs(api): update endpoint documentation

test(companies): add repository tests

chore(ci): enable backend caching
```

Types:

- feat
- fix
- docs
- refactor
- test
- chore
- perf
- ci
- build

---

# 11.7 Pull Request Rules

Every Pull Request should contain:

- Objective
- Scope
- Related issue or milestone
- Testing performed
- Screenshots (UI changes)
- Breaking changes
- Migration requirements

Large PRs should be avoided.

Aim for reviewable changes.

---

# 11.8 Pull Request Checklist

Before requesting review:

- Code builds
- Tests pass
- Lint passes
- Formatting passes
- Documentation updated
- No TODOs without justification
- No debug code
- No commented-out production code
- No secrets committed
- Docker builds successfully

Only complete PRs should be submitted.

---

# 11.9 Code Review Guidelines

Reviews should evaluate:

## Correctness

- Does the feature work?

## Architecture

- Does it follow approved architecture?

## Readability

- Can another engineer understand it?

## Security

- Any vulnerabilities?

## Performance

- Any obvious bottlenecks?

## Testing

- Are critical paths tested?

## Maintainability

- Will this be easy to modify later?

The objective is to improve the code, not criticize the author.

---

# 11.10 Merge Policy

A feature may be merged only when:

- CI passes
- Required reviews completed
- Documentation updated
- Acceptance criteria satisfied
- No unresolved blocking comments

Do not merge failing builds.

---

# 11.11 Hotfix Workflow

Critical production issues follow:

```
main
   │
   ▼
hotfix/*
   │
   ▼
Review
   │
   ▼
main
   │
   └────► develop
```

Hotfixes should be minimal and targeted.

---

# 11.12 Release Workflow

```
develop
     │
     ▼
Release Candidate
     │
     ▼
Regression Testing
     │
     ▼
Production Approval
     │
     ▼
main
     │
     ▼
Deployment
```

Every release should have:

- Version number
- Release notes
- Database migration review
- Rollback plan

---

# 11.13 Daily Development Routine

Recommended daily workflow:

1. Pull latest develop
2. Create feature branch
3. Implement one vertical slice
4. Run tests locally
5. Update documentation
6. Commit changes
7. Push branch
8. Open Pull Request
9. Address review comments
10. Merge after approval

Consistency is more valuable than speed.

---

# 11.14 AI-Assisted Development Workflow

When using AI:

1. Read relevant architecture documents.
2. Read this implementation plan.
3. Understand the current milestone.
4. Implement only the requested scope.
5. Follow project conventions.
6. Write tests.
7. Update documentation.
8. Produce a summary of changes.
9. Stop and wait for review.

AI should never implement unrelated features.

---

# 11.15 Engineering Rules

The following rules are mandatory:

- No direct database access from UI
- No business logic inside routes
- No duplicated business rules
- No hardcoded secrets
- No skipping tests
- No bypassing authorization
- No architecture changes without an ADR
- No merging broken builds
- No long-lived feature branches

These rules preserve long-term code quality.

---

# 11.16 Exit Criteria

This section is complete when:

- Git strategy is documented.
- Branching model is established.
- Commit conventions are defined.
- Pull Request workflow is approved.
- Code review expectations are documented.
- AI development workflow is documented.
- Release process is defined.

Development can now proceed using a repeatable engineering process.


---

# 12. Coding Standards & Engineering Conventions

## 12.1 Purpose

The purpose of these standards is to ensure that every line of code in ForgeCRM is:

- Readable
- Maintainable
- Testable
- Secure
- Predictable
- Easy to review

Consistency is more important than individual coding style.

If a developer or AI has to guess how something should be implemented, this document is incomplete.

---

# 12.2 General Engineering Principles

Every implementation should prioritize:

- Simplicity over cleverness
- Explicit code over hidden behavior
- Composition over inheritance
- Small functions over large classes
- Readability over brevity
- Immutable data where practical
- Strong typing
- Defensive programming
- Clear separation of concerns

Always optimize for the next engineer who will read the code.

---

# 12.3 Naming Conventions

Names should clearly describe intent.

### Variables

Good

```python
customer_id
workspace_name
lead_score
created_at
```

Bad

```python
x
tmp
data
obj
value
```

---

### Functions

Function names should describe actions.

Good

```python
create_workspace()

convert_lead()

calculate_probability()

send_invitation_email()
```

Bad

```python
do_it()

handle()

process()

run()
```

---

### Classes

Use PascalCase.

Examples

```
WorkspaceService

LeadRepository

AuthController

NotificationDispatcher
```

---

### Constants

Use uppercase.

```
MAX_UPLOAD_SIZE

DEFAULT_PAGE_SIZE

ACCESS_TOKEN_TTL
```

---

### Files

Use lowercase with underscores for Python.

```
workspace_service.py

notification_dispatcher.py
```

Use kebab-case where appropriate for frontend routes.

```
lead-details

company-profile

user-settings
```

---

# 12.4 Python Standards

Backend follows:

- PEP 8
- Type hints everywhere
- Pydantic v2 models
- SQLAlchemy 2 style
- Ruff
- Black

Every public function should include:

- Parameters
- Return type
- Docstring where business logic is non-trivial

Example

```python
def create_company(
    workspace_id: UUID,
    payload: CompanyCreate,
) -> Company:
    """Create a company within the specified workspace."""
```

---

# 12.5 TypeScript Standards

Frontend uses strict TypeScript.

Rules:

- noImplicitAny
- strict mode
- exact optional property types
- no unused variables
- no implicit returns

Avoid

```ts
const data: any
```

Prefer

```ts
const data: Company
```

---

# 12.6 Function Design

Functions should:

- Have one responsibility
- Be easy to test
- Avoid hidden side effects
- Return predictable values

Prefer

```python
validate_email()

generate_slug()

hash_password()
```

Over

```python
process_everything()
```

---

# 12.7 Class Design

Classes should encapsulate a single concept.

Avoid "God Objects."

Example

Good

```
LeadService

LeadRepository

LeadValidator
```

Bad

```
CRMManager
```

---

# 12.8 Dependency Injection

Prefer constructor or framework-supported dependency injection.

Avoid creating dependencies inside business logic.

Bad

```python
service = EmailService()
```

Good

```python
class LeadService:

    def __init__(
        self,
        email_service: EmailService
    ):
        ...
```

Dependencies should be replaceable during testing.

---

# 12.9 Error Handling

Errors should be:

- Explicit
- Logged
- Meaningful
- Recoverable where possible

Never

```python
except:
    pass
```

Instead

```python
except ValidationError as exc:
    logger.exception(exc)
    raise
```

Do not swallow exceptions.

---

# 12.10 Logging Standards

Every log should answer:

- What happened?
- Where?
- Why?
- Who?
- Correlation ID?

Use structured logging.

Example

```json
{
  "event":"lead_created",
  "workspace_id":"...",
  "user_id":"...",
  "lead_id":"...",
  "correlation_id":"..."
}
```

Never log:

- Passwords
- Tokens
- Secrets
- Credit card information
- Sensitive personal data

---

# 12.11 Configuration

Configuration belongs in environment variables.

Never hardcode:

- API keys
- Secrets
- Database credentials
- JWT secrets
- Storage credentials

Configuration should be validated during application startup.

Applications should fail fast if required configuration is missing.

---

# 12.12 API Design Standards

REST endpoints should use nouns.

Good

```
GET /companies

POST /companies

GET /companies/{id}

PATCH /companies/{id}

DELETE /companies/{id}
```

Avoid

```
/createCompany

/getCompany

/deleteLead
```

---

# 12.13 Validation

Validation should occur:

- At API boundaries
- Before database writes
- Before external API calls

Never trust client input.

Every request must be validated.

---

# 12.14 Database Standards

Database rules:

- UUIDv7 primary keys
- Foreign keys enforced
- Indexed lookup columns
- Soft deletes where required
- UTC timestamps
- snake_case naming
- Alembic migrations only

Never manually modify production schemas.

---

# 12.15 SQLAlchemy Standards

Prefer ORM models for business operations.

Use explicit relationships.

Avoid:

- N+1 queries
- Lazy loading surprises
- Hidden transactions

Review generated SQL for performance-critical endpoints.

---

# 12.16 Frontend Standards

Frontend components should be:

- Small
- Reusable
- Accessible
- Typed
- Feature-oriented

Avoid deeply nested component trees.

Keep business logic out of UI components where practical.

---

# 12.17 State Management

Use state according to scope.

Local state

- UI interactions

TanStack Query

- Server state

Zustand

- Global client state

Avoid unnecessary global state.

---

# 12.18 Testing Standards

Every feature should include:

- Unit tests
- Integration tests
- API tests
- Permission tests
- Error-path tests

Critical business logic should not rely solely on manual testing.

---

# 12.19 Security Standards

Security requirements include:

- Input validation
- Output encoding
- Parameterized queries
- RBAC enforcement
- Least privilege
- Secure password hashing
- HTTPS in production
- CSRF protection where applicable
- Rate limiting
- Audit logging

Security is a default requirement, not an optional enhancement.

---

# 12.20 Performance Standards

Performance guidelines:

- Avoid unnecessary database queries
- Paginate large datasets
- Cache appropriate data
- Optimize indexes
- Compress responses
- Minimize bundle size
- Lazy load large frontend modules

Measure before optimizing.

---

# 12.21 Documentation Standards

Documentation should accompany implementation.

Every completed feature should update:

- API documentation
- Architecture references (if affected)
- User documentation (when applicable)
- Changelog (for significant changes)

Documentation is part of the feature, not an afterthought.

---

# 12.22 Code Review Checklist

Reviewers should verify:

- Correctness
- Readability
- Security
- Performance
- Test coverage
- Architecture compliance
- Error handling
- Documentation

Approval indicates confidence that the code is production-ready.

---

# 12.23 Definition of Done

A feature is complete only when:

- Requirements implemented
- Tests passing
- Documentation updated
- CI passing
- Security review completed
- Performance reviewed
- Code reviewed
- Merged successfully

Anything less is considered work in progress.

---

# 12.24 Exit Criteria

This section is complete when:

- Coding conventions are documented.
- Naming rules are established.
- API standards are defined.
- Database standards are documented.
- Logging and error handling rules are approved.
- Security standards are documented.
- Performance expectations are defined.
- Definition of Done is accepted.

These standards apply to every future contribution, whether written by a human or generated by an AI assistant.


---

# 13. Milestone 01 — Foundation

## 13.1 Objective

The Foundation milestone establishes the technical platform for ForgeCRM.

No business features are implemented during this milestone.

Instead, the objective is to produce a stable, reproducible, and production-ready development environment upon which all future milestones depend.

At the completion of this milestone, every engineer should be able to clone the repository, execute a single setup command, and have the complete local development environment running successfully.

---

# 13.2 Success Criteria

Milestone 01 is complete when:

- Repository structure exists
- FastAPI starts successfully
- Next.js starts successfully
- PostgreSQL is running
- Redis is running
- MinIO is running
- Docker Compose starts all services
- Environment variables load correctly
- Database migrations execute successfully
- Logging is operational
- Health endpoints return healthy status
- CI pipeline passes
- Pre-commit hooks execute successfully
- Initial documentation is complete

No CRM functionality is required at this stage.

---

# 13.3 Deliverables

This milestone delivers:

## Backend

- FastAPI application scaffold
- Configuration system
- Database engine
- Alembic
- Logging
- Health API
- Dependency injection
- Middleware
- Exception handling

---

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zustand
- Routing
- Shared layout
- Theme provider

---

## Infrastructure

- Docker Compose
- PostgreSQL
- Redis
- MinIO
- Nginx (development-ready)
- Named Docker volumes
- Internal Docker networking

---

## Engineering

- GitHub Actions
- Ruff
- Black
- ESLint
- Prettier
- Husky (or equivalent)
- Commit linting
- Repository README

---

# 13.4 Repository Creation

Create the repository.

Initialize:

```
git init
```

Create:

```
main

develop
```

Protect the `main` branch before production development begins.

---

# 13.5 Monorepo Setup

Repository structure:

```
forgecrm/

apps/
packages/
docker/
infrastructure/
scripts/
docs/
planning/
standards/
.github/
```

Create empty placeholder directories immediately.

Future work should never introduce undocumented top-level folders.

---

# 13.6 Backend Bootstrap

Create:

```
apps/api
```

Install:

- FastAPI
- Uvicorn
- SQLAlchemy 2
- Alembic
- Pydantic v2
- psycopg
- Redis client
- boto3 (or chosen S3-compatible SDK)
- structlog
- pytest

Configure:

- Application factory
- Dependency injection
- Router registration
- Settings loader
- Logging
- Exception handlers

---

# 13.7 Frontend Bootstrap

Create:

```
apps/web
```

Install:

- Next.js
- TypeScript
- Tailwind
- shadcn/ui
- TanStack Query
- Zustand
- React Hook Form
- Zod

Configure:

- App Router
- Global layout
- Theme
- Fonts
- API client
- Environment loader

---

# 13.8 Docker Compose

Create containers for:

```
api

web

postgres

redis

minio

nginx
```

Requirements:

- Persistent volumes
- Health checks
- Restart policies
- Internal network
- Environment variables
- Service dependencies

Containers must communicate using service names rather than localhost.

---

# 13.9 PostgreSQL

Initialize:

- Primary database
- Development database
- Test database

Configure:

- UTF-8 encoding
- UTC timezone
- Named volume
- Backup directory

Verify successful connections from FastAPI.

---

# 13.10 Redis

Configure:

- Persistence
- Password (non-production default acceptable for local development if documented)
- Health check
- Named volume

Redis will support:

- Caching
- Background jobs
- Rate limiting
- Future pub/sub needs

---

# 13.11 MinIO

Configure:

- Development bucket
- Access credentials
- Named volume
- Health endpoint

Do not expose storage implementation details to application modules.

---

# 13.12 Environment Configuration

Create:

```
.env.example
```

Separate:

Development

Testing

Production

Every required variable should be documented.

Applications should fail during startup if mandatory configuration is missing or invalid.

---

# 13.13 Logging

Requirements:

- Structured JSON logs
- Correlation IDs
- Request logging
- Error logging
- Startup logging

Never log:

- Passwords
- Secrets
- Access tokens
- Refresh tokens

---

# 13.14 Health Endpoints

Backend:

```
GET /health

GET /health/live

GET /health/ready
```

Checks should verify:

- API
- Database
- Redis
- Object storage (basic connectivity if applicable)

These endpoints support local development, orchestration, and future monitoring.

---

# 13.15 Exception Handling

Create a centralized exception handling strategy.

Requirements:

- Validation errors
- Authentication errors
- Authorization errors
- Not found
- Conflict
- Internal server errors

Responses should use a consistent error schema.

---

# 13.16 Middleware

Register:

- Request ID
- Correlation ID
- CORS
- Request logging
- Security headers
- Compression (where appropriate)

Middleware order should be documented and tested.

---

# 13.17 CI/CD

GitHub Actions should execute:

- Backend lint
- Backend tests
- Frontend lint
- Frontend type check
- Frontend tests
- Docker build verification

A failing pipeline blocks merges into protected branches.

---

# 13.18 Code Quality Tooling

Backend:

- Ruff
- Black
- mypy (recommended)
- pytest

Frontend:

- ESLint
- Prettier
- TypeScript compiler

Automate checks wherever practical.

---

# 13.19 Pre-Commit Hooks

Hooks should verify:

- Formatting
- Linting
- Basic tests (fast subset)
- No merge conflict markers
- No accidental large binaries
- No committed secrets

Hooks improve quality before code reaches CI.

---

# 13.20 Documentation

Update:

- README
- Local setup guide
- Environment variable reference
- Development workflow
- Troubleshooting notes

A new contributor should be able to complete setup without external guidance.

---

# 13.21 Acceptance Criteria

This milestone is accepted only if:

- All services start with Docker Compose
- Backend serves health endpoints
- Frontend loads successfully
- Database migrations run
- Redis is reachable
- MinIO is reachable
- CI passes
- Local development is documented
- Repository structure matches the implementation plan

No placeholder failures or manual workarounds should be required.

---

# 13.22 AI Implementation Instructions

When implementing this milestone:

1. Read the approved architecture documents.
2. Read this implementation plan.
3. Scaffold only the Foundation components.
4. Do not implement authentication or CRM features.
5. Ensure all quality gates pass.
6. Produce a summary of created files.
7. List any assumptions made.
8. Stop after Milestone 01 is complete.

Future milestones build on this foundation and should not be started prematurely.

---

# 13.23 Exit Criteria

Milestone 01 is complete when:

- The repository is fully scaffolded.
- Every infrastructure service starts successfully.
- Backend and frontend run locally.
- CI passes.
- Documentation is complete.
- The project is ready for Milestone 02 (Authentication).


---

# 14. Engineering Baseline & Technology Matrix

## 14.1 Purpose

This section defines the official engineering baseline for ForgeCRM.

Every developer, CI pipeline, Docker image, and AI implementation must target these versions unless an approved Architecture Decision Record (ADR) updates this document.

Using consistent tooling minimizes environment-specific bugs and improves reproducibility.

---

# 14.2 Supported Operating Systems

Development is officially supported on:

- Windows 11
- macOS (latest stable)
- Ubuntu 24.04 LTS

Other Linux distributions are expected to work but are not officially validated.

---

# 14.3 Hardware Recommendations

Minimum:

- 4 CPU cores
- 16 GB RAM
- 30 GB free disk space

Recommended:

- 8 CPU cores
- 32 GB RAM
- SSD storage
- Docker Desktop (or Docker Engine on Linux)

---

# 14.4 Core Technology Matrix

| Technology | Baseline |
|------------|----------|
| Python | 3.13.x |
| Node.js | 22 LTS |
| FastAPI | Latest stable compatible with Python baseline |
| SQLAlchemy | 2.x |
| Alembic | Latest stable |
| Pydantic | 2.x |
| PostgreSQL | 17 |
| Redis | 8 |
| MinIO | Latest stable |
| Next.js | Latest stable major |
| React | Latest stable major supported by Next.js |
| TypeScript | Latest stable |
| Tailwind CSS | Latest stable |
| Docker Engine | Latest stable |
| Docker Compose | Latest stable |
| Git | Latest stable |

Exact patch versions should be recorded in lock files and container images.

---

# 14.5 Dependency Management

Backend:

- pyproject.toml
- Lock dependencies before release
- Avoid unnecessary packages

Frontend:

- package.json
- Lockfile committed to the repository
- Prefer stable releases over experimental packages

Every dependency must have a clear purpose.

---

# 14.6 Upgrade Policy

Routine upgrades:

- Patch updates: monthly
- Minor updates: quarterly
- Major updates: only after evaluation

Before any upgrade:

- Review release notes
- Run automated tests
- Verify Docker builds
- Validate production deployment

No major dependency should be upgraded directly on the production branch.

---

# 14.7 Browser Support

Officially supported:

- Chrome (latest)
- Edge (latest)
- Firefox (latest)
- Safari (latest)

Internet Explorer is not supported.

---

# 14.8 API Compatibility

REST APIs follow semantic versioning.

Guidelines:

- Breaking changes require a new API version.
- Backward-compatible additions may be introduced within the same version.
- Deprecated endpoints must include a migration timeline.

---

# 14.9 Environment Consistency

Every environment should behave as similarly as possible.

Development

- Docker Compose
- Local PostgreSQL
- Local Redis
- Local MinIO

Testing

- Isolated databases
- Disposable infrastructure
- Automated execution

Production

- Managed or production-grade services
- HTTPS
- Monitoring
- Backups
- Secret management

Configuration differences should be minimized.

---

# 14.10 Time & Locale Standards

The application should use:

- UTC for all persisted timestamps
- ISO 8601 date/time formatting
- UTF-8 encoding throughout the system

User-facing formatting should be localized in the frontend when appropriate.

---

# 14.11 Security Baseline

Minimum security expectations:

- HTTPS in production
- Strong password hashing
- JWT expiration
- Refresh token rotation
- Rate limiting
- RBAC enforcement
- Audit logging
- Secure secret management

Security controls are mandatory, not optional enhancements.

---

# 14.12 Quality Baseline

Every commit should satisfy:

- Builds successfully
- Lint passes
- Formatting passes
- Tests pass
- Documentation updated
- No critical security findings
- No known architecture violations

---

# 14.13 Exit Criteria

This section is complete when:

- Supported platforms are documented.
- Core technologies are standardized.
- Upgrade policy is defined.
- Dependency management is established.
- Browser support is documented.
- Security baseline is approved.
- Quality baseline is accepted.

Future implementation should target this engineering baseline unless superseded by an approved ADR.


