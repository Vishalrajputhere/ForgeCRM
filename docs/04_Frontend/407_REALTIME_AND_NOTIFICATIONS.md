# 407 — Realtime & Notifications

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** Realtime Architecture

---

# 1. Purpose

This document defines how ForgeCRM delivers realtime updates and notifications.

Goals:

- Low latency
- Minimal network traffic
- Predictable synchronization
- Excellent user experience

---

# 2. Philosophy

Realtime is event-driven.

Clients receive updates only when relevant business events occur.

Polling is reserved for exceptional cases.

---

# 3. Technology

Realtime Transport

- WebSockets

Server

- FastAPI WebSockets

State Synchronization

- TanStack Query

Notifications

- In-App Notification Center

---

# 4. Responsibilities

Realtime updates

- Synchronize application state

Notifications

- Inform users of important events

These responsibilities remain separate.

---

# 5. Connection Lifecycle

```
Application Starts

↓

Authenticate

↓

Open WebSocket

↓

Subscribe

↓

Receive Events

↓

Reconnect if Needed
```

Connections should recover automatically after interruptions.

---

# 6. Authentication

WebSocket connections require:

- Valid authentication
- Workspace resolution
- Permission verification

Unauthorized connections are rejected.

---

# 7. Event Types

Examples

```
LeadCreated

LeadUpdated

LeadDeleted

DealStageChanged

TaskAssigned

TaskCompleted

NotificationCreated

AICompleted
```

Events should be small and focused.

---

# 8. Event Payload

Example

```json
{
  "event": "DealStageChanged",
  "workspace_id": "...",
  "deal_id": "...",
  "updated_at": "2026-07-25T15:30:00Z"
}
```

Large business objects should not be transmitted.

---

# 9. Event Processing

Workflow

```
Receive Event

↓

Validate

↓

Update Cache

↓

Refresh UI
```

Business logic remains on the server.

---

# 10. Cache Synchronization

Whenever practical:

- Update affected query cache directly.

Otherwise:

- Invalidate the affected query.

Avoid full application refetches.

---

# 11. Notifications

Supported

- Task assignments
- Mentions
- Workspace invitations
- AI completion
- Deal updates
- System alerts

Notifications persist until dismissed or archived.

---

# 12. Notification Center

Provides:

- Unread count
- Read/unread state
- Grouping
- Filtering

Notification state synchronizes across devices.

---

# 13. Optimistic UI

Workflow

```
User Action

↓

Immediate UI Update

↓

Server Confirmation

↓

Keep or Roll Back
```

Only use optimistic updates for reversible actions.

---

# 14. Offline Recovery

When disconnected:

- Show connection indicator
- Queue local actions where appropriate
- Reconnect automatically
- Refresh stale queries after reconnecting

---

# 15. Reconnection Strategy

Reconnect using exponential backoff.

Example

```
1 second

2 seconds

4 seconds

8 seconds
```

Avoid aggressive reconnect loops.

---

# 16. Presence (Future)

Future capabilities may include:

- Online users
- Record viewers
- Active editors
- Typing indicators

Presence is not required in Version 1.

---

# 17. Accessibility

Notifications should:

- Announce important updates to assistive technologies
- Avoid stealing focus
- Respect reduced motion preferences

Users should remain in control.

---

# 18. Performance

Recommendations

- Subscribe only to relevant channels
- Batch rapid updates where appropriate
- Avoid unnecessary rerenders
- Limit event payload size

Realtime should improve responsiveness without increasing complexity.

---

# 19. Error Handling

Handle:

- Lost connections
- Authentication failures
- Invalid events
- Version mismatches

Recover gracefully whenever possible.

---

# 20. Testing

Verify:

- Connection lifecycle
- Event handling
- Cache updates
- Notification delivery
- Reconnection behavior

Realtime logic should be independently testable.

---

# 21. Future Extensions

Version 2 may include:

- Collaborative editing
- Live cursors
- Presence indicators
- Web Push notifications
- Cross-device synchronization

The architecture supports these features without redesign.

---

# 22. Summary

ForgeCRM uses an event-driven realtime architecture built on WebSockets and TanStack Query.

By separating state synchronization from notifications, minimizing payloads, and updating only affected data, the platform delivers a responsive, scalable, and maintainable realtime experience.