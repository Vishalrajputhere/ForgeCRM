# PHASE 8.1 — ARCHITECTURE AUDIT & EXTENSION PLAN
**ForgeCRM V2 — Multi-Tenancy & Enterprise Administration**

> **Authoritative Technical Audit Document**  
> **Date**: August 14, 2026  
> **Status**: APPROVED FOR IMPLEMENTATION PLANNING  

---

## 1. Existing System Audit Matrix

| Domain / Capability | Existing Backend Files | Database Models | Existing API Routes | Existing Frontend Views | Audit Status & Extension Plan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication & Identity** | `app/modules/identity/` (`routes.py`, `service.py`, `repository.py`) | `User`, `Session`, `RefreshToken`, `OAuthAccount`, `PasswordResetToken`, `EmailVerificationToken` | `POST /auth/login`<br>`POST /auth/register`<br>`POST /auth/refresh`<br>`GET /auth/me`<br>`POST /auth/logout`<br>`GET /auth/sessions`<br>`DELETE /auth/sessions/{id}` | `/login`, `/register`, `/reset-password` | **Production Ready Core**. Extend session management with admin session revocation & security policies. Do NOT duplicate User/Session models. |
| **Workspace & Multi-Tenancy** | `app/modules/workspace/` (`routes.py`, `service.py`, `repository.py`) | `Workspace`, `WorkspaceMember`, `WorkspaceSettings`, `WorkspaceInvitation` | `GET/POST /workspaces`<br>`GET/PATCH /workspaces/{id}`<br>`GET /workspaces/{id}/members`<br>`POST /workspaces/{id}/invitations`<br>`GET/POST /workspaces/invitations/accept`<br>`GET/PATCH /workspaces/{id}/settings` | `/workspace` (Overview, Regional Settings, Members) | **Production Ready Base**. Extend member role mutation, invitation revocation, and workspace security settings. Do NOT duplicate Workspace models. |
| **Teams Management** | `app/modules/workspace/` | `Team`, `TeamMember` (`teams`, `team_members` tables) | `GET /workspaces/{id}/teams`<br>`POST /workspaces/{id}/teams` | `/workspace/teams` | **90% Complete**. Extend with team detail `PATCH /teams/{id}` (rename, description, manager), team member assignment `POST/DELETE /teams/{id}/members`. |
| **Roles & Permissions (RBAC)** | `app/modules/identity/` | `Role`, `Permission`, `UserRole`, `role_permissions` | `GET /auth/roles` | System default role badges | **Production Ready Foundation**. System roles (`Super Admin`, `Workspace Admin`, `Sales Manager`, `Sales Rep`, `Read Only Member`) exist. Add `GET /permissions`, `POST /roles` (custom roles), and `/workspace/roles` permission matrix UI. |
| **Audit Logs** | `app/modules/crm/` (`Activity`), `app/modules/ai/` (`AISecurityAuditLog`) | `Activity`, `AISecurityAuditLog` | `GET /timeline`, `GET /ai/admin/audit` | `TimelineWidget`, `/ai/admin` | **Needs Unified Enterprise Audit Log**. Create dedicated `AuditEvent` model & `GET /workspaces/{id}/audit` endpoint capturing security, RBAC, member, and setting changes. |
| **Usage & Telemetry** | `app/modules/analytics/`, `app/modules/ai/` | `attachments`, `ai_usage`, `ai_cost_records`, CRM entity tables | `GET /analytics/overview`, `GET /ai/admin/cost` | `/dashboard`, `/admin/jobs` | **Needs Centralized Usage Endpoint**. Create `GET /workspaces/{id}/usage` aggregating real DB counts (members, teams, entities, storage bytes, AI tokens/cost) against tier quotas. |
| **Integration Administration** | `app/modules/storage/` (MinIO S3), `app/modules/jobs/` (Celery) | Integration config schemas | Presigned storage APIs, Celery job triggers | `/storage`, `/admin/jobs` | **Needs Enterprise Integration Matrix**. Create provider abstraction & `GET/POST /workspaces/{id}/integrations` administration API for Salesforce, HubSpot, Slack, Gmail, Outlook, Teams, IndiaMART. |
| **Enterprise Security Controls** | `app/core/security.py`, `app/core/dependencies.py` | `sessions`, `workspace_settings` | Token decode, JWT secret validation, `require_workspace_permission` | Security alerts in `/ai/admin` | **Needs /workspace/security UI & Policy API**. Build password policy, session timeout controls, active session revocation, and security audit feed. |

