"""Harden Automation Schema and Clean Legacy Field Paths

Revision ID: 007_harden_automation_schema
Revises: 006_workflow_automation_schema
Create Date: 2026-08-05 12:00:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence
from alembic import op

revision: str = "007_harden_automation_schema"
down_revision: str | None = "006_workflow_automation_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Phase 7: Automatically scan and repair legacy display labels in automation_conditions table
    op.execute(
        """
        UPDATE automation_conditions
        SET field_path = 'value', value_type = 'number'
        WHERE LOWER(field_path) IN ('estimated value', 'estimated_value', 'deal value');
        """
    )
    op.execute(
        """
        UPDATE automation_conditions
        SET field_path = 'company_name', value_type = 'string'
        WHERE LOWER(field_path) IN ('company name', 'company_name');
        """
    )
    op.execute(
        """
        UPDATE automation_conditions
        SET field_path = 'first_name', value_type = 'string'
        WHERE LOWER(field_path) IN ('first name', 'first_name');
        """
    )
    op.execute(
        """
        UPDATE automation_conditions
        SET field_path = 'last_name', value_type = 'string'
        WHERE LOWER(field_path) IN ('last name', 'last_name');
        """
    )
    op.execute(
        """
        UPDATE automation_conditions
        SET field_path = 'priority', value_type = 'enum'
        WHERE LOWER(field_path) = 'priority';
        """
    )


def downgrade() -> None:
    pass
