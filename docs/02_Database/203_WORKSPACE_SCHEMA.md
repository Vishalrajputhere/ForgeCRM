# 203 — Workspace Schema

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** Workspace Domain Database Design

---

# 1. Purpose

The Workspace Domain manages tenants, organizations, memberships, teams, invitations, and workspace-level configuration.

It provides complete tenant isolation and enables a single user to belong to multiple organizations while having different permissions in each.

---

# 2. Responsibilities

The Workspace Domain owns:

- Workspaces
- Workspace Memberships
- Teams
- Team Memberships
- Invitations
- Workspace Settings

The Workspace Domain does **not** own authentication.

Authentication belongs to the Identity Domain.

---

# 3. Domain Tables

```
workspaces

workspace_members

teams

team_members

workspace_invitations

workspace_settings
```

---

# 4. Entity Relationship Diagram

```
Users
   │
   ▼
Workspace Members
   │
   ├────────────┐
   │            │
   ▼            ▼
Workspaces    Roles
   │
   ├──────────────┐
   │              │
   ▼              ▼
Workspace      Teams
Settings          │
                  ▼
             Team Members
```

---

# 5. workspaces

Purpose

Represents one customer organization.

Examples

```
Acme Technologies

TechNova

ABC Pvt Ltd
```

Every CRM record belongs to one workspace.

---

Columns

| Column | Type | Notes |
|---------|------|------|
| id | UUIDv7 | Primary Key |
| name | VARCHAR(255) | Required |
| slug | VARCHAR(150) | Unique |
| logo_url | TEXT | Nullable |
| industry | VARCHAR(100) | Nullable |
| website | TEXT | Nullable |
| company_size | INTEGER | Nullable |
| subscription_plan | VARCHAR(50) | Default Free |
| status | VARCHAR(30) | Active / Suspended / Trial |
| created_by | UUID FK |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |
| deleted_at | TIMESTAMPTZ |

Indexes

```
slug UNIQUE

status

created_at
```

Business Rules

- Slug is unique.
- Workspace names are not required to be unique.
- Soft delete only.

---

# 6. workspace_members

Purpose

Connects users to workspaces.

This is one of the most important tables in the system.

Instead of:

```
Users

↓

Roles
```

ForgeCRM uses

```
Users

↓

Workspace Membership

↓

Workspace

↓

Role
```

This allows

- Multiple organizations
- Different roles per organization
- Invitation flow
- Membership status
- Future billing support

---

Columns

| Column | Type |
|---------|------|
| id | UUID |
| workspace_id | UUID FK |
| user_id | UUID FK |
| role_id | UUID FK |
| status | VARCHAR(30) |
| joined_at | TIMESTAMPTZ |
| invited_by | UUID FK |
| last_active_at | TIMESTAMPTZ |
| is_default_workspace | BOOLEAN |

Status Values

```
Pending

Active

Suspended

Removed
```

Unique Constraint

```
workspace_id

user_id
```

Business Rules

A user may belong to many workspaces.

A workspace may contain many users.

Each membership owns exactly one primary role.

---

# 7. teams

Purpose

Logical grouping of workspace members.

Examples

```
Sales

Enterprise Sales

Marketing

Support
```

Columns

| Column | Type |
|---------|------|
| id | UUID |
| workspace_id | UUID FK |
| name | VARCHAR(150) |
| description | TEXT |
| manager_member_id | UUID FK (workspace_members.id) |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

Unique

```
workspace_id

name
```

---

# 8. team_members

Purpose

Assigns workspace members to teams.

Columns

| Column | Type |
|---------|------|
| team_id | UUID FK |
| workspace_member_id | UUID FK |
| joined_at | TIMESTAMPTZ |

Composite Primary Key

```
team_id

workspace_member_id
```

A member may belong to multiple teams.

---

# 9. workspace_invitations

Purpose

Invite users into a workspace.

Supports

- Existing users
- New users
- Email invitations

Columns

| Column | Type |
|---------|------|
| id | UUID |
| workspace_id | UUID FK |
| email | VARCHAR(255) |
| role_id | UUID FK |
| invited_by | UUID FK |
| invitation_token_hash | TEXT |
| expires_at | TIMESTAMPTZ |
| accepted_at | TIMESTAMPTZ |
| created_at | TIMESTAMPTZ |

Rules

- Invitation tokens are hashed.
- Invitations expire automatically.
- Invitations are single-use.

---

# 10. workspace_settings

Purpose

Stores organization preferences.

Columns

| Column | Type |
|---------|------|
| workspace_id | UUID PK/FK |
| timezone | VARCHAR(100) |
| currency | VARCHAR(20) |
| language | VARCHAR(20) |
| date_format | VARCHAR(20) |
| time_format | VARCHAR(20) |
| week_start_day | SMALLINT |
| branding_primary_color | VARCHAR(20) |
| branding_logo_url | TEXT |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

One settings record exists per workspace.

---

# 11. Workspace Lifecycle

```
Workspace Created

↓

Workspace Settings Created

↓

Owner Membership Created

↓

Invite Members

↓

Create Teams

↓

Assign Members

↓

Workspace Operational
```

---

# 12. Tenant Isolation

Every business table references:

```
workspace_id
```

Every authenticated request resolves:

```
JWT

↓

User

↓

Workspace Member

↓

Workspace

↓

Permission Check

↓

Execute Query
```

Queries without workspace filtering are prohibited.

---

# 13. Team Strategy

Teams are organizational groups only.

Permissions come from Roles.

Teams help with:

- Lead assignment
- Reporting
- Notifications
- Filtering
- Workload distribution

---

# 14. Common Query Patterns

Examples

- List all members in a workspace.
- Find all workspaces for a user.
- List pending invitations.
- Load all teams.
- Find team members.
- Resolve user's active workspace.
- Check membership status.

Indexes are optimized for these operations.

---

# 15. Future Extensions

Version 2 may include:

- Departments
- Business Units
- Custom Roles per Workspace
- Workspace Billing
- Workspace API Keys
- Domain Verification
- Multiple Office Locations

The current schema supports these additions without redesign.

---

# 16. Summary

The Workspace Domain establishes ForgeCRM's multi-tenant foundation.

By introducing `workspace_members` as the central relationship between users, workspaces, and roles, the system supports enterprise-grade tenant isolation, flexible user management, and future organizational growth while keeping permissions clean and maintainable.