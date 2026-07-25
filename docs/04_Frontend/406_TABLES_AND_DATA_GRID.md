# 406 — Tables & Data Grid

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** Data Grid Architecture

---

# 1. Purpose

This document defines the reusable data grid architecture used throughout ForgeCRM.

The data grid is a productivity tool, not merely a table.

Its goals are:

- High performance
- Consistency
- Accessibility
- Extensibility
- Efficient workflows

---

# 2. Technology

Table Engine

- TanStack Table

Virtualization

- TanStack Virtual (when required)

Drag & Drop

- dnd-kit

State

- TanStack Query
- URL Search Params

---

# 3. Design Philosophy

A data grid should support work.

Users must be able to:

- Find information quickly
- Modify multiple records efficiently
- Customize their workspace
- Navigate without a mouse

---

# 4. Architecture

```
Reusable DataGrid

↓

Column Definitions

↓

Feature Configuration

↓

Business Data
```

The DataGrid provides behavior.

Each feature provides configuration.

---

# 5. Responsibilities

The DataGrid owns:

- Rendering
- Pagination
- Sorting
- Filtering
- Selection
- Keyboard navigation
- Virtualization
- Loading states

Features own:

- Columns
- Row actions
- Bulk actions
- Permissions
- Business rules

---

# 6. Column Definitions

Each column defines:

- Header
- Accessor
- Cell renderer
- Sorting support
- Filtering support
- Width
- Visibility

Columns should be strongly typed.

---

# 7. Sorting

Support:

- Single-column sorting
- Multi-column sorting

Sorting state belongs in the URL.

Server-side sorting is preferred for large datasets.

---

# 8. Filtering

Supported filters:

- Text
- Select
- Multi-select
- Date range
- Number range
- Boolean

Filtering state is stored in URL search parameters.

---

# 9. Pagination

Default strategy

Server-side pagination.

Support:

- Page number
- Page size
- Total count

Avoid loading unnecessary records.

---

# 10. Infinite Scrolling

Reserved for activity feeds and timelines.

Standard CRM tables continue to use pagination for predictable navigation.

---

# 11. Row Selection

Support:

- Single selection
- Multi-selection
- Select current page
- Select all matching results (future)

Selection belongs to UI state.

---

# 12. Bulk Actions

Examples

- Assign owner
- Archive
- Delete
- Export
- Add tag

Bulk actions must respect permissions.

---

# 13. Row Actions

Examples

- View
- Edit
- Duplicate
- Archive
- Delete

Actions should remain contextual.

---

# 14. Column Visibility

Users may:

- Show columns
- Hide columns
- Reorder columns

Preferences may be persisted per workspace member.

---

# 15. Column Resizing

Users may resize columns.

Reasonable minimum and maximum widths should be enforced.

---

# 16. Virtualization

Use virtualization when:

- Rendering very large datasets
- Performance becomes a concern

Avoid unnecessary virtualization for small tables.

---

# 17. Loading States

Provide:

- Skeleton rows
- Loading overlays
- Empty states
- Retry actions

Avoid layout shifts during loading.

---

# 18. Empty States

Examples

No Leads

↓

Illustration

↓

Helpful explanation

↓

Primary action

Empty states should encourage the next meaningful action.

---

# 19. Keyboard Navigation

Support:

- Arrow keys
- Tab navigation
- Enter
- Escape
- Space for selection

Keyboard users should have full functionality.

---

# 20. Accessibility

Ensure:

- Proper table semantics
- Screen reader support
- Focus management
- Accessible sorting controls
- Accessible filter controls

---

# 21. Export

Supported formats (permissions permitting):

- CSV

Future:

- Excel
- PDF

Exports execute as background jobs for large datasets.

---

# 22. Performance

Recommendations

- Memoized column definitions
- Stable row identifiers
- Server-side pagination
- Minimal re-renders
- Lazy rendering where appropriate

Measure performance before optimizing.

---

# 23. Testing

Verify:

- Sorting
- Filtering
- Pagination
- Bulk actions
- Keyboard navigation
- Accessibility
- Column persistence

The DataGrid should be tested independently of business features.

---

# 24. Future Extensions

Version 2 may include:

- Grouping
- Pivot tables
- Saved views
- Conditional formatting
- Spreadsheet-style editing
- Frozen columns

The architecture supports these features without redesign.

---

# 25. Summary

ForgeCRM uses a reusable, feature-configurable DataGrid built on TanStack Table.

By separating the grid engine from business configuration and supporting advanced workflows such as filtering, bulk actions, customization, and accessibility, the platform provides a consistent and highly productive experience across every module.