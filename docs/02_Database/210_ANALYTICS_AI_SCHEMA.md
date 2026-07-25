# 210 — Analytics & AI Schema

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** Analytics & AI Database Design

---

# 1. Purpose

This document defines the database structures supporting analytics, reporting, dashboards, and AI features.

Unlike the CRM Domain, these tables do not own business data.

Instead, they:

- Configure dashboards
- Store saved reports
- Store saved filters
- Track AI requests
- Store AI responses
- Collect user feedback
- Record AI usage metrics

Business data always remains in the CRM domain.

---

# 2. Responsibilities

This domain owns:

- Dashboard Preferences
- Saved Reports
- Saved Filters
- AI Conversations
- AI Requests
- AI Feedback
- Usage Metrics

It does **not** own:

- Leads
- Companies
- Contacts
- Deals
- Activities
- Documents

Those remain the source of truth.

---

# 3. Tables

```
dashboard_preferences

saved_reports

saved_filters

ai_conversations

ai_messages

ai_feedback

usage_metrics
```

---

# 4. Dashboard Philosophy

Dashboard values are calculated.

Examples

```
Pipeline Value

Forecast Revenue

Open Tasks

Deals Closing This Month

Lead Conversion Rate
```

These values are never permanently stored.

Only dashboard layout preferences are stored.

---

# 5. dashboard_preferences

Purpose

Stores each user's dashboard layout.

Columns

| Column | Type |
|---------|------|
| id | UUIDv7 |
| workspace_id | UUID FK |
| member_id | UUID FK |
| layout | JSONB |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

Business Rules

- One dashboard configuration per member.
- Layout only.
- Business metrics remain computed.

---

# 6. saved_reports

Purpose

Stores reusable report definitions.

Examples

```
Won Deals This Quarter

Pipeline Forecast

Overdue Tasks

Lead Conversion

Sales by Owner
```

Columns

| Column | Type |
|---------|------|
| id | UUIDv7 |
| workspace_id | UUID FK |
| owner_member_id | UUID FK |
| name | VARCHAR(255) |
| description | TEXT |
| report_type | VARCHAR(100) |
| configuration | JSONB |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

Business Rules

Report data is generated dynamically.

Only configuration is stored.

---

# 7. saved_filters

Purpose

Stores reusable search filters.

Examples

```
High Value Deals

My Open Leads

Today's Tasks

Lost Opportunities
```

Columns

| Column | Type |
|---------|------|
| id | UUIDv7 |
| workspace_id | UUID FK |
| owner_member_id | UUID FK |
| name | VARCHAR(255) |
| target_entity | VARCHAR(50) |
| filter_definition | JSONB |
| created_at | TIMESTAMPTZ |

---

# 8. ai_conversations

Purpose

Groups AI interactions.

Examples

```
Lead Summary

Deal Analysis

Email Draft

Meeting Summary
```

Columns

| Column | Type |
|---------|------|
| id | UUIDv7 |
| workspace_id | UUID FK |
| member_id | UUID FK |
| title | VARCHAR(255) |
| context_entity_type | VARCHAR(50) |
| context_entity_id | UUID |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

Business Rules

A conversation may optionally reference a CRM entity.

---

# 9. ai_messages

Purpose

Stores prompts and AI responses.

Columns

| Column | Type |
|---------|------|
| id | UUIDv7 |
| conversation_id | UUID FK |
| role | VARCHAR(20) |
| model | VARCHAR(100) |
| message | TEXT |
| token_count | INTEGER |
| latency_ms | INTEGER |
| created_at | TIMESTAMPTZ |

Role

```
User

Assistant

System
```

Business Rules

- Messages are immutable.
- Conversations maintain chronological order.
- Token counts are optional for providers that expose them.

---

# 10. ai_feedback

Purpose

Collects user feedback on AI outputs.

Columns

| Column | Type |
|---------|------|
| id | UUIDv7 |
| message_id | UUID FK |
| member_id | UUID FK |
| rating | SMALLINT |
| comment | TEXT |
| created_at | TIMESTAMPTZ |

Business Rules

- One feedback record per member per message.
- Rating range: 1–5.

---

# 11. usage_metrics

Purpose

Stores aggregated operational metrics.

Examples

```
AI Requests

Documents Uploaded

Active Users

Search Requests
```

Columns

| Column | Type |
|---------|------|
| id | UUIDv7 |
| workspace_id | UUID FK |
| metric_name | VARCHAR(100) |
| metric_date | DATE |
| metric_value | BIGINT |
| created_at | TIMESTAMPTZ |

Business Rules

- Metrics are aggregated.
- Raw events remain in their source domains.

---

# 12. Search

Search supports:

Saved Reports

Saved Filters

AI Conversations

Future versions may support semantic search using embeddings.

---

# 13. AI Architecture

AI never directly edits CRM records.

Workflow

```
CRM Context

↓

Prompt Builder

↓

LLM Provider

↓

Structured Response

↓

User Review

↓

Optional User Action
```

Every write operation requires explicit user confirmation.

---

# 14. Performance

Frequently indexed fields

```
workspace_id

member_id

created_at

metric_date

report_type
```

Redis may cache expensive report queries.

---

# 15. Security

Every query is scoped by:

```
workspace_id
```

AI conversations are private unless explicitly shared.

Saved reports inherit workspace permissions.

---

# 16. Future Extensions

Version 2 may include:

- Vector embeddings (pgvector)
- Semantic search
- AI memory
- Scheduled reports
- Dashboard sharing
- Natural language report builder
- Predictive forecasting
- AI-powered anomaly detection
- Model comparison
- Multi-provider routing

The current schema supports these additions without structural redesign.

---

# 17. Summary

The Analytics & AI Domain provides the supporting infrastructure for dashboards, reporting, and AI without duplicating operational business data.

By storing only configuration, interaction history, and aggregated metrics, ForgeCRM maintains a clean separation between transactional data and analytical capabilities while remaining scalable, auditable, and future-ready.