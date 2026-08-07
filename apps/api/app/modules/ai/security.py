"""
ForgeCRM API — AI Security & PII Sanitizer Engine

Defines prompt injection defense, PII field masking, and sensitive data protection.

Documentation: docs/05_Security/504_IDENTITY_AND_AUTHENTICATION.md
"""

from __future__ import annotations

import re
from typing import Any

# Known prompt injection attack vectors
INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(all\s+)?(previous|above)\s+instructions", re.IGNORECASE),
    re.compile(r"reveal\s+(system\s+)?prompt", re.IGNORECASE),
    re.compile(r"you\s+are\s+now\s+a\s+(dan|jailbroken)", re.IGNORECASE),
    re.compile(r"disregard\s+safety\s+filters", re.IGNORECASE),
]

# Sensitive keys to automatically mask in CRM entity dicts
SENSITIVE_KEYS = {
    "password_hash",
    "password",
    "credit_card",
    "ssn",
    "social_security",
    "api_key",
    "secret",
    "access_token",
    "refresh_token",
}


class AISecuritySanitizer:
    """Security & PII Sanitizer."""

    @staticmethod
    def sanitize_prompt(user_prompt: str) -> str:
        """Sanitizes user prompt string and rejects injection attempts."""
        cleaned = user_prompt.strip()
        for pattern in INJECTION_PATTERNS:
            if pattern.search(cleaned):
                raise ValueError("Security Violation: Malicious prompt injection attempt detected.")
        return cleaned

    @staticmethod
    def mask_sensitive_entity_dict(data: dict[str, Any]) -> dict[str, Any]:
        """Recursively masks sensitive values in entity dictionary."""
        masked = {}
        for key, val in data.items():
            if key.lower() in SENSITIVE_KEYS:
                masked[key] = "[REDACTED_SENSITIVE]"
            elif isinstance(val, dict):
                masked[key] = AISecuritySanitizer.mask_sensitive_entity_dict(val)
            elif isinstance(val, list):
                masked[key] = [
                    AISecuritySanitizer.mask_sensitive_entity_dict(v) if isinstance(v, dict) else v
                    for v in val
                ]
            else:
                masked[key] = val
        return masked
