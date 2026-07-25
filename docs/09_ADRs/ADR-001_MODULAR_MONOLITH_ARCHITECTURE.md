# ADR-001 — Modular Monolith Architecture

**Project:** ForgeCRM

**Status:** Accepted

**Date:** 2026-07-25

**Decision Makers:** ForgeCRM Engineering

---

# Context

ForgeCRM requires an architecture that is maintainable, scalable, easy to develop, and suitable for a solo developer while remaining capable of supporting future growth.

The architecture should avoid unnecessary operational complexity while preserving clear domain boundaries.

---

# Decision

ForgeCRM will adopt a **Modular Monolith** architecture.

The application will be deployed as a single executable service while internally separating business capabilities into independent modules organized around domains.

Examples include:

- Identity
- Workspaces
- Companies
- Contacts
- Leads
- Deals
- Tasks
- Notifications
- AI

Each module owns its application logic, persistence layer, API surface, and domain services.

---

# Rationale

The Modular Monolith approach provides:

- Simpler deployments
- Lower operational overhead
- Easier local development
- Single database transaction support
- Better debugging
- Strong domain separation
- Easer refactoring
- Faster development velocity

This architecture aligns with the current scale and team size of the project.

---

# Alternatives Considered

## Microservices

Advantages:

- Independent deployment
- Independent scaling
- Team autonomy

Disadvantages:

- Higher operational complexity
- Distributed transactions
- Service discovery
- Increased infrastructure requirements
- More difficult debugging

Rejected because the complexity outweighs the benefits for the current project stage.

---

## Traditional Layered Monolith

Advantages:

- Simple structure
- Familiar design

Disadvantages:

- Weak domain boundaries
- High coupling
- Difficult long-term maintenance

Rejected because it becomes difficult to evolve as the application grows.

---

# Consequences

Positive:

- Clear module ownership
- Easier testing
- Faster development
- Lower infrastructure costs
- Easier deployments

Negative:

- Entire application deploys together
- Horizontal scaling applies to the whole service
- Requires discipline to preserve module boundaries

These trade-offs are acceptable for ForgeCRM.

---

# Implementation Guidelines

Modules communicate through:

- Service interfaces
- Domain events
- Shared contracts

Direct cross-module database access is prohibited.

Business logic remains inside the owning module.

---

# Future Evolution

If the Modular Monolith reaches operational limits, individual modules may be extracted into independent services.

Extraction should occur only when supported by measurable operational or business requirements.

---

# Related Documents

- 101_SYSTEM_ARCHITECTURE.md
- 102_DOMAIN_DRIVEN_DESIGN.md
- 304_DOMAIN_STRUCTURE.md
- 306_EVENTS_AND_NOTIFICATIONS.md

---

# Review

This decision should be reviewed if:

- Team size grows significantly
- Independent deployments become necessary
- Operational scaling requirements exceed the capabilities of a modular monolith