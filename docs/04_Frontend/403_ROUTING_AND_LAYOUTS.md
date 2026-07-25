# 403 — Routing & Layouts

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** Routing & Layout Architecture

---

# 1. Purpose

This document defines how navigation, routing, layouts, authentication boundaries, and workspace context are organized throughout ForgeCRM.

It ensures the routing architecture remains scalable as new modules are added.

---

# 2. Routing Philosophy

Routes should be:

- Predictable
- Modular
- Secure
- Feature-oriented
- Easy to extend

Business modules should remain isolated from one another.

---

# 3. App Router

ForgeCRM uses the Next.js App Router.

Benefits

- Nested layouts
- Route groups
- Server Components
- Streaming
- Built-in loading states
- Error boundaries

The App Router is the only routing solution used.

---

# 4. Route Groups

Application structure

```
app/

├── (marketing)/
│
├── (auth)/
│
├── (app)/
│
└── api/
```

Each route group owns its own layout and boundaries.

---

# 5. Marketing Routes

Examples

```
/

pricing

about

privacy

terms
```

Characteristics

- Public
- SEO-friendly
- Mostly Server Components

No authentication required.

---

# 6. Authentication Routes

Examples

```
login

register

forgot-password

reset-password

verify-email

accept-invitation
```

Users who are already authenticated should be redirected appropriately.

---

# 7. Application Routes

Examples

```
dashboard

leads

companies

contacts

deals

tasks

calendar

reports

settings
```

These routes require:

- Authentication
- Workspace resolution
- Permission validation

---

# 8. Nested Layouts

Example

```
Root Layout

↓

Application Layout

↓

Feature Layout

↓

Page
```

Shared UI elements should live in layouts rather than individual pages.

---

# 9. Root Layout

Responsibilities

- Theme provider
- Query provider
- Global styles
- Authentication bootstrap
- Fonts
- Toast container

Initialized once for the application.

---

# 10. Application Layout

Responsibilities

- Sidebar
- Top navigation
- Workspace selector
- Notification center
- Command palette
- User menu

Persists across application navigation.

---

# 11. Feature Layouts

Feature layouts may provide:

- Feature navigation
- Breadcrumbs
- Toolbar
- Filters
- Context panels

Shared feature UI should not be duplicated across pages.

---

# 12. Dynamic Routes

Examples

```
/companies/[companyId]

/contacts/[contactId]

/deals/[dealId]

/leads/[leadId]
```

Dynamic routes should use stable UUIDs rather than sequential IDs.

---

# 13. Route Protection

Protected routes verify:

- Authentication
- Workspace membership
- Required permissions

Unauthorized users receive appropriate responses.

---

# 14. Workspace Resolution

Every application route resolves the active workspace.

Possible sources

- URL
- Session
- Workspace selector

The resolved workspace becomes available throughout the request lifecycle.

---

# 15. Navigation

Primary navigation

- Dashboard
- Leads
- Companies
- Contacts
- Deals
- Tasks
- Calendar
- Reports
- Settings

Secondary navigation belongs within feature layouts.

---

# 16. Loading States

Each feature may provide its own

```
loading.tsx
```

Loading UIs should use skeleton components rather than spinners whenever practical.

---

# 17. Error Boundaries

Each feature may define

```
error.tsx
```

Responsibilities

- Display friendly messages
- Offer retry actions
- Log unexpected failures

Errors remain isolated to the current route segment.

---

# 18. Not Found Pages

Feature-specific

```
not-found.tsx
```

Examples

- Company not found
- Deal not found
- Contact deleted

Users should receive contextual guidance rather than generic errors.

---

# 19. Route Metadata

Every page should define metadata where appropriate.

Examples

- Title
- Description
- Open Graph
- Robots directives

Application pages prioritize usability over SEO.

---

# 20. Navigation Performance

Recommendations

- Prefetch frequently visited routes
- Preserve layout state
- Lazy-load heavy modules
- Stream page content when appropriate

Navigation should feel instantaneous.

---

# 21. Future Expansion

The routing architecture supports:

- Admin portal
- Customer portal
- Public forms
- Partner portal
- White-label deployments

Additional route groups can be introduced without restructuring existing modules.

---

# 22. Summary

ForgeCRM uses the Next.js App Router with route groups, nested layouts, feature isolation, and localized loading/error boundaries.

This architecture keeps navigation predictable, resilient, and scalable while providing a seamless experience across the application.