# 309 — Observability

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** Observability Architecture

---

# 1. Purpose

This document defines how ForgeCRM monitors, traces, logs, and measures the health of the application in production.

Observability allows engineers to answer:

- What happened?
- Why did it happen?
- Where did it fail?
- How long did it take?
- Is the system healthy?

---

# 2. Pillars

ForgeCRM follows the three pillars of observability:

- Logs
- Metrics
- Traces

Together they provide complete visibility into system behavior.

---

# 3. Correlation IDs

Every incoming request receives a unique Request ID.

Example

```
req_01J8P4C6R8P...
```

The same ID is propagated to:

- HTTP logs
- Database operations
- Background jobs
- Domain events
- AI requests
- Storage operations
- External API calls

This enables end-to-end request tracing.

---

# 4. Structured Logging

Logs use structured JSON.

Example

```json
{
  "timestamp": "2026-07-25T14:32:18Z",
  "level": "INFO",
  "request_id": "req_01J8...",
  "workspace_id": "...",
  "member_id": "...",
  "event": "deal_created",
  "duration_ms": 84
}
```

Avoid plain text logs in production.

---

# 5. Log Levels

Supported levels

```
DEBUG

INFO

WARNING

ERROR

CRITICAL
```

Production defaults to:

```
INFO
```

---

# 6. Logging Rules

Always log:

- Authentication events
- Authorization failures
- Domain events
- Background job execution
- External service failures
- Startup and shutdown

Never log:

- Passwords
- Access tokens
- Refresh tokens
- API secrets
- Sensitive document contents

---

# 7. Metrics

Track application metrics such as:

- Request count
- Request latency
- Error rate
- Active sessions
- Background job duration
- Queue depth
- AI request latency
- Storage operations

Metrics are aggregated over time.

---

# 8. Health Endpoints

Provide dedicated endpoints.

```
GET /health
```

Returns basic application health.

```
GET /ready
```

Checks readiness for serving traffic.

```
GET /live
```

Confirms the process is alive.

Readiness should verify dependencies such as:

- PostgreSQL
- Redis
- Storage provider

---

# 9. Tracing

Every significant operation becomes a trace span.

Example

```
HTTP Request

↓

Authentication

↓

Authorization

↓

Service

↓

Repository

↓

Database

↓

Response
```

Future OpenTelemetry support should require minimal changes.

---

# 10. Background Job Monitoring

Track:

- Queue size
- Job latency
- Retry count
- Failure count
- Average execution time

Correlate jobs with originating Request IDs whenever possible.

---

# 11. External Services

Record:

- Provider
- Operation
- Duration
- Success/failure

Examples

- AI providers
- Email
- Object storage
- OAuth

Do not log request payloads containing sensitive information.

---

# 12. Error Reporting

Capture:

- Exception type
- Stack trace
- Request ID
- Workspace ID
- Member ID
- Environment

Errors should be grouped by fingerprint to reduce noise.

---

# 13. Audit vs Operational Logs

Operational Logs

Purpose:

- Troubleshooting
- Performance
- Infrastructure

Audit Logs

Purpose:

- Compliance
- Business history
- Security

These systems remain separate.

---

# 14. Performance Monitoring

Track:

- Slow API endpoints
- Slow SQL queries
- Cache hit ratio
- Background queue delays
- WebSocket connection count

Define alert thresholds for abnormal behavior.

---

# 15. Dashboards

Operational dashboards should include:

- API health
- Database health
- Redis health
- Queue health
- AI provider health
- Storage health

Business dashboards remain part of the CRM application.

---

# 16. Alerting

Alert on:

- High error rate
- Database unavailable
- Redis unavailable
- Queue backlog
- AI provider failures
- Disk space
- Excessive latency

Alerts should include the relevant Request ID when applicable.

---

# 17. Environment Awareness

Development

- Verbose logging
- Debug traces

Staging

- Production-like logging
- Lower alert thresholds

Production

- Structured logs
- Minimal debug output
- Full monitoring

---

# 18. Testing

Observability should be verified through tests.

Examples:

- Request ID propagation
- Health endpoint responses
- Log generation
- Metric emission

Observability code is part of the application and should be tested.

---

# 19. Future Extensions

Version 2 may include:

- OpenTelemetry
- Distributed tracing
- Log aggregation
- Real-time alert routing
- Service dependency maps
- SLA dashboards

The architecture supports these additions without redesign.

---

# 20. Summary

ForgeCRM treats observability as a core architectural concern.

By combining structured logging, metrics, tracing, health checks, and correlation IDs, the platform provides engineers with the visibility needed to operate, troubleshoot, and scale the system confidently in production.