"""
ForgeCRM API â€” Workflow Automation Execution Engine

The engine is responsible for:
  1. Evaluating condition groups against trigger data
  2. Executing each action step in order
  3. Writing per-step logs (AutomationLog)
  4. Updating run status and rule statistics on completion

This module runs synchronously within the HTTP request cycle.
Background/async Celery execution is Phase 2.

Documentation: docs/03_Backend/310_AUTOMATION_ENGINE.md Â§3 (Execution Engine)
"""

from __future__ import annotations

import time
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.db.base import generate_uuid7
from app.modules.automation.models import (
    AutomationAction,
    AutomationCondition,
    AutomationLog,
    AutomationRule,
    AutomationRun,
)
from app.modules.automation.repository import (
    AutomationLogRepository,
    AutomationRuleRepository,
    AutomationRunRepository,
)

logger = get_logger(__name__)


# ── Condition Evaluator ────────────────────────────────────────────────────────


def _get_field_value(data: dict[str, Any], field_path: str) -> Any:
    """
    Traverse a dotted field path within nested dict with robust multi-tier fallback matching.
    Supports:
    1. Direct exact key match (e.g. 'estimated_value')
    2. Alias mapping ('Estimated Value' -> 'estimated_value')
    3. Normalized snake_case ('Estimated Value' -> 'estimated_value')
    4. Case-insensitive / camelCase match
    5. Dotted path traversal ('lead.status')
    """
    from app.modules.automation.registry import LABEL_TO_CANONICAL_KEY_MAP

    parts = field_path.split(".")
    current: Any = data
    for part in parts:
        if not isinstance(current, dict):
            return None
        
        # Tier 1: Direct key match
        if part in current:
            current = current[part]
            continue

        # Tier 2: Alias map
        alias_key = LABEL_TO_CANONICAL_KEY_MAP.get(part.strip().lower())
        if alias_key and alias_key in current:
            current = current[alias_key]
            continue

        # Tier 3: Normalized snake_case
        snake_key = part.strip().lower().replace(" ", "_").replace("-", "_")
        if snake_key in current:
            current = current[snake_key]
            continue

        # Tier 4: Case-insensitive scan
        found = False
        part_lower = part.strip().lower()
        for k, v in current.items():
            if k.lower() == part_lower or k.lower().replace("_", "") == part_lower.replace("_", ""):
                current = v
                found = True
                break
        
        if not found:
            return None

    return current


def _coerce(value: Any, value_type: str) -> Any:
    """Coerce a string condition value to the correct Python type."""
    if value is None:
        return None
    if value_type == "number":
        try:
            return float(value)
        except (ValueError, TypeError):
            return None
    if value_type == "boolean":
        return str(value).lower() in ("true", "1", "yes")
    return str(value)


def _evaluate_condition(condition: AutomationCondition, data: dict[str, Any]) -> bool:
    """Evaluate a single condition predicate against the trigger entity data."""
    field_value = _get_field_value(data, condition.field_path)
    cond_value = _coerce(condition.value, condition.value_type)
    op = condition.operator

    # Null/empty operators don't need a cond_value
    if op == "EMPTY":
        return field_value is None or str(field_value).strip() == ""
    if op == "NOT_EMPTY":
        return field_value is not None and str(field_value).strip() != ""

    if field_value is None:
        return False

    field_str = str(field_value).lower()
    cond_str = str(cond_value).lower() if cond_value is not None else ""

    if op == "EQUALS":
        return field_str == cond_str
    if op == "NOT_EQUALS":
        return field_str != cond_str
    if op == "CONTAINS":
        return cond_str in field_str
    if op == "NOT_CONTAINS":
        return cond_str not in field_str
    if op == "STARTS_WITH":
        return field_str.startswith(cond_str)
    if op == "ENDS_WITH":
        return field_str.endswith(cond_str)

    # Numeric comparisons
    try:
        field_num = float(field_value)
        cond_num = float(cond_value) if cond_value is not None else 0.0
        if op == "GREATER_THAN":
            return field_num > cond_num
        if op == "LESS_THAN":
            return field_num < cond_num
        if op == "GREATER_OR_EQUAL":
            return field_num >= cond_num
        if op == "LESS_OR_EQUAL":
            return field_num <= cond_num
    except (ValueError, TypeError):
        return False

    return False


