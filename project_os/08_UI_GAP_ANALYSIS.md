# 08 — Frontend UI Gap Analysis

### Empirical UI Gap Assessment

This document identifies UI features that are missing, partial, or slated for enhancement in future iterations.

---

## Detailed Gap Analysis by Domain

### 1. Workspace & Organization Management
- **Existing**: Workspace switcher, create workspace modal, overview edit form, regional settings (timezone, currency, language, date format), member invitation modal with role picker, member list table.
- **Missing / Gaps**:
  - ⚠️ **Delete / Archive Workspace**: No UI button or confirm dialog for workspace deletion or archival (supported in backend via `PATCH /workspaces/{id}`).
  - ⚠️ **Team / Department Builder**: No dedicated UI panel to manage hierarchical Teams (`teams` table exists in DB & backend).

### 2. Companies Directory
- **Existing**: Directory list view with search, active/inactive filter, Create company modal, Edit company modal, company detail page (`/companies/[id]`), timeline widget.
- **Missing / Gaps**:
  - ⚠️ **Bulk Actions**: No multi-select checkboxes for batch status updates or bulk deletion.
  - ⚠️ **Export to CSV/Excel**: No CSV download button in the table header.

### 3. Contacts Directory
- **Existing**: Contacts list view with search, primary contact badges, company links, Create modal with primary toggle, Edit modal, Soft-delete action, detail page (`/contacts/[id]`), timeline widget.
- **Missing / Gaps**:
  - ⚠️ **Import Contacts (VCF/CSV)**: No file dropzone UI to import contacts in bulk.
  - ⚠️ **Contact Avatar Image Upload**: Uses generated text initials avatar (S3 presigned upload UI flow can be embedded in future).

### 4. Leads & Conversion
- **Existing**: Leads board with search, priority filters, show/hide converted toggle, Create modal, Edit modal, Disqualify action, Transactional Lead Conversion modal.
- **Missing / Gaps**:
  - ⚠️ **Lead Scoring Manual Adjustment**: AI lead score is displayed if available, but manual score override controls are not exposed in UI.

### 5. Sales Deals & Kanban Board
- **Existing**: Visual Kanban board with stage columns, drag-and-drop deal movement, probability progress bar, pipeline total summary, Create deal modal, deal detail page (`/deals/[id]`).
- **Missing / Gaps**:
  - ⚠️ **Pipeline Configuration Builder**: No drag-and-drop pipeline stage editor in UI (pipelines & stages can be managed via API, but UI stage customization panel is Phase 2).
  - ⚠️ **Deal Products / Line Items Table**: `deal_products` table exists in DB, but line-item product selector UI is minimal.

### 6. Tasks & Activities
- **Existing**: Tasks list with open/completed/overdue filters, priority badges, due date datepicker, overdue warning alerts (`⚠`), one-click completion checkbox, Edit modal, Delete action.
- **Missing / Gaps**:
  - ⚠️ **Calendar View**: Tasks are rendered in a clean list view. A monthly/weekly calendar grid view is slated for Phase 2.

### 7. File Storage & Attachments
- **Existing**: Presigned upload URL flow in API & `useStorage` hook.
- **Missing / Gaps**:
  - ⚠️ **Dedicated File Manager Page**: Attachments can be uploaded via entity detail pages, but a standalone `/storage` file explorer page is a Phase 2 UI addition.
