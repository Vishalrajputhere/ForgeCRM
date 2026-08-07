"""
ForgeCRM API — Identity Domain Validators

Validation rules for user input in the identity domain.
Password policy: Minimum 6 characters, max 128 characters (no unnecessary complexity rules).

Documentation: docs/05_Security/504_IDENTITY_AND_AUTHENTICATION.md §4
"""

from __future__ import annotations

import re
from typing import Annotated

from pydantic import AfterValidator

# Password policy parameters per docs/05_Security/504_IDENTITY_AND_AUTHENTICATION.md
MIN_PASSWORD_LENGTH = 6
MAX_PASSWORD_LENGTH = 128

# Basic email regex for strict formatting
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


def validate_password_strength(password: str) -> str:
    """
    Validate password strength according to security policy.

    Rule: Minimum 6 characters, max 128.
    Encourages passphrases and password managers.
    """
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValueError(f"Password must be at least {MIN_PASSWORD_LENGTH} characters long.")
    if len(password) > MAX_PASSWORD_LENGTH:
        raise ValueError(f"Password must not exceed {MAX_PASSWORD_LENGTH} characters.")
    return password


def validate_email_format(email: str) -> str:
    """Validate email formatting and normalize to lowercase."""
    email_clean = email.strip().lower()
    if not EMAIL_REGEX.match(email_clean):
        raise ValueError("Invalid email address format.")
    return email_clean


PasswordStr = Annotated[str, AfterValidator(validate_password_strength)]
EmailStrClean = Annotated[str, AfterValidator(validate_email_format)]
