# 306 — Events & Notifications

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** Event-Driven Communication Architecture

---

# 1. Purpose

This document defines how ForgeCRM communicates across domains without introducing tight coupling.

It covers:

- Domain Events
- Event Dispatcher
- Event Handlers
- Notifications
- WebSockets
- Email Notifications
- Future Integration Events

---

# 2. Philosophy

Business domains should not directly invoke unrelated domains.

Instead of:

```
Deal Service

↓

Notification Service

↓

AI Service

↓

Analytics Service
```

ForgeCRM uses events.

```
Deal Service

↓

DealWon Event

↓

Event Dispatcher

↓

Subscribers
```

This keeps domains independent.

---

# 3. Event Flow

```
Business Action

↓

Service

↓

Commit Transaction

↓

Publish Domain Event

↓

Dispatcher

↓

Subscribers

↓

Background Jobs (optional)
```

Events are published **only after a successful transaction**.

---

# 4. Domain Events

Examples

```
LeadCreated

LeadAssigned

LeadConverted

CompanyCreated

ContactCreated

DealCreated

DealStageChanged

DealWon

DealLost

TaskCreated

TaskCompleted

DocumentUploaded

NoteCreated
```

Events describe completed business actions.

---

# 5. Event Dispatcher

Purpose

Routes events to interested handlers.

Responsibilities

- Register handlers
- Dispatch events
- Handle failures
- Log event execution

The dispatcher knows nothing about business logic.

---

# 6. Event Handlers

Each handler performs one responsibility.

Examples

```
DealWon

↓

Create Activity

↓

Send Notification

↓

Refresh Dashboard Cache

↓

Trigger AI Summary
```

Handlers should remain independent.

---

# 7. Notification Types

Supported

- In-App Notifications
- Email Notifications
- Browser Push (future)

Future

- Slack
- Microsoft Teams
- SMS
- WhatsApp
- Webhooks

---

# 8. Notification Flow

```
TaskAssigned Event

↓

Notification Handler

↓

Create Notification

↓

Publish WebSocket Update

↓

Optional Email
```

Notification delivery should never block the original request.

---

# 9. In-App Notifications

Purpose

Real-time alerts inside ForgeCRM.

Examples

```
Task Assigned

Lead Assigned

Deal Won

Comment Mention

Document Shared
```

Notifications are persisted before delivery.

---

# 10. WebSocket Updates

Technology

- FastAPI WebSockets

Purpose

Deliver real-time UI updates.

Examples

- New notification
- Task assignment
- Deal stage change
- AI response completed

Clients reconnect automatically when disconnected.

---

# 11. Email Notifications

Sent asynchronously.

Examples

```
Workspace Invitation

Password Reset

Task Assignment

Weekly Digest

Mention Alert
```

Email sending always occurs through background jobs.

---

# 12. Event Ordering

Within a single transaction:

```
Commit

↓

Publish Events

↓

Handle Events
```

Business data must exist before subscribers execute.

---

# 13. Failure Handling

If an event handler fails:

- Log the failure
- Retry when appropriate
- Do not roll back the original business transaction

Event handling failures should be isolated.

---

# 14. Idempotency

Handlers must be idempotent.

Example

```
DealWon Event

↓

Notification Already Exists?

↓

Yes

↓

Skip
```

Duplicate event processing must not create duplicate side effects.

---

# 15. Event Naming

Pattern

```
<Entity><PastTenseAction>
```

Examples

```
LeadConverted

DealWon

TaskCompleted

DocumentUploaded
```

Events describe something that has already happened.

---

# 16. Event Payload

Each event contains only essential information.

Example

```json
{
  "event": "DealWon",
  "workspace_id": "...",
  "deal_id": "...",
  "occurred_at": "2026-07-25T12:00:00Z"
}
```

Large business objects should never be embedded.

Consumers fetch additional data if needed.

---

# 17. Notification Preferences

Each member may configure preferences.

Examples

- Email on task assignment
- Browser notification on mentions
- Weekly digest
- AI completion alerts

Preferences are stored per workspace member.

---

# 18. Security

Notifications inherit workspace permissions.

Users receive notifications only for records they are authorized to access.

WebSocket channels are authenticated.

---

# 19. Monitoring

Track

- Events published
- Event latency
- Handler failures
- Notification delivery rate
- WebSocket connection count

Operational metrics help identify bottlenecks.

---

# 20. Future Integration Events

Future versions may publish events externally.

Examples

```
DealWon

↓

Webhook

↓

ERP

↓

Accounting System
```

Domain Events remain internal.

Integration Events adapt them for external consumers.

---

# 21. Summary

ForgeCRM uses an event-driven architecture to keep business domains loosely coupled.

By publishing Domain Events after successful transactions and processing notifications, AI actions, analytics, and other side effects through independent handlers, the platform remains scalable, testable, and easy to extend while avoiding unnecessary dependencies.