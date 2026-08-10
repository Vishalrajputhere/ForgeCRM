"""
ForgeCRM — Prompt Firewall (Phase 7.5.3)

Detects prompt injections, jailbreak attempts, system instruction overrides, and malicious input.
"""

from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass
class FirewallInspectionResult:
    is_allowed: bool
    is_injection: bool
    is_jailbreak: bool
    risk_score: float  # 0.0 to 1.0
    detected_patterns: list[str]
    sanitized_text: str


class PromptFirewall:
    """Prompt Firewall inspecting user inputs for injection attacks and jailbreaks."""

    _INJECTION_PATTERNS: list[tuple[str, str]] = [
        ("ignore_previous", r"(?i)ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)"),
        ("disregard_system", r"(?i)disregard\s+(the\s+)?(system|admin|safety)\s+(prompt|rules|instructions)"),
        ("override_role", r"(?i)you\s+are\s+now\s+(a\s+)?(DAN|jailbroken|unrestricted|god\s+mode)"),
        ("system_prompt_leak", r"(?i)print\s+(your\s+)?(system\s+prompt|initial\s+instructions|secret\s+key)"),
        ("delimiter_attack", r"```\s*system|\[SYSTEM_NOTE\]|<|SYSTEM_PROMPT|>"),
    ]

    @classmethod
    def inspect(cls, text: str) -> FirewallInspectionResult:
        """Inspects prompt text for safety violations."""
        detected: list[str] = []
        is_injection = False
        is_jailbreak = False

        for tag, pattern in cls._INJECTION_PATTERNS:
            if re.search(pattern, text):
                detected.append(tag)
                if tag in ("ignore_previous", "disregard_system", "delimiter_attack"):
                    is_injection = True
                if tag in ("override_role", "system_prompt_leak"):
                    is_jailbreak = True

        risk_score = min(1.0, len(detected) * 0.35)
        is_allowed = risk_score < 0.50

        # Basic sanitization
        sanitized = text
        if is_injection or is_jailbreak:
            for _, pattern in cls._INJECTION_PATTERNS:
                sanitized = re.sub(pattern, "[BLOCKED_INJECTION]", sanitized)

        return FirewallInspectionResult(
            is_allowed=is_allowed,
            is_injection=is_injection,
            is_jailbreak=is_jailbreak,
            risk_score=round(risk_score, 2),
            detected_patterns=detected,
            sanitized_text=sanitized,
        )
