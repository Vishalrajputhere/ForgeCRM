# ADR-003 — Workspace-Based Multi-Tenancy

**Project:** ForgeCRM

**Status:** Accepted

**Date:** 2026-07-25

**Decision Makers:** ForgeCRM Engineering

---

# Context

ForgeCRM is a multi-tenant SaaS application serving multiple organizations.

Each organization requires:

- Complete logical data isolation
- Independent users
- Independent roles
- Independent CRM data
- Independent settings
- Secure access boundaries

The chosen tenancy model should maximize operational simplicity while maintaining strong security and scalability.

---

# Decision

ForgeCRM will implement **workspace-based multi-tenancy using row-level isolation**.

Every business entity belongs to exactly one workspace.

Each protected table contains a mandatory:

- `workspace_id`

All application queries must be scoped by the authenticated user's workspace.

Workspace boundaries are enforced within the application layer and verified through authorization logic.

---

# Rationale

Workspace-based row-level isolation provides:

- Single deployment
- Single PostgreSQL cluster
- Shared schema
- Lower operational complexity
- Easier migrations
- Simpler backups
- Efficient reporting
- Lower infrastructure cost
- Straightforward onboarding

This architecture aligns with ForgeCRM's expected scale and engineering resources.

---

# Alternatives Considered

## Separate Database Per Tenant

Advantages:

- Strong physical isolation
- Independent backup and restore
- Independent scaling
- Reduced blast radius

Disadvantages:

- Complex migrations
- Operational overhead
- Increased infrastructure cost
- Difficult cross-tenant administration

Rejected because operational complexity outweighs current requirements.

---

## Separate Schema Per Tenant

Advantages:

- Better isolation than row-level
- Shared PostgreSQL instance

Disadvantages:

- Large numbers of schemas become difficult to manage
- Migration complexity
- Increased operational burden

Rejected because it complicates lifecycle management without sufficient benefit.

---

## Shared Tables Without Workspace Isolation

Advantages:

- Simpler implementation

Disadvantages:

- No tenant isolation
- High security risk
- Impossible to support SaaS customers safely

Rejected because it fails fundamental security requirements.

---

# Consequences

Positive:

- Lower operational cost
- Simple deployments
- Easier migrations
- Centralized monitoring
- Efficient resource utilization
- Scalable for expected customer growth

Negative:

- Every query must enforce workspace filtering
- Authorization logic becomes critical
- Large tenants may require additional optimization

These trade-offs are acceptable for ForgeCRM.

---

# Implementation Guidelines

- Every business entity includes `workspace_id`.
- Workspace ownership is immutable after creation.
- Authorization validates workspace membership before granting access.
- Repository methods must always include workspace filtering.
- Administrative operations must explicitly justify any cross-workspace access.
- Soft deletes preserve workspace ownership for audit purposes.

---

# Security Considerations

Tenant isolation is a primary security requirement.

Controls include:

- Workspace-scoped authorization
- Role-Based Access Control (RBAC)
- Audit logging
- Query validation
- Integration and security testing for tenant isolation

Any cross-workspace data exposure is considered a critical security incident.

---

# Future Evolution

Future enhancements may include:

- PostgreSQL Row-Level Security (RLS) for defense in depth
- Tenant-specific encryption keys
- Read replicas
- Premium tenant isolation options
- Migration tooling for dedicated databases if required

Migration to stronger isolation models should be driven by measurable business or compliance requirements.

---

# Related Documents

- 203_WORKSPACE_SCHEMA.md
- 303_AUTHORIZATION.md
- 505_AUTHORIZATION_AND_RBAC.md
- 706_PERFORMANCE_AND_LOAD_TESTING.md
- 707_SECURITY_TESTING.md

---

# Review

This decision should be reviewed if:

- Regulatory requirements demand physical tenant isolation.
- Premium enterprise customers require dedicated infrastructure.
- Workspace size exceeds acceptable performance limits.
- Operational metrics indicate row-level isolation no longer meets scalability or security objectives.