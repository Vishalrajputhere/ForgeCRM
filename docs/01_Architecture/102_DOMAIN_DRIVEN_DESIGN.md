# 102 — Domain-Driven Design (DDD)

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** Domain Architecture

---

# 1. Purpose

This document defines how ForgeCRM is organized internally.

Rather than grouping code by technical layers (controllers, services, models), ForgeCRM is organized around business domains.

This architecture improves maintainability, scalability, ownership, testing, and future migration to microservices.

---

# 2. Why Domain-Driven Design

CRM software contains many related business concepts.

Examples:

- Leads
- Deals
- Companies
- Contacts
- Tasks
- Reports

Each concept has its own business rules.

Instead of placing all routes together and all services together, every domain owns its complete implementation.

---

# 3. Domain List

ForgeCRM consists of the following domains.

Identity

- Authentication
- Users
- Roles
- Permissions

Workspace

- Workspace
- Teams
- Invitations
- Settings

CRM

- Companies
- Contacts
- Leads
- Deals
- Pipelines
- Products

Activity

- Timeline
- Tasks
- Calendar
- Notes

Communication

- Notifications

Documents

- File Management

Analytics

- Dashboard
- Reports

AI

- AI Services

System

- Audit Logs
- Health
- Configuration

---

# 4. Folder Structure

```
apps/api/

src/

├── domains/
│
├── core/
│
├── infrastructure/
│
├── shared/
│
└── api/
```

The domains directory contains the business logic.

---

# 5. Domain Structure

Every domain follows the same internal layout.

```
leads/

├── api/
│
├── schemas/
│
├── services/
│
├── repositories/
│
├── models/
│
├── permissions/
│
├── validators/
│
├── events/
│
├── exceptions/
│
└── __init__.py
```

Every domain looks identical.

---

# 6. Domain Responsibilities

A domain owns:

- Business rules
- Validation
- Database access
- API routes
- Permissions
- Events
- Exceptions

No other domain may directly modify its internal implementation.

---

# 7. Communication Rules

Domains communicate only through services.

Allowed

```
Deal Service

↓

Company Service
```

Not allowed

```
Deal Repository

↓

Company Database Table
```

Repositories never communicate across domains.

---

# 8. Shared Components

Only reusable infrastructure belongs outside domains.

Examples

```
Database

Logger

Email

Cache

Storage

Authentication Middleware

Utilities

Configuration
```

Business logic never belongs in shared.

---

# 9. Dependency Direction

Dependencies always point inward.

```
API

↓

Service

↓

Repository

↓

Database
```

Never reverse the dependency direction.

---

# 10. Services

Services contain business logic.

Examples

Lead Conversion

Deal Closing

Permission Checks

Assignment Rules

Duplicate Detection

Services coordinate multiple repositories.

---

# 11. Repositories

Repositories perform database operations only.

Responsibilities

- Queries
- Inserts
- Updates
- Deletes

Repositories never contain business decisions.

---

# 12. Models

Models define database persistence.

Models should not contain application logic.

---

# 13. Schemas

Schemas define API contracts.

Responsibilities

- Request validation
- Response serialization
- Documentation

---

# 14. Validators

Complex business validation belongs here.

Examples

Duplicate email

Invalid pipeline stage

Workspace ownership

Permission conflicts

---

# 15. Events

Domains publish events.

Examples

LeadCreated

DealWon

UserInvited

TaskCompleted

Events allow future integrations without tight coupling.

---

# 16. Exceptions

Every domain owns its own exceptions.

Example

```
LeadNotFound

DuplicateLead

InvalidLeadStatus

LeadAlreadyConverted
```

Avoid generic exceptions.

---

# 17. Permissions

Permission logic belongs inside each domain.

Examples

Lead permissions

Deal permissions

Task permissions

This keeps authorization close to the business rules.

---

# 18. Transactions

Cross-domain operations use database transactions.

Example

Lead Conversion

↓

Create Company

↓

Create Contact

↓

Create Deal

↓

Create Timeline

↓

Commit

If any step fails, rollback everything.

---

# 19. Testing

Every domain is tested independently.

Tests include

- Unit Tests
- Repository Tests
- API Tests
- Permission Tests

Domains should not require unrelated modules to run their tests.

---

# 20. Future Scalability

Because domains are isolated, a domain can later become an independent service.

Example

```
AI Domain

↓

Separate AI Service

No business logic changes required.
```

---

# 21. Naming Rules

Use business language.

Good

```
LeadService

DealRepository

CompanyValidator

TaskPermission
```

Avoid technical names.

Bad

```
DataManager

Helper

CommonUtils

ManagerService
```

---

# 22. Domain Boundaries

Each domain owns its data.

Other domains request information through services.

No domain reaches directly into another domain's repositories or database tables.

---

# 23. Design Principles

Every domain must satisfy:

- High cohesion
- Low coupling
- Single responsibility
- Explicit interfaces
- Independent testing
- Clear ownership

---

# 24. Summary

ForgeCRM uses Domain-Driven Design to organize the codebase around business capabilities rather than technical layers.

This structure improves maintainability, reduces coupling, simplifies testing, and provides a clear path toward future microservice extraction while keeping Version 1 as a clean, production-ready modular monolith.