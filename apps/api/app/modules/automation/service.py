"""
ForgeCRM API — Workflow Automation Business Service

Orchestrates CRUD for automation rules, template management,
rule enable/disable, execution history queries, and manual test triggers.

Documentation: docs/03_Backend/310_AUTOMATION_ENGINE.md §2 (Service Layer)
"""

from __future__ import annotations

from collections.abc import Sequence
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.db.base import generate_uuid7
from app.modules.automation.engine import evaluate_conditions, run_automation
from app.modules.automation.exceptions import (
    AutomationNotFoundError,
    AutomationRunNotFoundError,
    AutomationTemplateNotFoundError,
    AutomationValidationError,
)
from app.modules.automation.models import (
    AutomationAction,
    AutomationCondition,
    AutomationRule,
    AutomationRun,
    AutomationTemplate,
)
from app.modules.automation.repository import (
    AutomationLogRepository,
    AutomationRuleRepository,
    AutomationRunRepository,
    AutomationTemplateRepository,
)
from app.modules.automation.schemas import (
    AutomationRuleCreate,
    AutomationRuleResponse,
    AutomationRuleSummary,
    AutomationRunResponse,
    AutomationTemplateResponse,
    TestAutomationRequest,
    TestAutomationResponse,
    ToggleResponse,
    UseTemplateRequest,
)

logger = get_logger(__name__)


# ── Built-in Template Definitions ──────────────────────────────────────────────

BUILTIN_TEMPLATES: list[dict[str, Any]] = [
    {
        "name": "New Lead -> Create Follow-up Task",
        "description": "Automatically create a follow-up task when a new lead is added to the CRM.",
        "category": "Lead Management",
        "trigger_event": "LEAD_CREATED",
        "trigger_entity_type": "lead",
        "is_featured": True,
        "template_config": {
            "condition_logic": "AND",
            "conditions": [],
            "actions": [
                {
                    "position": 0,
                    "action_type": "CREATE_TASK",
                    "config": {
                        "title": "Follow up with {{entity_name}}",
                        "description": "New lead added. Schedule initial contact.",
                        "priority": "High",
                        "due_offset_hours": 24,
                    },
                }
            ],
        },
    },
    {
        "name": "High Value Deal -> Assign to Manager",
        "description": "Automatically assign deals above $50,000 to the designated manager.",
        "category": "Deal Management",
        "trigger_event": "DEAL_CREATED",
        "trigger_entity_type": "deal",
        "is_featured": True,
        "template_config": {
            "condition_logic": "AND",
            "conditions": [
                {
                    "group_index": 0,
                    "field_path": "value",
                    "operator": "GREATER_THAN",
                    "value": "50000",
                    "value_type": "number",
                }
            ],
            "actions": [
                {
                    "position": 0,
                    "action_type": "CREATE_ACTIVITY",
                    "config": {
                        "title": "High-value deal {{entity_name}} requires manager review.",
                        "entity_type": "deal",
                    },
                }
            ],
        },
    },
    {
        "name": "Lead Converted -> Log Timeline Activity",
        "description": "Log a timeline event whenever a lead is successfully converted.",
        "category": "Lead Management",
        "trigger_event": "LEAD_CONVERTED",
        "trigger_entity_type": "lead",
        "is_featured": False,
        "template_config": {
            "condition_logic": "AND",
            "conditions": [],
            "actions": [
                {
                    "position": 0,
                    "action_type": "CREATE_ACTIVITY",
                    "config": {
                        "title": "Lead {{entity_name}} was successfully converted.",
                        "entity_type": "lead",
                    },
                }
            ],
        },
    },
    {
        "name": "Deal Stage Changed -> Notify Team",
        "description": "Send a notification whenever a deal moves between pipeline stages.",
        "category": "Deal Management",
        "trigger_event": "DEAL_STAGE_CHANGED",
        "trigger_entity_type": "deal",
        "is_featured": False,
        "template_config": {
            "condition_logic": "AND",
            "conditions": [],
            "actions": [
                {
                    "position": 0,
                    "action_type": "CREATE_ACTIVITY",
                    "config": {
                        "title": "Deal {{entity_name}} moved to a new stage.",
                        "entity_type": "deal",
                    },
                }
            ],
        },
    },
    {
        "name": "Task Completed -> Create Follow-up",
        "description": "Automatically create a follow-up task when one is marked complete.",
        "category": "Task Automation",
        "trigger_event": "TASK_COMPLETED",
        "trigger_entity_type": "task",
        "is_featured": False,
        "template_config": {
            "condition_logic": "AND",
            "conditions": [],
            "actions": [
                {
                    "position": 0,
                    "action_type": "CREATE_FOLLOWUP_TASK",
                    "config": {
                        "title": "Follow-up: {{entity_name}}",
                        "description": "Automatically created follow-up.",
                        "priority": "Medium",
                        "due_offset_hours": 48,
                    },
                }
            ],
        },
    },
    {
        "name": "New Company -> Log Welcome Activity",
        "description": "Log a welcome activity when a new company is created in the CRM.",
        "category": "Company Management",
        "trigger_event": "COMPANY_CREATED",
        "trigger_entity_type": "company",
        "is_featured": False,
        "template_config": {
            "condition_logic": "AND",
            "conditions": [],
            "actions": [
                {
                    "position": 0,
                    "action_type": "CREATE_ACTIVITY",
                    "config": {
                        "title": "New company {{entity_name}} added to CRM.",
                        "entity_type": "company",
                    },
                }
            ],
        },
    },
]