def explain_condition_evaluations(rule: AutomationRule, trigger_data: dict[str, Any]) -> list[dict[str, Any]]:
    """
    Produce granular condition evaluation details for rule debugging ('Explain Why').
    Returns a list of dicts with field_path, operator, expected_value, actual_value, result, and explanation.
    """
    details: list[dict[str, Any]] = []

    for cond in rule.conditions:
        actual_val = _get_field_value(trigger_data, cond.field_path)
        expected_val = cond.value
        passed = _evaluate_condition(cond, trigger_data)

        if passed:
            explanation = f"Condition passed: {cond.field_path} ({actual_val}) {cond.operator} {expected_val or ''}".strip()
        else:
            if actual_val is None:
                explanation = f"Condition failed: Field '{cond.field_path}' was missing/null in trigger entity data."
            else:
                explanation = f"Condition failed: Actual value '{actual_val}' did not satisfy {cond.operator} '{expected_val or ''}'."

        details.append({
            "field_path": cond.field_path,
            "operator": cond.operator,
            "expected_value": expected_val,
            "actual_value": actual_val,
            "result": passed,
            "explanation": explanation,
        })

    return details


def evaluate_conditions(rule: AutomationRule, trigger_data: dict[str, Any]) -> bool:
    """
    Evaluate all conditions for a rule against trigger data.

    Conditions within the same group_index are ANDed.
    Different groups are ORed when condition_logic == 'OR'.
    When condition_logic == 'AND', all conditions must pass regardless of group.
    When there are no conditions, the rule always matches.
    """
    if not rule.conditions:
        return True

    if rule.condition_logic == "AND":
        return all(_evaluate_condition(c, trigger_data) for c in rule.conditions)

    # OR logic â€” group by group_index, each group is ANDed, groups are ORed
    groups: dict[int, list[AutomationCondition]] = {}
    for cond in rule.conditions:
        groups.setdefault(cond.group_index, []).append(cond)

    return any(
        all(_evaluate_condition(c, trigger_data) for c in group_conditions)
        for group_conditions in groups.values()
    )



# â”€â”€ Action Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


async def _execute_action(
    action: AutomationAction,
    trigger_data: dict[str, Any],
    db: AsyncSession,
    workspace_id: UUID,
    member_id: UUID | None,
) -> dict[str, Any]:
    """
    Dispatch a single action to its handler.
    Returns a result dict that is stored in AutomationLog.result_data.
    Raises on failure â€” caller catches and marks log as failed.
    """
    action_type = action.action_type
    config = action.config or {}

    if action_type == "CREATE_TASK":
        return await _action_create_task(config, trigger_data, db, workspace_id, member_id)

    if action_type == "CREATE_FOLLOWUP_TASK":
        return await _action_create_task(config, trigger_data, db, workspace_id, member_id)

    if action_type == "UPDATE_LEAD":
        return await _action_update_entity("lead", config, trigger_data, db, workspace_id, member_id)

    if action_type == "UPDATE_COMPANY":
        return await _action_update_entity("company", config, trigger_data, db, workspace_id, member_id)

    if action_type == "UPDATE_CONTACT":
        return await _action_update_entity("contact", config, trigger_data, db, workspace_id, member_id)

    if action_type == "UPDATE_DEAL":
        return await _action_update_entity("deal", config, trigger_data, db, workspace_id, member_id)

    if action_type == "MOVE_DEAL_STAGE":
        return await _action_move_deal_stage(config, trigger_data, db, workspace_id, member_id)

    if action_type == "ASSIGN_OWNER":
        return await _action_assign_owner(config, trigger_data, db, workspace_id, member_id)

    if action_type == "CREATE_ACTIVITY":
        return await _action_create_activity(config, trigger_data, db, workspace_id, member_id)

    if action_type == "SEND_NOTIFICATION":
        return await _action_send_notification(config, trigger_data, workspace_id, member_id)

    if action_type == "SEND_EMAIL":
        return await _action_send_email(config, trigger_data, workspace_id, member_id)

    if action_type == "ARCHIVE_RECORD":
        return await _action_archive_record(config, trigger_data, db, workspace_id, member_id)

    if action_type in ("ADD_TAG", "REMOVE_TAG"):
        return {"action": action_type, "note": "Tag operations logged â€” tag table not yet implemented."}

    if action_type == "WEBHOOK":
        return await _action_webhook(config, trigger_data)

    raise ValueError(f"Unknown action_type: {action_type}")


