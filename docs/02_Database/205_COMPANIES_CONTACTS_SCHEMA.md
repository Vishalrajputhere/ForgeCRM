# 205 — Companies & Contacts Schema

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** CRM Database Design

---

# 1. Purpose

This document defines the data model for Companies and Contacts.

These entities represent organizations and the people associated with them.

They form the foundation for Deals, Activities, Tasks, Notes, Documents, AI insights, and Reporting.

---

# 2. Design Principles

- Every Company belongs to one Workspace.
- Every Contact belongs to one Company.
- A Company may exist without Contacts.
- Every Contact belongs to exactly one Company in Version 1.
- All business records use soft deletes.
- Ownership is explicit.
- Timeline history is immutable.

---

# 3. Tables

```
companies

contacts

company_industries
```

---

# 4. Entity Relationship

```
Workspace
     │
     ▼
 Companies
     │
     ├──────────────┐
     ▼              ▼
 Contacts        Deals
     │              │
     ▼              ▼
Activities     Documents
```

---

# 5. companies

Purpose

Represents an organization.

Examples

```
OpenAI

Microsoft

ABC Technologies Pvt Ltd
```

---

Columns

| Column | Type | Notes |
|---------|------|------|
| id | UUIDv7 | Primary Key |
| workspace_id | UUID FK | Required |
| owner_member_id | UUID FK | Required |
| name | VARCHAR(255) | Required |
| legal_name | VARCHAR(255) | Nullable |
| industry_id | UUID FK | Nullable |
| website | TEXT | Nullable |
| email | VARCHAR(255) | Nullable |
| phone | VARCHAR(50) | Nullable |
| annual_revenue | NUMERIC(18,2) | Nullable |
| employee_count | INTEGER | Nullable |
| description | TEXT | Nullable |
| status | VARCHAR(30) | Active / Inactive |
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

industry_id

status

created_at

(name)

(website)
```

Composite

```
workspace_id + owner_member_id

workspace_id + status

workspace_id + created_at
```

---

Business Rules

- Company names are unique **within the same workspace**.
- Soft delete only.
- Company owner must belong to the same workspace.
- Deleting a company is prohibited while active deals exist.
- Merge operations preserve timeline history.

---

# 6. company_industries

Purpose

Lookup table.

Examples

```
Technology

Healthcare

Manufacturing

Education

Finance

Retail

Hospitality

Real Estate
```

Columns

| Column | Type |
|---------|------|
| id | UUID |
| name | VARCHAR(150) |
| description | TEXT |
| sort_order | INTEGER |

Unique

```
name
```

---

# 7. contacts

Purpose

Represents an individual associated with a company.

Examples

```
John Smith

Priya Sharma

Rahul Singh
```

---

Columns

| Column | Type | Notes |
|---------|------|------|
| id | UUIDv7 | Primary Key |
| workspace_id | UUID FK | Required |
| company_id | UUID FK | Required |
| owner_member_id | UUID FK | Required |
| first_name | VARCHAR(100) | Required |
| last_name | VARCHAR(100) | Required |
| job_title | VARCHAR(150) | Nullable |
| department | VARCHAR(150) | Nullable |
| email | VARCHAR(255) | Nullable |
| phone | VARCHAR(50) | Nullable |
| mobile | VARCHAR(50) | Nullable |
| linkedin_url | TEXT | Nullable |
| birthday | DATE | Nullable |
| is_primary | BOOLEAN | Default false |
| status | VARCHAR(30) | Active / Inactive |
| created_by | UUID FK | Required |
| updated_by | UUID FK | Required |
| created_at | TIMESTAMPTZ | Required |
| updated_at | TIMESTAMPTZ | Required |
| deleted_at | TIMESTAMPTZ | Nullable |

---

Indexes

```
workspace_id

company_id

owner_member_id

email

phone

mobile

created_at
```

Composite

```
workspace_id + company_id

workspace_id + owner_member_id
```

---

Business Rules

- Exactly one primary contact per company.
- Emails are unique within a workspace when present.
- Owner must belong to the same workspace.
- Contacts cannot exist without a company.
- Soft delete only.

---

# 8. Duplicate Detection

Potential duplicate Companies

Compare

- Name
- Website
- Phone
- Email

Potential duplicate Contacts

Compare

- Email
- Mobile
- First Name
- Last Name
- Company

Duplicates are flagged for review.

No automatic merge.

---

# 9. Merge Strategy

Supported

Company Merge

```
Company A

+

Company B

↓

Company A
```

Move

- Contacts
- Deals
- Activities
- Notes
- Documents

Old company becomes archived.

---

Contact Merge

```
Contact A

+

Contact B

↓

Single Contact
```

Timeline preserved.

---

# 10. Query Patterns

Most frequent queries

```
Companies by Workspace

Companies by Owner

Company Details

Company Timeline

Company Contacts

Company Deals

Recent Companies

Primary Contact

Search by Name

Search by Website
```

Indexes are optimized for these patterns.

---

# 11. Search

Searchable Company Fields

```
Name

Legal Name

Website

Email

Phone
```

Searchable Contact Fields

```
First Name

Last Name

Email

Phone

Job Title
```

Uses PostgreSQL Full Text Search in Version 1.

---

# 12. Timeline

Every Company and Contact automatically generates timeline events.

Examples

```
Created

Owner Changed

Edited

Deal Added

Task Assigned

Document Uploaded

Note Added

Email Generated

Merged
```

Timeline records are immutable.

---

# 13. Security

Queries are always filtered by

```
workspace_id
```

Permission checks occur before data retrieval.

Users never see records outside their workspace.

---

# 14. Future Extensions

Version 2 may add

- Multiple office locations
- Parent / Child companies
- Contact relationships
- Buying committees
- Social profiles
- Customer health score
- Custom fields
- External integrations

The current schema supports these additions without redesign.

---

# 15. Summary

Companies and Contacts form the customer foundation of ForgeCRM.

The schema is normalized, optimized for enterprise CRM workflows, and designed to scale while preserving clean relationships, strong tenant isolation, and high query performance.