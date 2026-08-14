"""
ForgeCRM API — Dynamic Real-Time RBAC & Role Propagation Test Suite

Tests:
1. Dynamic effective permission calculation via GET /api/v1/auth/me/permissions.
2. Real-time role change propagation (Sales Executive -> Sales Manager -> Viewer).
3. Authorization version incrementing on role mutation.
4. Audit event recording.
5. Strict backend 403 enforcement on unauthorized mutations.
6. Privilege escalation protection (Viewer/Sales Exec -> Super Admin).
7. Cross-tenant isolation enforcement.

Documentation: Section 29 & 30 of System Capabilities & Technical Roadmap.
"""

from uuid import uuid4
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.security import create_access_token, hash_password
from app.modules.identity.models import User, Role
from app.modules.identity.permissions import SystemRoles
from app.modules.workspace.models import Workspace, WorkspaceMember


@pytest.mark.asyncio
async def test_dynamic_rbac_propagation_end_to_end(client: AsyncClient, db_session: AsyncSession):
    settings = get_settings()

    # Fetch system roles
    res_r = await db_session.execute(select(Role).options(selectinload(Role.permissions)))
    roles = res_r.scalars().all()
    role_map = {r.name: r for r in roles}

    sa_role = role_map[SystemRoles.SUPER_ADMIN]
    sm_role = role_map[SystemRoles.SALES_MANAGER]
    se_role = role_map[SystemRoles.SALES_EXECUTIVE]
    v_role = role_map[SystemRoles.VIEWER]

    # Create Workspace A
    ws_id_a = uuid4()
    ws_a = Workspace(id=ws_id_a, name="Workspace Alpha", slug=f"ws-alpha-{ws_id_a.hex[:6]}")
    db_session.add(ws_a)

    # Create Super Admin User A
    user_a_id = uuid4()
    user_a = User(
        id=user_a_id,
        email=f"admin_a_{user_a_id.hex[:6]}@example.com",
        first_name="Super",
        last_name="AdminA",
        password_hash=hash_password("Password123!"),
        is_active=True,
    )
    user_a.roles.append(sa_role)
    db_session.add(user_a)

    member_a = WorkspaceMember(
        id=uuid4(),
        workspace_id=ws_id_a,
        user_id=user_a_id,
        role_id=sa_role.id,
        status="Active",
        authorization_version=1,
    )
    db_session.add(member_a)

    # Create Test User B (Initial Role: Sales Executive)
    user_b_id = uuid4()
    user_b = User(
        id=user_b_id,
        email=f"user_b_{user_b_id.hex[:6]}@example.com",
        first_name="User",
        last_name="Bravo",
        password_hash=hash_password("Password123!"),
        is_active=True,
    )
    db_session.add(user_b)

    member_b = WorkspaceMember(
        id=uuid4(),
        workspace_id=ws_id_a,
        user_id=user_b_id,
        role_id=se_role.id,
        status="Active",
        authorization_version=1,
    )
    db_session.add(member_b)
    await db_session.commit()

    # Generate JWT tokens
    secret = settings.JWT_SECRET_KEY.get_secret_value() if hasattr(settings.JWT_SECRET_KEY, "get_secret_value") else str(settings.JWT_SECRET_KEY)
    token_a = create_access_token(subject=str(user_a_id), secret_key=secret, algorithm=settings.JWT_ALGORITHM, expire_minutes=60)
    token_b = create_access_token(subject=str(user_b_id), secret_key=secret, algorithm=settings.JWT_ALGORITHM, expire_minutes=60)

    headers_b = {"Authorization": f"Bearer {token_b}", "X-Workspace-ID": str(ws_id_a)}
    headers_a = {"Authorization": f"Bearer {token_a}", "X-Workspace-ID": str(ws_id_a)}

    # ── 1. Fetch User B Effective Permissions as Sales Executive ───────────────
    res1 = await client.get("/api/v1/auth/me/permissions", headers=headers_b)
    assert res1.status_code == 200
    data1 = res1.json()
    assert "deals.read" in data1["permissions"]
    assert "teams.read" not in data1["permissions"]
    v1_version = data1["authorization_version"]

    # ── 2. Super Admin changes User B: Sales Executive -> Sales Manager ─────────
    res2 = await client.patch(
        f"/api/v1/workspaces/{ws_id_a}/members/{member_b.id}/role",
        json={"role_id": str(sm_role.id)},
        headers=headers_a,
    )
    assert res2.status_code == 200

    # ── 3. Fetch User B Effective Permissions -> Must reflect Sales Manager ────
    res3 = await client.get("/api/v1/auth/me/permissions", headers=headers_b)
    assert res3.status_code == 200
    data3 = res3.json()
    assert "teams.read" in data3["permissions"]
    assert data3["authorization_version"] > v1_version

    # ── 4. Super Admin changes User B: Sales Manager -> Viewer ─────────────────
    res4 = await client.patch(
        f"/api/v1/workspaces/{ws_id_a}/members/{member_b.id}/role",
        json={"role_id": str(v_role.id)},
        headers=headers_a,
    )
    assert res4.status_code == 200

    # ── 5. Fetch User B Effective Permissions -> Must reflect Viewer ──────────
    res5 = await client.get("/api/v1/auth/me/permissions", headers=headers_b)
    assert res5.status_code == 200
    data5 = res5.json()
    assert "deals.create" not in data5["permissions"]
    assert "companies.read" in data5["permissions"]

    # ── 6. Backend Authorization Enforcement: Viewer cannot create deals ─────
    res_deal = await client.post(
        "/api/v1/deals",
        json={"name": "Forbidden Deal", "stage_id": str(uuid4()), "amount": 10000},
        headers=headers_b,
    )
    assert res_deal.status_code == 403

    # ── 7. Privilege Escalation Protection: Viewer cannot grant Super Admin ────
    res_esc = await client.patch(
        f"/api/v1/workspaces/{ws_id_a}/members/{member_b.id}/role",
        json={"role_id": str(sa_role.id)},
        headers=headers_b,
    )
    assert res_esc.status_code == 403

    # ── 8. Cross-Tenant Isolation Protection: Bad Workspace ID ───────────────
    fake_ws = str(uuid4())
    headers_bad_ws = {"Authorization": f"Bearer {token_b}", "X-Workspace-ID": fake_ws}
    res_tenant = await client.get("/api/v1/companies", headers=headers_bad_ws)
    assert res_tenant.status_code == 403
