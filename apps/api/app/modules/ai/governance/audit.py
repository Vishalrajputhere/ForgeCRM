"""
ForgeCRM — Security Audit Logger (Phase 7.5.3)

Logs prompt security violations, injection attempts, and PII redactions to AISecurityAuditLog.
"""

from __future__ import annotations

import uuid
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ai.models import AISecurityAuditLog


class AuditLogger:
    """Security audit logger writing security violations to database."""

    def __init__(self, db: AsyncSession | None = None) -> None:
        self.db = db

    async def log_security_event(
        self,
        workspace_id: uuid.UUID,
        event_type: str,
        sanitized_prompt: str,
        severity: str = "high",
        blocked: bool = True,
        user_id: uuid.UUID | None = None,
        details: dict[str, Any] | None = None,
    ) -> AISecurityAuditLog:
        """Logs a security audit event to the database."""
        log_entry = AISecurityAuditLog(
            workspace_id=workspace_id,
            user_id=user_id,
            event_type=event_type,
            severity=severity,
            blocked=blocked,
            sanitized_prompt=sanitized_prompt[:1000],
            details_json=details or {},
        )

        if self.db:
            self.db.add(log_entry)
            await self.db.commit()

        return log_entry
