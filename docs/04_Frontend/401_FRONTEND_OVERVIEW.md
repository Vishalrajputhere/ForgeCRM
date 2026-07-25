# 401 — Frontend Overview

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** Frontend Architecture

---

# 1. Purpose

This document defines the frontend architecture for ForgeCRM.

It establishes:

- Project structure
- Rendering strategy
- State management
- Component organization
- Data flow
- Performance principles
- Coding standards

All frontend implementation must follow these guidelines.

---

# 2. Technology Stack

Framework

- Next.js (App Router)

Language

- TypeScript

Styling

- Tailwind CSS

Component Library

- shadcn/ui

Animations

- Framer Motion

Server State

- TanStack Query

Client State

- Zustand

Forms

- React Hook Form

Validation

- Zod

Tables

- TanStack Table

Drag & Drop

- dnd-kit

Charts

- Recharts

---

# 3. Frontend Philosophy

The frontend should be:

- Fast
- Predictable
- Accessible
- Responsive
- Type-safe
- Reusable
- Modular

Business logic belongs in the backend whenever possible.

---

# 4. Rendering Strategy

Use the most appropriate rendering method for each page.

### Server Components

Use for:

- Static layouts
- Navigation
- Read-only content
- Initial page structure

### Client Components

Use for:

- Forms
- Tables
- Modals
- Interactive dashboards
- Drag & Drop
- Charts

Default to Server Components unless interactivity is required.

---

# 5. Application Structure

```
app/

components/

features/

hooks/

lib/

providers/

services/

stores/

styles/

types/

utils/
```

Each directory has a single responsibility.

---

# 6. Feature Organization

Business functionality is grouped by feature.

Example

```
features/

    leads/

    companies/

    contacts/

    deals/

    dashboard/

    reports/
```

Each feature owns:

- Components
- Hooks
- API helpers
- Validation
- Types

---

# 7. Component Hierarchy

```
Page

↓

Feature

↓

Section

↓

Reusable Components

↓

UI Primitives
```

Avoid deeply nested component trees.

---

# 8. State Management

ForgeCRM separates state into categories.

### Server State

Managed by:

```
TanStack Query
```

Examples

- Leads
- Companies
- Dashboard data
- Reports

---

### Client State

Managed by:

```
Zustand
```

Examples

- Sidebar
- Theme
- Selected rows
- Active workspace
- Modal visibility

---

### Form State

Managed by:

```
React Hook Form
```

Every complex form uses RHF.

---

### URL State

Examples

```
page

search

filters

sort

view
```

Shareable application state belongs in the URL.

---

# 9. Data Flow

```
User

↓

Component

↓

Hook

↓

API Client

↓

Backend

↓

TanStack Query Cache

↓

UI
```

Components should never call fetch directly.

---

# 10. API Layer

All API communication occurs through a centralized client.

Responsibilities

- Authentication
- Error handling
- Retry logic
- Token refresh
- Response parsing

Business components remain unaware of transport details.

---

# 11. Error Handling

Display user-friendly messages.

Examples

- Validation errors
- Network failures
- Permission denied
- Server unavailable

Unexpected errors are logged.

---

# 12. Loading States

Every async screen provides:

- Skeleton loaders
- Button loading indicators
- Empty states
- Retry actions

Avoid blank screens.

---

# 13. Authentication

Protected routes require:

- Auth validation
- Workspace resolution
- Permission checks

Unauthorized users are redirected appropriately.

---

# 14. Performance

Use:

- Code splitting
- Dynamic imports
- Lazy loading
- Image optimization
- Memoization where appropriate

Avoid premature optimization.

---

# 15. Accessibility

All components should support:

- Keyboard navigation
- Screen readers
- Focus management
- ARIA attributes where needed
- Color contrast compliance

Accessibility is a core requirement.

---

# 16. Responsive Design

Support:

- Mobile
- Tablet
- Laptop
- Desktop
- Wide screens

Layouts should adapt without changing business functionality.

---

# 17. Testing

Frontend testing includes:

- Component tests
- Integration tests
- End-to-end tests

Critical workflows should be covered before release.

---

# 18. Coding Standards

- TypeScript everywhere
- Functional components
- Custom hooks for reusable logic
- Small focused components
- No duplicated UI logic
- Consistent naming

---

# 19. Scalability

The architecture supports:

- New modules
- New dashboards
- Additional workspaces
- Future mobile applications
- Design system evolution

No major restructuring should be required.

---

# 20. Summary

ForgeCRM's frontend uses a modular Next.js architecture with clear separation of rendering, state management, API communication, and UI composition.

By organizing the application around features, keeping server and client state separate, and prioritizing performance and accessibility, the frontend remains maintainable, scalable, and ready for long-term growth.