from app.modules.automation.engine import evaluate_conditions, explain_condition_evaluations, run_automation
from app.modules.automation.registry import AutomationRegistry


def _validate_conditions_against_registry(trigger_event: str, conditions: list[Any]) -> None:
    """
    Validate condition field paths and operators against the AutomationRegistry.
    Raises AutomationValidationError (HTTP 422) if invalid.
    """
    for i, cond in enumerate(conditions):
        if isinstance(cond, dict):
            field_path = cond.get("field_path")
            operator = cond.get("operator")
        else:
            field_path = getattr(cond, "field_path", None)
            operator = getattr(cond, "operator", None)

        if not field_path:
            raise AutomationValidationError(f"Condition #{i + 1} is missing a field path.")

        field_meta = AutomationRegistry.find_field_metadata(trigger_event, field_path)
        if not field_meta:
            allowed_fields = [f["key"] for f in AutomationRegistry.get_fields_for_trigger(trigger_event)]
            raise AutomationValidationError(
                f"Invalid field path '{field_path}' for trigger event '{trigger_event}'. "
                f"Allowed field keys: {', '.join(allowed_fields)}"
            )

        if operator and operator not in field_meta["allowed_operators"]:
            raise AutomationValidationError(
                f"Operator '{operator}' is invalid for field '{field_path}' (type '{field_meta['type']}'). "
                f"Allowed operators: {', '.join(field_meta['allowed_operators'])}"
            )



