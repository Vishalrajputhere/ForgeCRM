# 14 — Technical Debt Catalog

### Summary of Known Technical Debt

| Category | Description | Severity | Impact | Remediation Plan |
| :--- | :--- | :---: | :--- | :--- |
| **Code Duplication** | Entity `SELECT` queries repeat `workspace_id` filter across repositories in `CRMService`. | Low | Maintainability | Extract shared `get_by_id_in_workspace` helper method in `BaseRepository`. |
| **UI Polish** | Entity table rows lack bulk selection checkboxes for batch status updates. | Medium | User Experience | Add `selectedIds` state and multi-select checkboxes to directory tables. |
| **Testing** | E2E browser verifications are run via Playwright Python scripts instead of Jest/Vitest UI unit tests. | Low | Test Speed | Introduce Vitest unit tests for frontend React Query hooks. |
| **Background Processing** | Scheduled cron tasks rely on one-shot job triggers rather than Celery Beat daemon. | Low | Automation | Configure Celery Beat cron schedule for daily digest emails. |
| **AI Integration** | Deterministic lead scoring fallback is used when `OPENAI_API_KEY` is not present in `.env`. | Low | AI Quality | Configure live OpenAI API key in production environment. |

---

## Detailed Remediation Items

### 1. Refactoring & Code Quality
- **Repository Abstractions**: DRY up repetitive workspace ID checks in `CompanyRepository`, `ContactRepository`, `LeadRepository`, `DealRepository`, `TaskRepository`.

### 2. UI Polish & UX Improvements
- **Bulk Directory Operations**: Add multi-select checkboxes in `/companies`, `/contacts`, `/leads` table headers.
- **CSV Data Exporter**: Implement client-side CSV generator utility (`lib/csv-exporter.ts`) for tabular reports.

### 3. Developer Experience (DX)
- **Shared Type Generation**: Generate TypeScript interfaces directly from FastAPI Pydantic schemas using `openapi-typescript` to ensure schema sync.
