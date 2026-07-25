# ADR-008 — AI Provider Abstraction

**Project:** ForgeCRM

**Status:** Accepted

**Date:** 2026-07-25

**Decision Makers:** ForgeCRM Engineering

---

# Context

ForgeCRM incorporates AI features to improve user productivity rather than automate core business decisions.

Representative AI capabilities include:

- Lead summaries
- Email drafting
- Meeting summaries
- CRM search assistance
- Follow-up suggestions
- Text classification
- Information extraction

The AI ecosystem changes rapidly. Models, providers, pricing, and capabilities evolve frequently.

Direct integration with a single provider would increase vendor lock-in and reduce architectural flexibility.

---

# Decision

ForgeCRM will implement an **AI Provider Abstraction Layer**.

Business modules interact only with an internal AI service interface.

Concrete providers may include:

- OpenAI
- Anthropic
- Google Gemini
- Azure OpenAI
- Self-hosted models

Provider selection is controlled through configuration rather than business logic.

---

# Rationale

An AI abstraction provides:

- Provider independence
- Easier testing
- Cost optimization
- Fallback capability
- Environment flexibility
- Cleaner architecture
- Future extensibility

Business logic remains independent of model-specific APIs.

---

# AI Responsibilities

The AI layer is responsible for:

- Prompt execution
- Model selection
- Provider communication
- Response normalization
- Retry handling
- Timeout management
- Usage accounting
- Observability

Business modules remain responsible for business rules and user authorization.

---

# Alternatives Considered

## Direct OpenAI Integration

Advantages:

- Fast implementation
- Mature SDK
- Excellent model quality

Disadvantages:

- Vendor lock-in
- Difficult provider migration
- Business logic coupled to provider APIs

Rejected because provider independence is a strategic architectural goal.

---

## Multiple Provider Integrations in Business Modules

Advantages:

- Direct access to provider-specific features

Disadvantages:

- Code duplication
- Higher maintenance cost
- Inconsistent behavior
- Complex testing

Rejected because it increases coupling and operational complexity.

---

## Self-Hosted Models Only

Advantages:

- Full control
- Data residency flexibility
- Reduced external dependency

Disadvantages:

- Significant infrastructure requirements
- Operational overhead
- Variable model quality depending on deployment

Rejected because it limits flexibility and increases operational burden for the current project stage.

---

# Consequences

Positive:

- Provider independence
- Easier experimentation
- Cleaner architecture
- Simplified testing
- Better cost control
- Future-proof AI integration

Negative:

- Additional abstraction layer
- Some provider-specific capabilities require optional extensions
- Slight implementation complexity

These trade-offs are acceptable for ForgeCRM.

---

# Implementation Guidelines

- Business modules call only the AI service interface.
- Prompts should be managed separately from business logic.
- Responses should be normalized into provider-agnostic models.
- AI operations should enforce configurable timeouts.
- Optional capabilities should be exposed through extension interfaces rather than expanding the core contract.
- AI failures should degrade gracefully without affecting core CRM functionality.

---

# Reliability Considerations

The AI layer should support:

- Configurable provider selection
- Automatic retries for transient failures
- Request timeouts
- Provider fallback where appropriate
- Circuit breaker behavior
- Usage limits
- Correlation IDs for tracing

Optional AI failures should never block critical business workflows.

---

# Security Considerations

AI integrations should enforce:

- Least-privilege API credentials
- Secret management through environment configuration
- Prompt and response logging policies
- Input validation
- Output validation before business use
- Data minimization
- Compliance with organizational privacy requirements

Sensitive customer information should only be transmitted when explicitly required and authorized.

---

# Cost Management

The AI layer should support:

- Usage tracking
- Token accounting
- Budget monitoring
- Model selection by task complexity
- Configurable rate limits
- Cost reporting

Provider selection should balance quality, latency, and operational cost.

---

# Observability

AI requests should record:

- Provider
- Model
- Latency
- Success or failure
- Retry count
- Token usage
- Estimated cost
- Correlation ID

Operational metrics support optimization and troubleshooting.

---

# Future Evolution

Future enhancements may include:

- Model routing
- Prompt versioning
- Prompt evaluation
- Retrieval-Augmented Generation (RAG)
- Local inference
- AI safety guardrails
- Human review workflows

Future capabilities should integrate through the abstraction layer rather than bypass it.

---

# Related Documents

- 308_AI_INTEGRATION.md
- 309_OBSERVABILITY.md
- 508_SECRETS_AND_KEY_MANAGEMENT.md
- 609_MONITORING_AND_OBSERVABILITY.md
- 707_SECURITY_TESTING.md

---

# Review

This decision should be reviewed if:

- AI provider capabilities change significantly.
- Business requirements demand provider-specific functionality.
- Cost, latency, or quality objectives require architectural changes.
- Regulatory requirements affect AI usage or data handling.
- A future AI architecture provides measurable benefits with acceptable migration effort.