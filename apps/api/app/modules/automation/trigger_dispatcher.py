"""
ForgeCRM API — Workflow Automation Trigger Dispatcher

Dispatches CRM domain events to the automation engine.
Called from CRMService after key state-changing operations.

Design goals:
  - Zero cost when no active rules match (single indexed query)
  - Never raises exceptions to caller (automation never breaks CRM flow)
  - All errors are logged and swallowed

Usage in CRMService:
    await dispatch_trigger(
        event_type="LEAD_CREATED",
        entity_type="lead",
        entity_data=lead_dict,
        db=db,
        workspace_id=workspace_id,
        member_id=member.id,
    )

Documentation: docs/03_Backend/310_AUTOMATION_ENGINE.md §4 (Trigger Dispatcher)
"""

from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.modules.automation.engine import run_automation
from app.modules.automation.repository import AutomationRuleRepository

logger = get_logger(__name__)


async def dispatch_trigger(
    event_type: str,
    entity_type: str,
    entity_data: dict[str, Any],
    db: AsyncSession,
    workspace_id: UUID,
    member_id: UUID | None = None,
) -> None:
    """
    Find all active automation rules matching event_type for this workspace
    and execute them against the provided entity data.

    Execution is fire-and-continue — exceptions are caught and logged
    so that the originating CRM operation is never interrupted.

    Args:
        event_type:    One of the TriggerEvent literals (e.g. 'LEAD_CREATED').
        entity_type:   CRM entity type string (e.g. 'lead', 'deal', 'company').
        entity_data:   Dictionary of the triggering entity's fields.
        db:            Active AsyncSession from the current HTTP request.
        workspace_id:  Current workspace UUID.
        member_id:     ID of the member who triggered the CRM operation.
    """
    try:
        rule_repo = AutomationRuleRepository(db)
        active_rules = await rule_repo.get_active_rules_for_event(workspace_id, event_type)

        if not active_rules:
            return  # Fast exit — no active rules for this event

        logger.info(
            "automation_trigger_dispatched",
            event_type=event_type,
            entity_type=entity_type,
            workspace_id=str(workspace_id),
            rule_count=len(active_rules),
        )

        # Inject metadata into trigger_data for engine use
        trigger_data = {
            **entity_data,
            "_trigger_event": event_type,
            "_entity_type": entity_type,
        }

        for rule in active_rules:
            try:
                await run_automation(
                    rule=rule,
                    trigger_data=trigger_data,
                    db=db,
                    workspace_id=workspace_id,
                    member_id=member_id,
                )
            except Exception as exc:
                logger.error(
                    "automation_rule_execution_error",
                    rule_id=str(rule.id),
                    event_type=event_type,
                    error=str(exc),
                )

    except Exception as exc:
        # The trigger dispatcher must NEVER propagate exceptions to the caller
        logger.error(
            "automation_dispatch_fatal_error",
            event_type=event_type,
            workspace_id=str(workspace_id),
            error=str(exc),
        )


__all__ = ["dispatch_trigger"]