---

## 2. Target Enterprise Organizational Hierarchy

```
Organization (Logical Multi-Tenant Scope)
    └── Workspace / Tenant Boundary (Strict Data Isolation via X-Workspace-ID)
        ├── Workspace Settings & Regional Preferences
        ├── Enterprise Security Policies & Audit Logs
        ├── Integrations Administration Layer
        ├── Usage & Quotas Engine
        ├── Teams (Sales, Operations, Support)
        │   └── Workspace Members
        └── Roles & Permissions (System & Custom Roles)
            └── Atomic Permissions (crm.*, workspace.*, ai.*, admin.*)
```

- **Tenant Isolation Principle**: Every query enforces `workspace_id == current_workspace_id`.
- **Role Escalation Protection**: Users cannot assign roles containing permissions they do not possess.
- **Admin Audit Trail**: Every sensitive operation (role change, member removal, setting update, session revocation) creates an immutable `AuditEvent` log.

---

## 3. Mandatory Non-Duplication Directives

1. **User Models**: Re-use existing `User` model (`users` table).
2. **Workspace Models**: Re-use existing `Workspace`, `WorkspaceMember`, `WorkspaceSettings` models.
3. **Roles & Permissions**: Re-use existing `Role`, `Permission`, `UserRole`, `role_permissions` ORM models.
4. **Teams**: Re-use existing `Team`, `TeamMember` models.
5. **Auth Dependencies**: Re-use existing `get_current_user`, `get_current_workspace_id`, `require_workspace_permission`.
6. **Frontend State**: Re-use existing `useAuthStore`, `useWorkspaceStore`, `useAIFetch`, and Axios `api-client`.

---

## 4. Phase 8.1 Deliverables Checklist

### Backend Architectural Additions
- [ ] `AuditEvent` ORM Model & Migration (`005_enterprise_administration_schema`) for unified workspace audit logs.
- [ ] `WorkspaceSecuritySettings` ORM Model / Extension for password policy, session timeouts, MFA policy.
- [ ] `EnterpriseIntegration` Status Model / Registry for integration administration.
- [ ] API Endpoint: `GET/POST /api/v1/workspaces/{id}/audit` (Searchable, filterable audit log table).
- [ ] API Endpoint: `GET/PATCH /api/v1/workspaces/{id}/security` & `GET /api/v1/workspaces/{id}/security/sessions` (Admin session revocation).
- [ ] API Endpoint: `GET /api/v1/permissions` & `POST /api/v1/roles` & `PATCH /api/v1/workspaces/{id}/members/{member_id}/role`.
- [ ] API Endpoint: `PATCH /api/v1/teams/{team_id}` & `POST/DELETE /api/v1/teams/{team_id}/members`.
- [ ] API Endpoint: `GET /api/v1/workspaces/{id}/integrations` & `POST /api/v1/workspaces/{id}/integrations/{provider}/toggle`.
- [ ] API Endpoint: `GET /api/v1/workspaces/{id}/usage` (Real DB metrics & limit comparisons).

### Frontend UI Views
- [ ] `/workspace/admin` — Enterprise Workspace Console & Sub-Navigation Header.
- [ ] `/workspace/settings` — General, Regional, and Member Invitation Policies.
- [ ] `/workspace/members` — Member Management, Role Assignment & Invitation Revocation.
- [ ] `/workspace/teams` — Team Management, Member Assignment & Manager Assignment.
- [ ] `/workspace/roles` — System & Custom Roles Matrix & Permission Assignment.
- [ ] `/workspace/security` — Security Policies, Active Sessions Revocation & Security Event Feed.
- [ ] `/workspace/audit` — Searchable Enterprise Audit Trail with Event Detail Drawer.
- [ ] `/workspace/integrations` — Enterprise Integration Matrix & Provider Status Panel.
- [ ] `/workspace/usage` — Real-Time Usage Gauges, Limits & Quota Remaining.

---

## 5. Verification Requirements
- `pytest apps/api -v` — 100% pass rate.
- `npx tsc --noEmit` — 0 errors.
- `npm run build` — Clean production Next.js build.
