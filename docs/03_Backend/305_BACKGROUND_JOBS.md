# 305 — Background Jobs

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** Background Processing Architecture

---

# 1. Purpose

This document defines how asynchronous work is handled throughout ForgeCRM.

Background processing exists to:

- Improve response times
- Handle long-running work
- Improve reliability
- Isolate external services
- Support scheduled jobs

---

# 2. Technology Stack

Queue

- Redis

Worker

- Celery

Scheduler

- Celery Beat

Future compatible

- Dramatiq
- RabbitMQ
- AWS SQS

Business logic must remain independent of the queue implementation.

---

# 3. Architecture

```
HTTP Request

↓

Router

↓

Service

↓

Job Dispatcher

↓

Queue

↓

Worker

↓

External Service
```

Business services never call Celery directly.

---

# 4. Job Dispatcher

Purpose

Provides a single interface for scheduling work.

Example

```
dispatch_email()

dispatch_ai_request()

dispatch_notification()

dispatch_report_generation()
```

Only the dispatcher knows which queue implementation is used.

---

# 5. Responsibilities

Background jobs should perform:

- Email delivery
- AI generation
- File processing
- Report generation
- Notification fan-out
- Scheduled maintenance
- Cleanup tasks

Background jobs should not:

- Replace synchronous validation
- Execute authorization
- Modify request state

---

# 6. Job Categories

Immediate

Examples

```
Send Email

Generate AI Summary

Resize Image

Upload File
```

Scheduled

Examples

```
Daily Reports

Expired Session Cleanup

Database Maintenance

Notification Digests
```

Recurring

Examples

```
Daily Metrics

Weekly Reports

Monthly Cleanup
```

---

# 7. Idempotency

Every job must be idempotent.

Examples

Good

```
Check whether email already sent.

↓

Send if not sent.
```

Bad

```
Always send email.
```

Duplicate execution must never create duplicate business effects.

---

# 8. Retry Strategy

Retries are automatic for transient failures.

Recommended policy

```
Maximum Retries

5
```

Backoff

```
Exponential
```

Retry examples

- Network failures
- Temporary storage outages
- AI provider unavailable
- SMTP unavailable

Do not retry:

- Validation failures
- Permission failures
- Invalid requests

---

# 9. Dead Letter Handling

Jobs that permanently fail move to a dead-letter queue.

Administrators may:

- Inspect failures
- Retry manually
- Delete failed jobs

Business operations continue unaffected.

---

# 10. Job States

```
Queued

Running

Completed

Failed

Cancelled
```

Workers report state transitions for monitoring.

---

# 11. Timeouts

Every job has a timeout.

Examples

AI

```
120 seconds
```

Email

```
30 seconds
```

Image Processing

```
300 seconds
```

Jobs exceeding their timeout are terminated and retried if appropriate.

---

# 12. Progress Reporting

Long-running jobs may expose progress.

Example

```
Import Leads

↓

Reading File

20%

↓

Validating

55%

↓

Saving Records

90%

↓

Completed
```

Progress reporting is optional and job-specific.

---

# 13. Scheduling

Recurring jobs are managed by Celery Beat.

Examples

Daily

- Workspace statistics
- Cleanup expired tokens

Weekly

- Report generation
- Usage summaries

Monthly

- Archive maintenance
- Storage cleanup

---

# 14. Queue Separation

Different workloads use different queues.

Example

```
default

emails

ai

reports

files
```

Heavy AI jobs must never block email delivery.

---

# 15. Monitoring

Track:

- Queue length
- Processing time
- Retry count
- Failure rate
- Average execution time

Monitoring data supports operational dashboards.

---

# 16. Logging

Each job records:

- Job ID
- Job type
- Workspace ID
- Member ID (if applicable)
- Started time
- Finished time
- Duration
- Result

Sensitive payloads are never logged.

---

# 17. Security

Workers always:

- Validate referenced records exist
- Verify workspace ownership
- Use server-side credentials
- Avoid trusting serialized client data

Jobs should operate on record IDs rather than entire serialized objects whenever possible.

---

# 18. AI Jobs

AI requests execute asynchronously.

Workflow

```
Create AI Request

↓

Queue Job

↓

Build Prompt

↓

Call AI Provider

↓

Store Response

↓

Create Activity

↓

Notify User
```

User-facing requests may poll or subscribe for completion.

---

# 19. File Processing

Examples

- Virus scanning
- Thumbnail generation
- PDF metadata extraction
- OCR (future)

Original uploads return immediately while processing continues in the background.

---

# 20. Testing

Business services should mock the Job Dispatcher.

Worker tests verify:

- Retry behavior
- Error handling
- External integrations
- Idempotency

Avoid requiring a running worker for unit tests.

---

# 21. Future Extensions

Version 2 may include:

- Priority queues
- Workflow orchestration
- Distributed workers
- Queue autoscaling
- Multi-region processing
- Event streaming
- Serverless workers

The dispatcher abstraction allows these upgrades without changing business services.

---

# 22. Summary

ForgeCRM uses an asynchronous job architecture built around a queue-agnostic Job Dispatcher.

By isolating business logic from Celery, enforcing idempotent jobs, separating workloads into dedicated queues, and providing robust retry and monitoring strategies, the platform is prepared for production-scale background processing while remaining maintainable and extensible.