# 505 — Authorization & RBAC

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** Authorization & Role-Based Access Control

---

# 1. Purpose

This document defines how ForgeCRM authorizes users to perform actions within a workspace.

Authentication identifies the user.

Authorization determines what that user is allowed to do.

---

# 2. Philosophy

Authorization follows the principle of least privilege.

Users receive only the permissions required to perform their responsibilities.

Access is denied by default.

---

# 3. Authorization Flow

Every protected request follows this sequence.

```
Authenticated?

↓

Workspace Member?

↓

Permission Granted?

↓

Resource Belongs To Workspace?

↓

Business Rule Check

↓

Allow
```

Any failure immediately denies access.

---

# 4. Workspace Isolation

Every business record belongs to exactly one workspace.

Examples

- Lead
- Company
- Contact
- Deal
- Task
- Document
- Note

Cross-workspace access is never permitted.

Workspace isolation is enforced on the server.

---

# 5. RBAC Model

ForgeCRM uses:

Workspace Member

↓

Role

↓

Permissions

↓

Business Action

Roles are collections of permissions.

Business logic never checks role names directly.

---

# 6. Permission Naming

Permissions follow a predictable pattern.

Examples

```
leads.read

leads.create

leads.update

leads.delete

deals.read

deals.move_stage

reports.export

users.invite

settings.update
```

Permission names remain stable over time.

---

# 7. Permission Evaluation

Authorization evaluates:

- Workspace membership
- Required permission
- Resource ownership (if applicable)
- Business constraints

Every evaluation occurs on the server.

---

# 8. Resource Ownership

Some actions require ownership.

Examples

- Edit own draft
- Complete assigned task
- Modify personal preferences

Ownership complements permissions rather than replacing them.

---

# 9. Administrative Permissions

Administrative actions include:

- Invite members
- Assign roles
- Configure workspace settings
- Manage billing (future)

Administrative permissions should be granted only to trusted users.

---

# 10. Feature Flags vs Permissions

Feature flags determine availability.

Permissions determine authorization.

Example

```
Feature Enabled?

↓

Permission Granted?

↓

Allow Access
```

These concerns remain independent.

---

# 11. Permission Caching

Permissions may be cached for performance.

Cache invalidation occurs when:

- Role changes
- Permission changes
- Workspace membership changes

Security takes priority over cache lifetime.

---

# 12. Middleware

Authorization middleware performs:

- Identity verification
- Workspace resolution
- Permission evaluation

Business services should assume authorization has already been enforced.

Business rules may perform additional domain-specific validation.

---

# 13. IDOR Prevention

Never trust identifiers supplied by the client.

Every resource lookup verifies:

- Workspace ownership
- Authorization
- Resource existence

Object identifiers alone never grant access.

---

# 14. Bulk Operations

Bulk actions require authorization for every affected record.

Example

```
Archive 100 Leads

↓

Validate Each Lead

↓

Execute Authorized Actions

↓

Reject Unauthorized Records
```

Partial success behavior should be clearly defined.

---

# 15. Audit Requirements

Generate immutable audit records for:

- Role assignment
- Permission changes
- Workspace invitations
- Administrative actions
- Authorization failures (where appropriate)

Audit history supports investigation and compliance.

---

# 16. Error Responses

Unauthorized requests should not disclose unnecessary information.

Examples

Return:

- 401 Unauthorized (not authenticated)
- 403 Forbidden (authenticated but not permitted)
- 404 Not Found when hiding resource existence is appropriate

Avoid revealing sensitive resource details.

---

# 17. Future Field-Level Security

Version 2 may introduce field-level permissions.

Examples

- Hide salary information
- Hide financial forecasts
- Restrict internal notes

The authorization model should accommodate finer-grained access controls.

---

# 18. Delegated Access

Future versions may support:

- Temporary delegated permissions
- Approval workflows
- Acting on behalf of another user with audit tracking

Delegation must always be explicit and auditable.

---

# 19. Monitoring

Track:

- Authorization failures
- Permission changes
- Administrative actions
- Suspicious access attempts
- Cross-workspace access denials

Monitoring helps detect misuse and configuration errors.

---

# 20. Testing

Verify:

- Permission enforcement
- Workspace isolation
- Resource ownership rules
- IDOR prevention
- Administrative workflows
- Bulk authorization behavior

Authorization tests should cover both positive and negative scenarios.

---

# 21. Future Enhancements

Version 2 may include:

- Attribute-Based Access Control (ABAC)
- Field-level permissions
- Approval-based authorization
- Dynamic policy evaluation
- Time-limited permissions

The current RBAC architecture supports gradual evolution.

---

# 22. Summary

ForgeCRM uses a workspace-scoped RBAC model built on least privilege, deny-by-default authorization, and strict tenant isolation.

By evaluating workspace membership, permissions, ownership, and business rules on every protected request, the platform minimizes authorization vulnerabilities while remaining flexible enough to support future access control models.