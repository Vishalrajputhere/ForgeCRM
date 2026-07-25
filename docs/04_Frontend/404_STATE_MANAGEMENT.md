# 404 — State Management

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** State Management Architecture

---

# 1. Purpose

This document defines how application state is managed throughout ForgeCRM.

Its goals are:

- Single source of truth
- Predictable updates
- Minimal duplication
- Excellent performance
- Easy debugging

---

# 2. State Philosophy

Every piece of state has exactly one owner.

Never duplicate state across multiple stores.

State should live as close as possible to where it is needed.

---

# 3. State Categories

ForgeCRM divides state into four categories.

- Server State
- Client State
- Form State
- URL State

Each category has its own tool.

---

# 4. Server State

Managed exclusively by:

```
TanStack Query
```

Examples

- Leads
- Companies
- Contacts
- Deals
- Reports
- Dashboard metrics

Server state is fetched from APIs and cached automatically.

---

# 5. Client State

Managed exclusively by:

```
Zustand
```

Examples

- Sidebar collapsed
- Theme
- Active workspace selector
- Open dialogs
- Command palette
- Selected table rows (temporary UI state)

Client state should never contain API resources.

---

# 6. Form State

Managed exclusively by:

```
React Hook Form
```

Examples

- Lead form
- Company form
- Login form
- Settings form

Forms own their validation and submission lifecycle.

---

# 7. URL State

Stored in:

```
Search Params
```

Examples

- Search query
- Filters
- Sort order
- Pagination
- Active tab
- View mode

URL state should be shareable and bookmarkable.

---

# 8. Local Component State

Use React state for temporary UI values.

Examples

- Hover state
- Expanded accordion
- Current step in a wizard
- Input focus

Avoid moving short-lived state into global stores.

---

# 9. Data Ownership

Examples

Lead list

Owner:

```
TanStack Query
```

Sidebar

Owner:

```
Zustand
```

Lead creation form

Owner:

```
React Hook Form
```

Search filter

Owner:

```
URL
```

---

# 10. TanStack Query

Responsibilities

- Fetching
- Caching
- Refetching
- Retry
- Background updates
- Pagination
- Infinite queries

Components never call fetch directly.

---

# 11. Query Keys

Use consistent query keys.

Example

```
["leads"]

["leads", workspaceId]

["lead", leadId]

["companies"]

["dashboard"]
```

Keys should be predictable and hierarchical.

---

# 12. Cache Strategy

Default behavior

- Cache server responses
- Reuse cached data
- Refetch when stale
- Invalidate after mutations

Avoid manual cache manipulation unless necessary.

---

# 13. Mutations

Workflow

```
User Action

↓

Mutation

↓

Server

↓

Invalidate Queries

↓

Fresh Data
```

Mutations should update the cache through invalidation or targeted cache updates.

---

# 14. Optimistic Updates

Use optimistic updates only when:

- The operation is reversible
- The user benefits from instant feedback

Examples

- Completing a task
- Updating deal stage
- Archiving a record

Rollback on failure.

---

# 15. Zustand Stores

Create focused stores.

Examples

```
uiStore

themeStore

workspaceStore

commandPaletteStore
```

Avoid one large global store.

---

# 16. Store Design

Stores should contain:

- State
- Actions
- Derived selectors

Keep business logic outside the store whenever practical.

---

# 17. Persistence

Persist only durable UI preferences.

Examples

- Theme
- Sidebar state
- Recent workspace

Do not persist sensitive information or server data.

---

# 18. Derived State

Prefer computed values.

Example

```
Completed Tasks

↓

Filter Active Tasks

↓

Compute Count
```

Do not store values that can be derived.

---

# 19. Synchronization Rules

Never copy server data into Zustand.

Never duplicate form values in global state.

Never maintain parallel copies of the same information.

One state → One owner.

---

# 20. Performance

Recommendations

- Use selectors
- Memoize expensive computations
- Split stores by responsibility
- Avoid unnecessary re-renders

Measure before optimizing.

---

# 21. Testing

Verify:

- Query behavior
- Store actions
- Form submission
- URL synchronization
- Optimistic update rollback

State management should be independently testable.

---

# 22. Future Extensions

The architecture supports:

- Offline mode
- Background synchronization
- Cross-tab communication
- Persistent query caches
- Real-time cache updates

No redesign should be required.

---

# 23. Summary

ForgeCRM separates server state, client state, form state, and URL state into distinct ownership boundaries.

By assigning every piece of state a single owner, using TanStack Query for remote data, Zustand for UI state, React Hook Form for forms, and URLs for shareable state, the application remains predictable, performant, and easy to maintain as it grows.