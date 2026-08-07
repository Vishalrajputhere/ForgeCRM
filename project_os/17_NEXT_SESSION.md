# 17 — Next Session Handoff & Operating Protocol

> [!IMPORTANT]
> **MANDATORY AI STARTUP DIRECTIVE**:
> Any AI session starting work on ForgeCRM MUST read this file first before inspecting code or taking any action. Do NOT rely on memory, previous conversation history, or assumptions.

---

## Session Handoff Information

- **Current Branch**: `main`
- **Current Repository Commit**: `afa8dcb`
- **Overall Project Completion**: **100.0% (v2.2 Redesign Sub-phase 7.2.3 — AI Memory Manager & Conversation Branching Complete)**
- **Backend Test Status**: 12/12 AI Unit Tests Passing (`pytest apps/api/tests/test_ai_memory.py apps/api/tests/test_ai_rag.py apps/api/tests/test_ai_context.py apps/api/tests/test_ai.py`)
- **Frontend Type Safety**: Exit Code 0 — 0 TypeScript Compilation Errors (`npx tsc --noEmit`)
- **Open Bugs**: 0 Critical Bugs

---

## Highest Priority Next Tasks (Version 2.2 Execution Plan)

1. **Sub-phase 7.2.4 — MCP Tool Registry, Auto-Selection & Action Approval Guardrails**
   - *Priority*: High
   - *Goal*: Implement MCP tool registry (`tool_registry.py`), automatic tool execution guards, RBAC permission checks, and Tier 3 human approval workflows for destructive actions.

---

## Mandatory Post-Task Checklist for Future Sessions
After completing any task, the AI agent MUST update the following 5 files in `project_os/` before concluding:
1. `01_PROJECT_STATUS.md`
2. `02_FEATURE_MATRIX.md`
3. `15_PROJECT_SCORE.md`
4. `16_CHANGELOG.md`
5. `17_NEXT_SESSION.md`
