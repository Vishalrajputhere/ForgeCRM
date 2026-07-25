# 507 — File Upload Security

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** File Upload Security

---

# 1. Purpose

This document defines the security architecture for all file uploads within ForgeCRM.

Uploaded files are treated as untrusted input throughout their lifecycle.

---

# 2. Security Principles

All uploaded files must be:

- Authenticated
- Authorized
- Validated
- Stored privately
- Auditable

Files are never trusted solely because they were uploaded successfully.

---

# 3. Upload Lifecycle

```
Client

↓

Authentication

↓

Authorization

↓

Upload Validation

↓

Private Storage

↓

(Optional Malware Scan)

↓

Metadata Stored

↓

Available for Authorized Access
```

If any step fails, the upload is rejected or quarantined.

---

# 4. Supported File Types

Version 1 supports only explicitly approved formats.

Examples:

- PDF
- PNG
- JPG
- JPEG
- DOCX
- XLSX

Unsupported file types are rejected.

---

# 5. MIME Type Validation

Validate the detected MIME type on the server.

Do not rely solely on:

- Browser-reported MIME type
- File extension

Content inspection takes precedence.

---

# 6. Extension Validation

Allow only approved extensions.

Reject:

- Executables
- Scripts
- Archives unless explicitly supported

Example blocked extensions:

- .exe
- .bat
- .cmd
- .sh
- .php
- .js (when uploaded as files)

---

# 7. File Size Limits

Define limits by upload category.

Examples:

- Profile Image
- Document
- Attachment

Reject oversized uploads before processing.

---

# 8. Secure File Naming

Never store user-provided filenames as storage keys.

Storage object names should use:

- UUIDv7
- Random identifiers

Original filenames are stored only as metadata.

---

# 9. Storage

Files are stored in:

- Private MinIO buckets (development)
- Private Amazon S3 buckets (production)

Direct public bucket access is prohibited.

---

# 10. Metadata

Store metadata separately.

Examples:

- Original filename
- Content type
- Size
- Uploaded by
- Workspace ID
- Upload time
- Scan status

Metadata belongs in PostgreSQL.

---

# 11. Malware Scanning

Future architecture supports:

- Antivirus engine
- Background scanning
- Scan status tracking

Possible states:

- Pending
- Clean
- Infected
- Failed

Scanning occurs asynchronously.

---

# 12. Quarantine

Files that fail security checks should enter quarantine.

Quarantined files:

- Cannot be downloaded
- Cannot be referenced by business records
- May be deleted automatically

---

# 13. Download Authorization

Downloads require:

- Authentication
- Workspace validation
- Authorization

Object storage should never expose unrestricted URLs.

---

# 14. Signed URLs

Downloads use:

- Short-lived signed URLs
- Single-purpose access

Signed URLs expire automatically.

---

# 15. Image Processing

If image resizing or thumbnail generation is introduced:

- Validate input before processing
- Strip unsafe metadata where appropriate
- Preserve original securely

Image processing runs outside the request path.

---

# 16. PDF Processing

PDF parsing should:

- Use maintained libraries
- Apply resource limits
- Reject malformed documents
- Prevent excessive memory usage

Avoid executing embedded content.

---

# 17. Retention

Retention policies should define:

- Active files
- Deleted files
- Orphaned uploads
- Temporary uploads

Unused files should be cleaned up automatically.

---

# 18. Deletion

Deleting a business record does not necessarily delete the file immediately.

Deletion strategy may include:

- Soft delete
- Scheduled cleanup
- Legal hold support (future)

---

# 19. Audit Logging

Log:

- Upload
- Download
- Delete
- Scan failure
- Quarantine actions

Logs should reference the file identifier rather than storage paths.

---

# 20. Monitoring

Monitor:

- Upload failures
- Invalid file attempts
- Malware detections
- Large upload frequency
- Storage usage

Unexpected activity should trigger alerts.

---

# 21. Testing

Verify:

- MIME validation
- Extension validation
- Authorization
- Download permissions
- Signed URL expiration
- Quarantine workflow
- Storage isolation

Negative test cases should be included.

---

# 22. Future Enhancements

Future capabilities may include:

- Content DLP scanning
- Image moderation
- OCR pipelines
- Duplicate detection
- Version-aware scanning
- Customer-managed encryption keys

The storage architecture should support these additions.

---

# 23. Summary

ForgeCRM secures file uploads through layered validation, private storage, authorization, metadata tracking, and future-ready malware scanning.

By treating every uploaded file as untrusted and controlling its complete lifecycle, the platform minimizes the risk of malicious uploads while providing reliable document management.