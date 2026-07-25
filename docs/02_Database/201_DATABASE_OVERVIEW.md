# 201 — Database Overview

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** Database Architecture

---

# 1. Purpose

This document defines the database architecture, design principles, conventions, and rules for ForgeCRM.

It establishes:

- Database technology
- Data modeling principles
- Multi-tenancy strategy
- Naming conventions
- Relationships
- Indexing strategy
- Performance guidelines
- Data lifecycle

All database schemas must comply with this document.

---

# 2. Database Philosophy

The database is designed to support a production-grade SaaS CRM.

Primary goals:

- Data integrity
- Performance
- Scalability
- Maintainability
- Tenant isolation
- Predictable relationships

The schema prioritizes correctness over convenience.

---

# 3. Technology Stack

Primary Database

- PostgreSQL 17+

Supporting Services

- Redis (Cache / Queue)
- MinIO (Development Object Storage)
- Amazon S3 (Production Object Storage)

---

# 4. Why PostgreSQL

ForgeCRM uses PostgreSQL because it provides:

- Strong ACID compliance
- Mature transaction support
- Excellent relational modeling
- Advanced indexing
- JSONB support
- Full Text Search
- pgvector support
- Reliable migrations
- Excellent ecosystem

MongoDB is intentionally not used because CRM data is highly relational.

---

# 5. Multi-Tenant Strategy

ForgeCRM is Workspace-based.

Every business entity belongs to one Workspace.

Example:

Workspace

↓

Companies

↓

Contacts

↓

Deals

↓

Tasks

↓

Notes

↓

Documents

Every business table includes:

```
workspace_id UUID NOT NULL
```

Every query must be scoped by workspace.

Cross-workspace access is prohibited.

---

# 6. Primary Keys

All primary keys use UUID Version 7.

Example

```
id UUID PRIMARY KEY
```

Reasons

- Globally unique
- Better for distributed systems
- API-safe
- Harder to enumerate
- Future microservice compatibility

Auto-increment integers are not used.

---

# 7. Timestamp Standards

Every business table includes:

```
created_at

updated_at
```

Both use:

```
TIMESTAMP WITH TIME ZONE
```

All timestamps are stored in UTC.

Timezone conversion occurs in the frontend.

---

# 8. Soft Deletes

Business entities are never permanently deleted.

Instead:

```
deleted_at TIMESTAMP NULL
```

Rules

NULL

↓

Active Record

Timestamp

↓

Deleted Record

Benefits

- Recovery
- Audit
- Historical reporting
- Compliance

Hard deletes are reserved for system cleanup.

---

# 9. Audit Strategy

Business history is never stored directly in entity tables.

Instead,

all important changes generate immutable audit records.

Examples

- Create
- Update
- Delete
- Restore
- Assignment
- Role changes

Audit logs are append-only.

---

# 10. Ownership

Most business records include:

```
owner_id
```

Ownership controls:

- Visibility
- Assignment
- Reporting
- Permissions

Ownership may differ from creator.

---

# 11. Creator Tracking

Most tables include:

```
created_by

updated_by
```

Benefits

- Accountability
- Reporting
- Debugging

---

# 12. Relationships

ForgeCRM primarily uses:

One-to-One

One-to-Many

Many-to-Many

Examples

Workspace

↓

Companies

↓

Contacts

↓

Deals

Company

↓

Many Contacts

Deal

↓

Many Activities

Deal

↓

Many Products

---

# 13. Junction Tables

Many-to-many relationships always use junction tables.

Examples

```
deal_products

team_members

user_roles

role_permissions
```

Avoid storing arrays of foreign keys.

---

# 14. Polymorphic Relationships

Polymorphic relationships are allowed only when justified.

Used for:

- Tags
- Notes
- Attachments

Examples

```
entity_type

entity_id
```

Avoid excessive polymorphism.

---

# 15. Lookup Tables

Statuses should not be hardcoded.

Examples

Lead Status

Deal Stage

Task Priority

Activity Type

Notification Type

Lookup tables improve flexibility.

---

# 16. Constraints

Mandatory constraints:

- NOT NULL
- UNIQUE
- CHECK
- FOREIGN KEY

The database should reject invalid data whenever possible.

Business logic complements constraints—it does not replace them.

---

# 17. Naming Convention

Tables

Plural

Examples

```
users

companies

contacts

tasks
```

Columns

snake_case

Examples

```
workspace_id

created_at

phone_number
```

Foreign Keys

```
user_id

company_id

deal_id
```

Booleans

```
is_active

is_primary

is_verified
```

---

# 18. Indexing Strategy

Every business table indexes:

```
workspace_id

created_at

updated_at
```

Frequently filtered columns:

- owner_id
- status_id
- stage_id
- email
- phone

Composite indexes

Examples

```
workspace_id + owner_id

workspace_id + status_id

workspace_id + created_at
```

Indexes should reflect real query patterns.

---

# 19. Full Text Search

Version 1

PostgreSQL Full Text Search

Used for:

- Companies
- Contacts
- Leads
- Deals
- Notes

Future

pgvector semantic search.

---

# 20. JSON Usage

JSONB is permitted only for flexible metadata.

Examples

```
preferences

integration_settings

ai_metadata
```

Business relationships must remain relational.

---

# 21. Transactions

Operations spanning multiple tables must use database transactions.

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

Rollback on failure.

---

# 22. Cascade Rules

Delete cascades are minimized.

Preferred behavior:

Restrict

or

Soft Delete

Automatic cascading deletes are avoided for business entities.

---

# 23. File Storage

Files are not stored inside PostgreSQL.

Only metadata is stored.

Binary data resides in:

- MinIO
- Amazon S3

---

# 24. Caching

Redis caches:

- Dashboard metrics
- User permissions
- Frequently accessed lookups
- Search suggestions

Redis is never the source of truth.

---

# 25. Data Lifecycle

Business Record

↓

Created

↓

Updated

↓

Archived

↓

Soft Deleted

↓

Optional Permanent Cleanup

Historical reporting must remain possible.

---

# 26. Performance Targets

Typical CRUD

<100 ms

Dashboard

<300 ms

Global Search

<200 ms

Bulk Import

Background Job

Large reports

Background Job

---

# 27. Estimated Schema Size

| Domain | Approx. Tables |
|---------|---------------:|
| Identity | 10 |
| Workspace | 5 |
| CRM | 14 |
| Activity | 8 |
| Communication | 5 |
| Documents | 4 |
| Analytics | 4 |
| AI | 4 |
| System | 5 |

Estimated Total:

**≈ 59 Tables**

This is intentionally modular and normalized.

---

# 28. Database Principles

The database must always satisfy:

- ACID compliance
- Strong referential integrity
- Tenant isolation
- Normalized relationships
- Predictable naming
- Explicit constraints
- High query performance
- Minimal duplication

---

# 29. Architecture Freeze

The following decisions are fixed:

- PostgreSQL
- UUIDv7 Primary Keys
- UTC timestamps
- Soft Deletes
- Workspace Isolation
- Relational Modeling
- Redis Cache
- S3-Compatible Object Storage

No schema should violate these principles.

---

# 30. Conclusion

The ForgeCRM database is designed as a production-ready relational model that prioritizes correctness, scalability, maintainability, and future growth.

All subsequent schema documents inherit the rules defined here.