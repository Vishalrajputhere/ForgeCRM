"""
ForgeCRM — PII Redaction & Data Loss Prevention Engine (Phase 7.5.3)

Detects and redacts PII (emails, phone numbers, SSNs, credit cards) and secrets (API keys, JWTs).
"""

from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass
class RedactionResult:
    original_text: str
    redacted_text: str
    pii_count: int
    detected_types: list[str]


class PIIRedactionEngine:
    """PII Detection and Redaction Engine."""

    _PII_PATTERNS: dict[str, str] = {
        "EMAIL": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
        "PHONE": r"\b(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}\b",
        "SSN": r"\b\d{3}-\d{2}-\d{4}\b",
        "CREDIT_CARD": r"\b(?:\d[ -]*?){13,16}\b",
    }

    @classmethod
    def redact(cls, text: str) -> RedactionResult:
        """Redacts PII patterns from input text."""
        redacted = text
        detected: list[str] = []
        count = 0

        for pii_type, pattern in cls._PII_PATTERNS.items():
            matches = re.findall(pattern, redacted)
            if matches:
                detected.append(pii_type)
                count += len(matches)
                redacted = re.sub(pattern, f"[{pii_type}_REDACTED]", redacted)

        return RedactionResult(
            original_text=text,
            redacted_text=redacted,
            pii_count=count,
            detected_types=detected,
        )


class DataLossPrevention:
    """Detects enterprise secrets, API keys, and sensitive financial credentials."""

    _SECRET_PATTERNS: dict[str, str] = {
        "API_KEY": r"(?i)(api[_-]?key|secret|token)\s*[:=]\s*['\"]?[A-Za-z0-9_\-]{16,}['\"]?",
        "JWT": r"\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\b",
        "AWS_KEY": r"\bAKIA[0-9A-Z]{16}\b",
    }

    @classmethod
    def scan_secrets(cls, text: str) -> tuple[bool, list[str]]:
        """Scans for API keys or secrets. Returns (has_secrets, list_of_secret_types)."""
        found: list[str] = []
        for secret_type, pattern in cls._SECRET_PATTERNS.items():
            if re.search(pattern, text):
                found.append(secret_type)
        return len(found) > 0, found
