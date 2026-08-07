"""
ForgeCRM API — Automation Schema Registry

Central, single source of truth for all trigger entity metadata, field paths,
allowed operators, value types, and UI display labels.

Guarantees 100% parity between Frontend, REST API validation, and Execution Engine.
Documentation: docs/03_Backend/310_AUTOMATION_ENGINE.md
"""

from __future__ import annotations

from typing import Any, Literal, TypedDict

ValueType = Literal["string", "number", "boolean", "date", "enum"]

OPERATORS_BY_TYPE: dict[ValueType, list[str]] = {
    "number": [
        "EQUALS", "NOT_EQUALS",
        "GREATER_THAN", "LESS_THAN",
        "GREATER_OR_EQUAL", "LESS_OR_EQUAL",
        "EMPTY", "NOT_EMPTY",
    ],
    "string": [
        "EQUALS", "NOT_EQUALS",
        "CONTAINS", "NOT_CONTAINS",
        "STARTS_WITH", "ENDS_WITH",
        "EMPTY", "NOT_EMPTY",
    ],
    "boolean": [
        "EQUALS", "NOT_EQUALS",
    ],
    "date": [
        "EQUALS", "NOT_EQUALS",
        "GREATER_THAN", "LESS_THAN",
        "GREATER_OR_EQUAL", "LESS_OR_EQUAL",
        "EMPTY", "NOT_EMPTY",
    ],
    "enum": [
        "EQUALS", "NOT_EQUALS",
        "EMPTY", "NOT_EMPTY",
    ],
}


class FieldMetadata(TypedDict, total=False):
    key: str
    label: str
    type: ValueType
    allowed_operators: list[str]
    options: list[dict[str, str]] | None
    description: str | None


class EntitySchema(TypedDict):
    entity_name: str
    label: str
    fields: list[FieldMetadata]


# ── Canonical Field Registries per Entity ──────────────────────────────────────

LEAD_FIELDS: list[FieldMetadata] = [
    {
        "key": "value",
        "label": "Estimated Value",
        "type": "number",
        "allowed_operators": OPERATORS_BY_TYPE["number"],
        "description": "Monetary value of the lead",
    },
    {
        "key": "estimated_value",
        "label": "Estimated Value (Alias)",
        "type": "number",
        "allowed_operators": OPERATORS_BY_TYPE["number"],
    },
    {
        "key": "priority",
        "label": "Priority",
        "type": "enum",
        "allowed_operators": OPERATORS_BY_TYPE["enum"],
        "options": [
            {"value": "low", "label": "Low"},
            {"value": "medium", "label": "Medium"},
            {"value": "high", "label": "High"},
            {"value": "urgent", "label": "Urgent"},
        ],
    },
    {
        "key": "first_name",
        "label": "First Name",
        "type": "string",
        "allowed_operators": OPERATORS_BY_TYPE["string"],
    },
    {
        "key": "last_name",
        "label": "Last Name",
        "type": "string",
        "allowed_operators": OPERATORS_BY_TYPE["string"],
    },
    {
        "key": "name",
        "label": "Full Name",
        "type": "string",
        "allowed_operators": OPERATORS_BY_TYPE["string"],
    },
    {
        "key": "email",
        "label": "Email Address",
        "type": "string",
        "allowed_operators": OPERATORS_BY_TYPE["string"],
    },
    {
        "key": "company_name",
        "label": "Company Name",
        "type": "string",
        "allowed_operators": OPERATORS_BY_TYPE["string"],
    },
    {
        "key": "status",
        "label": "Status",
        "type": "string",
        "allowed_operators": OPERATORS_BY_TYPE["string"],
    },
]

DEAL_FIELDS: list[FieldMetadata] = [
    {
        "key": "value",
        "label": "Deal Value",
        "type": "number",
        "allowed_operators": OPERATORS_BY_TYPE["number"],
    },
    {
        "key": "name",
        "label": "Deal Name",
        "type": "string",
        "allowed_operators": OPERATORS_BY_TYPE["string"],
    },
    {
        "key": "stage",
        "label": "Stage",
        "type": "string",
        "allowed_operators": OPERATORS_BY_TYPE["string"],
    },
    {
        "key": "old_stage",
        "label": "Previous Stage",
        "type": "string",
        "allowed_operators": OPERATORS_BY_TYPE["string"],
    },
    {
        "key": "priority",
        "label": "Priority",
        "type": "enum",
        "allowed_operators": OPERATORS_BY_TYPE["enum"],
        "options": [
            {"value": "low", "label": "Low"},
            {"value": "medium", "label": "Medium"},
            {"value": "high", "label": "High"},
        ],
    },
]

COMPANY_FIELDS: list[FieldMetadata] = [
    {
        "key": "name",
        "label": "Company Name",
        "type": "string",
        "allowed_operators": OPERATORS_BY_TYPE["string"],
    },
    {
        "key": "industry",
        "label": "Industry",
        "type": "string",
        "allowed_operators": OPERATORS_BY_TYPE["string"],
    },
    {
        "key": "website",
        "label": "Website URL",
        "type": "string",
        "allowed_operators": OPERATORS_BY_TYPE["string"],
    },
    {
        "key": "email",
        "label": "Company Email",
        "type": "string",
        "allowed_operators": OPERATORS_BY_TYPE["string"],
    },
    {
        "key": "phone",
        "label": "Phone Number",
        "type": "string",
        "allowed_operators": OPERATORS_BY_TYPE["string"],
    },
]

