# 05 — Backend Architecture Audit

### Backend Monolith Module Structure (`apps/api/app/modules`)

```
apps/api/app/modules/
├── ai/           # LLM Client & Rule-based Lead/Deal Intelligence
├── analytics/    # Executive Dashboard Aggregations & Metrics
├── crm/          # CRM Core Entities (Companies, Contacts, Leads, Deals, Tasks, Pipelines, Timeline)
├── identity/     # Authentication, Users, Roles, Permissions, Sessions, Tokens
├── jobs/         # Celery/Redis Task Dispatcher & Background Jobs
├── search/       # Multi-Entity PostgreSQL Full-Text Search Engine
├── storage/      # MinIO S3 Object Storage Presigned Upload Flow
└── workspace/    # Multi-Tenant Workspaces, Members, Settings, Invitations
```

---

## Detailed Module Audit

### 1. Identity Module (`apps/api/app/modules/identity`)
- **Entities / Models**: `User`, `Role`, `Permission`, `UserRole`, `RolePermission`, `Session`, `RefreshToken`
- **Repositories**: `UserRepository`, `RoleRepository`, `SessionRepository`, `RefreshTokenRepository`
- **Services**: `IdentityService`
  - `register_user`: Creates user record + default workspace organization + workspace admin role binding.
  - `authenticate_user`: Validates password against Argon2id hash, issues access token (15m) & refresh token (7d).
  - `refresh_token`: Rotates access/refresh tokens securely.
  - `list_roles`: Returns system roles for member invitation role selection.
  - `revoke_session`: Invalidates active user session.
- **Endpoints**:
  - `POST /api/v1/auth/register` (201 Created)
  - `POST /api/v1/auth/login` (200 OK)
  - `POST /api/v1/auth/refresh` (200 OK)
  - `GET /api/v1/auth/me` (200 OK)
  - `GET /api/v1/auth/roles` (200 OK)
  - `POST /api/v1/auth/logout` (204 No Content)
  - `POST /api/v1/auth/password/change` (200 OK)
  - `POST /api/v1/auth/password-reset/request` (200 OK)
  - `POST /api/v1/auth/password-reset/confirm` (200 OK)
- **Status**: **100% Complete & Verified**

### 2. Workspace Module (`apps/api/app/modules/workspace`)
- **Entities / Models**: `Workspace`, `WorkspaceMember`, `WorkspaceSettings`, `WorkspaceInvitation`, `Team`
- **Repositories**: `WorkspaceRepository`, `WorkspaceMemberRepository`, `WorkspaceSettingsRepository`, `InvitationRepository`, `TeamRepository`
- **Services**: `WorkspaceService`
  - `create_workspace`: Instantiates workspace + default settings + default pipeline + admin member.
  - `update_workspace`: Updates name, slug, industry, website, logo URL, company size.
  - `update_settings`: Updates regional preferences (timezone, currency, language, date format, week start).
  - `invite_member`: Generates secure single-use invitation token with assigned role.
  - `accept_invitation`: Validates token and creates workspace member binding.
- **Endpoints**:
  - `GET /api/v1/workspaces` (200 OK)
  - `POST /api/v1/workspaces` (201 Created)
  - `GET /api/v1/workspaces/{id}` (200 OK)
  - `PATCH /api/v1/workspaces/{id}` (200 OK)
  - `GET /api/v1/workspaces/{id}/members` (200 OK)
  - `POST /api/v1/workspaces/{id}/invitations` (201 Created)
  - `POST /api/v1/workspaces/invitations/accept` (200 OK)
  - `GET /api/v1/workspaces/{id}/settings` (200 OK)
  - `PATCH /api/v1/workspaces/{id}/settings` (200 OK)
- **Status**: **100% Complete & Verified**

### 3. CRM Operational Core Module (`apps/api/app/modules/crm`)
- **Entities / Models**: `Company`, `Contact`, `Lead`, `Pipeline`, `PipelineStage`, `Deal`, `DealProduct`, `Task`, `Activity`, `Note`
- **Repositories**: `CompanyRepository`, `ContactRepository`, `LeadRepository`, `PipelineRepository`, `DealRepository`, `TaskRepository`, `ActivityRepository`, `NoteRepository`
- **Services**: `CRMService`
  - `Companies`: `create_company`, `list_companies`, `get_company`, `update_company`
  - `Contacts`: `create_contact`, `list_contacts`, `get_contact`, `update_contact`, `delete_contact` (soft-deactivates)
  - `Leads`: `create_lead`, `list_leads`, `get_lead`, `update_lead`, `delete_lead` (disqualifies), `convert_lead` (transactionally creates Company + Contact + Deal)
  - `Pipelines & Deals`: `list_pipelines`, `list_deals`, `get_deal`, `create_deal`, `update_deal`, `delete_deal`, `move_deal_stage`
  - `Tasks`: `list_tasks`, `get_task`, `create_task`, `update_task`, `delete_task`, `complete_task`
  - `Timeline Activity`: `list_timeline_activities`, `_log_timeline_activity`
- **Endpoints**:
  - `POST/GET /api/v1/companies`, `GET/PATCH /api/v1/companies/{id}`
  - `POST/GET /api/v1/contacts`, `GET/PATCH/DELETE /api/v1/contacts/{id}`
  - `POST/GET /api/v1/leads`, `GET/PATCH/DELETE /api/v1/leads/{id}`, `POST /api/v1/leads/{id}/convert`
  - `GET/POST /api/v1/pipelines`, `GET/POST /api/v1/deals`, `GET/PATCH/DELETE /api/v1/deals/{id}`, `POST /api/v1/deals/{id}/move-stage`
  - `GET/POST /api/v1/tasks`, `GET/PATCH/DELETE /api/v1/tasks/{id}`, `POST /api/v1/tasks/{id}/complete`
  - `GET /api/v1/timeline?entity_type=&entity_id=`
- **Status**: **100% Complete & Verified**

### 4. Supporting Services (`apps/api/app/modules/`)
- **Analytics Module (`analytics/`)**: `AnalyticsService` computes overview KPIs, lead funnel conversion metrics, deal win rates (`GET /api/v1/analytics/overview`, `/leads`, `/deals`, `/pipeline`).
- **Search Module (`search/`)**: `SearchService` executes multi-entity PostgreSQL Full-Text Search across Companies, Contacts, Leads, Deals (`GET /api/v1/search`).
- **Storage Module (`storage/`)**: `StorageService` manages S3/MinIO presigned upload URL generation and attachment record confirmation (`POST /api/v1/storage/upload-url`, `/confirm`).
- **AI Module (`ai/`)**: `AIService` provides rule-based lead scoring and LLM abstraction for deal risk summaries (`POST /api/v1/ai/score-lead`, `/summarize-deal`).
- **Jobs Module (`jobs/`)**: `JobService` dispatches Celery background tasks via Redis broker (`POST /api/v1/jobs/trigger`).

---

## Core Middleware & Security Dependencies

1. **Authentication Guard (`CurrentUser`)**: Decodes `Authorization: Bearer <token>`, validates expiration, fetches user record.
2. **Workspace Isolation Guard (`get_current_workspace_id`)**: Reads `X-Workspace-ID` header, verifies valid UUID format, validates active membership in `workspace_members`.
3. **RBAC Guard (`require_workspace_permission`)**: Verifies member role holds target permission slug.
4. **CORS Middleware (`CORSMiddleware`)**: Configured for local Next.js origin (`http://localhost:3000`) and production domains.