async def _action_create_task(
    config: dict[str, Any],
    trigger_data: dict[str, Any],
    db: AsyncSession,
    workspace_id: UUID,
    member_id: UUID | None,
) -> dict[str, Any]:
    """Create a task via CRMService."""
    from datetime import timedelta
    from app.modules.crm.schemas import TaskCreate
    from app.modules.crm.service import CRMService

    if member_id is None:
        return {"skipped": True, "reason": "No member context for task creation."}

    due_offset_hours: int = config.get("due_offset_hours", 24)
    due_date = datetime.now(UTC) + timedelta(hours=due_offset_hours)

    # Interpolate title with trigger entity name if available
    title_template: str = config.get("title", "Follow-up task")
    entity_name = trigger_data.get("name") or trigger_data.get("title") or ""
    title = title_template.replace("{{entity_name}}", entity_name)

    entity_type_str = trigger_data.get("_entity_type")
    entity_id_parsed = _safe_uuid(trigger_data.get("id"))

    task_payload = TaskCreate(
        title=title,
        description=config.get("description", "Automatically created by workflow automation."),
        priority=config.get("priority", "Medium"),
        due_date=due_date,
        assigned_member_id=member_id,
        entity_type=entity_type_str.capitalize() if entity_type_str else None,
        entity_id=entity_id_parsed,
    )

    service = CRMService(db)
    task = await service.create_task(workspace_id, member_id, task_payload)
    return {"task_id": str(task.id), "title": task.title}


async def _action_update_entity(
    entity_type: str,
    config: dict[str, Any],
    trigger_data: dict[str, Any],
    db: AsyncSession,
    workspace_id: UUID,
    member_id: UUID | None,
) -> dict[str, Any]:
    """Update a CRM entity field (lead/company/contact/deal)."""
    from uuid import UUID as _UUID
    from app.modules.crm.service import CRMService

    entity_id_str = trigger_data.get("id") or config.get("entity_id")
    if not entity_id_str:
        return {"skipped": True, "reason": f"No {entity_type} ID in trigger data."}

    try:
        entity_id = _UUID(str(entity_id_str))
    except ValueError:
        return {"skipped": True, "reason": "Invalid entity ID format."}

    fields: dict[str, Any] = config.get("fields", {})
    if not fields:
        return {"skipped": True, "reason": "No fields to update in action config."}

    service = CRMService(db)

    if entity_type == "lead":
        from app.modules.crm.schemas import LeadUpdate
        payload = LeadUpdate(**{k: v for k, v in fields.items() if v is not None})
        await service.update_lead(workspace_id, entity_id, payload)
    elif entity_type == "company":
        from app.modules.crm.schemas import CompanyUpdate
        payload = CompanyUpdate(**{k: v for k, v in fields.items() if v is not None})
        await service.update_company(workspace_id, entity_id, payload)
    elif entity_type == "contact":
        from app.modules.crm.schemas import ContactUpdate
        payload = ContactUpdate(**{k: v for k, v in fields.items() if v is not None})
        await service.update_contact(workspace_id, entity_id, payload)
    elif entity_type == "deal":
        from app.modules.crm.schemas import DealUpdate
        payload = DealUpdate(**{k: v for k, v in fields.items() if v is not None})
        await service.update_deal(workspace_id, entity_id, payload)

    return {"entity_type": entity_type, "entity_id": str(entity_id), "fields_updated": list(fields.keys())}


