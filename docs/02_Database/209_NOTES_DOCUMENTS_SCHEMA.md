# 209 — Notes & Documents Schema

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** CRM Collaboration & Document Database Design

---

# 1. Purpose

The Notes & Documents Domain manages structured business knowledge and file attachments throughout ForgeCRM.

This domain enables users to:

- Record business notes
- Upload documents
- Share files
- Build customer history
- Attach information to any supported CRM entity

Rather than creating separate note or document tables for every module, ForgeCRM uses a unified attachment model.

---

# 2. Responsibilities

This domain owns:

- Notes
- Documents
- Document Versions
- Entity Links

It does not own:

- Activities
- Notifications
- Audit Logs
- AI

These consume Notes and Documents but do not own them.

---

# 3. Tables

```
notes

documents

document_versions

entity_links
```

---

# 4. Design Philosophy

Notes and Documents are first-class business objects.

Instead of:

```
lead_notes

company_notes

deal_notes

contact_notes
```

ForgeCRM stores:

```
Notes

↓

Entity Links

↓

CRM Objects
```

Exactly the same strategy is used for Documents.

This avoids duplicated schemas.

---

# 5. Entity Relationship

```
Workspace

     │

     ▼

 Entity Links

 ┌──────┴───────────┐

 ▼                  ▼

Notes          Documents

                   │

                   ▼

          Document Versions
```

---

# 6. notes

Purpose

Represents structured business notes.

Examples

```
Customer requested pricing update.

------------

Follow-up call next Tuesday.

------------

CEO prefers quarterly contracts.
```

---

Columns

| Column | Type | Notes |
|---------|------|------|
| id | UUIDv7 | Primary Key |
| workspace_id | UUID FK | Required |
| author_member_id | UUID FK | Required |
| title | VARCHAR(255) | Nullable |
| body | TEXT | Required |
| is_pinned | BOOLEAN | Default false |
| created_at | TIMESTAMPTZ | Required |
| updated_at | TIMESTAMPTZ | Required |
| deleted_at | TIMESTAMPTZ | Nullable |

Indexes

```
workspace_id

author_member_id

created_at
```

Business Rules

- Notes use soft delete.
- Notes may be attached to multiple entities.
- Editing a note creates an Activity.
- Mention parsing is handled by the Activity Domain.

---

# 7. documents

Purpose

Represents uploaded business files.

Binary content is never stored in PostgreSQL.

Only metadata is stored.

---

Columns

| Column | Type |
|---------|------|
| id | UUIDv7 |
| workspace_id | UUID FK |
| uploaded_by | UUID FK |
| current_version_id | UUID FK Nullable |
| original_filename | VARCHAR(255) |
| mime_type | VARCHAR(150) |
| file_size_bytes | BIGINT |
| storage_key | TEXT |
| checksum_sha256 | CHAR(64) |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |
| deleted_at | TIMESTAMPTZ |

Indexes

```
workspace_id

uploaded_by

mime_type

created_at
```

Business Rules

- Files stored in MinIO (development) or Amazon S3 (production).
- Duplicate uploads may be detected using checksum.
- Soft delete only.

---

# 8. document_versions

Purpose

Supports document version history.

Every new upload replaces the current version while preserving previous versions.

Columns

| Column | Type |
|---------|------|
| id | UUIDv7 |
| document_id | UUID FK |
| version_number | INTEGER |
| storage_key | TEXT |
| checksum_sha256 | CHAR(64) |
| uploaded_by | UUID FK |
| file_size_bytes | BIGINT |
| created_at | TIMESTAMPTZ |

Unique Constraint

```
document_id + version_number
```

Business Rules

- Version numbers are sequential.
- Previous versions are immutable.
- Restoring a version creates a new current version.

---

# 9. entity_links

Purpose

Creates a reusable relationship between business entities and collaborative resources.

Instead of creating separate foreign keys for every module, all relationships use one standardized model.

Supported Resource Types

```
Note

Document
```

Supported Entity Types

```
Lead

Company

Contact

Deal

Task
```

Columns

| Column | Type |
|---------|------|
| id | UUIDv7 |
| workspace_id | UUID FK |
| resource_type | VARCHAR(50) |
| resource_id | UUID |
| entity_type | VARCHAR(50) |
| entity_id | UUID |
| linked_by | UUID FK |
| created_at | TIMESTAMPTZ |

Indexes

```
workspace_id

resource_type

resource_id

entity_type

entity_id
```

Composite

```
workspace_id + entity_type + entity_id
```

Business Rules

- Resources may be linked to multiple entities.
- Removing a link does not delete the resource.
- Links are lightweight and reusable.

---

# 10. File Storage Strategy

Development

```
MinIO
```

Production

```
Amazon S3
```

Database stores only:

- Metadata
- File location
- Checksum
- Version information

---

# 11. Versioning Workflow

```
Document

↓

Upload New Version

↓

Create Document Version

↓

Update Current Version Pointer

↓

Activity Created
```

Previous versions remain available.

---

# 12. Search

Searchable Fields

Notes

```
Title

Body
```

Documents

```
Filename

MIME Type
```

Future versions may include OCR and full-text indexing of document contents.

---

# 13. Timeline Integration

Examples

```
Note Added

Note Edited

Document Uploaded

Document Updated

Document Restored

Document Linked
```

Every significant action creates an Activity.

---

# 14. Security

Every query is filtered by:

```
workspace_id
```

Permissions determine:

- View
- Upload
- Edit
- Delete
- Restore
- Download

Documents inherit entity-level access control.

---

# 15. AI Integration

AI may use Notes and Documents to generate:

- Customer summaries
- Meeting summaries
- Sales insights
- Follow-up suggestions

Document contents are processed only with explicit user action.

AI never modifies source documents.

---

# 16. Future Extensions

Version 2 may include:

- Folder hierarchy
- File sharing links
- OCR
- PDF preview generation
- Image thumbnails
- Document approval workflow
- Electronic signatures
- External storage providers
- Virus scanning
- Retention policies

The current schema supports these additions without structural redesign.

---

# 17. Summary

The Notes & Documents Domain provides a unified, extensible collaboration model for ForgeCRM.

By treating Notes and Documents as reusable resources linked through a generic entity relationship, the platform avoids schema duplication, simplifies future feature development, and delivers a scalable foundation for collaboration, search, reporting, and AI.