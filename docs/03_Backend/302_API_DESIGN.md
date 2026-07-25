# 302 — API Design

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** REST API Standards

---

# 1. Purpose

This document defines the REST API conventions used throughout ForgeCRM.

Every endpoint must follow these standards for:

- URL structure
- HTTP methods
- Request validation
- Response format
- Pagination
- Filtering
- Sorting
- Error handling
- Versioning

Consistency is mandatory.

---

# 2. Base URL

```
/api/v1
```

Examples

```
GET    /api/v1/leads

POST   /api/v1/leads

GET    /api/v1/leads/{id}

PATCH  /api/v1/leads/{id}

DELETE /api/v1/leads/{id}
```

---

# 3. Resource Naming

Rules

- Use plural nouns.
- Use lowercase.
- Use hyphens only when necessary.
- Never use verbs in URLs.

Good

```
/companies

/deals

/tasks

/pipeline-stages
```

Bad

```
/getDeals

/createLead

/deleteCompany
```

---

# 4. HTTP Methods

GET

Retrieve resources.

POST

Create resources.

PATCH

Partial updates.

PUT

Reserved for full replacement (rarely used).

DELETE

Soft delete unless otherwise documented.

---

# 5. Standard Response Envelope

Success

```json
{
  "success": true,
  "message": "Lead created successfully.",
  "data": {},
  "meta": {}
}
```

Failure

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address."
    }
  ]
}
```

Every endpoint returns the same envelope.

---

# 6. HTTP Status Codes

```
200 OK

201 Created

204 No Content

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

422 Unprocessable Entity

429 Too Many Requests

500 Internal Server Error
```

---

# 7. Pagination

Default query parameters

```
?page=1

&page_size=25
```

Limits

Minimum

```
1
```

Maximum

```
100
```

Default

```
25
```

Example

```
GET /api/v1/deals?page=2&page_size=25
```

Response

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 2,
    "page_size": 25,
    "total_items": 485,
    "total_pages": 20
  }
}
```

---

# 8. Sorting

Query

```
?sort=created_at

&order=desc
```

Supported

```
asc

desc
```

Example

```
GET /companies?sort=name&order=asc
```

---

# 9. Search

Global search parameter

```
?search=openai
```

Each endpoint defines searchable fields.

Search must be case-insensitive.

---

# 10. Filtering

Filters use query parameters.

Examples

```
?status=open

?owner=me

?pipeline=enterprise

?priority=high

?created_after=2026-01-01

?created_before=2026-12-31
```

Multiple filters may be combined.

---

# 11. Field Selection

Optional support

```
?fields=id,name,email
```

Allows clients to reduce payload size.

---

# 12. Relationship Expansion

Optional support

```
?include=company,owner,primary_contact
```

Expanded relationships are explicitly requested.

Avoid eager loading by default.

---

# 13. Bulk Operations

Supported endpoints

```
POST /companies/bulk

PATCH /tasks/bulk

DELETE /notes/bulk
```

Bulk responses include per-record results.

---

# 14. Idempotency

POST endpoints that may be retried support an optional header:

```
Idempotency-Key
```

This prevents accidental duplicate creations.

Recommended for:

- Lead imports
- File uploads
- AI-assisted actions
- External integrations

---

# 15. Validation

Validation occurs before business logic.

Validation includes:

- Required fields
- Data types
- Length constraints
- Enum values
- Format validation

Business rules remain in the Service Layer.

---

# 16. Error Format

Example

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    {
      "field": "phone",
      "message": "Phone number is invalid."
    },
    {
      "field": "website",
      "message": "Website must be a valid URL."
    }
  ]
}
```

Errors should be specific and actionable.

---

# 17. Authentication

Protected endpoints require:

```
Authorization: Bearer <access_token>
```

Public endpoints are explicitly documented.

---

# 18. Versioning

API version is part of the URL.

Example

```
/api/v1
```

Breaking changes require a new version.

Non-breaking additions do not.

---

# 19. Rate Limiting

Examples

Authentication

```
10 requests/minute
```

AI endpoints

```
30 requests/minute
```

General API

```
300 requests/minute
```

Limits are configurable.

---

# 20. Date & Time

All timestamps use:

```
ISO 8601

UTC
```

Example

```
2026-07-25T10:30:00Z
```

---

# 21. Soft Delete

DELETE requests mark records as deleted.

Example

```
DELETE /companies/{id}
```

Returns

```
204 No Content
```

Restore endpoints may be added later.

---

# 22. API Documentation

Every endpoint includes:

- Summary
- Description
- Request schema
- Response schema
- Status codes
- Example request
- Example response

OpenAPI documentation is generated automatically from FastAPI.

---

# 23. Security

Every request must:

- Authenticate the user.
- Resolve the workspace.
- Verify permissions.
- Validate input.
- Scope database queries by workspace.

Never trust client-provided identifiers without verification.

---

# 24. Summary

ForgeCRM APIs are designed to be predictable, consistent, and easy to consume.

By standardizing resource naming, pagination, filtering, response envelopes, validation, authentication, and versioning, the API provides a stable contract for frontend applications, third-party integrations, and future platform growth.