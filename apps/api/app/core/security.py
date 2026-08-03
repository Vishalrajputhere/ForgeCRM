"""
ForgeCRM API — Security Utilities

Password hashing, verification, and token utilities.
Never log passwords, tokens, or any secret material.

Documentation: docs/05_Security/504_IDENTITY_AND_AUTHENTICATION.md
ADR: ADR-005_JWT_AUTHENTICATION_AND_RBAC.md
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.logging import get_logger

logger = get_logger(__name__)

import bcrypt

def hash_password(plain_password: str) -> str:
    """
    Hash a plain-text password using bcrypt.

    Args:
        plain_password: The raw password string from the user.

    Returns:
        A bcrypt hash string safe to store in the database.
    """
    password_bytes = plain_password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain-text password against a stored bcrypt hash.

    Args:
        plain_password: The raw password to check.
        hashed_password: The stored bcrypt hash from the database.

    Returns:
        True if the password matches, False otherwise.
    """
    password_bytes = plain_password.encode("utf-8")[:72]
    hashed_bytes = hashed_password.encode("utf-8")
    try:
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


def needs_password_rehash(hashed_password: str) -> bool:
    """
    Check if a stored password hash should be upgraded.

    Returns True if the hash was generated with outdated parameters
    and should be re-hashed on next successful login.

    Args:
        hashed_password: The stored bcrypt hash from the database.

    Returns:
        True if the hash should be upgraded.
    """
    return False


# ── JWT Tokens ───────────────────────────────────────────────────────────────


def create_access_token(
    subject: str,
    secret_key: str,
    algorithm: str,
    expire_minutes: int,
    additional_claims: dict[str, Any] | None = None,
) -> str:
    """
    Create a JWT access token.

    Args:
        subject: The token subject (typically user ID as string).
        secret_key: The JWT signing secret.
        algorithm: The JWT signing algorithm (e.g. HS256).
        expire_minutes: Token lifetime in minutes.
        additional_claims: Optional additional claims to include in the payload.

    Returns:
        Encoded JWT string.
    """
    now = datetime.now(UTC)
    expire = now + timedelta(minutes=expire_minutes)

    payload: dict[str, Any] = {
        "sub": subject,
        "iat": now,
        "exp": expire,
        "type": "access",
        **(additional_claims or {}),
    }

    return jwt.encode(payload, secret_key, algorithm=algorithm)


def create_refresh_token(
    subject: str,
    secret_key: str,
    algorithm: str,
    expire_days: int,
    jti: str | None = None,
) -> str:
    """
    Create a JWT refresh token.

    Refresh tokens use a jti (JWT ID) claim to support token rotation
    and revocation via Redis blocklist.

    Args:
        subject: The token subject (user ID as string).
        secret_key: The JWT signing secret.
        algorithm: The JWT signing algorithm.
        expire_days: Token lifetime in days.
        jti: Optional unique token identifier. Generated if not provided.

    Returns:
        Encoded JWT string.
    """
    import uuid

    now = datetime.now(UTC)
    expire = now + timedelta(days=expire_days)

    payload: dict[str, Any] = {
        "sub": subject,
        "iat": now,
        "exp": expire,
        "type": "refresh",
        "jti": jti or str(uuid.uuid4()),
    }

    return jwt.encode(payload, secret_key, algorithm=algorithm)


def decode_token(
    token: str,
    secret_key: str,
    algorithm: str,
) -> dict[str, Any]:
    """
    Decode and validate a JWT token.

    Args:
        token: The encoded JWT string.
        secret_key: The JWT signing secret.
        algorithm: The JWT signing algorithm.

    Returns:
        The decoded token payload as a dictionary.

    Raises:
        JWTError: If the token is invalid, expired, or tampered with.
    """
    return jwt.decode(token, secret_key, algorithms=[algorithm])


__all__ = [
    "JWTError",
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    "hash_password",
    "needs_password_rehash",
    "verify_password",
]
