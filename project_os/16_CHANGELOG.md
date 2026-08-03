# 16 — Project Changelog

All future implementations must append changes to this living log following this exact markdown structure:

---

## [1.0.0] — 2026-08-03

### Features Added
- **Dynamic Regional Localization**: Introduced `useFormatters()` hook and workspace settings persistence for currency, timezone, date format, and week start day across Dashboard, Deals, Leads, Tasks, and Timeline.
- **System Roles API**: Added `GET /api/v1/auth/roles` endpoint in FastAPI identity module and `useRoles()` hook in Next.js web client.
- **Role-Based Member Invitations**: Added role picker dropdown to Workspace Member Invitation modal, with copyable invitation tokens.
- **Workspace Switcher & Cache Invalidation**: Added `queryClient.invalidateQueries()` on workspace context switch to clear stale React Query cache instantly.
- **Overview & Settings Unsaved Changes Alert**: Added dirty-state detection and unsaved changes alert banner to Workspace Overview and Settings tabs.

### Bugs Fixed
- **Missing `X-Workspace-ID` Header**: Centralized dynamic header injection in `api-client.ts` with `getWorkspaceIdSync()` fallback to eliminate multi-tenant 400 errors.
- **Unused Workspace Variables**: Cleaned up unused destructures in layout components to maintain 0 `tsc` compilation errors.
- **Stage Metrics Property Access**: Updated `analytics-dashboard.tsx` to read `stage.stage_name` and `stage.total_value` correctly.

### Refactoring & Quality
- **Test Database Isolation**: Updated Pytest `conftest.py` fixture with `Base.metadata.drop_all` before `create_all` for clean test database drops.
- **TypeScript Type Safety**: Satisfied strict `exactOptionalPropertyTypes: true` across all frontend entity update DTOs.
- **Project Operating System**: Created `project_os/` living knowledge base with 19 specification documents.
