# 307 — File Storage

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** File Storage Architecture

---

# 1. Purpose

This document defines how ForgeCRM stores, retrieves, validates, and manages files.

It covers:

- Storage abstraction
- Upload workflow
- Downloads
- Versioning
- Security
- Validation
- Object lifecycle

Business logic must remain independent of the storage provider.

---

# 2. Storage Philosophy

Files are not stored in PostgreSQL.

Only metadata is stored.

Actual file content resides in object storage.

```
PostgreSQL

↓

Metadata

↓

Storage Provider

↓

Object Storage
```

---

# 3. Storage Providers

Development

- MinIO

Production

- Amazon S3

Future

- Azure Blob Storage
- Google Cloud Storage

The application communicates only with the Storage Service.

---

# 4. Architecture

```
Application

↓

Storage Service

↓

Storage Provider

↓

Object Storage
```

Business services never call the provider SDK directly.

---

# 5. Storage Service

Responsibilities

- Generate upload URLs
- Generate download URLs
- Delete files
- Restore versions
- Validate uploads
- Resolve providers

The service hides implementation details.

---

# 6. Upload Workflow

Preferred workflow

```
Client

↓

Request Upload

↓

Backend Validation

↓

Generate Presigned URL

↓

Upload Directly to Storage

↓

Confirm Upload

↓

Store Metadata

↓

Create Activity
```

Large files never pass through the backend.

---

# 7. Downloads

Workflow

```
Client

↓

Request Download

↓

Permission Check

↓

Generate Temporary Download URL

↓

Redirect Client
```

Download URLs expire automatically.

---

# 8. Validation

Every upload validates:

- File size
- MIME type
- File extension
- Workspace permissions

Rejected uploads never receive a presigned URL.

---

# 9. Supported File Types

Version 1

Documents

```
PDF

DOCX

XLSX

PPTX

TXT
```

Images

```
PNG

JPEG

WEBP
```

Archives

```
ZIP
```

Additional formats may be enabled through configuration.

---

# 10. File Size Limits

Default

```
25 MB
```

Administrators may configure limits.

Limits may vary by workspace plan in future versions.

---

# 11. Storage Keys

Objects use generated keys.

Example

```
workspace_id/

documents/

uuidv7.ext
```

Original filenames are metadata only.

---

# 12. Versioning

Workflow

```
Existing Document

↓

Upload New Version

↓

Store New Object

↓

Update Current Version

↓

Preserve Previous Versions
```

Previous versions remain immutable.

---

# 13. Deletion

Deleting a document:

- Soft deletes database metadata
- Schedules physical deletion asynchronously
- Preserves audit history

Immediate object deletion is avoided unless required.

---

# 14. Security

Storage security includes:

- Presigned URLs
- Short-lived download links
- Private buckets
- Server-side permission checks

Objects are never publicly accessible by default.

---

# 15. Virus Scanning

Future-compatible workflow

```
Upload

↓

Quarantine

↓

Virus Scan

↓

Approved

↓

Visible to Users
```

Version 1 provides the extension point even if scanning is disabled.

---

# 16. Image Processing

Future background jobs may generate:

- Thumbnails
- Optimized previews
- Responsive image sizes

Original files remain unchanged.

---

# 17. Lifecycle Management

Future policies may archive or delete inactive objects automatically.

Examples

- Temporary uploads
- Expired exports
- Orphaned files

Lifecycle rules remain configurable.

---

# 18. Logging

Every storage operation records:

- Workspace ID
- Member ID
- Operation
- Object key
- Timestamp
- Result

Sensitive URLs are never logged.

---

# 19. Performance

Recommendations

- Direct-to-storage uploads
- CDN for downloads (future)
- Parallel multipart uploads for large files
- Lazy metadata loading

Avoid streaming large files through the application.

---

# 20. Testing

Storage tests use a mock provider.

Integration tests verify:

- Uploads
- Downloads
- Versioning
- Permission checks

Business services should not depend on a real storage backend.

---

# 21. Future Extensions

Version 2 may include:

- CDN integration
- Multi-region replication
- Customer-managed encryption keys
- Cross-provider migration
- Media transcoding
- OCR
- Automatic retention policies

The provider abstraction supports these features without redesign.

---

# 22. Summary

ForgeCRM treats file storage as infrastructure rather than business logic.

By introducing a Storage Service abstraction, using direct-to-storage uploads with presigned URLs, enforcing strong validation, and keeping metadata separate from binary content, the platform achieves high scalability, strong security, and provider independence.