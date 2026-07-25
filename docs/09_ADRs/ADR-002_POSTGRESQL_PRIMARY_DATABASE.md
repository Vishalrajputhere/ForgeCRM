# ADR-002 — PostgreSQL as Primary Database

**Project:** ForgeCRM

**Status:** Accepted

**Date:** 2026-07-25

**Decision Makers:** ForgeCRM Engineering

---

# Context

ForgeCRM manages highly relational business data, including:

- Workspaces
- Users
- Roles
- Companies
- Contacts
- Leads
- Deals
- Activities
- Tasks
- Notes
- Audit Logs

The database must provide:

- Strong transactional guarantees
- High data integrity
- Efficient relational queries
- Mature indexing
- Reliable migrations
- Long-term maintainability

The selected database should also integrate well with FastAPI, SQLAlchemy, and Alembic.

---

# Decision

ForgeCRM will use **PostgreSQL** as the primary transactional database.

PostgreSQL stores all persistent business data.

Redis will complement PostgreSQL for caching, distributed locks, and background processing, but PostgreSQL remains the system of record.

---

# Rationale

PostgreSQL provides:

- Full ACID compliance
- Mature relational modeling
- Excellent indexing capabilities
- Rich SQL support
- JSONB for selective semi-structured data
- Robust concurrency control
- Advanced query optimization
- Strong ecosystem support
- Excellent SQLAlchemy compatibility
- Proven production reliability

These capabilities align closely with the needs of an enterprise CRM platform.

---

# Alternatives Considered

## MySQL

Advantages:

- Mature ecosystem
- Broad hosting support
- Familiar to many developers

Disadvantages:

- Fewer advanced SQL features
- Less flexible indexing options
- Weaker support for certain analytical queries

Rejected because PostgreSQL better supports complex business applications.

---

## MongoDB

Advantages:

- Flexible document model
- Rapid schema evolution
- Horizontal scaling options

Disadvantages:

- Complex relational modeling
- Limited transactional workflows compared to PostgreSQL
- Increased application-side data consistency logic

Rejected because ForgeCRM's domain is inherently relational.

---

## Distributed SQL Databases

Examples:

- CockroachDB
- YugabyteDB

Advantages:

- Horizontal scalability
- Geographic distribution
- High availability

Disadvantages:

- Higher operational complexity
- Increased infrastructure requirements
- Limited benefit at the current project scale

Rejected because ForgeCRM does not currently require distributed SQL capabilities.

---

# Consequences

Positive:

- Strong data integrity
- Reliable transactions
- Efficient reporting
- Mature tooling
- Excellent ORM support
- Easier schema evolution
- Lower operational risk

Negative:

- Vertical scaling has practical limits
- Requires careful query optimization
- Large datasets require ongoing maintenance

These trade-offs are acceptable for ForgeCRM.

---

# Implementation Guidelines

- PostgreSQL is the single source of truth.
- All schema changes use Alembic migrations.
- UUIDv7 is used for primary keys.
- Foreign keys enforce referential integrity.
- Soft deletes are preferred over hard deletes for business entities.
- Appropriate indexes should accompany schema changes.
- JSONB should be used only when a relational model is not appropriate.

---

# Future Evolution

Future enhancements may include:

- Read replicas
- Logical replication
- Table partitioning
- Query optimization
- Archival strategies

Migration to a distributed SQL platform should occur only if supported by measurable scalability or availability requirements.

---

# Related Documents

- 201_DATABASE_OVERVIEW.md
- 202_IDENTITY_SCHEMA.md
- 203_WORKSPACE_SCHEMA.md
- 204_CRM_OVERVIEW.md
- 609_MONITORING_AND_OBSERVABILITY.md

---

# Review

This decision should be reviewed if:

- Database growth exceeds vertical scaling capabilities.
- Multi-region active-active deployments become a business requirement.
- Operational constraints indicate PostgreSQL is no longer sufficient.
- A future database technology provides compelling, measurable advantages with acceptable migration cost.