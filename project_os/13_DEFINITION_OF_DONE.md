# 13 — Definition of Done (DoD)

### Definition of Done Rules
A feature in ForgeCRM is marked **COMPLETE** if and only if **100% of the following 17 criteria** are satisfied and empirically verified against the repository:

---

## 17-Point Definition of Done Checklist

1. **Architecture Specification**: Feature specification exists in `docs/` or `project_os/`.
2. **Backend Service & Route**: Fully implemented in FastAPI with typed request/response Pydantic DTO schemas.
3. **Frontend Component & Hook**: Built in Next.js 15 App Router with TanStack React Query mutations & queries.
4. **Database Schema & Migration**: Relational table exists in PostgreSQL with workspace foreign key isolation & Alembic migration revision.
5. **Central Interceptor Connection**: All HTTP calls flow through `api-client.ts` with `Authorization` & `X-Workspace-ID` header injection.
6. **Runtime Execution Verification**: Endpoint and UI interaction executed successfully in runtime browser or integration test suite.
7. **CRUD Verification**: Full Create, Read, Update, and Delete/Deactivate operations function as expected.
8. **Responsive Layout**: UI scales fluidly across mobile, tablet, and desktop viewports.
9. **Dark Mode Styling**: UI adheres to dark theme design system (`slate-900`/`forge-500` glassmorphism).
10. **Multi-Tenant Workspace Isolation**: Backend dependencies validate `workspace_id` membership on every query.
11. **RBAC & Authorization**: Permissions are validated prior to execution.
12. **Error Handling**: Graceful error alert banners and toast notifications render upon API failures.
13. **Loading States**: Skeletons or disabled buttons render during asynchronous pending states.
14. **Empty States**: Helpful zero-state graphics render when no records exist.
15. **Accessibility**: Form labels are associated with inputs, and interactive elements support keyboard navigation.
16. **Test Coverage**: Pytest integration tests pass cleanly without errors.
17. **Zero Console & Type Errors**: `npx tsc --noEmit` returns exit code 0 with 0 compilation errors.

---

## Strictly Prohibited Workflows
- ❌ **No Placeholder Functions**: Never leave stubbed `TODO` return statements in production endpoints.
- ❌ **No Hardcoded Tenant IDs**: Never hardcode workspace UUIDs or user IDs in frontend components.
- ❌ **No Bypassing Headers**: Never instantiate custom `fetch` or `axios` instances outside `lib/api-client.ts`.
- ❌ **No Masking Errors**: Never swallow exceptions or return empty dummy fallbacks to force a test pass.
