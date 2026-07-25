# 101 — System Architecture

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** System Architecture

---

# 1. Purpose

This document defines the high-level architecture of ForgeCRM.

It establishes:

- System boundaries
- Service responsibilities
- Communication patterns
- Deployment topology
- Scalability strategy
- Infrastructure decisions

Every implementation must conform to this architecture.

---

# 2. Architectural Goals

ForgeCRM must be:

- Modular
- Secure
- Multi-tenant
- Horizontally scalable
- Highly maintainable
- API-first
- Cloud-ready
- AI-ready

---

# 3. Architecture Style

ForgeCRM follows a **Modular Monolith** architecture for Version 1.

Each business domain is isolated inside its own module.

Modules communicate only through defined interfaces.

Internal coupling must remain minimal.

Future extraction into microservices should require minimal code changes.

---

# 4. High-Level Architecture

```
                   Browser
                      │
             Next.js Frontend
                      │
          HTTPS / REST API / WebSocket
                      │
                 FastAPI Backend
                      │
 ┌──────────────┬──────────────┬──────────────┐
 │              │              │              │
CRM         Identity      AI Services     Notifications
Modules      Module         Module          Module
 │              │              │              │
 └──────────────┴──────────────┴──────────────┘
                      │
              Shared Domain Layer
                      │
      PostgreSQL + Redis + Object Storage
```

---

# 5. Core Components

## Frontend

Responsibilities

- UI
- Routing
- Forms
- Client validation
- State management
- API communication
- Realtime updates

Technology

- Next.js
- React
- TypeScript

---

## Backend

Responsibilities

- Business logic
- Authentication
- Authorization
- Validation
- Database access
- Background jobs
- AI orchestration

Technology

- FastAPI
- SQLAlchemy
- Alembic

---

## Database

Primary datastore.

Technology

- PostgreSQL

Stores

- Users
- CRM data
- Reports
- Settings
- Metadata
- Audit logs

---

## Cache

Technology

Redis

Responsibilities

- Caching
- Background queues
- Rate limiting
- Session cache
- Temporary tokens

---

## Object Storage

Technology

MinIO (development)

Amazon S3 (production)

Stores

- Documents
- Images
- Attachments
- Exports

---

# 6. Domain Architecture

The backend is divided into domains.

```
Auth

Workspace

Users

Teams

Companies

Contacts

Leads

Deals

Activities

Tasks

Calendar

Notes

Documents

Reports

Notifications

AI

Settings

Audit
```

Each domain owns:

- Models
- Schemas
- Services
- Repository layer
- API routes
- Business rules

No domain directly modifies another domain's data.

---

# 7. Request Lifecycle

```
Browser

↓

Middleware

↓

Authentication

↓

Authorization

↓

Validation

↓

Route

↓

Service

↓

Repository

↓

Database

↓

Response

↓

Frontend Update
```

Business logic belongs only in the Service layer.

---

# 8. Backend Layering

```
API Layer

↓

Application Services

↓

Domain Logic

↓

Repository Layer

↓

Database
```

Rules

- Routes contain no business logic.
- Repositories contain no business rules.
- Services coordinate workflows.
- Database models never contain API logic.

---

# 9. Frontend Architecture

```
Pages

↓

Layouts

↓

Feature Modules

↓

Reusable Components

↓

Shared UI
```

Feature modules communicate through API contracts rather than directly sharing business state.

---

# 10. API Strategy

REST API

Principles

- Resource-oriented
- Predictable endpoints
- Pagination
- Filtering
- Sorting
- Consistent error format

Future versions may expose a public API without changing internal architecture.

---

# 11. Authentication Flow

```
Login

↓

Credentials Verified

↓

JWT Access Token

↓

Refresh Token

↓

Secure API Access

↓

Automatic Refresh

↓

Logout
```

All protected endpoints require authentication.

---

# 12. Authorization

Authorization is enforced at three levels.

1. Authentication

Identity verified.

2. Workspace Isolation

User belongs to workspace.

3. RBAC

Permission checked before execution.

---

# 13. Multi-Tenant Strategy

Every business entity includes:

- workspace_id

Every query is scoped to the current workspace.

Cross-workspace access is prohibited.

Super Admin is the only exception.

---

# 14. Background Jobs

Long-running operations execute asynchronously.

Examples

- AI processing
- CSV import
- CSV export
- Report generation
- Email sending
- File processing

Technology

Celery + Redis

---

# 15. Notification Architecture

Realtime notifications use WebSockets.

Flow

```
Action

↓

Backend Event

↓

Notification Service

↓

WebSocket

↓

Client Update
```

Notifications are also stored for later retrieval.

---

# 16. File Processing

```
Upload

↓

Validation

↓

Virus Scan (Future)

↓

Object Storage

↓

Metadata Saved

↓

Activity Created
```

Database stores metadata only.

Files remain in object storage.

---

# 17. AI Architecture

AI is isolated from CRM business logic.

```
CRM Request

↓

AI Service

↓

LLM Provider

↓

Response Validation

↓

User Review

↓

Optional Save
```

AI never directly modifies production data.

---

# 18. Error Handling

Every error follows the same structure.

```
Status Code

Error Code

Message

Details

Request ID
```

No internal stack traces are returned to clients.

---

# 19. Logging Strategy

Log levels

- Debug
- Info
- Warning
- Error
- Critical

Every request receives a unique Request ID.

Logs include

- User
- Workspace
- Endpoint
- Duration
- Status

---

# 20. Audit Strategy

Business actions create immutable audit records.

Tracked

- Login
- Role changes
- User invitations
- Record updates
- Permission changes
- Deletes
- Imports
- Exports

Audit records cannot be edited.

---

# 21. Caching Strategy

Redis caches

- Dashboard metrics
- Frequently accessed lookups
- User permissions
- Feature flags
- Temporary reports

Never cache sensitive user-specific business data without proper invalidation.

---

# 22. Scalability Strategy

Version 1

Single backend instance.

Future scaling

- Multiple API servers
- Shared Redis
- Shared PostgreSQL
- Load balancer
- CDN

No architectural redesign required.

---

# 23. Security Strategy

Mandatory

- HTTPS
- Password hashing
- JWT
- Refresh token rotation
- RBAC
- Input validation
- SQL injection prevention
- XSS protection
- CSRF strategy where applicable
- Secure headers

---

# 24. Availability Strategy

Daily backups

Database migration history

Health endpoints

Graceful shutdown

Container restart policy

---

# 25. Design Principles

- Separation of concerns
- Single responsibility
- Dependency inversion
- Explicit interfaces
- Immutable audit history
- Predictable APIs
- Consistent naming
- Modular domains

---

# 26. Architecture Constraints

The following decisions are fixed for Version 1.

- Modular Monolith
- PostgreSQL
- Redis
- FastAPI
- Next.js
- REST
- JWT Authentication
- WebSockets
- Docker Deployment

These decisions may only change in a major version.

---

# 27. Architecture Decision Records (ADR)

Any future architectural change must be documented through an ADR before implementation.

No undocumented architectural changes are permitted.

---

# 28. Conclusion

This architecture is designed to balance simplicity, maintainability, and scalability.

ForgeCRM Version 1 intentionally favors a well-structured modular monolith over premature microservices, enabling rapid development today while preserving a clear migration path for future growth.