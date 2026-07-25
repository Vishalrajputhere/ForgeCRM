# 206 — Leads Schema

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** CRM Database Design

---

# 1. Purpose

The Leads Domain manages potential customers before they become structured CRM records.

A Lead represents an unqualified sales opportunity.

A Lead may later be converted into:

- Company
- Contact
- Deal (optional)

Lead conversion is transactional and preserves history.

---

# 2. Design Philosophy

A Lead is intentionally independent.

A Lead is **not** a Company.

A Lead is **not** a Contact.

A Lead may contain only partial information.

Examples

```
Rahul Sharma
rahul@gmail.com

------------

Marketing Manager
ABC Pvt Ltd

------------

+91xxxxxxxxxx
```

Sales representatives should be able to create leads quickly without requiring complete business information.

---

# 3. Tables

```
leads

lead_sources

lead_statuses

lead_conversions
```

---

# 4. Entity Relationship

```
Workspace
      │
      ▼
    Leads
      │
      ▼
Lead Conversion
      │
 ┌────┴───────────────┐
 ▼                    ▼
Company            Contact
                        │
                        ▼
                     Deal (Optional)
```

---

# 5. leads

Purpose

Represents an unqualified prospect.

---

Columns

| Column | Type | Notes |
|---------|------|------|
| id | UUIDv7 | Primary Key |
| workspace_id | UUID FK | Required |
| owner_member_id | UUID FK | Required |
| source_id | UUID FK | Nullable |
| status_id | UUID FK | Required |
| first_name | VARCHAR(100) | Required |
| last_name | VARCHAR(100) | Nullable |
| company_name | VARCHAR(255) | Nullable |
| job_title | VARCHAR(150) | Nullable |
| email | VARCHAR(255) | Nullable |
| phone | VARCHAR(50) | Nullable |
| website | TEXT | Nullable |
| estimated_value | NUMERIC(18,2) | Nullable |
| priority | VARCHAR(20) | Low / Medium / High |
| description | TEXT | Nullable |
| assigned_at | TIMESTAMPTZ | Nullable |
| converted_at | TIMESTAMPTZ | Nullable |
| lost_reason | TEXT | Nullable |
| created_by | UUID FK | Required |
| updated_by | UUID FK | Required |
| created_at | TIMESTAMPTZ | Required |
| updated_at | TIMESTAMPTZ | Required |
| deleted_at | TIMESTAMPTZ | Nullable |

---

Indexes

```
workspace_id

owner_member_id

status_id

source_id

email

phone

company_name

created_at
```

Composite

```
workspace_id + status_id

workspace_id + owner_member_id

workspace_id + created_at
```

---

Business Rules

- Every Lead belongs to one workspace.
- Every Lead has one owner.
- A Lead may exist without email.
- A Lead may exist without phone.
- A Lead may exist without company.
- Converted leads remain in the database.
- Converted leads become read-only.
- Soft delete only.

---

# 6. lead_sources

Purpose

Tracks where leads originate.

Examples

```
Website

Referral

LinkedIn

Cold Call

Facebook

Google Ads

Trade Show

Email Campaign

Import

Manual
```

Columns

| Column | Type |
|---------|------|
| id | UUID |
| workspace_id | UUID FK |
| name | VARCHAR(100) |
| description | TEXT |
| is_active | BOOLEAN |

Unique

```
workspace_id

name
```

---

# 7. lead_statuses

Purpose

Controls the sales qualification workflow.

Default Statuses

```
New

Contacted

Qualified

Unqualified

Converted

Lost
```

Columns

| Column | Type |
|---------|------|
| id | UUID |
| workspace_id | UUID FK |
| name | VARCHAR(100) |
| color | VARCHAR(20) |
| sort_order | INTEGER |
| is_final | BOOLEAN |

Business Rules

Administrators may customize statuses.

---

# 8. lead_conversions

Purpose

Stores conversion history.

A Lead may only be converted once.

Columns

| Column | Type |
|---------|------|
| id | UUID |
| lead_id | UUID FK |
| company_id | UUID FK |
| contact_id | UUID FK |
| deal_id | UUID FK Nullable |
| converted_by | UUID FK |
| converted_at | TIMESTAMPTZ |

Unique

```
lead_id
```

---

# 9. Conversion Workflow

```
Lead

↓

Validate Lead

↓

Begin Transaction

↓

Create Company

↓

Create Contact

↓

(Optional) Create Deal

↓

Copy Notes

↓

Copy Documents

↓

Copy Activities

↓

Create Conversion Record

↓

Update Lead Status

↓

Commit
```

If any step fails:

```
Rollback Everything
```

---

# 10. Assignment Rules

Every Lead has one owner.

Leads may later support:

- Round Robin
- Territory Assignment
- AI Assignment

Version 1 supports manual assignment only.

---

# 11. Duplicate Detection

Possible duplicate leads compare:

- Email
- Phone
- Website
- Company Name
- First Name
- Last Name

Duplicates are flagged.

Automatic merging is not performed.

---

# 12. Lead Timeline

Timeline examples

```
Lead Created

Owner Changed

Status Updated

Note Added

Task Created

Document Uploaded

Email Generated

Converted

Lost
```

Timeline entries are immutable.

---

# 13. Search

Search fields

```
First Name

Last Name

Email

Phone

Company Name

Website
```

Uses PostgreSQL Full Text Search.

---

# 14. Security

Every query includes:

```
workspace_id
```

Permission checks are enforced before query execution.

Users cannot access Leads from other workspaces.

---

# 15. Analytics

Lead metrics include:

- Total Leads
- New Leads
- Qualified Leads
- Lost Leads
- Conversion Rate
- Average Conversion Time
- Source Performance
- Owner Performance

---

# 16. Future Extensions

Version 2 may add:

- AI Lead Scoring
- Duplicate Suggestions
- Lead Enrichment
- Automatic Assignment Rules
- Territory Management
- SLA Tracking
- Multi-step Qualification
- Predictive Conversion

The current schema supports these additions without redesign.

---

# 17. Summary

The Leads Domain models the earliest stage of the customer lifecycle.

It allows rapid data entry, supports transactional conversion into structured CRM records, preserves historical data, and provides a scalable foundation for sales qualification, reporting, and future AI enhancements.