CONTACT_FIELDS: list[FieldMetadata] = [
    {
        "key": "first_name",
        "label": "First Name",
        "type": "string",
        "allowed_operators": OPERATORS_BY_TYPE["string"],
    },
    {
        "key": "last_name",
        "label": "Last Name",
        "type": "string",
        "allowed_operators": OPERATORS_BY_TYPE["string"],
    },
    {
        "key": "email",
        "label": "Email Address",
        "type": "string",
        "allowed_operators": OPERATORS_BY_TYPE["string"],
    },
    {
        "key": "company_name",
        "label": "Company Name",
        "type": "string",
        "allowed_operators": OPERATORS_BY_TYPE["string"],
    },
]

TASK_FIELDS: list[FieldMetadata] = [
    {
        "key": "title",
        "label": "Task Title",
        "type": "string",
        "allowed_operators": OPERATORS_BY_TYPE["string"],
    },
    {
        "key": "priority",
        "label": "Priority",
        "type": "enum",
        "allowed_operators": OPERATORS_BY_TYPE["enum"],
        "options": [
            {"value": "Low", "label": "Low"},
            {"value": "Medium", "label": "Medium"},
            {"value": "High", "label": "High"},
            {"value": "Urgent", "label": "Urgent"},
        ],
    },
    {
        "key": "entity_type",
        "label": "Related Entity Type",
        "type": "string",
        "allowed_operators": OPERATORS_BY_TYPE["string"],
    },
]

GENERIC_FIELDS: list[FieldMetadata] = [
    {
        "key": "name",
        "label": "Name",
        "type": "string",
        "allowed_operators": OPERATORS_BY_TYPE["string"],
    },
]

# ── Trigger Event to Entity Metadata Mapping ──────────────────────────────────

TRIGGER_ENTITY_MAP: dict[str, EntitySchema] = {
    "LEAD_CREATED": {"entity_name": "lead", "label": "Lead", "fields": LEAD_FIELDS},
    "LEAD_UPDATED": {"entity_name": "lead", "label": "Lead", "fields": LEAD_FIELDS},
    "LEAD_CONVERTED": {"entity_name": "lead", "label": "Lead", "fields": LEAD_FIELDS},
    "DEAL_CREATED": {"entity_name": "deal", "label": "Deal", "fields": DEAL_FIELDS},
    "DEAL_UPDATED": {"entity_name": "deal", "label": "Deal", "fields": DEAL_FIELDS},
    "DEAL_STAGE_CHANGED": {"entity_name": "deal", "label": "Deal", "fields": DEAL_FIELDS},
    "COMPANY_CREATED": {"entity_name": "company", "label": "Company", "fields": COMPANY_FIELDS},
    "COMPANY_UPDATED": {"entity_name": "company", "label": "Company", "fields": COMPANY_FIELDS},
    "CONTACT_CREATED": {"entity_name": "contact", "label": "Contact", "fields": CONTACT_FIELDS},
    "CONTACT_UPDATED": {"entity_name": "contact", "label": "Contact", "fields": CONTACT_FIELDS},
    "TASK_CREATED": {"entity_name": "task", "label": "Task", "fields": TASK_FIELDS},
    "TASK_COMPLETED": {"entity_name": "task", "label": "Task", "fields": TASK_FIELDS},
    "MANUAL": {"entity_name": "custom", "label": "Custom Data", "fields": GENERIC_FIELDS},
    "SCHEDULED": {"entity_name": "custom", "label": "Custom Data", "fields": GENERIC_FIELDS},
}

# Legacy UI label to canonical key fallback lookup map
LABEL_TO_CANONICAL_KEY_MAP: dict[str, str] = {
    "estimated value": "value",
    "estimated_value": "value",
    "deal value": "value",
    "company name": "company_name",
    "first name": "first_name",
    "last name": "last_name",
    "full name": "name",
    "email address": "email",
    "phone number": "phone",
}


class AutomationRegistry:
    """Central manager for automation trigger schemas and validation rules."""

    @classmethod
    def get_full_schema(cls) -> dict[str, Any]:
        """Return the complete metadata registry for all trigger events."""
        return {
            "trigger_events": TRIGGER_ENTITY_MAP,
            "operators_by_type": OPERATORS_BY_TYPE,
            "alias_mappings": LABEL_TO_CANONICAL_KEY_MAP,
        }

    @classmethod
    def get_fields_for_trigger(cls, trigger_event: str) -> list[FieldMetadata]:
        """Return allowed fields for a given trigger event."""
        entity_schema = TRIGGER_ENTITY_MAP.get(trigger_event)
        if not entity_schema:
            return GENERIC_FIELDS
        return entity_schema["fields"]

    @classmethod
    def find_field_metadata(cls, trigger_event: str, field_path: str) -> FieldMetadata | None:
        """Locate metadata for a specific field path in a trigger event."""
        fields = cls.get_fields_for_trigger(trigger_event)
        field_norm = field_path.strip().lower()
        
        # Exact key match
        for f in fields:
            if f["key"].lower() == field_norm:
                return f
        
        # Check alias
        canonical_key = LABEL_TO_CANONICAL_KEY_MAP.get(field_norm)
        if canonical_key:
            for f in fields:
                if f["key"] == canonical_key:
                    return f

        # Fallback to snake_case normalization
        snake_key = field_norm.replace(" ", "_").replace("-", "_")
        for f in fields:
            if f["key"].lower() == snake_key:
                return f

        return None