class AutomationService:
    """Business logic for the Workflow Automation Engine."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self._rule_repo = AutomationRuleRepository(db)
        self._run_repo = AutomationRunRepository(db)
        self._log_repo = AutomationLogRepository(db)
        self._template_repo = AutomationTemplateRepository(db)

    async def get_schema(self) -> dict[str, Any]:
        """Return the single source of truth automation schema registry."""
        return AutomationRegistry.get_full_schema()

    # ── Rule CRUD ──────────────────────────────────────────────────────────────

    async def list_rules(
        self,
        workspace_id: UUID,
        page: int = 1,
        page_size: int = 50,
        search: str | None = None,
        is_active: bool | None = None,
    ) -> dict[str, Any]:
        offset = (page - 1) * page_size
        rules = await self._rule_repo.list_workspace_rules(
            workspace_id=workspace_id,
            limit=page_size,
            offset=offset,
            search=search,
            is_active=is_active,
        )
        total = await self._rule_repo.count_workspace_rules(
            workspace_id=workspace_id,
            search=search,
            is_active=is_active,
        )
        return {
            "items": [AutomationRuleSummary.model_validate(r) for r in rules],
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": max(1, -(-total // page_size)),
        }

    async def get_rule(self, workspace_id: UUID, rule_id: UUID) -> AutomationRuleResponse:
        rule = await self._rule_repo.get_by_id(workspace_id, rule_id)
        if not rule:
            raise AutomationNotFoundError(str(rule_id))
        return AutomationRuleResponse.model_validate(rule)

    async def create_rule(
        self,
        workspace_id: UUID,
        member_id: UUID,
        payload: AutomationRuleCreate,
    ) -> AutomationRuleResponse:
        if not payload.actions:
            raise AutomationValidationError("An automation rule must have at least one action.")

        # Phase 6: Strict Backend Validation
        _validate_conditions_against_registry(payload.trigger_event, payload.conditions)


        rule = AutomationRule(
            id=generate_uuid7(),
            workspace_id=workspace_id,
            created_by=member_id,
            updated_by=member_id,
            name=payload.name,
            description=payload.description,
            is_active=payload.is_active,
            trigger_event=payload.trigger_event,
            trigger_entity_type=payload.trigger_entity_type,
            condition_logic=payload.condition_logic,
        )
        await self._rule_repo.create(rule)

        # Create conditions
        for cond_data in payload.conditions:
            condition = AutomationCondition(
                id=generate_uuid7(),
                rule_id=rule.id,
                group_index=cond_data.group_index,
                field_path=cond_data.field_path,
                operator=cond_data.operator,
                value=cond_data.value,
                value_type=cond_data.value_type,
            )
            await self._rule_repo.add_condition(condition)

        # Create actions
        for i, action_data in enumerate(payload.actions):
            action = AutomationAction(
                id=generate_uuid7(),
                rule_id=rule.id,
                position=action_data.position if action_data.position is not None else i,
                action_type=action_data.action_type,
                config=action_data.config,
            )
            await self._rule_repo.add_action(action)

        await self.db.commit()
        await self.db.refresh(rule)

        logger.info("automation_rule_created", rule_id=str(rule.id), workspace_id=str(workspace_id))
        return await self.get_rule(workspace_id, rule.id)

    async def update_rule(
        self,
        workspace_id: UUID,
        rule_id: UUID,
        member_id: UUID,
        payload: dict[str, Any],
    ) -> AutomationRuleResponse:
        rule = await self._rule_repo.get_by_id(workspace_id, rule_id)
        if not rule:
            raise AutomationNotFoundError(str(rule_id))

        # Apply scalar field updates
        scalar_fields = ["name", "description", "is_active", "trigger_event", "trigger_entity_type", "condition_logic"]
        for field in scalar_fields:
            if field in payload and payload[field] is not None:
                setattr(rule, field, payload[field])

        rule.updated_by = member_id
        rule.updated_at = datetime.now(UTC)

        # Replace conditions if provided
        if "conditions" in payload and payload["conditions"] is not None:
            trigger_evt = payload.get("trigger_event") or rule.trigger_event
            _validate_conditions_against_registry(trigger_evt, payload["conditions"])

            await self._rule_repo.delete_conditions_for_rule(rule_id)
            for cond_data in payload["conditions"]:
                condition = AutomationCondition(
                    id=generate_uuid7(),
                    rule_id=rule.id,
                    group_index=cond_data.get("group_index", 0),
                    field_path=cond_data["field_path"],
                    operator=cond_data["operator"],
                    value=cond_data.get("value"),
                    value_type=cond_data.get("value_type", "string"),
                )
                await self._rule_repo.add_condition(condition)

        # Replace actions if provided
        if "actions" in payload and payload["actions"] is not None:
            if not payload["actions"]:
                raise AutomationValidationError("An automation rule must have at least one action.")
            await self._rule_repo.delete_actions_for_rule(rule_id)
            for i, action_data in enumerate(payload["actions"]):
                action = AutomationAction(
                    id=generate_uuid7(),
                    rule_id=rule.id,
                    position=action_data.get("position", i),
                    action_type=action_data["action_type"],
                    config=action_data.get("config", {}),
                )
                await self._rule_repo.add_action(action)

        await self._rule_repo.save(rule)
        await self.db.commit()

        return await self.get_rule(workspace_id, rule.id)

    async def delete_rule(self, workspace_id: UUID, rule_id: UUID) -> None:
        rule = await self._rule_repo.get_by_id(workspace_id, rule_id)
        if not rule:
            raise AutomationNotFoundError(str(rule_id))
        rule.deleted_at = datetime.now(UTC)
        await self._rule_repo.save(rule)
        await self.db.commit()
        logger.info("automation_rule_deleted", rule_id=str(rule_id))

    async def toggle_rule(
        self, workspace_id: UUID, rule_id: UUID, member_id: UUID
    ) -> ToggleResponse:
        rule = await self._rule_repo.get_by_id(workspace_id, rule_id)
        if not rule:
            raise AutomationNotFoundError(str(rule_id))

        rule.is_active = not rule.is_active
        rule.updated_by = member_id
        rule.updated_at = datetime.now(UTC)
        await self._rule_repo.save(rule)
        await self.db.commit()

        state = "enabled" if rule.is_active else "disabled"
        logger.info("automation_rule_toggled", rule_id=str(rule_id), is_active=rule.is_active)
        return ToggleResponse(id=rule.id, is_active=rule.is_active, message=f"Automation rule {state}.")

    # ── Execution History ──────────────────────────────────────────────────────

    async def get_run_history(
        self,
        workspace_id: UUID,
        rule_id: UUID,
        page: int = 1,
        page_size: int = 20,
    ) -> list[AutomationRunResponse]:
        rule = await self._rule_repo.get_by_id(workspace_id, rule_id)
        if not rule:
            raise AutomationNotFoundError(str(rule_id))

        offset = (page - 1) * page_size
        runs = await self._run_repo.list_by_rule(rule_id, limit=page_size, offset=offset)
        return [AutomationRunResponse.model_validate(r) for r in runs]

    async def get_run_with_logs(
        self, workspace_id: UUID, rule_id: UUID, run_id: UUID
    ) -> AutomationRunResponse:
        run = await self._run_repo.get_by_id(run_id)
        if not run or run.rule_id != rule_id:
            raise AutomationRunNotFoundError(str(run_id))
        return AutomationRunResponse.model_validate(run)

    # ── Manual Test Trigger ────────────────────────────────────────────────────

    async def test_rule(
        self,
        workspace_id: UUID,
        rule_id: UUID,
        member_id: UUID,
        payload: TestAutomationRequest,
    ) -> TestAutomationResponse:
        """
        Manually trigger a rule with simulated trigger_data.
        Creates a real AutomationRun record (run is marked with source=manual).
        Synthesizes default sample entity data and condition values if omitted.
        """
        rule = await self._rule_repo.get_by_id(workspace_id, rule_id)
        if not rule:
            raise AutomationNotFoundError(str(rule_id))

        # Default sample data tailored for the trigger entity type
        sample_data: dict[str, Any] = {
            "id": str(generate_uuid7()),
            "name": f"Test {rule.trigger_entity_type or 'Entity'}",
            "title": f"Test {rule.trigger_entity_type or 'Entity'}",
            "priority": "High",
            "status": "Open",
            "value": 150000.0,
            "estimated_value": 150000.0,
            "email": "test.user@example.com",
            "company_name": "Test Enterprise Corp",
        }

        # Synthesize matching values for condition fields not explicitly provided in request
        for cond in rule.conditions:
            path = cond.field_path
            if path and path not in payload.trigger_data and path not in sample_data:
                if cond.operator in ("GREATER_THAN", "GREATER_OR_EQUAL"):
                    try:
                        sample_data[path] = float(cond.value or 0) + 100.0
                    except (ValueError, TypeError):
                        sample_data[path] = 100.0
                elif cond.operator in ("LESS_THAN", "LESS_OR_EQUAL"):
                    try:
                        sample_data[path] = float(cond.value or 0) - 1.0
                    except (ValueError, TypeError):
                        sample_data[path] = 0.0
                elif cond.operator in ("EQUALS", "CONTAINS", "STARTS_WITH", "ENDS_WITH"):
                    sample_data[path] = cond.value or "Test Value"
                elif cond.operator == "NOT_EMPTY":
                    sample_data[path] = "Test Value"

        trigger_data = {
            **sample_data,
            **payload.trigger_data,
            "_trigger_event": rule.trigger_event,
            "_entity_type": rule.trigger_entity_type or "manual",
            "_is_test": True,
        }

        run = await run_automation(
            rule=rule,
            trigger_data=trigger_data,
            db=self.db,
            workspace_id=workspace_id,
            member_id=member_id,
        )
        await self.db.commit()

        conditions_passed = evaluate_conditions(rule, trigger_data)
        eval_details = explain_condition_evaluations(rule, trigger_data)
        logs = await self._log_repo.list_by_run(run.id)

        from app.modules.automation.schemas import AutomationLogResponse, ConditionEvaluationDetail
        return TestAutomationResponse(
            rule_id=rule.id,
            run_id=run.id,
            status=run.status,
            conditions_passed=conditions_passed,
            actions_executed=run.actions_executed,
            actions_failed=run.actions_failed,
            duration_ms=run.duration_ms,
            logs=[AutomationLogResponse.model_validate(log) for log in logs],
            evaluation_details=[ConditionEvaluationDetail.model_validate(d) for d in eval_details],
        )


    # ── Templates ──────────────────────────────────────────────────────────────

    async def ensure_templates_seeded(self) -> None:
        """Idempotently seed built-in automation templates. Called on app startup."""
        count = await self._template_repo.count_all()
        if count >= len(BUILTIN_TEMPLATES):
            return

        for tmpl_data in BUILTIN_TEMPLATES:
            template = AutomationTemplate(
                id=generate_uuid7(),
                name=tmpl_data["name"],
                description=tmpl_data["description"],
                category=tmpl_data["category"],
                trigger_event=tmpl_data["trigger_event"],
                trigger_entity_type=tmpl_data.get("trigger_entity_type"),
                template_config=tmpl_data["template_config"],
                is_featured=tmpl_data.get("is_featured", False),
            )
            await self._template_repo.create(template)

        await self.db.commit()
        logger.info("automation_templates_seeded", count=len(BUILTIN_TEMPLATES))

    async def list_templates(
        self, category: str | None = None
    ) -> list[AutomationTemplateResponse]:
        templates = await self._template_repo.list_all(category=category)
        return [AutomationTemplateResponse.model_validate(t) for t in templates]

    async def create_rule_from_template(
        self,
        workspace_id: UUID,
        template_id: UUID,
        member_id: UUID,
        payload: UseTemplateRequest,
    ) -> AutomationRuleResponse:
        template = await self._template_repo.get_by_id(template_id)
        if not template:
            raise AutomationTemplateNotFoundError(str(template_id))

        config = template.template_config
        from app.modules.automation.schemas import (
            AutomationActionCreate,
            AutomationConditionCreate,
            AutomationRuleCreate,
        )

        conditions = [
            AutomationConditionCreate(**c)
            for c in config.get("conditions", [])
        ]
        actions = [
            AutomationActionCreate(**a)
            for a in config.get("actions", [])
        ]

        rule_payload = AutomationRuleCreate(
            name=payload.name or template.name,
            description=template.description,
            trigger_event=template.trigger_event,  # type: ignore[arg-type]
            trigger_entity_type=template.trigger_entity_type,
            condition_logic=config.get("condition_logic", "AND"),  # type: ignore[arg-type]
            conditions=conditions,
            actions=actions,
        )

        await self._template_repo.increment_use_count(template_id)
        return await self.create_rule(workspace_id, member_id, rule_payload)


__all__ = ["AutomationService"]
