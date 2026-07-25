# ADR-004 — FastAPI + Next.js Technology Stack

**Project:** ForgeCRM

**Status:** Accepted

**Date:** 2026-07-25

**Decision Makers:** ForgeCRM Engineering

---

# Context

ForgeCRM requires a modern full-stack technology stack capable of supporting:

- Enterprise CRM workflows
- High developer productivity
- Excellent API performance
- Modern frontend UX
- Type-safe development
- Strong community support
- Long-term maintainability

The stack should remain approachable for a small engineering team while supporting future growth.

---

# Decision

ForgeCRM will use:

## Backend

- FastAPI
- Python
- SQLAlchemy 2
- Alembic
- Pydantic v2

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zustand

The frontend and backend communicate exclusively through versioned REST APIs.

---

# Rationale

## FastAPI

FastAPI provides:

- Excellent developer productivity
- Automatic OpenAPI generation
- Strong typing
- High runtime performance
- Modern asynchronous support
- Excellent Python ecosystem integration
- Outstanding developer experience

---

## Next.js

Next.js provides:

- File-based routing
- Excellent performance
- Server-side rendering support
- Static rendering capabilities
- Modern React architecture
- Strong TypeScript integration
- Mature ecosystem

---

## TypeScript

TypeScript improves:

- Maintainability
- Refactoring safety
- IDE support
- API contract reliability
- Long-term scalability

---

## Combined Benefits

The selected stack offers:

- Fast development
- Excellent tooling
- Strong type safety
- Modern UI capabilities
- Mature ecosystems
- Lower maintenance costs
- Strong community support

The combination aligns with ForgeCRM's architectural goals.

---

# Alternatives Considered

## Spring Boot + React

Advantages:

- Enterprise maturity
- Rich ecosystem
- Excellent scalability

Disadvantages:

- Higher development complexity
- More boilerplate
- Slower iteration for a small team

Rejected because the operational and development overhead was not justified for the project's current scope.

---

## ASP.NET Core + React

Advantages:

- Excellent tooling
- Strong performance
- Enterprise adoption

Disadvantages:

- Smaller ecosystem alignment with the chosen AI and Python tooling
- Additional platform expertise required

Rejected because Python better supports the project's AI integration goals.

---

## Django

Advantages:

- Mature ecosystem
- Batteries included
- Rapid development

Disadvantages:

- Less modular by default
- More opinionated architecture
- REST API experience not as focused as FastAPI

Rejected because FastAPI better aligns with an API-first architecture.

---

## NestJS

Advantages:

- Strong TypeScript ecosystem
- Modular architecture
- Familiarity for Node.js developers

Disadvantages:

- Less alignment with Python-based AI tooling
- Additional runtime ecosystem complexity

Rejected because Python simplifies AI integration while maintaining excellent API performance.

---

## Laravel

Advantages:

- Rapid application development
- Mature ecosystem
- Large community

Disadvantages:

- PHP ecosystem does not align with the selected AI and backend strategy

Rejected because Python provides stronger integration with AI libraries.

---

## React SPA (Vite)

Advantages:

- Simpler deployment
- Excellent client-side experience
- Fast development

Disadvantages:

- Fewer built-in rendering options
- Less flexibility for future SEO or hybrid rendering needs

Rejected because Next.js provides a more complete application framework.

---

# Consequences

Positive:

- Excellent developer experience
- Strong API performance
- Modern frontend architecture
- Excellent TypeScript support
- Seamless AI integration
- Strong community ecosystem
- Lower maintenance overhead

Negative:

- Two-language stack (Python + TypeScript)
- Requires coordination between frontend and backend teams
- Dependency management across two ecosystems

These trade-offs are acceptable for ForgeCRM.

---

# Implementation Guidelines

- REST APIs are versioned.
- OpenAPI serves as the API contract.
- Pydantic validates all request and response models.
- TypeScript is used throughout the frontend.
- Shared business logic remains within the backend.
- Frontend communicates only through documented APIs.
- Avoid framework-specific features that create unnecessary vendor lock-in.

---

# Future Evolution

Potential future enhancements include:

- GraphQL gateway for specialized use cases
- Edge rendering where beneficial
- Background AI microservices if workload increases
- Native mobile applications consuming the same REST APIs

The core technology stack should evolve only when there is a measurable business or technical advantage.

---

# Related Documents

- 101_SYSTEM_ARCHITECTURE.md
- 301_BACKEND_OVERVIEW.md
- 401_FRONTEND_OVERVIEW.md
- 302_API_DESIGN.md
- 308_AI_INTEGRATION.md

---

# Review

This decision should be reviewed if:

- The selected frameworks no longer meet performance or maintainability requirements.
- Ecosystem support significantly declines.
- Business requirements demand capabilities not well supported by the current stack.
- A future technology offers substantial, measurable improvements with acceptable migration cost.