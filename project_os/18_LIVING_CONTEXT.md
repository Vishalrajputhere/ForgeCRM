# 18 — Living Context & Architecture Standards

> [!NOTE]
> This document replaces legacy `AGENT_MEMORY.md` files and serves as the living context of ForgeCRM coding conventions and architectural decisions.

---

## 1. Monorepo Architecture & Directory Layout

```
ForgeCRM/
├── apps/
│   ├── api/                    # FastAPI Modular Monolith (Python 3.12)
│   │   ├── app/
│   │   │   ├── core/           # Security, Auth, Dependencies, Config
│   │   │   ├── db/             # SQLAlchemy Engine, Session, Alembic Migrations
│   │   │   └── modules/        # Modular Monolith Domains (crm, workspace, identity, etc.)
│   │   ├── tests/              # Pytest Integration Suite
│   │   ├── alembic.ini
│   │   └── pyproject.toml
│   └── web/                    # Next.js 15 App Router Web Client (React 19 / TS)
│       ├── src/
│       │   ├── app/            # App Router Pages & Layouts
│       │   ├── components/     # UI Components (analytics, crm, common, workspace, ui)
│       │   ├── hooks/          # Custom React Hooks (useCRM, useWorkspace, useFormatters)
│       │   ├── stores/         # Zustand Stores (auth, workspace, analytics, storage)
│       │   ├── lib/            # Central Axios API Client & Formatting Helpers
│       │   └── types/          # TypeScript DTO Interfaces
├── docs/                       # Technical Specifications & Master Plan
├── project_os/                 # Permanent Project Knowledge Base (19 Specs)
└── docker-compose.prod.yml     # Production Orchestration (API, Web, Postgres, Redis, MinIO, Nginx)
```

---

## 2. Coding & Architectural Standards

### Backend Standards (FastAPI & SQLAlchemy)
- **Modular Monolith**: Code is organized strictly by domain inside `app/modules/<domain>/`. Each module contains `models.py`, `schemas.py`, `repository.py`, `service.py`, and `routes.py`.
- **Dependency Injection**: Use `Annotated[Type, Depends(...)]` for dependencies (`CurrentUser`, `WorkspaceIdDep`, `WorkspaceMemberDep`, `get_db_session`).
- **Pydantic Schemas**: Use `ConfigDict(from_attributes=True)` for response DTOs.
- **Async DB Sessions**: Use SQLAlchemy 2.0 AsyncIO queries (`await db.execute(...)`, `await db.flush()`).

### Frontend Standards (Next.js 15 & React Query)
- **Central API Client**: All HTTP requests MUST use `apiGet`, `apiPost`, `apiPatch`, `apiDelete` from `@/lib/api-client`.
- **Dynamic Headers**: Axios interceptor automatically attaches `Authorization: Bearer <token>` and `X-Workspace-ID: <uuid>`.
- **React Query Cache Invalidation**: Mutations MUST invalidate relevant query keys upon success. Switching workspaces MUST invoke `queryClient.invalidateQueries()`.
- **Dynamic Localization**: Use `useFormatters()` hook (`formatCurrency`, `formatDate`, `formatDateTime`) instead of hardcoding `$` or fixed date formats.
- **Strict TypeScript**: Code must pass `npx tsc --noEmit` cleanly with 0 errors (`exactOptionalPropertyTypes` enabled).

---

## 3. Known Limitations & Technical Constraints
- **Multi-Tenancy**: Tenant isolation relies on foreign key column `workspace_id`. All repository queries MUST include `.where(Model.workspace_id == workspace_id)`.
- **File Attachments**: Uploads generate presigned MinIO S3 URLs directly to object storage.
