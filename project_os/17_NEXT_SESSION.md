# 17 — Next Session Handoff & Operating Protocol

> [!IMPORTANT]
> **MANDATORY AI STARTUP DIRECTIVE**:
> Any AI session starting work on ForgeCRM MUST read this file first before inspecting code or taking any action. Do NOT rely on memory, previous conversation history, or assumptions.

---

## Session Handoff Information

- **Current Branch**: `main`
- **Current Repository Commit**: `afa8dcb`
- **Overall Project Completion**: **96.25% (A Grade — Production Ready Monolith)**
- **Backend Test Status**: 53/53 Integration Tests Passing (`pytest`)
- **Frontend Type Safety**: Exit Code 0 — 0 TypeScript Compilation Errors (`npx tsc --noEmit`)
- **Open Bugs**: 0 Critical Bugs

---

## Highest Priority Next Tasks (from `11_IMPLEMENTATION_ROADMAP.md`)

1. **Task 1: Standalone S3 File Manager UI (`/storage`)**
   - *Priority*: High
   - *Goal*: Build standalone `/storage` file explorer page utilizing presigned MinIO S3 API endpoints (`app/modules/storage`).
   - *Files Affected*: `apps/web/src/app/(dashboard)/storage/page.tsx`, `components/storage/file-uploader.tsx`.
2. **Task 2: Tabular Data CSV Exporter Utility**
   - *Priority*: Medium
   - *Goal*: Implement client-side CSV download generator for Companies, Contacts, Leads, and Tasks tables.
   - *Files Affected*: `apps/web/src/lib/csv-exporter.ts`.

---

## Mandatory Post-Task Checklist for Future Sessions
After completing any task, the AI agent MUST update the following 5 files in `project_os/` before concluding:
1. `01_PROJECT_STATUS.md`
2. `02_FEATURE_MATRIX.md`
3. `15_PROJECT_SCORE.md`
4. `16_CHANGELOG.md`
5. `17_NEXT_SESSION.md`
