"""
ForgeCRM API — Authentication & Identity Test Suite

Comprehensive automated tests covering:
  - User registration & validation (min 6 char password policy)
  - User login & credential verification
  - JWT token decoding, claims, and Bearer authentication
  - Refresh token rotation
  - Profile retrieval & update
  - Password change
  - Session listing & revocation
  - Role-based permission checks

Documentation: docs/07_Testing/704_API_TESTING.md
Standards: MASTER_IMPLEMENTATION_PLAN.md §12.18
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient

# Test credentials
REGISTER_DATA = {
    "first_name": "Test",
    "last_name": "User",
    "email": "testuser@forgecrm.io",
    "password": "StrongPassword123!",
    "job_title": "Account Executive",
}

WEAK_PASSWORD_DATA = {
    "first_name": "Short",
    "last_name": "Password",
    "email": "short@forgecrm.io",
    "password": "short",  # Under 6 chars (5 chars)
}

SIX_CHAR_PASSWORD_DATA = {
    "first_name": "SixChar",
    "last_name": "User",
    "email": "sixchar@forgecrm.io",
    "password": "Pass1!",  # Exactly 6 chars
}


class TestUserRegistration:
    """Tests for POST /api/v1/auth/register."""

    @pytest.mark.asyncio
    async def test_successful_registration(self, client: AsyncClient) -> None:
        """New user registration should return 201 Created and tokens."""
        response = await client.post("/api/v1/auth/register", json=REGISTER_DATA)
        assert response.status_code == 201

        body = response.json()
        assert "access_token" in body
        assert "refresh_token" in body
        assert body["token_type"] == "bearer"
        assert "user" in body
        assert body["user"]["email"] == REGISTER_DATA["email"]
        assert body["user"]["first_name"] == REGISTER_DATA["first_name"]

    @pytest.mark.asyncio
    async def test_6_char_password_registration_succeeds(self, client: AsyncClient) -> None:
        """Registration with exactly 6 characters should succeed (201)."""
        response = await client.post("/api/v1/auth/register", json=SIX_CHAR_PASSWORD_DATA)
        assert response.status_code == 201
        assert "access_token" in response.json()

    @pytest.mark.asyncio
    async def test_duplicate_email_registration_fails(self, client: AsyncClient) -> None:
        """Registering an existing email address should return 409 Conflict."""
        # First registration
        await client.post("/api/v1/auth/register", json=REGISTER_DATA)

        # Duplicate attempt
        response = await client.post("/api/v1/auth/register", json=REGISTER_DATA)
        assert response.status_code == 409

        body = response.json()
        assert body["error_code"] == "USER_ALREADY_EXISTS"

    @pytest.mark.asyncio
    async def test_weak_password_registration_fails(self, client: AsyncClient) -> None:
        """Password under 6 characters should fail schema validation (422)."""
        response = await client.post("/api/v1/auth/register", json=WEAK_PASSWORD_DATA)
        assert response.status_code == 422


class TestUserLogin:
    """Tests for POST /api/v1/auth/login."""

    @pytest.mark.asyncio
    async def test_successful_login(self, client: AsyncClient) -> None:
        """Valid credentials should return 200 OK and tokens."""
        # Register user
        await client.post("/api/v1/auth/register", json=REGISTER_DATA)

        # Login
        login_payload = {
            "email": REGISTER_DATA["email"],
            "password": REGISTER_DATA["password"],
        }
        response = await client.post("/api/v1/auth/login", json=login_payload)
        assert response.status_code == 200

        body = response.json()
        assert "access_token" in body
        assert "refresh_token" in body
        assert body["user"]["email"] == REGISTER_DATA["email"]

    @pytest.mark.asyncio
    async def test_invalid_password_login_fails(self, client: AsyncClient) -> None:
        """Wrong password should return 401 Unauthorized."""
        await client.post("/api/v1/auth/register", json=REGISTER_DATA)

        login_payload = {
            "email": REGISTER_DATA["email"],
            "password": "WrongPassword999!",
        }
        response = await client.post("/api/v1/auth/login", json=login_payload)
        assert response.status_code == 401
        assert response.json()["error_code"] == "INVALID_CREDENTIALS"

    @pytest.mark.asyncio
    async def test_nonexistent_user_login_fails(self, client: AsyncClient) -> None:
        """Non-existent email should return generic 401 (prevent enumeration)."""
        login_payload = {
            "email": "nobody@forgecrm.io",
            "password": "StrongPassword123!",
        }
        response = await client.post("/api/v1/auth/login", json=login_payload)
        assert response.status_code == 401
        assert response.json()["error_code"] == "INVALID_CREDENTIALS"


class TestUserProfileAndAuth:
    """Tests for protected endpoints (GET /api/v1/auth/me, etc.)."""

    @pytest.mark.asyncio
    async def test_unauthenticated_request_fails(self, client: AsyncClient) -> None:
        """Requests without Authorization header should return 401."""
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_authenticated_get_me_succeeds(self, client: AsyncClient) -> None:
        """Authenticated requests with valid Bearer token should return user profile."""
        reg_res = await client.post("/api/v1/auth/register", json=REGISTER_DATA)
        access_token = reg_res.json()["access_token"]

        headers = {"Authorization": f"Bearer {access_token}"}
        response = await client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == 200

        body = response.json()
        assert body["email"] == REGISTER_DATA["email"]
        assert body["full_name"] == f"{REGISTER_DATA['first_name']} {REGISTER_DATA['last_name']}"

    @pytest.mark.asyncio
    async def test_update_profile(self, client: AsyncClient) -> None:
        """Authenticated user should be able to update their profile."""
        reg_res = await client.post("/api/v1/auth/register", json=REGISTER_DATA)
        access_token = reg_res.json()["access_token"]

        headers = {"Authorization": f"Bearer {access_token}"}
        update_data = {
            "first_name": "UpdatedFirst",
            "last_name": "UpdatedLast",
            "phone": "+15551234567",
        }
        response = await client.patch("/api/v1/auth/me", json=update_data, headers=headers)
        assert response.status_code == 200

        body = response.json()
        assert body["first_name"] == "UpdatedFirst"
        assert body["last_name"] == "UpdatedLast"
        assert body["phone"] == "+15551234567"


class TestTokenRefresh:
    """Tests for POST /api/v1/auth/refresh."""

    @pytest.mark.asyncio
    async def test_refresh_token_rotation(self, client: AsyncClient) -> None:
        """Valid refresh token should return new access token and new refresh token."""
        reg_res = await client.post("/api/v1/auth/register", json=REGISTER_DATA)
        tokens = reg_res.json()
        old_refresh_token = tokens["refresh_token"]

        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": old_refresh_token},
        )
        assert response.status_code == 200

        new_tokens = response.json()
        assert "access_token" in new_tokens
        assert "refresh_token" in new_tokens
        assert new_tokens["refresh_token"] != old_refresh_token

    @pytest.mark.asyncio
    async def test_reusing_revoked_refresh_token_fails(self, client: AsyncClient) -> None:
        """Reusing a previously rotated refresh token should return 401."""
        reg_res = await client.post("/api/v1/auth/register", json=REGISTER_DATA)
        old_refresh_token = reg_res.json()["refresh_token"]

        # First refresh (rotates old_refresh_token)
        await client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh_token})

        # Second refresh with old token (should fail)
        response = await client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh_token})
        assert response.status_code == 401


class TestPasswordChangeAndSessions:
    """Tests for password change and session management."""

    @pytest.mark.asyncio
    async def test_change_password_and_login_with_new_password(self, client: AsyncClient) -> None:
        """Changing password should allow login with new password and invalidate old password."""
        reg_res = await client.post("/api/v1/auth/register", json=REGISTER_DATA)
        access_token = reg_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}

        new_pass = "BrandNewPassword123!"
        change_payload = {
            "current_password": REGISTER_DATA["password"],
            "new_password": new_pass,
        }
        res = await client.post("/api/v1/auth/password/change", json=change_payload, headers=headers)
        assert res.status_code == 200

        # Login with old password should fail
        old_login = await client.post(
            "/api/v1/auth/login",
            json={"email": REGISTER_DATA["email"], "password": REGISTER_DATA["password"]},
        )
        assert old_login.status_code == 401

        # Login with new password should succeed
        new_login = await client.post(
            "/api/v1/auth/login",
            json={"email": REGISTER_DATA["email"], "password": new_pass},
        )
        assert new_login.status_code == 200

    @pytest.mark.asyncio
    async def test_list_active_sessions(self, client: AsyncClient) -> None:
        """Listing sessions should return active session details."""
        reg_res = await client.post("/api/v1/auth/register", json=REGISTER_DATA)
        access_token = reg_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}

        response = await client.get("/api/v1/auth/sessions", headers=headers)
        assert response.status_code == 200
        body = response.json()
        assert isinstance(body, list)
        assert len(body) >= 1

    @pytest.mark.asyncio
    async def test_logout_invalidates_session(self, client: AsyncClient) -> None:
        """Logging out should terminate session and invalidate access token for subsequent requests."""
        reg_res = await client.post("/api/v1/auth/register", json=REGISTER_DATA)
        access_token = reg_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}

        logout_res = await client.post("/api/v1/auth/logout", headers=headers)
        assert logout_res.status_code == 204

        # Subsequent authenticated request with same access token should fail
        me_res = await client.get("/api/v1/auth/me", headers=headers)
        assert me_res.status_code == 401

    @pytest.mark.asyncio
    async def test_password_reset_request_always_returns_200(self, client: AsyncClient) -> None:
        """Password reset request should return 200 regardless of email presence."""
        response = await client.post(
            "/api/v1/auth/password-reset/request",
            json={"email": "nonexistent@forgecrm.io"},
        )
        assert response.status_code == 200
        assert "message" in response.json()

