# 204 — CRM Domain Overview

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** CRM Domain Architecture

---

# 1. Purpose

The CRM Domain is the core business domain of ForgeCRM.

It manages the complete customer lifecycle, from the first lead through customer acquisition and ongoing relationship management.

Every business workflow in ForgeCRM ultimately revolves around this domain.

---

# 2. Objectives

The CRM domain is designed to:

- Manage the sales lifecycle.
- Track customer relationships.
- Organize business information.
- Support collaboration.
- Maintain historical activity.
- Provide reporting data.
- Supply AI context.

---

# 3. CRM Philosophy

ForgeCRM follows one central principle:

> Every customer interaction should be traceable.

This means every important business action creates historical records.

Nothing important disappears.

---

# 4. Business Lifecycle

The normal customer journey is:

```
Visitor

↓

Lead

↓

Qualified Lead

↓

Company

↓

Contact

↓

Opportunity (Deal)

↓

Negotiation

↓

Won Customer

↓

Ongoing Relationship
```

Not every lead becomes a customer.

Not every company has active deals.

The model supports every possible path.

---

# 5. Primary Entities

The CRM Domain contains the following entities.

```
Companies

Contacts

Leads

Deals

Pipelines

Pipeline Stages

Products

Deal Products

Activities

Tasks

Notes

Documents

Tags
```

Each entity has clearly defined ownership.

---

# 6. Domain Responsibilities

The CRM domain owns:

- Customer information
- Sales opportunities
- Sales pipelines
- Customer history
- Deal forecasting
- Product associations
- Customer timelines

The CRM domain does **not** own:

- Authentication
- Users
- Roles
- Notifications
- AI processing
- Reports

Those belong to separate domains.

---

# 7. Relationships

```
Workspace
     │
     ▼
 Companies
     │
 ┌───┴──────────────┐
 ▼                  ▼
Contacts         Deals
                     │
             ┌───────┴────────┐
             ▼                ▼
         Activities      Products
             │
             ▼
          Timeline
```

Every entity belongs to a workspace.

---

# 8. Customer Hierarchy

ForgeCRM follows this hierarchy.

```
Workspace

↓

Company

↓

Contact

↓

Deal

↓

Activities
```

A company represents an organization.

A contact represents an individual.

A deal represents an opportunity.

---

# 9. Lead Conversion

Lead conversion is transactional.

```
Lead

↓

Create Company

↓

Create Primary Contact

↓

Create Initial Deal (optional)

↓

Copy Notes

↓

Copy Activities

↓

Archive Lead

↓

Commit Transaction
```

If any step fails, the transaction rolls back.

---

# 10. Ownership

Every major CRM entity contains:

```
workspace_id

owner_member_id

created_by

updated_by
```

Ownership controls:

- Visibility
- Assignment
- Reporting
- Notifications
- Permissions

---

# 11. Activity Timeline

Every CRM object has a timeline.

Examples

Lead

Company

Contact

Deal

Task

Timeline entries include:

```
Created

Updated

Assigned

Status Changed

Comment Added

Note Added

Meeting Scheduled

Task Completed

Email Generated

Document Uploaded
```

Timeline records are immutable.

---

# 12. Status Strategy

Statuses are stored in lookup tables.

Never hardcode values.

Examples

Lead Status

Deal Stage

Task Status

Activity Type

Reason:

Administrators may customize workflows in future versions.

---

# 13. Tagging

ForgeCRM supports universal tags.

```
Tags

↓

Entity Type

↓

Entity ID
```

Supported entities:

- Lead
- Company
- Contact
- Deal
- Task

One tagging system serves the entire CRM.

---

# 14. Attachments

Files are never duplicated.

Instead:

```
Document

↓

Entity Type

↓

Entity ID
```

Supported:

- Company
- Contact
- Lead
- Deal
- Task
- Note

Metadata resides in PostgreSQL.

Files reside in object storage.

---

# 15. Notes

Notes are first-class business objects.

A note may belong to:

- Lead
- Company
- Contact
- Deal
- Task

Future versions may support rich collaboration.

---

# 16. Search

Global search covers:

- Companies
- Contacts
- Leads
- Deals
- Notes

Search is scoped by workspace.

Future versions may use pgvector.

---

# 17. Business Rules

- Every entity belongs to exactly one workspace.
- Soft delete is mandatory.
- Audit logs are generated for important actions.
- Activities are append-only.
- Lead conversion is transactional.
- Duplicate companies should be detected.
- Duplicate contacts should be flagged.
- Deal stages belong to pipelines.
- Products are reusable.

---

# 18. Performance Considerations

Frequently indexed fields:

```
workspace_id

owner_member_id

status_id

stage_id

created_at

updated_at
```

Frequently queried relationships:

Company → Contacts

Company → Deals

Deal → Activities

Lead → Owner

Task → Assignee

---

# 19. CRM Domain Boundaries

The CRM domain communicates with:

Identity Domain

→ Resolve user identity.

Workspace Domain

→ Resolve tenant context.

Activity Domain

→ Record timelines.

Notification Domain

→ Notify users.

AI Domain

→ Generate summaries and suggestions.

Reports consume CRM data but never modify it.

---

# 20. Future Extensions

The architecture supports future additions without redesign.

Potential Version 2 features:

- Multiple sales pipelines
- Custom fields
- Custom objects
- Lead scoring
- Sales forecasting
- Territory management
- Quotes
- Contracts
- CPQ
- Workflow automation
- Customer portal

---

# 21. Architecture Principles

The CRM domain follows these rules:

- High cohesion
- Low coupling
- Transactional consistency
- Immutable history
- Explicit ownership
- Workspace isolation
- Reusable relationships
- Predictable APIs

---

# 22. Summary

The CRM Domain is the business heart of ForgeCRM.

It models the complete customer journey while remaining modular, scalable, and enterprise-ready.

All detailed schemas in the following documents inherit the principles defined here.