async def _action_move_deal_stage(
    config: dict[str, Any],
    trigger_data: dict[str, Any],
    db: AsyncSession,
    workspace_id: UUID,
    member_id: UUID | None,
) -> dict[str, Any]:
    """Move a deal to a specific pipeline stage."""
    from uuid import UUID as _UUID
    from app.modules.crm.schemas import DealStageMoveRequest
    from app.modules.crm.service import CRMService

    deal_id_str = trigger_data.get("id") or config.get("deal_id")
    stage_id_str = config.get("stage_id")

    if not deal_id_str or not stage_id_str:
        return {"skipped": True, "reason": "deal_id or stage_id missing."}

    try:
        deal_id = _UUID(str(deal_id_str))
        stage_id = _UUID(str(stage_id_str))
    except ValueError:
        return {"skipped": True, "reason": "Invalid UUID format."}

    service = CRMService(db)
    move_req = DealStageMoveRequest(stage_id=stage_id)
    await service.move_deal_stage(workspace_id, deal_id, move_req)
    return {"deal_id": str(deal_id), "new_stage_id": str(stage_id)}


async def _action_assign_owner(
    config: dict[str, Any],
    trigger_data: dict[str, Any],
    db: AsyncSession,
    workspace_id: UUID,
    member_id: UUID | None,
) -> dict[str, Any]:
    """Assign a CRM entity to a specific workspace member."""
    from uuid import UUID as _UUID
    from sqlalchemy import update
    from app.modules.crm.models import Lead, Deal, Company, Contact

    entity_id_str = trigger_data.get("id")
    entity_type = trigger_data.get("_entity_type", "")
    assignee_id_str = config.get("assignee_member_id")

    if not entity_id_str or not assignee_id_str:
        return {"skipped": True, "reason": "entity_id or assignee_member_id missing."}

    try:
        entity_id = _UUID(str(entity_id_str))
        assignee_id = _UUID(str(assignee_id_str))
    except ValueError:
        return {"skipped": True, "reason": "Invalid UUID format."}

    model_map = {"lead": Lead, "deal": Deal, "company": Company, "contact": Contact}
    model = model_map.get(entity_type.lower())

    if model is None:
        return {"skipped": True, "reason": f"ASSIGN_OWNER not supported for entity_type: {entity_type}"}

    owner_col = getattr(model, "owner_member_id", None)
    if owner_col is None:
        return {"skipped": True, "reason": f"Model {entity_type} has no owner_member_id column."}

    stmt = update(model).where(model.id == entity_id).values(owner_member_id=assignee_id)
    await db.execute(stmt)
    return {"entity_id": str(entity_id), "assigned_to": str(assignee_id)}


async def _action_create_activity(
    config: dict[str, Any],
    trigger_data: dict[str, Any],
    db: AsyncSession,
    workspace_id: UUID,
    member_id: UUID | None,
) -> dict[str, Any]:
    """Write an activity/timeline entry."""
    from datetime import UTC, datetime
    from uuid import uuid4
    from app.modules.crm.models import Activity
    from app.modules.crm.repository import ActivityRepository

    entity_id_str = trigger_data.get("id")
    entity_type_str = trigger_data.get("_entity_type", config.get("entity_type", "Automation"))
    # Capitalize for consistency with existing CRM timeline entries
    entity_type_display = entity_type_str.capitalize() if entity_type_str else "Automation"

    title: str = config.get("title", "Automated workflow action executed.")
    entity_name = trigger_data.get("name") or trigger_data.get("title") or ""
    title = title.replace("{{entity_name}}", entity_name)

    repo = ActivityRepository(db)
    activity_type = await repo.get_or_create_activity_type(title, category="Automation")

    # Safely parse entity_id
    entity_id_parsed: UUID | None = _safe_uuid(entity_id_str)

    # Use a placeholder UUID if none available (automation context)
    from app.db.base import generate_uuid7
    effective_entity_id = entity_id_parsed or generate_uuid7()

    activity = Activity(
        id=uuid4(),
        workspace_id=workspace_id,
        activity_type_id=activity_type.id,
        actor_member_id=member_id,
        entity_type=entity_type_display,
        entity_id=effective_entity_id,
        title=title,
        description=config.get("description"),
        metadata_json={"source": "automation", "trigger": trigger_data.get("_trigger_event")},
        occurred_at=datetime.now(UTC),
    )
    logged = await repo.log_activity(activity)
    return {"activity_id": str(logged.id), "title": title}


