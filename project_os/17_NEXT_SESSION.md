# 17 — Next Session Handoff & Operating Protocol

> [!IMPORTANT]
> **MANDATORY AI STARTUP DIRECTIVE**:
> Any AI session starting work on ForgeCRM MUST read this file first before inspecting code or taking any action. Do NOT rely on memory, previous conversation history, or assumptions.

---

## Session Handoff Information

- **Current Branch**: `main`
- **Current Repository Commit**: `afa8dcb`
- **Overall Project Completion**: **100.0% (v2.2 Redesign Sub-phase 7.2.2 — pgvector RAG Engine & Embedding Pipeline Complete)**
- **Backend Test Status**: 10/10 AI Unit Tests Passing (`pytest apps/api/tests/test_ai_rag.py apps/api/tests/test_ai_context.py apps/api/tests/test_ai.py`)
- **Frontend Type Safety**: Exit Code 0 — 0 TypeScript Compilation Errors (`npx tsc --noEmit`)
- **Open Bugs**: 0 Critical Bugs

---

## Highest Priority Next Tasks (Version 2.2 Execution Plan)

1. **Sub-phase 7.2.3 — AI Memory Manager & Conversation Tree Branching**
   - *Priority*: High
   - *Goal*: Implement multi-tier memory service (`AIMemory`), memory summarization cron, and conversation tree branching (`parent_message_id`).

---

## Mandatory Post-Task Checklist for Future Sessions
After completing any task, the AI agent MUST update the following 5 files in `project_os/` before concluding:
1. `01_PROJECT_STATUS.md`
2. `02_FEATURE_MATRIX.md`
3. `15_PROJECT_SCORE.md`
4. `16_CHANGELOG.md`
5. `17_NEXT_SESSION.md`
