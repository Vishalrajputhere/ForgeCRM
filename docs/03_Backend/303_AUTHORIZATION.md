# 303 — Authentication & Authorization

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** Security Architecture

---

# 1. Purpose

This document defines how ForgeCRM authenticates users and authorizes access to resources.

It covers:

- Authentication
- JWT
- Refresh Tokens
- Workspace Resolution
- Role-Based Access Control (RBAC)
- Permission Resolution
- Authorization Flow

---

# 2. Security Philosophy

Authentication answers:

> Who are you?

Authorization answers:

> What are you allowed to do?

These responsibilities are strictly separated.

---

# 3. Authentication Methods

Supported

- Email + Password
- Google OAuth

Future

- Microsoft OAuth
- SAML
- Enterprise SSO

---

# 4. Authentication Flow

```
Login

↓

Validate Credentials

↓

Generate Access Token

↓

Generate Refresh Token

↓

Store Refresh Session

↓

Return Tokens
```

Passwords are never stored in plain text.

---

# 5. Password Security

Passwords are hashed using:

```
bcrypt
```

Rules

- Minimum length enforced
- Strong password policy
- Password reset tokens expire
- Password hashes are never returned

---

# 6. JWT Strategy

Access Token

Purpose

```
Authentication
```

Lifetime

```
15 minutes
```

Refresh Token

Purpose

```
Session Renewal
```

Lifetime

```
30 days
```

Every refresh rotates the refresh token.

---

# 7. JWT Claims

Access Token contains:

```
sub

workspace_id

member_id

session_id

token_version

exp

iat
```

Sensitive business information is never embedded in the token.

---

# 8. Refresh Token Rotation

```
Login

↓

Access Token

+

Refresh Token

↓

Access Expires

↓

Refresh Request

↓

Validate Refresh Token

↓

Issue New Access Token

↓

Issue New Refresh Token

↓

Invalidate Old Refresh Token
```

Stolen refresh tokens become unusable after rotation.

---

# 9. Workspace Resolution

Every authenticated request resolves:

```
User

↓

Workspace Member

↓

Workspace

↓

Permissions
```

Authorization is always evaluated in the current workspace context.

---

# 10. Authorization Model

ForgeCRM uses Permission-Based RBAC.

Users never receive permissions directly.

Permissions are granted through Roles.

```
User

↓

Workspace Member

↓

Role

↓

Permissions
```

---

# 11. Permission Naming

Pattern

```
resource.action
```

Examples

```
companies.read

companies.create

companies.update

companies.delete

contacts.read

contacts.create

deals.read

deals.move_stage

reports.export

users.invite

settings.update
```

Permission names are immutable.

---

# 12. Roles

Examples

```
Workspace Owner

Administrator

Sales Manager

Sales Representative

Support

Viewer
```

Roles are configurable.

The application never hardcodes role names.

---

# 13. Permission Resolution

Example

```
Workspace Member

↓

Assigned Roles

↓

Merge Permissions

↓

Unique Permission Set

↓

Authorization Check
```

Duplicate permissions are ignored.

---

# 14. Authorization Flow

```
HTTP Request

↓

Validate JWT

↓

Resolve Workspace

↓

Resolve Workspace Member

↓

Load Permissions

↓

Check Permission

↓

Execute Service

↓

Return Response
```

Authorization occurs before business logic.

---

# 15. Service-Level Authorization

Services receive the resolved member context.

Example

```
create_deal()

↓

Require

deals.create
```

Services never inspect role names.

They check permissions only.

---

# 16. Ownership Rules

Some operations require ownership.

Example

```
Task Owner

↓

Task Update
```

Permission checks may combine:

- Permission
- Ownership
- Workspace membership

---

# 17. Public Endpoints

Examples

```
Login

Register

Forgot Password

Reset Password

Email Verification

Health Check
```

Everything else requires authentication.

---

# 18. Session Management

Every login creates a Session.

Sessions include:

- Device
- IP Address
- User Agent
- Created Time
- Last Activity

Users may revoke individual sessions.

---

# 19. Token Revocation

Tokens become invalid when:

- User logs out
- Refresh token rotates
- Password changes
- Account is disabled
- Session is revoked

---

# 20. Security Events

Examples

- Login Success
- Login Failure
- Password Reset
- Email Verification
- Refresh Rotation
- Session Revoked
- Permission Denied

Security events are logged for monitoring and auditing.

---

# 21. Workspace Isolation

Every protected query includes:

```
workspace_id
```

Even administrators cannot access another workspace unless they belong to it.

Workspace isolation is mandatory.

---

# 22. Future Extensions

Version 2 may include:

- MFA / TOTP
- Passkeys (WebAuthn)
- Enterprise SSO
- SCIM Provisioning
- IP Allow Lists
- Device Trust
- Conditional Access Policies

The current architecture supports these additions without redesign.

---

# 23. Summary

ForgeCRM uses a workspace-aware, permission-based RBAC system built on JWT authentication and refresh token rotation.

By assigning permissions through workspace roles rather than hardcoding role names, the platform remains flexible, secure, and scalable while supporting multi-tenant SaaS deployments and future enterprise security features.