async def _action_send_notification(
    config: dict[str, Any],
    trigger_data: dict[str, Any],
    workspace_id: UUID,
    member_id: UUID | None,
) -> dict[str, Any]:
    """Dispatch a notification via the JobDispatcher."""
    from app.modules.jobs.dispatcher import JobDispatcher

    message: str = config.get("message", "Automated workflow notification.")
    entity_name = trigger_data.get("name") or trigger_data.get("title") or ""
    message = message.replace("{{entity_name}}", entity_name)

    job_id = JobDispatcher.dispatch_email(
        to_email=config.get("to_email", ""),
        subject=config.get("subject", "ForgeCRM Automation Alert"),
        body=message,
        workspace_id=workspace_id,
    )
    return {"notification_job_id": job_id, "message": message}


async def _action_send_email(
    config: dict[str, Any],
    trigger_data: dict[str, Any],
    workspace_id: UUID,
    member_id: UUID | None,
) -> dict[str, Any]:
    """Send an email via the JobDispatcher."""
    from app.modules.jobs.dispatcher import JobDispatcher

    to_email = config.get("to_email", "")
    subject = config.get("subject", "ForgeCRM Notification")
    body_template: str = config.get("body", "")
    entity_name = trigger_data.get("name") or trigger_data.get("title") or ""
    body = body_template.replace("{{entity_name}}", entity_name)

    job_id = JobDispatcher.dispatch_email(
        to_email=to_email,
        subject=subject,
        body=body,
        workspace_id=workspace_id,
    )
    return {"email_job_id": job_id, "to_email": to_email}


async def _action_archive_record(
    config: dict[str, Any],
    trigger_data: dict[str, Any],
    db: AsyncSession,
    workspace_id: UUID,
    member_id: UUID | None,
) -> dict[str, Any]:
    """Soft-delete a CRM entity."""
    from uuid import UUID as _UUID
    from datetime import UTC, datetime

    entity_id_str = trigger_data.get("id")
    entity_type = trigger_data.get("_entity_type", config.get("entity_type", ""))

    if not entity_id_str:
        return {"skipped": True, "reason": "No entity ID in trigger data."}

    try:
        entity_id = _UUID(str(entity_id_str))
    except ValueError:
        return {"skipped": True, "reason": "Invalid entity ID format."}

    from app.modules.crm.models import Lead, Deal, Company, Contact, Task
    model_map = {"lead": Lead, "deal": Deal, "company": Company, "contact": Contact, "task": Task}
    model = model_map.get(entity_type.lower())

    if model is None:
        return {"skipped": True, "reason": f"ARCHIVE_RECORD not supported for entity_type: {entity_type}"}

    from sqlalchemy import update
    stmt = update(model).where(model.id == entity_id).values(deleted_at=datetime.now(UTC))
    await db.execute(stmt)
    return {"archived": str(entity_id), "entity_type": entity_type}


