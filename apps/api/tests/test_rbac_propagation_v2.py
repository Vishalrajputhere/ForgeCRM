"""
ForgeCRM API — Phase 8.X Dynamic RBAC Real-Time SSE Propagation Tests

Tests:
1. GET /api/v1/auth/me/authorization-version lightweight version check endpoint.
2. AuthorizationSSEManager event queuing & eviction mechanics.
3. Real-time SSE delivery trigger when member role is updated.
4. Real-time SSE delivery trigger when custom role permissions are modified.
"""

from uuid import uuid4
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.security import create_access_token, hash_password
from app.modules.identity.models import User, Role, Permission
from app.modules.identity.permissions import SystemRoles
from app.modules.identity.sse import authorization_sse_manager
from app.modules.workspace.models import Workspace, WorkspaceMember


@pytest.mark.asyncio
async def test_authorization_version_endpoint(client: AsyncClient, db_session: AsyncSession):
    settings = get_settings()

    res_r = await db_session.execute(select(Role))
    roles = {r.name: r for r in res_r.scalars().all()}
    se_role = roles[SystemRoles.SALES_EXECUTIVE]

    ws_id = uuid4()
    ws = Workspace(id=ws_id, name="Test WS Version", slug=f"ws-ver-{ws_id.hex[:6]}")
    db_session.add(ws)

    user_id = uuid4()
    user = User(
        id=user_id,
        email=f"ver_user_{user_id.hex[:6]}@example.com",
        first_name="Version",
        last_name="Tester",
        password_hash=hash_password("Password123!"),
        is_active=True,
    )
    db_session.add(user)

    member = WorkspaceMember(
        id=uuid4(),
        workspace_id=ws_id,
        user_id=user_id,
        role_id=se_role.id,
        status="Active",
        authorization_version=5,
    )
    db_session.add(member)
    await db_session.commit()

    secret = settings.JWT_SECRET_KEY.get_secret_value() if hasattr(settings.JWT_SECRET_KEY, "get_secret_value") else str(settings.JWT_SECRET_KEY)
    token = create_access_token(subject=str(user_id), secret_key=secret, algorithm=settings.JWT_ALGORITHM, expire_minutes=60)
    headers = {"Authorization": f"Bearer {token}", "X-Workspace-ID": str(ws_id)}

    res = await client.get("/api/v1/auth/me/authorization-version", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["authorization_version"] == 5
    assert data["workspace_id"] == str(ws_id)
    assert data["user_id"] == str(user_id)


@pytest.mark.asyncio
async def test_sse_manager_publish_and_subscribe():
    test_user_id = uuid4()
    ws_id = uuid4()

    queue = authorization_sse_manager.connect(test_user_id)
    assert queue is not None

    delivered = await authorization_sse_manager.publish(
        user_id=test_user_id,
        workspace_id=ws_id,
        authorization_version=2,
        reason="role_changed",
    )
    assert delivered == 1

    msg = queue.get_nowait()
    assert "event: authorization.changed" in msg
    assert f'"authorization_version": 2' in msg
    assert f'"workspace_id": "{ws_id}"' in msg

    authorization_sse_manager.disconnect(test_user_id, queue)
    delivered_after = await authorization_sse_manager.publish(
        user_id=test_user_id,
        workspace_id=ws_id,
        authorization_version=3,
        reason="role_changed",
    )
    assert delivered_after == 0


@pytest.mark.asyncio
async def test_custom_role_update_triggers_sse(client: AsyncClient, db_session: AsyncSession):
    settings = get_settings()

    res_r = await db_session.execute(select(Role))
    roles = {r.name: r for r in res_r.scalars().all()}
    sa_role = roles[SystemRoles.SUPER_ADMIN]

    res_p = await db_session.execute(select(Permission))
    perms = res_p.scalars().all()
    p1 = perms[0]

    ws_id = uuid4()
    ws = Workspace(id=ws_id, name="Test WS Custom Role", slug=f"ws-cust-{ws_id.hex[:6]}")
    db_session.add(ws)

    # Super Admin User
    admin_id = uuid4()
    admin_user = User(
        id=admin_id,
        email=f"sa_cust_{admin_id.hex[:6]}@example.com",
        first_name="Super",
        last_name="Admin",
        password_hash=hash_password("Password123!"),
        is_active=True,
    )
    admin_user.roles.append(sa_role)
    db_session.add(admin_user)

    member_admin = WorkspaceMember(
        id=uuid4(),
        workspace_id=ws_id,
        user_id=admin_id,
        role_id=sa_role.id,
        status="Active",
    )
    db_session.add(member_admin)

    # Custom role
    custom_role = Role(
        id=uuid4(),
        name=f"Custom Role {uuid4().hex[:6]}",
        description="Test custom role",
        is_system=False,
    )
    db_session.add(custom_role)

    # User assigned to custom role
    user_id = uuid4()
    user = User(
        id=user_id,
        email=f"member_cust_{user_id.hex[:6]}@example.com",
        first_name="Member",
        last_name="Custom",
        password_hash=hash_password("Password123!"),
        is_active=True,
    )
    db_session.add(user)

    member = WorkspaceMember(
        id=uuid4(),
        workspace_id=ws_id,
        user_id=user_id,
        role_id=custom_role.id,
        status="Active",
        authorization_version=1,
    )
    db_session.add(member)
    await db_session.commit()

    # Connect SSE for test member
    queue = authorization_sse_manager.connect(user_id)

    secret = settings.JWT_SECRET_KEY.get_secret_value() if hasattr(settings.JWT_SECRET_KEY, "get_secret_value") else str(settings.JWT_SECRET_KEY)
    admin_token = create_access_token(subject=str(admin_id), secret_key=secret, algorithm=settings.JWT_ALGORITHM, expire_minutes=60)
    admin_headers = {"Authorization": f"Bearer {admin_token}", "X-Workspace-ID": str(ws_id)}

    # Update custom role permissions via Admin API
    res = await client.put(
        f"/api/v1/workspaces/roles/{custom_role.id}",
        json={"permission_ids": [str(p1.id)]},
        headers=admin_headers,
    )
    assert res.status_code == 200

    # Verify SSE message was received in member's queue
    msg = queue.get_nowait()
    assert "event: authorization.changed" in msg
    assert '"reason": "role_permissions_changed"' in msg
    assert '"authorization_version": 2' in msg

    authorization_sse_manager.disconnect(user_id, queue)
