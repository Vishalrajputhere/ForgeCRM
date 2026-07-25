# 304 — Domain Structure

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** Backend Domain Organization

---

# 1. Purpose

This document defines the standard internal structure for every backend domain.

Every business domain must follow the same organization to ensure consistency, maintainability, and scalability.

The goal is to make every domain immediately understandable to any developer.

---

# 2. Domain Philosophy

Each domain owns:

- Data models
- Business rules
- Validation
- Permissions
- Events
- Database access
- API endpoints

A domain should never expose its internal implementation details.

Interaction with another domain occurs only through public services or domain events.

---

# 3. Directory Structure

```
app/

  domains/

    leads/

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

      __init__.py
```

Every domain follows this exact layout.

---

# 4. Responsibilities

## models/

Contains:

- SQLAlchemy models
- Relationships
- Database mappings

Never contains business logic.

---

## schemas/

Contains:

- Request DTOs
- Response DTOs
- Validation models
- Serialization

Uses Pydantic v2.

---

## repositories/

Responsible for:

- Queries
- Inserts
- Updates
- Deletes
- Search
- Pagination

Repositories never:

- Send emails
- Trigger AI
- Publish notifications
- Implement business rules

---

## services/

Contains business use cases.

Examples

```
create_lead.py

update_lead.py

convert_lead.py

assign_owner.py

archive_lead.py

search_leads.py
```

Each file should solve one business problem.

---

## routers/

Contains FastAPI routers.

Responsible for:

- HTTP methods
- Dependency injection
- Request parsing
- Response serialization

Routers never contain business logic.

---

## validators/

Contains complex validation beyond schema validation.

Examples

```
Duplicate Lead Detection

Deal Stage Validation

Workspace Membership Validation
```

---

## permissions/

Contains permission definitions and authorization helpers.

Examples

```
require_lead_read()

require_deal_update()

require_company_delete()
```

Authorization is centralized here.

---

## events/

Contains domain events.

Examples

```
LeadConverted

DealWon

TaskCompleted
```

Events are consumed by other domains without creating direct dependencies.

---

## exceptions/

Defines domain-specific exceptions.

Examples

```
LeadAlreadyConverted

DuplicateCompanyDetected

InvalidPipelineStage
```

---

## constants/

Contains immutable domain constants.

Examples

```
Default Lead Status

Maximum File Size

Supported MIME Types
```

Never store business configuration here.

---

# 5. Vertical Slice Pattern

Every business action has its own service.

Good

```
services/

    create.py

    update.py

    convert.py

    assign.py

    merge.py
```

Avoid

```
lead_service.py
```

Small services are easier to:

- Test
- Review
- Maintain
- Reuse

---

# 6. Dependency Flow

Inside a domain:

```
Router

↓

Schema

↓

Service

↓

Repository

↓

Database
```

Validation and permission checks support the flow without reversing it.

Dependencies never point upward.

---

# 7. Cross-Domain Communication

Allowed

```
Lead Service

↓

Company Service
```

when orchestration is required.

Preferred

```
Lead Converted Event

↓

Activity Domain

↓

Notification Domain

↓

AI Domain
```

Favor events for side effects.

---

# 8. Transactions

Transactions belong to the orchestrating service.

Example

```
convert_lead.py

↓

Create Company

↓

Create Contact

↓

Create Deal

↓

Create Activity

↓

Commit
```

Repositories never commit independently.

---

# 9. Naming Conventions

Files

```
snake_case.py
```

Classes

```
PascalCase
```

Functions

```
snake_case
```

Constants

```
UPPER_SNAKE_CASE
```

Keep names descriptive and consistent.

---

# 10. Testing Strategy

Each service has corresponding tests.

Example

```
services/

    convert.py

tests/

    test_convert.py
```

Repositories have query-focused tests.

Routers have API integration tests.

---

# 11. Shared Code

Shared utilities belong under:

```
app/core/

app/shared/
```

Only place code here when it is genuinely reusable across multiple domains.

Avoid creating large generic utility modules.

---

# 12. Code Review Rules

Every new feature should answer:

- Does it belong to an existing domain?
- Does it introduce a new business use case?
- Can it reuse an existing repository?
- Does it require a new event?
- Does it need new permissions?

If the answer is yes, follow the standard domain structure.

---

# 13. Anti-Patterns

Avoid:

- Massive service classes
- God repositories
- Cross-domain database queries
- Business logic inside routers
- Business logic inside models
- Circular imports
- Shared mutable state

---

# 14. Future Growth

This structure supports:

- Additional domains
- Independent teams
- Gradual extraction into microservices
- Event-driven workflows
- Easier onboarding

No structural redesign is required as the application grows.

---

# 15. Summary

ForgeCRM organizes backend code around business domains using a consistent layered architecture and vertical slice pattern.

Every business use case is isolated, every domain has clear ownership, and dependencies flow in one direction. This results in a codebase that is easier to understand, extend, test, and maintain over the long term.