async def _action_webhook(
    config: dict[str, Any],
    trigger_data: dict[str, Any],
) -> dict[str, Any]:
    """Log a webhook call â€” actual HTTP call deferred to async worker in Phase 2."""
    url = config.get("url", "")
    logger.info("automation_webhook_queued", url=url, trigger_data_keys=list(trigger_data.keys()))
    return {"webhook_url": url, "status": "queued", "note": "Outbound HTTP execution is Phase 2."}


# â”€â”€ Main Run Executor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


async def run_automation(
    rule: AutomationRule,
    trigger_data: dict[str, Any],
    db: AsyncSession,
    workspace_id: UUID,
    member_id: UUID | None = None,
) -> AutomationRun:
    """
    Execute a single automation rule against trigger_data.

    Creates an AutomationRun, evaluates conditions, executes each action step,
    writes per-step AutomationLog records, and updates run status + rule stats.

    Returns the completed AutomationRun.
    """
    run_repo = AutomationRunRepository(db)
    log_repo = AutomationLogRepository(db)
    rule_repo = AutomationRuleRepository(db)

    start_ms = int(time.time() * 1000)

    # Create run record in 'running' state
    run = AutomationRun(
        id=generate_uuid7(),
        rule_id=rule.id,
        workspace_id=workspace_id,
        triggered_by_member_id=member_id,
        trigger_entity_type=trigger_data.get("_entity_type"),
        trigger_entity_id=_safe_uuid(trigger_data.get("id")),
        status="running",
        started_at=datetime.now(UTC),
    )
    await run_repo.create(run)

    # Evaluate conditions
    try:
        conditions_passed = evaluate_conditions(rule, trigger_data)
    except Exception as exc:
        logger.warning("automation_condition_eval_error", rule_id=str(rule.id), error=str(exc))
        conditions_passed = False

    if not conditions_passed:
        run.status = "skipped"
        run.finished_at = datetime.now(UTC)
        run.duration_ms = int(time.time() * 1000) - start_ms
        await run_repo.save(run)
        logger.info("automation_skipped_conditions_not_met", rule_id=str(rule.id))
        return run

    # Execute actions sequentially
    actions_executed = 0
    actions_failed = 0
    overall_success = True

    for action in sorted(rule.actions, key=lambda a: a.position):
        action_start_ms = int(time.time() * 1000)
        log = AutomationLog(
            id=generate_uuid7(),
            run_id=run.id,
            action_id=action.id,
            action_type=action.action_type,
            position=action.position,
        )

        try:
            result = await _execute_action(action, trigger_data, db, workspace_id, member_id)
            log.status = "success"
            log.message = f"Action '{action.action_type}' completed successfully."
            log.result_data = result
            actions_executed += 1
        except Exception as exc:
            logger.warning(
                "automation_action_failed",
                rule_id=str(rule.id),
                action_type=action.action_type,
                error=str(exc),
            )
            log.status = "failed"
            log.message = str(exc)
            log.result_data = {"error": str(exc)}
            actions_failed += 1
            overall_success = False

        log.duration_ms = int(time.time() * 1000) - action_start_ms
        await log_repo.create(log)

    # Finalize run
    finish_time = datetime.now(UTC)
    run.status = "success" if overall_success else "failed"
    run.finished_at = finish_time
    run.actions_executed = actions_executed
    run.actions_failed = actions_failed
    run.duration_ms = int(time.time() * 1000) - start_ms
    await run_repo.save(run)

    # Update rule statistics atomically
    await rule_repo.increment_run_stats(rule.id, overall_success, finish_time)

    logger.info(
        "automation_run_complete",
        rule_id=str(rule.id),
        run_id=str(run.id),
        status=run.status,
        actions_executed=actions_executed,
        actions_failed=actions_failed,
        duration_ms=run.duration_ms,
    )

    return run


def _safe_uuid(value: Any) -> UUID | None:
    """Safely convert a value to UUID or return None."""
    if value is None:
        return None
    try:
        return UUID(str(value))
    except (ValueError, AttributeError):
        return None


__all__ = ["evaluate_conditions", "run_automation"]
