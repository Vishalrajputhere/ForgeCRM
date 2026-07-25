# 301 — Backend Overview

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** Backend Architecture

---

# 1. Purpose

This document defines the backend architecture of ForgeCRM.

It establishes:

- Project structure
- Layer responsibilities
- Dependency rules
- Request lifecycle
- Coding standards
- Domain organization

Every backend implementation must follow these principles.

---

# 2. Technology Stack

Framework

- FastAPI

Language

- Python 3.13+

ORM

- SQLAlchemy 2.x

Validation

- Pydantic v2

Database

- PostgreSQL

Cache

- Redis

Background Jobs

- Celery

Authentication

- JWT
- Refresh Tokens
- Google OAuth

Object Storage

- MinIO (Development)
- Amazon S3 (Production)

---

# 3. Architecture Style

ForgeCRM uses a **Modular Monolith**.

Characteristics:

- Single deployable application
- Domain-based organization
- Clear module boundaries
- Independent business domains
- Shared infrastructure
- Easy migration to microservices if required

---

# 4. Layered Architecture

```
HTTP Request
      │
      ▼
API Router
      │
      ▼
Service
      │
      ▼
Repository
      │
      ▼
Database
```

Each layer has one responsibility.

---

# 5. Layer Responsibilities

## API Layer

Responsible for:

- Route definitions
- Request validation
- Authentication
- Authorization
- Response serialization
- HTTP status codes

Never:

- Access the database directly
- Contain business rules

---

## Service Layer

Responsible for:

- Business logic
- Transactions
- Cross-domain coordination
- Domain events
- Validation beyond schema

Never:

- Return SQLAlchemy models directly
- Parse HTTP requests

---

## Repository Layer

Responsible for:

- Database queries
- Persistence
- Pagination
- Search
- Filtering

Never:

- Implement business rules
- Trigger notifications
- Call other repositories directly unless explicitly required

---

## Infrastructure Layer

Responsible for:

- Redis
- Storage
- Email
- AI Providers
- Logging
- Background jobs

Infrastructure never owns business rules.

---

# 6. Dependency Rules

Dependencies always flow inward.

```
Router

↓

Service

↓

Repository

↓

Database
```

Forbidden:

```
Repository → Router

Repository → Service

Service → Router

Infrastructure → API
```

This prevents circular dependencies.

---

# 7. Domain Organization

Each business domain owns its code.

Example:

```
app/

    domains/

        leads/

        companies/

        deals/

        activities/

        identity/

        workspace/
```

Domains communicate only through services or events.

---

# 8. Standard Domain Structure

```
domain/

    models/

    schemas/

    repositories/

    services/

    routers/

    validators/

    permissions/

    events/

    exceptions/

    constants/
```

Every domain follows the same structure.

---

# 9. Request Lifecycle

Example

```
POST /deals

↓

Router

↓

Validate Request

↓

Authentication

↓

Authorization

↓

Service

↓

Repository

↓

Commit Transaction

↓

Activity Event

↓

Notification Event

↓

Response
```

---

# 10. Transactions

Transactions belong to the Service Layer.

Repositories never begin or commit transactions.

Example

```
Lead Conversion

↓

Create Company

↓

Create Contact

↓

Create Deal

↓

Create Timeline Events

↓

Commit
```

Rollback occurs automatically on failure.

---

# 11. Error Handling

Errors are categorized.

Examples

```
ValidationError

AuthenticationError

AuthorizationError

ConflictError

NotFoundError

BusinessRuleError

ExternalServiceError
```

Every error returns a consistent API response.

---

# 12. Logging

Every request generates:

- Request ID
- User ID (if authenticated)
- Workspace ID
- Response Status
- Execution Time

Sensitive information is never logged.

---

# 13. Configuration

Configuration is environment-based.

Examples

```
DATABASE_URL

REDIS_URL

JWT_SECRET

S3_BUCKET

OPENAI_API_KEY
```

Configuration is never hardcoded.

---

# 14. Background Jobs

Long-running tasks execute asynchronously.

Examples

- Email sending
- AI requests
- Report generation
- File processing
- Notification fan-out

The HTTP request should return as soon as possible.

---

# 15. Security Principles

Always:

- Validate input
- Scope queries by workspace
- Check permissions
- Hash passwords
- Rotate refresh tokens
- Sanitize uploads

Never trust client input.

---

# 16. Testing Strategy

Each domain supports:

- Unit tests
- Integration tests
- API tests

Business logic is tested in the Service Layer.

Repositories are tested for query correctness.

---

# 17. Performance Guidelines

Prefer:

- Indexed queries
- Bulk operations
- Pagination
- Lazy loading where appropriate
- Redis caching for expensive reads

Avoid:

- N+1 queries
- Loading unnecessary relationships
- Repeated permission lookups

---

# 18. Coding Standards

- One responsibility per class.
- Small service methods.
- Explicit typing.
- Constructor dependency injection.
- Domain-first organization.
- Consistent naming.
- No duplicated business logic.

---

# 19. Scalability

The architecture supports:

- Horizontal scaling
- Read replicas
- Background workers
- CDN-backed file storage
- External AI providers
- Event-driven extensions

No structural redesign is required for moderate-to-large deployments.

---

# 20. Summary

ForgeCRM's backend follows a layered, domain-driven Modular Monolith architecture.

By enforcing strict dependency direction, domain ownership, transactional business logic, and infrastructure isolation, the backend remains maintainable, testable, secure, and ready for future growth.
