# 11 — Prioritized Implementation Roadmap

### Roadmap Overview
This document guides future engineering sessions. Every proposed task is prioritized based on empirical repository needs, technical debt resolution, or architecture specs.

---

## Roadmap Task Backlog

### Phase 1: High Priority / Technical Debt Refactoring

#### Task 1: Standalone S3 File Manager UI (`/storage`)
- **Priority**: High
- **Difficulty**: Medium
- **Dependencies**: MinIO Presigned S3 API (`app/modules/storage`)
- **Estimated Effort**: 4 hours
- **Files Affected**:
  - `apps/web/src/app/(dashboard)/storage/page.tsx` [NEW]
  - `apps/web/src/components/storage/file-uploader.tsx` [NEW]
  - `apps/web/src/hooks/use-storage.ts`
- **Reason**: The backend storage service and presigned URL flows are 100% complete, but a dedicated file explorer page will improve document attachment management.

#### Task 2: Advanced CSV Bulk Export & Import Tools
- **Priority**: Medium
- **Difficulty**: Medium
- **Dependencies**: Companies & Contacts API
- **Estimated Effort**: 3 hours
- **Files Affected**:
  - `apps/web/src/app/(dashboard)/companies/page.tsx`
  - `apps/web/src/app/(dashboard)/contacts/page.tsx`
  - `apps/web/src/lib/csv-exporter.ts` [NEW]
- **Reason**: Allows sales managers to export directory tables to CSV/Excel for offline analysis.

#### Task 3: Interactive Pipeline Stage Customization Panel
- **Priority**: Medium
- **Difficulty**: Hard
- **Dependencies**: Pipelines API (`app/modules/crm`)
- **Estimated Effort**: 5 hours
- **Files Affected**:
  - `apps/web/src/app/(dashboard)/workspace/page.tsx` (Pipelines Tab)
  - `apps/web/src/components/crm/stage-editor.tsx` [NEW]
- **Reason**: Enables workspace admins to customize pipeline stage names, sort orders, and target probabilities directly in the UI.

---

### Phase 2: Feature Additions

#### Task 4: Email Notifications & SMTP Gateway Integration
- **Priority**: Medium
- **Difficulty**: Hard
- **Dependencies**: Celery Background Jobs (`app/modules/jobs`)
- **Estimated Effort**: 6 hours
- **Files Affected**:
  - `apps/api/app/modules/notifications/` [NEW]
  - `apps/api/app/core/email.py` [NEW]
- **Reason**: Automated email dispatch for member invitations, task overdue alerts, and deal stage assignment notifications.

#### Task 5: AI Insights Drawer & LLM Prompt Enhancements
- **Priority**: Low
- **Difficulty**: Medium
- **Dependencies**: AI Module (`app/modules/ai`)
- **Estimated Effort**: 4 hours
- **Files Affected**:
  - `apps/web/src/components/ai/ai-insights-drawer.tsx` [NEW]
  - `apps/api/app/modules/ai/service.py`
- **Reason**: Enhances current rule-based lead scoring with live OpenAI LLM prompt summaries for enterprise accounts.
