# 10 — Exhaustive Manual QA Checklist

### Instructions for QA Engineers & Verification Testers
Execute each test step in a fresh browser session (or automated E2E script) and check off each box upon successful validation.

---

## 1. Authentication & Session Security
- [ ] **TC-AUTH-01**: Access `http://localhost:3000/register`. Register a new account with password shorter than 6 characters. Verify validation error appears.
- [ ] **TC-AUTH-02**: Register a valid account (`testuser@example.com` / `SecurePass123!`). Verify user is automatically logged in and redirected to `/dashboard`.
- [ ] **TC-AUTH-03**: Verify default workspace organization was created automatically and selected.
- [ ] **TC-AUTH-04**: Log out. Access protected page `/dashboard`. Verify automatic redirect to `/login`.
- [ ] **TC-AUTH-05**: Log in with invalid password. Verify red error alert banner appears.
- [ ] **TC-AUTH-06**: Log in with correct credentials. Refresh page. Verify session persists without requiring re-login.

---

## 2. Workspace & Multi-Tenant Isolation
- [ ] **TC-WS-01**: Open Workspace Switcher dropdown in header. Click "+ Create New Workspace".
- [ ] **TC-WS-02**: Create workspace "Acme Enterprise". Verify active workspace switches to "Acme Enterprise".
- [ ] **TC-WS-03**: Verify CRM data (Companies, Leads, Deals) resets to fresh tenant state for "Acme Enterprise".
- [ ] **TC-WS-04**: Switch back to original workspace. Verify original workspace data reloads cleanly.
- [ ] **TC-WS-05**: Navigate to `/workspace`. On **Overview** tab, edit workspace name and click "Save Overview". Verify toast notification.
- [ ] **TC-WS-06**: On **Settings** tab, change currency to `EUR (€)` and date format to `DD/MM/YYYY`. Click "Save All Settings".
- [ ] **TC-WS-07**: Navigate to `/dashboard` or `/deals`. Verify monetary values render in Euros (`€`) and dates follow European format.
- [ ] **TC-WS-08**: On **Members** tab, click "Invite Member". Enter email, select Role, click "Send Invitation". Verify invitation token is generated and copyable.

---

## 3. Companies Directory
- [ ] **TC-COMP-01**: Navigate to `/companies`. Click "+ Add Company".
- [ ] **TC-COMP-02**: Enter Company Name "Stark Industries", website "https://stark.com", email "info@stark.com". Click "Save Company". Verify toast notification and table row insertion.
- [ ] **TC-COMP-03**: Type "Stark" into search input. Verify list filters instantaneously.
- [ ] **TC-COMP-04**: Click "View →" link on company row. Verify navigation to `/companies/[id]`.
- [ ] **TC-COMP-05**: Verify company profile details, empty contacts sub-tab, empty deals sub-tab, and timeline widget are displayed.

---

## 4. Contacts Directory
- [ ] **TC-CONT-01**: Navigate to `/contacts`. Click "+ Add Contact".
- [ ] **TC-CONT-02**: Enter First Name "Tony", Last Name "Stark", select Company "Stark Industries", check "Primary contact". Click "Save Contact".
- [ ] **TC-CONT-03**: Verify contact row appears with "Primary" badge and clickable company link.
- [ ] **TC-CONT-04**: Click contact name to view `/contacts/[id]`. Verify company association and timeline audit event "Created Contact Tony Stark".

---

## 5. Leads & Transactional Lead Conversion
- [ ] **TC-LEAD-01**: Navigate to `/leads`. Click "+ Add Lead".
- [ ] **TC-LEAD-02**: Enter First Name "Bruce", Last Name "Wayne", Company "Wayne Enterprises", Priority "High", Est. Value "$250,000". Click "Save Lead".
- [ ] **TC-LEAD-03**: Verify lead row appears with "High" priority color badge.
- [ ] **TC-LEAD-04**: Click "Convert" button on Bruce Wayne lead row.
- [ ] **TC-LEAD-05**: In Convert Modal, keep "Also create a Deal" checked, enter Deal Name "Wayne Tech Contract", value "$250,000". Click "Convert Lead".
- [ ] **TC-LEAD-06**: Verify green success banner. Click "Done". Verify lead status updates to "✓ Converted".
- [ ] **TC-LEAD-07**: Navigate to `/companies`. Verify "Wayne Enterprises" company was created automatically.
- [ ] **TC-LEAD-08**: Navigate to `/contacts`. Verify "Bruce Wayne" contact was created automatically.
- [ ] **TC-LEAD-09**: Navigate to `/deals`. Verify "Wayne Tech Contract" deal appears in initial pipeline stage.

---

## 6. Sales Deals & Kanban Pipeline
- [ ] **TC-DEAL-01**: Navigate to `/deals`. Verify visual Sales Kanban board renders with stage columns.
- [ ] **TC-DEAL-02**: Verify top summary bar displays "Total Pipeline", "Open Deals", and "Stages" metrics.
- [ ] **TC-DEAL-03**: Drag a Deal Card from "Lead In" column and drop it into "Proposal / Quote" column.
- [ ] **TC-DEAL-04**: Verify visual dropzone highlight during drag, and verify card stays in new column after drop.
- [ ] **TC-DEAL-05**: Click deal card title to open `/deals/[id]`. Verify stage progress bar and timeline widget show stage movement event.

---

## 7. Tasks & Overdue Management
- [ ] **TC-TASK-01**: Navigate to `/tasks`. Click "+ Add Task".
- [ ] **TC-TASK-02**: Enter Title "Schedule Product Demo", Priority "Urgent", select yesterday's date in Due Date picker. Click "Create Task".
- [ ] **TC-TASK-03**: Verify task row renders with red overdue alert styling and warning icon (`⚠`).
- [ ] **TC-TASK-04**: Click one-click completion checkbox. Verify task strikes through, status updates to "Completed", and overdue warning clears.

---

## 8. Executive Analytics Dashboard
- [ ] **TC-BI-01**: Navigate to `/dashboard`. Verify 4 primary KPI cards (Open Deals, Pipeline Value, Won Revenue, Win Rate) display active workspace data.
- [ ] **TC-BI-02**: Verify Pipeline by Stage progress bars reflect current stage deal distribution.
- [ ] **TC-BI-03**: Verify Recent Deals and Priority Tasks sections update in real-time.

---

## 9. Storage Manager (Cloudinary Engine)
- [x] **TC-STOR-01**: Navigate to `/storage` via Sidebar or Command Palette (`⌘K` shortcut `G S`).
- [x] **TC-STOR-02**: Verify Virtual Folders (All Files, Companies, Contacts, Deals, Leads, Tasks) render with correct record count badges.
- [x] **TC-STOR-03**: Click "+ Upload File". Select JPG/PNG/PDF/DOCX/ZIP files. Verify Cloudinary multi-file upload queue progress indicators.
- [x] **TC-STOR-04**: Click "Eye" icon on an Image attachment. Verify Cloudinary CDN image renders in preview modal.
- [x] **TC-STOR-05**: Click "Eye" icon on a PDF attachment. Verify Cloudinary PDF iframe renders correctly.
- [x] **TC-STOR-06**: Click "Download" icon. Verify presigned Cloudinary download link opens file directly.
- [x] **TC-STOR-07**: Type file name into search input. Verify instant client/server filtering.
- [x] **TC-STOR-08**: Select "Images" or "PDFs" from file type dropdown. Verify filtering.
- [x] **TC-STOR-09**: Click "Trash" icon on a file attachment. Confirm delete in modal. Verify file soft-deletion and list refresh.

