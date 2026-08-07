# 504 — Identity & Authentication

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** Identity & Authentication Architecture

---

# 1. Purpose

This document defines how ForgeCRM authenticates users, manages identities, and secures sessions.

Authentication establishes identity.

Authorization is documented separately.

---

# 2. Identity Model

Each person has one identity.

An identity may belong to multiple workspaces.

An identity may maintain multiple active sessions simultaneously.

Identity and sessions remain separate concerns.

---

# 3. Authentication Methods

Version 1

- Email + Password

Future

- Google OAuth
- Microsoft OAuth
- Enterprise SSO
- WebAuthn / Passkeys
- Multi-Factor Authentication (MFA)

All authentication methods produce the same authenticated identity model.

---

# 4. Password Policy

Minimum requirements

- Minimum length: 6 characters
- Encourage passphrases
- No maximum that discourages password managers (allow at least 128 characters)

Do not require arbitrary complexity rules if a strong length policy is enforced.

Encourage password manager usage.

---

# 5. Password Storage

Passwords are never stored.

Passwords are hashed using:

Preferred

- Argon2id

Acceptable fallback

- bcrypt

The hashing algorithm should be configurable for future upgrades.

---

# 6. Login Flow

```
User

↓

Credentials

↓

Validation

↓

Password Verification

↓

Session Created

↓

Access Token

↓

Refresh Token
```

Authentication completes only after successful credential verification.

---

# 7. JWT Strategy

Access Token

Purpose

- API authentication

Characteristics

- Short-lived
- Stateless
- Signed

Refresh Token

Purpose

- Obtain new access tokens

Characteristics

- Long-lived
- Rotated after use
- Stored server-side with metadata

---

# 8. Session Model

Each session includes:

- Session ID
- User ID
- Refresh Token Identifier
- Created At
- Last Activity
- Device Information
- User Agent
- IP Address (where appropriate)
- Revocation Status

Sessions are independently revocable.

---

# 9. Session Revocation

Users may:

- Revoke one session
- Revoke all sessions except current
- Revoke every session

Revoked refresh tokens cannot be reused.

---

# 10. Refresh Token Rotation

Each refresh request:

```
Validate Refresh Token

↓

Issue New Refresh Token

↓

Invalidate Previous Token

↓

Issue New Access Token
```

Token reuse should be detected and treated as suspicious.

---

# 11. Email Verification

New accounts require email verification before gaining full access.

Verification links:

- Single use
- Time limited
- Cryptographically random

---

# 12. Password Reset

Workflow

```
Request Reset

↓

Email Link

↓

Verify Token

↓

Choose New Password

↓

Invalidate Existing Sessions (configurable)

↓

Login
```

Reset tokens:

- Single use
- Expire automatically
- Cannot be guessed

---

# 13. Login Protection

Mitigations

- Rate limiting
- Exponential backoff
- Temporary lockout after repeated failures
- Audit logging

Avoid revealing whether an account exists.

---

# 14. Multi-Factor Authentication (Future)

The architecture supports:

- TOTP
- Authenticator apps
- Hardware keys
- Passkeys

MFA will be enforced after successful primary authentication.

---

# 15. OAuth

Future providers

- Google
- Microsoft

OAuth identities map to the same internal user model.

Authorization logic remains unchanged regardless of login method.

---

# 16. Enterprise SSO

Future compatibility

- OpenID Connect (OIDC)
- SAML 2.0

Enterprise authentication should integrate without changing business domains.

---

# 17. Account Recovery

Recovery processes must:

- Verify user identity
- Avoid knowledge-based questions
- Log all recovery actions

Manual recovery procedures should require administrative approval where applicable.

---

# 18. Security Events

Generate audit records for:

- Login
- Logout
- Failed login
- Password change
- Password reset
- Session revocation
- Email verification
- OAuth linking

Security events are immutable.

---

# 19. Error Handling

Authentication responses should not reveal:

- Whether the email exists
- Whether the password was correct
- Internal implementation details

Provide generic failure messages.

---

# 20. Monitoring

Track:

- Login success rate
- Failed logins
- Password reset requests
- Session count
- Refresh token reuse
- Account lockouts

Unusual activity should trigger alerts.

---

# 21. Testing

Verify:

- Password hashing
- Token expiration
- Refresh rotation
- Session revocation
- Email verification
- Password reset
- Rate limiting

Authentication should be comprehensively tested.

---

# 22. Future Enhancements

Version 2 may include:

- Adaptive authentication
- Risk-based login
- Device trust
- Passkeys
- MFA enforcement policies
- Identity federation

The architecture supports these features without redesign.

---

# 23. Summary

ForgeCRM separates identities from sessions to provide secure, flexible authentication.

By using modern password hashing, short-lived access tokens, rotating refresh tokens, independent session management, and future-ready support for OAuth, SSO, MFA, and passkeys, the platform establishes a robust identity foundation suitable for enterprise SaaS deployments.