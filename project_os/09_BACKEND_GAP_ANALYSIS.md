# 09 — Backend Gap Analysis & Code Audit

### Empirical Backend Code Inspection

This document records dead code, unused endpoints, duplicate logic, TODO markers, and partial feature implementations identified during the repository audit.

---

## Detailed Findings

### 1. Code Duplication & Refactoring Candidates
- **Entity Access Verification**:
  - `CRMService` repeats individual SQL `SELECT` queries with `workspace_id` filtering for each entity type (`get_by_id`).
  - *Recommendation*: Use a shared `BaseRepository.get_by_id_in_workspace(workspace_id, id)` helper method across repositories.

### 2. TODO Markers in Source Code
- **`apps/api/app/modules/ai/service.py`**:
  - `TODO: Replace deterministic lead scoring fallback with full fine-tuned LLM prompt pipeline when OPENAI_API_KEY is configured in production environment.`
  - *Current Status*: Deterministic scoring fallback is 100% operational and returns valid scores (`0–100`) and qualification tiers (`Hot`, `Warm`, `Cold`).

- **`apps/api/app/modules/jobs/service.py`**:
  - `TODO: Implement scheduled cron dispatch for daily digest emails via Celery Beat.`
  - *Current Status*: One-shot job triggers via `POST /jobs/trigger` are operational, but Celery Beat cron scheduling is scheduled for Phase 2.

### 3. Partial Feature Implementations
- **Webhooks & External Integrations**:
  - `apps/api/app/modules/crm/models.py` has fields for external sync identifiers (`external_crm_id`), but third-party sync integrations (Salesforce / HubSpot importer) are deferred to Phase 2.

### 4. Unused / Dead Endpoints
- **Audit Findings**: Zero completely dead routes. All 45 defined endpoints in FastAPI routers (`identity`, `workspace`, `crm`, `analytics`, `search`, `storage`, `ai`, `jobs`) are mounted in `app/main.py` and covered by integration tests in `apps/api/tests/`.

### 5. Repository & Service Health Summary
- **Dead Imports**: None (cleaned via Ruff linter).
- **Type Annotations**: `mypy` strict mode passes across `app/`.
- **Database Connection Pool**: Configured with `pool_pre_ping=True` and connection recycling in `app/db/engine.py`.
