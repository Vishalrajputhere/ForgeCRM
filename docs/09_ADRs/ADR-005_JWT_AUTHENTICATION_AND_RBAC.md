# ADR-005 — JWT Authentication & Workspace-Scoped RBAC

**Project:** ForgeCRM

**Status:** Accepted

**Date:** 2026-07-25

**Decision Makers:** ForgeCRM Engineering

---

# Context

ForgeCRM is a multi-tenant SaaS platform where users authenticate once and access one or more workspaces with different permissions.

The authentication and authorization solution must provide:

- Secure user authentication
- Stateless API requests
- Workspace isolation
- Fine-grained permissions
- Good developer experience
- Horizontal scalability
- Support for future SSO integration

Authentication and authorization should remain independent concerns.

---

# Decision

ForgeCRM will implement:

## Authentication

- JWT access tokens
- Refresh token rotation
- Secure password hashing using bcrypt
- Optional MFA support
- Short-lived access tokens
- Long-lived refresh tokens

## Authorization

Workspace-scoped Role-Based Access Control (RBAC).

Permissions are granted through roles assigned to users within individual workspaces.

Authorization is evaluated for every protected request.

---

# Rationale

## JWT Authentication

JWT provides:

- Stateless authentication
- Horizontal scalability
- Efficient API authorization
- Excellent support for REST APIs
- Simple frontend integration

Short-lived access tokens reduce exposure if compromised.

Refresh token rotation improves long-term session security.

---

## RBAC

RBAC provides:

- Simple permission management
- Predictable authorization
- Easy auditing
- Role reuse
- Clear separation of responsibilities

Permissions are associated with roles rather than individual users.

---

# Alternatives Considered

## Server-Side Sessions

Advantages:

- Simple implementation
- Immediate session revocation
- Familiar architecture

Disadvantages:

- Shared session storage required
- Reduced horizontal scalability
- Additional operational complexity

Rejected because ForgeCRM is API-first and benefits from stateless authentication.

---

## API Keys

Advantages:

- Simple machine authentication
- Easy automation

Disadvantages:

- Unsuitable for interactive user authentication
- Limited user identity management
- Difficult permission modeling

Rejected because API keys are intended for service integrations rather than end users.

---

## OAuth-Only Authentication

Advantages:

- Delegated authentication
- External identity providers

Disadvantages:

- Requires third-party providers
- Does not replace internal authorization
- Not suitable as the sole authentication mechanism

Rejected as the primary model, though OAuth/OIDC may be added for SSO.

---

## Attribute-Based Access Control (ABAC)

Advantages:

- Highly flexible
- Fine-grained policies
- Dynamic authorization

Disadvantages:

- Higher implementation complexity
- Harder to understand
- More difficult to audit

Rejected because RBAC better fits the project's current requirements.

---

# Consequences

Positive:

- Stateless authentication
- Strong scalability
- Clear permission model
- Simple auditing
- Efficient API requests
- Future SSO compatibility

Negative:

- JWT revocation requires additional handling
- Permission changes may require refreshed tokens depending on implementation
- RBAC is less flexible than ABAC for highly dynamic policies

These trade-offs are acceptable for ForgeCRM.

---

# Implementation Guidelines

- Access tokens should have a short lifetime.
- Refresh tokens must be rotated after successful use.
- Passwords are never stored in plaintext.
- Password hashes use bcrypt with an appropriate work factor.
- All protected endpoints require authentication.
- Authorization checks occur after successful authentication.
- Roles are scoped to workspaces.
- Permission checks should be implemented within the service layer rather than only at the API layer.
- Administrative privileges should follow the principle of least privilege.

---

# Security Considerations

Authentication and authorization should follow defense-in-depth principles.

Key controls include:

- HTTPS only
- Secure token storage
- Token expiration
- Refresh token rotation
- Rate limiting
- Audit logging
- Session invalidation where applicable
- MFA support for privileged accounts

Authentication events should be logged for security monitoring.

---

# Future Evolution

Future enhancements may include:

- OAuth 2.0 / OpenID Connect (OIDC)
- Enterprise SSO (SAML/OIDC)
- Passkey (WebAuthn) authentication
- Fine-grained permission extensions
- Risk-based authentication
- Device management
- Adaptive MFA

Future enhancements should build upon the existing authentication and authorization model rather than replace it unnecessarily.

---

# Related Documents

- 303_AUTHORIZATION.md
- 501_SECURITY_OVERVIEW.md
- 504_IDENTITY_AND_AUTHENTICATION.md
- 505_AUTHORIZATION_AND_RBAC.md
- 506_API_SECURITY.md
- 707_SECURITY_TESTING.md

---

# Review

This decision should be reviewed if:

- Regulatory requirements demand stronger authentication mechanisms.
- Enterprise customers require mandatory SSO.
- Permission management becomes significantly more dynamic than RBAC can efficiently support.
- Business requirements justify introducing ABAC or hybrid authorization models.