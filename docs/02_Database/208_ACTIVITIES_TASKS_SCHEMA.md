# 208 — Activities & Tasks Schema

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** CRM Activity Domain Database Design

---

# 1. Purpose

The Activity Domain records business events occurring throughout ForgeCRM.

It powers:

- CRM Timelines
- Tasks
- Calendar
- Follow-ups
- Collaboration
- AI Context
- Dashboard Activity Feed

Unlike Audit Logs, Activities describe business events rather than database changes.

---

# 2. Responsibilities

The Activity Domain owns:

- Activities
- Activity Types
- Tasks
- Task Comments
- Calendar Events
- Mentions

This domain does **not** own:

- Audit Logs
- Notifications
- Documents
- AI

Those consume Activity data but do not own it.

---

# 3. Tables

```
activities

activity_types

tasks

task_comments

calendar_events

mentions
```

---

# 4. Activity Philosophy

Every meaningful business action should generate one Activity.

Examples

```
Lead Created

Lead Assigned

Deal Created

Deal Stage Changed

Task Completed

Meeting Scheduled

Document Uploaded

Note Added
```

Activities are append-only.

Activities are never edited.

---

# 5. Entity Relationship

```
Workspace
      │
      ▼
 Activities
      │
 ┌────┴──────────────┐
 ▼                   ▼
Tasks          Calendar Events
 │
 ▼
Task Comments

Activities

↓

Mentions
```

---

# 6. activity_types

Purpose

Defines the type of business event.

Examples

```
Lead Created

Lead Assigned

Lead Converted

Company Created

Contact Added

Deal Created

Deal Won

Deal Lost

Task Created

Task Completed

Meeting Scheduled

Document Uploaded

Note Added
```

Columns

| Column | Type |
|---------|------|
| id | UUID |
| name | VARCHAR(120) |
| category | VARCHAR(50) |
| icon | VARCHAR(50) |
| color | VARCHAR(20) |

Unique

```
name
```

---

# 7. activities

Purpose

Represents a timeline event.

Activities are generic so every CRM object shares one timeline model.

Columns

| Column | Type | Notes |
|---------|------|------|
| id | UUIDv7 | Primary Key |
| workspace_id | UUID FK | Required |
| activity_type_id | UUID FK | Required |
| actor_member_id | UUID FK | User performing action |
| entity_type | VARCHAR(50) | Company, Lead, Deal, Contact, Task... |
| entity_id | UUID | Target record |
| title | VARCHAR(255) | Required |
| description | TEXT | Nullable |
| metadata | JSONB | Optional structured data |
| occurred_at | TIMESTAMPTZ | Required |
| created_at | TIMESTAMPTZ | Required |

Indexes

```
workspace_id

entity_type

entity_id

occurred_at

actor_member_id
```

Composite

```
workspace_id + entity_type + entity_id

workspace_id + occurred_at
```

Business Rules

- Activities are immutable.
- Activities are never updated.
- Activities are never deleted.
- Metadata stores lightweight contextual information only.

---

# 8. tasks

Purpose

Represents work assigned to a workspace member.

Columns

| Column | Type |
|---------|------|
| id | UUIDv7 |
| workspace_id | UUID FK |
| owner_member_id | UUID FK |
| assigned_member_id | UUID FK |
| entity_type | VARCHAR(50) |
| entity_id | UUID |
| title | VARCHAR(255) |
| description | TEXT |
| priority | VARCHAR(20) |
| status | VARCHAR(20) |
| due_date | TIMESTAMPTZ |
| completed_at | TIMESTAMPTZ |
| created_by | UUID FK |
| updated_by | UUID FK |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |
| deleted_at | TIMESTAMPTZ |

Priority

```
Low

Medium

High

Critical
```

Status

```
Open

In Progress

Completed

Cancelled
```

Indexes

```
workspace_id

assigned_member_id

owner_member_id

status

priority

due_date
```

Business Rules

- Every task belongs to one workspace.
- Tasks may be linked to any supported CRM entity.
- Completing a task automatically creates an Activity.

---

# 9. task_comments

Purpose

Discussion attached to a task.

Columns

| Column | Type |
|---------|------|
| id | UUID |
| task_id | UUID FK |
| author_member_id | UUID FK |
| body | TEXT |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

Comments are append-only except minor edits by the author.

---

# 10. calendar_events

Purpose

Meetings, calls, demos, reminders, and appointments.

Columns

| Column | Type |
|---------|------|
| id | UUID |
| workspace_id | UUID FK |
| owner_member_id | UUID FK |
| entity_type | VARCHAR(50) |
| entity_id | UUID |
| title | VARCHAR(255) |
| description | TEXT |
| starts_at | TIMESTAMPTZ |
| ends_at | TIMESTAMPTZ |
| location | TEXT |
| meeting_url | TEXT |
| all_day | BOOLEAN |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

Business Rules

- End time must be greater than start time.
- Events may optionally reference CRM records.

---

# 11. mentions

Purpose

Supports @mentions in comments and notes.

Columns

| Column | Type |
|---------|------|
| id | UUID |
| workspace_id | UUID FK |
| mentioned_member_id | UUID FK |
| source_entity_type | VARCHAR(50) |
| source_entity_id | UUID |
| created_at | TIMESTAMPTZ |

Mentions trigger notifications.

---

# 12. Timeline Generation

Every timeline is generated by querying Activities.

Example

```
Company

↓

Activities

↓

Ordered by occurred_at DESC
```

No separate timeline table exists.

---

# 13. Query Patterns

Common queries

```
Recent Activities

Company Timeline

Lead Timeline

Deal Timeline

Upcoming Tasks

Tasks Due Today

Overdue Tasks

Calendar by Date Range
```

Indexes are optimized for these queries.

---

# 14. Search

Searchable

```
Task Title

Task Description

Activity Title

Activity Description

Calendar Title
```

---

# 15. Security

All queries include:

```
workspace_id
```

Users only see Activities and Tasks they are authorized to access.

Permission checks occur before retrieval.

---

# 16. AI Integration

AI may consume Activities to generate:

- Customer summaries
- Meeting summaries
- Next-step recommendations
- Relationship history
- Sales insights

AI never modifies Activities.

---

# 17. Future Extensions

Version 2 may include:

- Recurring Tasks
- Task Templates
- Checklists
- Dependencies
- Time Tracking
- Meeting Participants
- Calendar Synchronization
- SLA Monitoring

The current schema supports these features without redesign.

---

# 18. Summary

The Activity Domain provides ForgeCRM with a unified, immutable history of business events.

By separating Activities from Audit Logs and modeling Tasks and Calendar as first-class business entities, the platform gains consistent timelines, richer collaboration, better reporting, and high-quality context for AI features while maintaining a clean, scalable architecture.