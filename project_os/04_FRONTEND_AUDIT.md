# 04 — Frontend Web Audit

### App Router Structure & Layouts
- **Global Layout (`apps/web/src/app/layout.tsx`)**: Renders `QueryProvider` (React Query), `ThemeProvider` (Dark mode), and Inter font family.
- **Protected Layout (`apps/web/src/app/(dashboard)/layout.tsx`)**: Enforces authentication guard (`useAuth`) and workspace hydration guard (`_hydrated`). Includes header search bar, tenant switcher, navigation links, and profile dropdown.
- **Auth Layout (`apps/web/src/app/(auth)/layout.tsx`)**: Centered glassmorphic container layout for authentication flows.

---

## Detailed Page-by-Page Audit

### 1. `/login` (`apps/web/src/app/(auth)/login/page.tsx`)
- **Exists**: ✅ Yes
- **Navigation**: ✅ Accessible via direct URL, redirected to `/dashboard` upon auth
- **Backend Connected**: ✅ `POST /api/v1/auth/login`
- **CRUD Support**: ✅ N/A (Authentication)
- **Responsive**: ✅ Mobile-optimized flex layout
- **Dark Mode**: ✅ Dark theme with slate/forge palette
- **Loading State**: ✅ Submit button disabled with spinner during request
- **Error State**: ✅ Red error banner for invalid credentials
- **Empty State**: ✅ N/A
- **Accessibility**: ✅ Form label association & keyboard submit
- **Performance**: ✅ Single client-side bundle load
- **Completion**: **100%**
- **Missing Work**: None.

### 2. `/register` (`apps/web/src/app/(auth)/register/page.tsx`)
- **Exists**: ✅ Yes
- **Navigation**: ✅ Accessible via direct URL & login link
- **Backend Connected**: ✅ `POST /api/v1/auth/register`
- **CRUD Support**: ✅ N/A (User Creation)
- **Responsive**: ✅ Fully responsive single-column layout
- **Dark Mode**: ✅ Dark theme
- **Loading State**: ✅ Submit button disabled during creation
- **Error State**: ✅ Form validation errors displayed
- **Empty State**: ✅ N/A
- **Accessibility**: ✅ Input labels & focus rings
- **Performance**: ✅ Instant rendering
- **Completion**: **100%**
- **Missing Work**: None.

### 3. `/reset-password` (`apps/web/src/app/(auth)/reset-password/page.tsx`)
- **Exists**: ✅ Yes
- **Navigation**: ✅ Accessible via login page link
- **Backend Connected**: ✅ `POST /api/v1/auth/password-reset/confirm`
- **CRUD Support**: ✅ N/A (Password Reset)
- **Responsive**: ✅ Responsive
- **Dark Mode**: ✅ Dark theme
- **Loading State**: ✅ Loading state on submit
- **Error State**: ✅ Invalid token error alert
- **Empty State**: ✅ N/A
- **Accessibility**: ✅ Accessible
- **Performance**: ✅ Fast load
- **Completion**: **100%**
- **Missing Work**: None.

### 4. `/dashboard` (`apps/web/src/app/(dashboard)/dashboard/page.tsx`)
- **Exists**: ✅ Yes
- **Navigation**: ✅ Primary sidebar link
- **Backend Connected**: ✅ `GET /analytics/overview`, `GET /deals`, `GET /tasks`, `GET /companies`, `GET /leads`
- **CRUD Support**: ✅ Read-only overview + Quick Action links to create entities
- **Responsive**: ✅ 2-column mobile to 4-column desktop grid
- **Dark Mode**: ✅ Dark mode with backdrop blur glassmorphic cards
- **Loading State**: ✅ Skeleton loaders for KPI cards
- **Error State**: ✅ Fallback zero states if queries fail
- **Empty State**: ✅ Zero-state banners for recent deals & urgent tasks
- **Accessibility**: ✅ High-contrast text & ARIA roles
- **Performance**: ✅ Parallel React Query data fetching
- **Completion**: **100%**
- **Missing Work**: None.

