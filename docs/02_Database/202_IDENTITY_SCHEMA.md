# 202 — Identity Schema

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** Identity Domain Database Design

---

# 1. Purpose

The Identity Domain manages authentication, authorization, user identities, sessions, roles, and permissions.

It is the security foundation of ForgeCRM.

Every authenticated request passes through this domain.

---

# 2. Responsibilities

The Identity Domain owns:

- Users
- Authentication
- Roles
- Permissions
- Sessions
- Refresh Tokens
- OAuth Accounts
- Password Reset
- Email Verification

The Identity Domain does **not** manage workspace membership. That belongs to the Workspace Domain.

---

# 3. Domain Tables

```
users

roles

permissions

role_permissions

user_roles

sessions

refresh_tokens

oauth_accounts

password_reset_tokens

email_verification_tokens
```

---

# 4. Entity Relationship Diagram

```
Users
   │
   ├──────────────┐
   │              │
   ▼              ▼
Sessions     OAuth Accounts
   │
   ▼
Refresh Tokens

Users
   │
   ▼
User Roles
   │
   ▼
Roles
   │
   ▼
Role Permissions
   │
   ▼
Permissions
```

---

# 5. users

Purpose

Represents an authenticated person.

One user may belong to multiple workspaces.

Authentication belongs to the user.

Workspace membership is handled elsewhere.

---

Columns

| Column | Type | Notes |
|---------|------|------|
| id | UUIDv7 | Primary Key |
| first_name | VARCHAR(100) | Required |
| last_name | VARCHAR(100) | Required |
| email | VARCHAR(255) | Unique |
| password_hash | TEXT | Nullable for OAuth |
| phone | VARCHAR(30) | Nullable |
| avatar_url | TEXT | Nullable |
| job_title | VARCHAR(150) | Nullable |
| timezone | VARCHAR(100) | Default UTC |
| language | VARCHAR(30) | Default en |
| is_active | BOOLEAN | Default true |
| is_email_verified | BOOLEAN | Default false |
| last_login_at | TIMESTAMPTZ | Nullable |
| created_at | TIMESTAMPTZ | Required |
| updated_at | TIMESTAMPTZ | Required |
| deleted_at | TIMESTAMPTZ | Soft delete |

Indexes

```
email UNIQUE

is_active

created_at
```

Business Rules

- Email is globally unique.
- Password is never stored in plain text.
- OAuth users may not have a password hash.
- Soft delete only.

---

# 6. roles

Purpose

Defines permission groups.

Examples

```
Super Admin

Workspace Admin

Sales Manager

Sales Executive

Customer Success

Viewer
```

Columns

| Column | Type |
|---------|------|
| id | UUID |
| name | VARCHAR(100) |
| description | TEXT |
| is_system | BOOLEAN |
| created_at | TIMESTAMPTZ |

Unique

```
name
```

---

# 7. permissions

Purpose

Represents atomic permissions.

Examples

```
lead.read

lead.create

lead.update

lead.delete

deal.read

deal.create

task.assign

user.invite

report.export
```

Columns

| Column | Type |
|---------|------|
| id | UUID |
| name | VARCHAR(150) |
| module | VARCHAR(100) |
| description | TEXT |

Unique

```
name
```

Permission Naming Convention

```
resource.action
```

Examples

```
deal.create

deal.update

company.read

company.export
```

---

# 8. role_permissions

Purpose

Maps permissions to roles.

Columns

| Column | Type |
|---------|------|
| role_id | UUID FK |
| permission_id | UUID FK |

Composite Primary Key

```
role_id

permission_id
```

---

# 9. user_roles

Purpose

Assigns roles to users.

A user may hold multiple roles within a workspace (actual workspace linkage is defined in the Workspace schema).

Columns

| Column | Type |
|---------|------|
| user_id | UUID FK |
| role_id | UUID FK |
| assigned_by | UUID FK |
| assigned_at | TIMESTAMPTZ |

Composite Key

```
user_id

role_id
```

---

# 10. sessions

Purpose

Tracks active user sessions.

Supports

- Multi-device login
- Device management
- Force logout
- Security auditing

Columns

| Column | Type |
|---------|------|
| id | UUID |
| user_id | UUID FK |
| ip_address | INET |
| user_agent | TEXT |
| device_name | VARCHAR(255) |
| platform | VARCHAR(100) |
| browser | VARCHAR(100) |
| country | VARCHAR(100) |
| city | VARCHAR(100) |
| last_activity_at | TIMESTAMPTZ |
| expires_at | TIMESTAMPTZ |
| revoked_at | TIMESTAMPTZ |
| created_at | TIMESTAMPTZ |

Indexes

```
user_id

expires_at
```

---

# 11. refresh_tokens

Purpose

Stores refresh tokens.

Columns

| Column | Type |
|---------|------|
| id | UUID |
| session_id | UUID FK |
| token_hash | TEXT |
| expires_at | TIMESTAMPTZ |
| revoked_at | TIMESTAMPTZ |
| created_at | TIMESTAMPTZ |

Rules

- Store hashed refresh tokens only.
- Rotate refresh tokens.
- Revoke immediately after logout.

---

# 12. oauth_accounts

Purpose

Connects users to external providers.

Supported Providers

```
Google
```

Future

```
Microsoft

GitHub

Okta
```

Columns

| Column | Type |
|---------|------|
| id | UUID |
| user_id | UUID FK |
| provider | VARCHAR(50) |
| provider_user_id | VARCHAR(255) |
| email | VARCHAR(255) |
| created_at | TIMESTAMPTZ |

Unique

```
provider

provider_user_id
```

---

# 13. password_reset_tokens

Purpose

Password recovery.

Columns

| Column | Type |
|---------|------|
| id | UUID |
| user_id | UUID FK |
| token_hash | TEXT |
| expires_at | TIMESTAMPTZ |
| used_at | TIMESTAMPTZ |
| created_at | TIMESTAMPTZ |

Business Rules

- One-time use.
- Hash tokens before storage.
- Short expiration.

---

# 14. email_verification_tokens

Purpose

Verify user email addresses.

Columns

| Column | Type |
|---------|------|
| id | UUID |
| user_id | UUID FK |
| token_hash | TEXT |
| expires_at | TIMESTAMPTZ |
| verified_at | TIMESTAMPTZ |
| created_at | TIMESTAMPTZ |

---

# 15. Security Rules

- Passwords hashed using Argon2id (preferred) or bcrypt.
- Never store plaintext passwords.
- Never store plaintext refresh tokens.
- Every login creates a session.
- Every logout revokes the session.
- Sensitive actions require permission checks.
- Audit logs are generated for authentication events.

---

# 16. Query Patterns

Common queries include:

- Find user by email.
- List active sessions for a user.
- Load permissions for a user's roles.
- Verify refresh token.
- Validate email verification token.
- Validate password reset token.

Indexes are designed to optimize these operations.

---

# 17. Future Extensions

Version 2 may add:

- Passkeys (WebAuthn)
- Multi-Factor Authentication (TOTP)
- SAML / SSO
- SCIM provisioning
- Security policies
- Risk-based authentication

These features should not require redesign of the existing schema.

---

# 18. Summary

The Identity Domain provides a secure, scalable foundation for authentication and authorization.

It separates identity from workspace membership, supports multiple authentication methods, enables enterprise-grade RBAC, and is designed to evolve with future security requirements without breaking existing architecture.