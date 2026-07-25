# ADR-006 — Event-Driven Internal Architecture

**Project:** ForgeCRM

**Status:** Accepted

**Date:** 2026-07-25

**Decision Makers:** ForgeCRM Engineering

---

# Context

ForgeCRM is implemented as a Modular Monolith with multiple business domains, including:

- Identity
- Workspaces
- Companies
- Contacts
- Leads
- Deals
- Tasks
- Notifications
- Documents
- AI

As the platform grows, modules must remain loosely coupled while still reacting to important business events.

Direct service-to-service dependencies increase coupling and make long-term maintenance more difficult.

---

# Decision

ForgeCRM will adopt an **internal event-driven architecture** based on domain events.

Business modules publish domain events whenever significant business actions occur.

Interested modules subscribe to those events and execute their own independent business logic.

Events are used **inside the Modular Monolith**.

This architecture does not require an external message broker.

---

# Rationale

Internal domain events provide:

- Loose coupling
- Better separation of concerns
- Easier feature expansion
- Improved maintainability
- Better testability
- Clear business workflows

Modules become consumers of business events rather than direct dependencies of one another.

---

# Event Categories

ForgeCRM distinguishes between:

## Commands

Commands request work.

Examples:

- Create Lead
- Convert Lead
- Create Task

Commands are synchronous.

---

## Domain Events

Domain events describe something that has already happened.

Examples:

- LeadCreated
- LeadConverted
- DealWon
- TaskCompleted
- UserInvited

Events are immutable facts.

---

# Event Flow

Typical workflow:

```
API Request
      │
      ▼
Application Service
      │
      ▼
Business Logic
      │
      ▼
Database Transaction
      │
      ▼
Publish Domain Event
      │
      ▼
Event Dispatcher
      │
      ▼
Event Handlers
```

The initiating business transaction completes before event handlers perform secondary work.

---

# Alternatives Considered

## Direct Module Calls

Advantages:

- Simple implementation
- Easy to understand

Disadvantages:

- Tight coupling
- Harder testing
- Reduced modularity
- Growing dependency graph

Rejected because it becomes increasingly difficult to maintain.

---

## External Message Broker

Examples:

- RabbitMQ
- Kafka
- NATS

Advantages:

- Independent processing
- Horizontal scalability
- Cross-service messaging

Disadvantages:

- Additional infrastructure
- Operational complexity
- Increased deployment requirements

Rejected because ForgeCRM currently operates as a Modular Monolith.

---

## Shared Database Triggers

Advantages:

- Automatic execution

Disadvantages:

- Hidden business logic
- Difficult testing
- Poor observability
- Database vendor dependence

Rejected because business behavior should remain within the application.

---

# Consequences

Positive:

- Reduced coupling
- Easier feature additions
- Better module independence
- Improved testability
- Cleaner architecture
- Future migration path to distributed messaging

Negative:

- Additional architectural concepts
- Event ordering considerations
- Need for idempotent handlers
- Increased debugging complexity compared to direct calls

These trade-offs are acceptable for ForgeCRM.

---

# Implementation Guidelines

- Events represent completed business facts.
- Event names should use the past tense.
- Events are immutable.
- Event payloads should be minimal and stable.
- Handlers should remain independent.
- Event handlers should not directly call each other.
- Commands should never be published as events.

---

# Reliability Considerations

To improve reliability:

- Event handlers should be idempotent.
- Failed handlers should support retry.
- Events should include correlation IDs.
- Event processing should be logged.
- Long-running handlers should execute asynchronously where appropriate.

Failures in optional handlers should not invalidate the originating business transaction unless explicitly required.

---

# Future Evolution

Future enhancements may include:

- Transactional Outbox Pattern
- External message broker
- Event replay
- Event versioning
- Distributed event processing

Migration to external messaging should be driven by measurable operational or scalability requirements.

---

# Related Documents

- 102_DOMAIN_DRIVEN_DESIGN.md
- 304_DOMAIN_STRUCTURE.md
- 305_BACKGROUND_JOBS.md
- 306_EVENTS_AND_NOTIFICATIONS.md
- 309_OBSERVABILITY.md

---

# Review

This decision should be reviewed if:

- Independent service deployment becomes necessary.
- Event volume exceeds the capabilities of in-process dispatch.
- Cross-service communication becomes a primary architectural requirement.
- Reliability requirements justify introducing external messaging infrastructure.