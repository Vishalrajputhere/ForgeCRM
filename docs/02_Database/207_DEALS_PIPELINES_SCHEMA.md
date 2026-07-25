# 207 — Deals & Pipelines Schema

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** CRM Database Design

---

# 1. Purpose

The Deals Domain manages revenue opportunities from qualification through closure.

A Deal represents a potential sale between the workspace and a customer.

Deals move through configurable pipelines and stages until they are won or lost.

---

# 2. Design Philosophy

A Deal represents an opportunity.

It is NOT:

- a Company
- a Contact
- an Invoice
- an Order

A Company can have many Deals.

A Contact can participate in many Deals.

Every Deal belongs to exactly one Pipeline.

Every Pipeline contains multiple ordered Stages.

---

# 3. Tables

```
pipelines

pipeline_stages

deals

deal_products
```

Products themselves will be introduced later when inventory, pricing, and catalogs expand. Version 1 stores only product associations needed for sales opportunities.

---

# 4. Entity Relationship

```
Workspace
      │
      ▼
 Pipelines
      │
      ▼
Pipeline Stages
      │
      ▼
     Deals
      │
 ┌────┴─────────┐
 ▼              ▼
Company     Deal Products
      │
      ▼
Activities
```

---

# 5. pipelines

Purpose

Defines a sales workflow.

Examples

```
Default Sales

Enterprise Sales

Renewals

Partner Sales
```

Columns

| Column | Type | Notes |
|---------|------|------|
| id | UUIDv7 | Primary Key |
| workspace_id | UUID FK | Required |
| name | VARCHAR(150) | Required |
| description | TEXT | Nullable |
| is_default | BOOLEAN | Default false |
| is_active | BOOLEAN | Default true |
| created_at | TIMESTAMPTZ | Required |
| updated_at | TIMESTAMPTZ | Required |

Unique Constraint

```
workspace_id + name
```

Business Rules

- Every workspace must have one default pipeline.
- Multiple pipelines are supported.
- Only active pipelines accept new deals.

---

# 6. pipeline_stages

Purpose

Defines the ordered stages inside a pipeline.

Default Stages

```
Qualification

Discovery

Proposal

Negotiation

Closed Won

Closed Lost
```

Columns

| Column | Type |
|---------|------|
| id | UUIDv7 |
| pipeline_id | UUID FK |
| name | VARCHAR(120) |
| sort_order | INTEGER |
| probability | SMALLINT |
| is_closed | BOOLEAN |
| is_won | BOOLEAN |
| color | VARCHAR(20) |

Rules

- Probability: 0–100
- sort_order must be unique within a pipeline.
- Only one stage may represent Closed Won.
- One or more stages may represent Closed Lost if desired.

Indexes

```
pipeline_id

sort_order
```

---

# 7. deals

Purpose

Represents an active sales opportunity.

Columns

| Column | Type | Notes |
|---------|------|------|
| id | UUIDv7 | Primary Key |
| workspace_id | UUID FK | Required |
| pipeline_id | UUID FK | Required |
| stage_id | UUID FK | Required |
| company_id | UUID FK | Required |
| primary_contact_id | UUID FK | Nullable |
| owner_member_id | UUID FK | Required |
| lead_id | UUID FK | Nullable |
| name | VARCHAR(255) | Required |
| value | NUMERIC(18,2) | Required |
| expected_close_date | DATE | Nullable |
| probability | SMALLINT | Optional Override |
| status | VARCHAR(30) | Open / Won / Lost |
| loss_reason | TEXT | Nullable |
| description | TEXT | Nullable |
| created_by | UUID FK | Required |
| updated_by | UUID FK | Required |
| created_at | TIMESTAMPTZ | Required |
| updated_at | TIMESTAMPTZ | Required |
| deleted_at | TIMESTAMPTZ | Nullable |

Indexes

```
workspace_id

pipeline_id

stage_id

company_id

owner_member_id

status

expected_close_date

created_at
```

Composite

```
workspace_id + owner_member_id

workspace_id + stage_id

workspace_id + expected_close_date
```

Business Rules

- Every Deal belongs to one Company.
- Every Deal belongs to one Pipeline.
- Every Deal belongs to one Stage.
- Closed Deals cannot move to non-closed stages without explicit reopen action.
- Soft delete only.

---

# 8. Deal Probability

Probability is determined by:

```
Pipeline Stage

↓

Default Probability
```

Users with permission may override probability for individual Deals.

Example

```
Negotiation Stage

↓

75%

↓

Deal Override

↓

85%
```

---

# 9. deal_products

Purpose

Associates products or services with a Deal.

Columns

| Column | Type |
|---------|------|
| deal_id | UUID FK |
| product_name | VARCHAR(255) |
| quantity | NUMERIC(12,2) |
| unit_price | NUMERIC(18,2) |
| discount_percent | NUMERIC(5,2) |
| line_total | NUMERIC(18,2) |

Composite Primary Key

```
deal_id

product_name
```

Version 1 intentionally stores product snapshots to preserve historical pricing.

---

# 10. Stage Movement Rules

Allowed

```
Qualification

↓

Discovery

↓

Proposal

↓

Negotiation

↓

Closed Won
```

Backward movement is allowed if the user has permission.

Moving into a closed stage automatically updates Deal status.

---

# 11. Forecasting

Forecasts are calculated using:

```
Deal Value

×

Probability

=

Weighted Forecast
```

Workspace dashboards aggregate:

- Pipeline Value
- Forecast Revenue
- Won Revenue
- Lost Revenue
- Stage Distribution

---

# 12. Duplicate Detection

Potential duplicate Deals compare:

- Company
- Name
- Pipeline
- Owner

Duplicates are flagged.

No automatic merge.

---

# 13. Timeline

Timeline Events

```
Deal Created

Owner Changed

Stage Changed

Value Updated

Product Added

Task Created

Meeting Scheduled

Won

Lost

Reopened
```

Timeline records are immutable.

---

# 14. Search

Searchable Fields

```
Deal Name

Company

Primary Contact

Owner

Pipeline

Stage
```

---

# 15. Security

Every query filters by:

```
workspace_id
```

Permission checks are enforced before:

- Viewing
- Creating
- Updating
- Moving stages
- Closing Deals
- Reopening Deals

---

# 16. Analytics

Metrics include:

- Total Pipeline Value
- Forecast Revenue
- Average Deal Size
- Win Rate
- Loss Rate
- Sales Cycle Length
- Revenue by Pipeline
- Revenue by Owner
- Revenue by Stage

---

# 17. Future Extensions

Version 2 may include:

- Product Catalog
- Price Books
- Quotes
- Contracts
- CPQ
- Multi-Currency
- Revenue Recognition
- Approval Workflows
- Split Ownership
- Commission Tracking

The current schema is designed to support these features without structural redesign.

---

# 18. Summary

The Deals Domain is the commercial center of ForgeCRM.

Its pipeline-based architecture enables flexible sales processes, accurate forecasting, robust reporting, and scalable growth while maintaining strong tenant isolation and transactional consistency.