### 5. `/companies` (`apps/web/src/app/(dashboard)/companies/page.tsx`)
- **Exists**: ✅ Yes
- **Navigation**: ✅ Sidebar link
- **Backend Connected**: ✅ `GET /companies`, `POST /companies`, `PATCH /companies/{id}`
- **CRUD Support**: ✅ Full List, Create, Edit, View Detail
- **Responsive**: ✅ Overflow-x scroll for table on mobile
- **Dark Mode**: ✅ Dark theme
- **Loading State**: ✅ Pulse skeleton rows during fetch
- **Error State**: ✅ Form error alert banners
- **Empty State**: ✅ Centered empty state graphic when no companies exist
- **Accessibility**: ✅ Accessible buttons & modals
- **Performance**: ✅ Fast query caching
- **Completion**: **100%**
- **Missing Work**: Direct soft-delete action button in list view (currently supported via edit status toggle to Inactive).

### 6. `/companies/[id]` (`apps/web/src/app/(dashboard)/companies/[id]/page.tsx`)
- **Exists**: ✅ Yes
- **Navigation**: ✅ Clickable links from companies list & contact cards
- **Backend Connected**: ✅ `GET /companies/{id}`, `GET /contacts?company_id=`, `GET /deals`, `GET /timeline`
- **CRUD Support**: ✅ View company profile, associated contacts, associated deals, and activity timeline
- **Responsive**: ✅ Responsive grid
- **Dark Mode**: ✅ Dark theme
- **Loading State**: ✅ Page loading skeleton
- **Error State**: ✅ 404 / Not Found message
- **Empty State**: ✅ Empty states for contacts & deals sub-tabs
- **Accessibility**: ✅ Accessible
- **Performance**: ✅ Fast
- **Completion**: **100%**
- **Missing Work**: None.

### 7. `/contacts` (`apps/web/src/app/(dashboard)/contacts/page.tsx`)
- **Exists**: ✅ Yes
- **Navigation**: ✅ Sidebar link
- **Backend Connected**: ✅ `GET /contacts`, `POST /contacts`, `PATCH /contacts/{id}`, `DELETE /contacts/{id}`
- **CRUD Support**: ✅ Full List, Create, Edit, Soft-Delete
- **Responsive**: ✅ Mobile table scroll
- **Dark Mode**: ✅ Dark theme
- **Loading State**: ✅ Table pulse skeleton
- **Error State**: ✅ Form validation error alerts
- **Empty State**: ✅ Empty state graphic with Add Contact CTA
- **Accessibility**: ✅ Form label associations
- **Performance**: ✅ Instant query caching
- **Completion**: **100%**
- **Missing Work**: None.

### 8. `/contacts/[id]` (`apps/web/src/app/(dashboard)/contacts/[id]/page.tsx`)
- **Exists**: ✅ Yes
- **Navigation**: ✅ Clickable link from contacts table
- **Backend Connected**: ✅ `GET /contacts/{id}`, `GET /companies/{id}`, `GET /timeline`
- **CRUD Support**: ✅ View contact profile, company link, timeline
- **Responsive**: ✅ Responsive
- **Dark Mode**: ✅ Dark theme
- **Loading State**: ✅ Loading skeleton
- **Error State**: ✅ Contact not found banner
- **Empty State**: ✅ Empty timeline state
- **Accessibility**: ✅ Accessible
- **Performance**: ✅ Fast
- **Completion**: **100%**
- **Missing Work**: None.

### 9. `/leads` (`apps/web/src/app/(dashboard)/leads/page.tsx`)
- **Exists**: ✅ Yes
- **Navigation**: ✅ Sidebar link
- **Backend Connected**: ✅ `GET /leads`, `POST /leads`, `PATCH /leads/{id}`, `DELETE /leads/{id}`, `POST /leads/{id}/convert`
- **CRUD Support**: ✅ Full List, Create, Edit, Disqualify, Convert to Account
- **Responsive**: ✅ Responsive table view
- **Dark Mode**: ✅ Dark theme
- **Loading State**: ✅ Pulse row skeletons
- **Error State**: ✅ Conversion error banner
- **Empty State**: ✅ Empty leads state with Add Lead CTA
- **Accessibility**: ✅ Accessible
- **Performance**: ✅ Fast
- **Completion**: **100%**
- **Missing Work**: None.

### 10. `/deals` (`apps/web/src/app/(dashboard)/deals/page.tsx`)
- **Exists**: ✅ Yes
- **Navigation**: ✅ Sidebar link
- **Backend Connected**: ✅ `GET /pipelines`, `GET /deals`, `POST /deals`, `POST /deals/{id}/move-stage`
- **CRUD Support**: ✅ Kanban Board, Drag-and-Drop stage move, Create Deal modal
- **Responsive**: ✅ Horizontal scroll Kanban board for smaller screens
- **Dark Mode**: ✅ Dark theme with stage color indicators
- **Loading State**: ✅ Column pulse skeletons
- **Error State**: ✅ Move stage error toast
- **Empty State**: ✅ "Drag deal here" dropzone indicators
- **Accessibility**: ✅ Keyboard-accessible deal links
- **Performance**: ✅ Optimistic UI stage movements
- **Completion**: **100%**
- **Missing Work**: None.

### 11. `/deals/[id]` (`apps/web/src/app/(dashboard)/deals/[id]/page.tsx`)
- **Exists**: ✅ Yes
- **Navigation**: ✅ Clickable deal cards from Kanban board
- **Backend Connected**: ✅ `GET /deals/{id}`, `GET /companies/{id}`, `GET /timeline`
- **CRUD Support**: ✅ View deal info, value, probability bar, stage progress, timeline
- **Responsive**: ✅ Responsive layout
- **Dark Mode**: ✅ Dark theme
- **Loading State**: ✅ Loading skeleton
- **Error State**: ✅ Deal not found message
- **Empty State**: ✅ Empty activity timeline state
- **Accessibility**: ✅ Accessible
- **Performance**: ✅ Fast
- **Completion**: **100%**
- **Missing Work**: None.

### 12. `/tasks` (`apps/web/src/app/(dashboard)/tasks/page.tsx`)
- **Exists**: ✅ Yes
- **Navigation**: ✅ Sidebar link
- **Backend Connected**: ✅ `GET /tasks`, `POST /tasks`, `PATCH /tasks/{id}`, `DELETE /tasks/{id}`, `POST /tasks/{id}/complete`
- **CRUD Support**: ✅ Full List, Create, Edit, Delete, One-click Complete
- **Responsive**: ✅ Mobile responsive list items
- **Dark Mode**: ✅ Dark theme
- **Loading State**: ✅ List item skeletons
- **Error State**: ✅ Create/Edit error banners
- **Empty State**: ✅ Empty tasks list graphic
- **Accessibility**: ✅ Complete checkbox accessibility
- **Performance**: ✅ Fast
- **Completion**: **100%**
- **Missing Work**: None.

### 13. `/workspace` (`apps/web/src/app/(dashboard)/workspace/page.tsx`)
- **Exists**: ✅ Yes
- **Navigation**: ✅ Sidebar link & tenant switcher link
- **Backend Connected**: ✅ `GET/PATCH /workspaces/{id}`, `GET/PATCH /settings`, `GET /members`, `POST /invitations`, `GET /auth/roles`
- **CRUD Support**: ✅ 3 Tabs (Overview, Settings, Members): Edit Workspace, Configure Regional Settings, Invite Member with role picker, Member list
- **Responsive**: ✅ Tabbed responsive layout
- **Dark Mode**: ✅ Dark theme with dirty-state alert banners
- **Loading State**: ✅ Settings & members loading skeletons
- **Error State**: ✅ Unsaved changes alert banner & error toasts
- **Empty State**: ✅ Member search zero-state
- **Accessibility**: ✅ Accessible tab navigation
- **Performance**: ✅ Fast
- **Completion**: **100%**
- **Missing Work**: None.
