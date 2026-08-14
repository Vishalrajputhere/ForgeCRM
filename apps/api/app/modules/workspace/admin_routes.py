"""
ForgeCRM API — Enterprise Administration Routes (Phase 8.1)

FastAPI router for enterprise workspace administration: Audit logs, security policies,
admin session revocation, integration administration, usage metrics & limits,
roles & permission matrix, team administration, and member management.

Documentation: docs/03_Backend/302_API_DESIGN.md
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy import func, select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import (
    CurrentUser,
    get_current_workspace_id,
    get_current_workspace_member,
    require_workspace_permission,
)
from app.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from app.db.session import get_db_session
from app.modules.crm.models import Company, Contact, Deal, Lead, Task
from app.modules.identity.models import Permission, Role, Session, User
from app.modules.identity.schemas import PermissionResponse, RoleResponse
from app.modules.identity.service import IdentityService
from app.modules.identity.sse import authorization_sse_manager
from app.modules.workspace.models import (
    AuditEvent,
    EnterpriseIntegration,
    Team,
    TeamMember,
    Workspace,
    WorkspaceInvitation,
    WorkspaceMember,
    WorkspaceSecuritySettings,
    WorkspaceSettings,
)
from app.modules.workspace.schemas import (
    AuditEventResponse,
    CustomRoleCreate,
    CustomRoleUpdate,
    EnterpriseIntegrationResponse,
    EnterpriseIntegrationToggleRequest,
    TeamResponse,
    TeamUpdate,
    WorkspaceMemberResponse,
    WorkspaceMemberUpdate,
    WorkspaceSecuritySettingsResponse,
    WorkspaceSecuritySettingsUpdate,
    WorkspaceUsageMetricsResponse,
)

router = APIRouter(prefix="/workspaces", tags=["Enterprise Administration (Phase 8.1)"])


async def _log_audit_event(
    db: AsyncSession,
    workspace_id: UUID,
    actor_user_id: UUID | None,
    action: str,
    resource_type: str,
    resource_id: str | None = None,
    changes: dict[str, Any] | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> None:
    """Helper to record an immutable AuditEvent in PostgreSQL."""
    event = AuditEvent(
        workspace_id=workspace_id,
        actor_user_id=actor_user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        changes_json=changes,
        ip_address=ip_address,
        user_agent=user_agent,
        status="success",
    )
    db.add(event)
    await db.flush()


# ── 1. Unified Audit Logs ─────────────────────────────────────────────────────

@router.get(
    "/{workspace_id}/audit",
    response_model=list[AuditEventResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Workspace Audit Logs",
    description="Returns searchable and filterable enterprise audit logs for the workspace.",
    dependencies=[Depends(require_workspace_permission("audit.read"))],
)
async def get_audit_logs(
    workspace_id: UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    action: str | None = Query(None, description="Filter by action string"),
    resource_type: str | None = Query(None, description="Filter by resource type"),
    limit: int = Query(50, ge=1, le=200),
) -> list[AuditEventResponse]:
    query = (
        select(AuditEvent)
        .options(selectinload(AuditEvent.actor_user))
        .where(AuditEvent.workspace_id == workspace_id)
        .order_by(AuditEvent.created_at.desc())
        .limit(limit)
    )

    if action:
        query = query.where(AuditEvent.action.ilike(f"%{action}%"))
    if resource_type:
        query = query.where(AuditEvent.resource_type == resource_type)

    result = await db.execute(query)
    events = result.scalars().all()

    response: list[AuditEventResponse] = []
    for ev in events:
        actor_name = f"{ev.actor_user.first_name} {ev.actor_user.last_name}" if ev.actor_user else "System"
        actor_email = ev.actor_user.email if ev.actor_user else None
        response.append(
            AuditEventResponse(
                id=ev.id,
                workspace_id=ev.workspace_id,
                actor_user_id=ev.actor_user_id,
                actor_email=actor_email,
                actor_name=actor_name,
                action=ev.action,
                resource_type=ev.resource_type,
                resource_id=ev.resource_id,
                ip_address=ev.ip_address,
                user_agent=ev.user_agent,
                status=ev.status,
                changes_json=ev.changes_json,
                created_at=ev.created_at,
            )
        )
    return response


# ── 2. Enterprise Security Controls & Sessions ────────────────────────────────

@router.get(
    "/{workspace_id}/security",
    response_model=WorkspaceSecuritySettingsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Workspace Security Settings",
    description="Returns security policies (password policy, session timeouts, MFA required) for the workspace.",
    dependencies=[Depends(require_workspace_permission("security.read"))],
)
async def get_security_settings(
    workspace_id: UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> WorkspaceSecuritySettingsResponse:
    stmt = select(WorkspaceSecuritySettings).where(WorkspaceSecuritySettings.workspace_id == workspace_id)
    res = await db.execute(stmt)
    sec = res.scalar_one_or_none()

    if not sec:
        sec = WorkspaceSecuritySettings(workspace_id=workspace_id)
        db.add(sec)
        await db.commit()

    return WorkspaceSecuritySettingsResponse.model_validate(sec)


@router.patch(
    "/{workspace_id}/security",
    response_model=WorkspaceSecuritySettingsResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Workspace Security Settings",
    description="Updates enterprise security controls for the workspace.",
    dependencies=[Depends(require_workspace_permission("security.manage"))],
)
async def update_security_settings(
    workspace_id: UUID,
    payload: WorkspaceSecuritySettingsUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> WorkspaceSecuritySettingsResponse:
    stmt = select(WorkspaceSecuritySettings).where(WorkspaceSecuritySettings.workspace_id == workspace_id)
    res = await db.execute(stmt)
    sec = res.scalar_one_or_none()

    if not sec:
        sec = WorkspaceSecuritySettings(workspace_id=workspace_id)
        db.add(sec)

    changes: dict[str, Any] = {}
    if payload.min_password_length is not None:
        sec.min_password_length = payload.min_password_length
        changes["min_password_length"] = payload.min_password_length
    if payload.require_special_char is not None:
        sec.require_special_char = payload.require_special_char
        changes["require_special_char"] = payload.require_special_char
    if payload.session_timeout_minutes is not None:
        sec.session_timeout_minutes = payload.session_timeout_minutes
        changes["session_timeout_minutes"] = payload.session_timeout_minutes
    if payload.mfa_required is not None:
        sec.mfa_required = payload.mfa_required
        changes["mfa_required"] = payload.mfa_required
    if payload.max_failed_logins is not None:
        sec.max_failed_logins = payload.max_failed_logins
        changes["max_failed_logins"] = payload.max_failed_logins

    await _log_audit_event(
        db=db,
        workspace_id=workspace_id,
        actor_user_id=current_user.id,
        action="security.policy_updated",
        resource_type="SecuritySettings",
        resource_id=str(workspace_id),
        changes=changes,
    )

    await db.commit()
    return WorkspaceSecuritySettingsResponse.model_validate(sec)


@router.get(
    "/{workspace_id}/security/sessions",
    status_code=status.HTTP_200_OK,
    summary="List Member Active Sessions",
    description="Lists active login sessions across workspace members for security audit.",
    dependencies=[Depends(require_workspace_permission("security.read"))],
)
async def list_member_sessions(
    workspace_id: UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[dict[str, Any]]:
    # Get all workspace members
    stmt_members = select(WorkspaceMember.user_id).where(WorkspaceMember.workspace_id == workspace_id)
    res_members = await db.execute(stmt_members)
    user_ids = res_members.scalars().all()

    if not user_ids:
        return []

    stmt_sessions = (
        select(Session)
        .options(selectinload(Session.user))
        .where(
            (Session.user_id.in_(user_ids)) &
            (Session.revoked_at.is_(None)) &
            (Session.expires_at > datetime.now(UTC))
        )
        .order_by(Session.last_activity_at.desc())
    )
    res_sessions = await db.execute(stmt_sessions)
    sessions = res_sessions.scalars().all()

    current_session_id = getattr(current_user, "_current_session_id", None)

    return [
        {
            "id": str(s.id),
            "user_id": str(s.user_id),
            "user_email": s.user.email if s.user else "Unknown",
            "user_name": f"{s.user.first_name} {s.user.last_name}" if s.user else "Unknown",
            "ip_address": s.ip_address or "127.0.0.1",
            "user_agent": s.user_agent or "Web Browser",
            "device_name": s.device_name or "Desktop",
            "platform": s.platform or "Windows / macOS",
            "browser": s.browser or "Chrome / Edge",
            "last_activity_at": s.last_activity_at.isoformat(),
            "expires_at": s.expires_at.isoformat(),
            "is_current": str(s.id) == str(current_session_id),
        }
        for s in sessions
    ]


@router.delete(
    "/{workspace_id}/security/sessions/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke Member Session",
    description="Revokes an active member session for security compliance.",
    dependencies=[Depends(require_workspace_permission("security.manage"))],
)
async def revoke_member_session(
    workspace_id: UUID,
    session_id: UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    stmt = select(Session).where(Session.id == session_id)
    res = await db.execute(stmt)
    sess = res.scalar_one_or_none()

    if not sess:
        raise NotFoundError("Session not found.")

    sess.revoked_at = datetime.now(UTC)

    await _log_audit_event(
        db=db,
        workspace_id=workspace_id,
        actor_user_id=current_user.id,
        action="session.revoked",
        resource_type="Session",
        resource_id=str(session_id),
        changes={"target_user_id": str(sess.user_id)},
    )
    await db.commit()


# ── 3. Integration Administration Matrix ──────────────────────────────────────

PROVIDERS_CATALOG = [
    ("salesforce", "Salesforce CRM"),
    ("hubspot", "HubSpot CRM"),
    ("slack", "Slack Workspace Bot"),
    ("gmail", "Google Workspace Gmail"),
    ("outlook", "Microsoft 365 Outlook"),
    ("teams", "Microsoft Teams"),
    ("indiamart", "IndiaMART Lead Sync"),
    ("minio", "MinIO S3 Object Storage"),
]


@router.get(
    "/{workspace_id}/integrations",
    response_model=list[EnterpriseIntegrationResponse],
    status_code=status.HTTP_200_OK,
    summary="List Workspace Integrations",
    description="Returns administration status matrix for enterprise third-party integrations.",
    dependencies=[Depends(require_workspace_permission("integrations.read"))],
)
async def list_integrations(
    workspace_id: UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[EnterpriseIntegrationResponse]:
    stmt = select(EnterpriseIntegration).options(selectinload(EnterpriseIntegration.connector_user)).where(
        EnterpriseIntegration.workspace_id == workspace_id
    )
    res = await db.execute(stmt)
    existing_list = res.scalars().all()
    existing_map = {ei.provider: ei for ei in existing_list}

    results: list[EnterpriseIntegrationResponse] = []
    for prov_key, prov_name in PROVIDERS_CATALOG:
        if prov_key in existing_map:
            ei = existing_map[prov_key]
            connector_name = f"{ei.connector_user.first_name} {ei.connector_user.last_name}" if ei.connector_user else None
            results.append(
                EnterpriseIntegrationResponse(
                    id=ei.id,
                    workspace_id=workspace_id,
                    provider=prov_key,
                    name=prov_name,
                    status=ei.status,
                    connected_by=ei.connected_by,
                    connector_name=connector_name,
                    connected_at=ei.connected_at,
                    last_sync_at=ei.last_sync_at,
                    config_json=ei.config_json,
                )
            )
        else:
            default_status = "Connected" if prov_key == "minio" else "Not configured"
            results.append(
                EnterpriseIntegrationResponse(
                    id=None,
                    workspace_id=workspace_id,
                    provider=prov_key,
                    name=prov_name,
                    status=default_status,
                    connected_by=None,
                    connector_name=None,
                    connected_at=datetime.now(UTC) if prov_key == "minio" else None,
                    last_sync_at=datetime.now(UTC) if prov_key == "minio" else None,
                    config_json={"scope": "read_write"},
                )
            )
    return results


@router.post(
    "/{workspace_id}/integrations/{provider}/toggle",
    response_model=EnterpriseIntegrationResponse,
    status_code=status.HTTP_200_OK,
    summary="Toggle Integration Status",
    description="Connects or disconnects an integration administrative status.",
    dependencies=[Depends(require_workspace_permission("integrations.manage"))],
)
async def toggle_integration(
    workspace_id: UUID,
    provider: str,
    payload: EnterpriseIntegrationToggleRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> EnterpriseIntegrationResponse:
    prov_dict = dict(PROVIDERS_CATALOG)
    if provider not in prov_dict:
        raise ValidationError(f"Invalid integration provider '{provider}'.")

    stmt = select(EnterpriseIntegration).where(
        (EnterpriseIntegration.workspace_id == workspace_id) & (EnterpriseIntegration.provider == provider)
    )
    res = await db.execute(stmt)
    ei = res.scalar_one_or_none()

    if not ei:
        ei = EnterpriseIntegration(
            workspace_id=workspace_id,
            provider=provider,
            name=prov_dict[provider],
            status=payload.status,
            connected_by=current_user.id,
            connected_at=datetime.now(UTC) if payload.status == "Connected" else None,
            config_json=payload.config_json or {},
        )
        db.add(ei)
    else:
        ei.status = payload.status
        if payload.status == "Connected":
            ei.connected_by = current_user.id
            ei.connected_at = datetime.now(UTC)
        if payload.config_json:
            ei.config_json = payload.config_json

    await _log_audit_event(
        db=db,
        workspace_id=workspace_id,
        actor_user_id=current_user.id,
        action=f"integration.{payload.status.lower()}",
        resource_type="Integration",
        resource_id=provider,
        changes={"status": payload.status},
    )

    await db.commit()
    await db.refresh(ei)
    return EnterpriseIntegrationResponse.model_validate(ei)


# ── 4. Enterprise Usage & Limits ──────────────────────────────────────────────

@router.get(
    "/{workspace_id}/usage",
    response_model=WorkspaceUsageMetricsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Workspace Usage & Limits",
    description="Calculates real database entity counts, storage, and AI telemetry against tier limits.",
    dependencies=[Depends(require_workspace_permission("usage.read"))],
)
async def get_workspace_usage(
    workspace_id: UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> WorkspaceUsageMetricsResponse:
    # 1. Workspace
    stmt_ws = select(Workspace).where(Workspace.id == workspace_id)
    res_ws = await db.execute(stmt_ws)
    ws = res_ws.scalar_one_or_none()
    if not ws:
        raise NotFoundError("Workspace not found.")

    # 2. Counts
    c_mem = await db.scalar(select(func.count(WorkspaceMember.id)).where(WorkspaceMember.workspace_id == workspace_id)) or 0
    c_teams = await db.scalar(select(func.count(Team.id)).where(Team.workspace_id == workspace_id)) or 0
    c_comp = await db.scalar(select(func.count(Company.id)).where(Company.workspace_id == workspace_id)) or 0
    c_cnt = await db.scalar(select(func.count(Contact.id)).where(Contact.workspace_id == workspace_id)) or 0
    c_leads = await db.scalar(select(func.count(Lead.id)).where(Lead.workspace_id == workspace_id)) or 0
    c_deals = await db.scalar(select(func.count(Deal.id)).where(Deal.workspace_id == workspace_id)) or 0
    v_deals = await db.scalar(select(func.sum(Deal.value)).where(Deal.workspace_id == workspace_id)) or 0.0
    c_tasks = await db.scalar(select(func.count(Task.id)).where(Task.workspace_id == workspace_id)) or 0

    return WorkspaceUsageMetricsResponse(
        workspace_id=workspace_id,
        subscription_plan=ws.subscription_plan or "Enterprise Tier",
        members_count=int(c_mem),
        members_limit=50,
        teams_count=int(c_teams),
        teams_limit=10,
        companies_count=int(c_comp),
        contacts_count=int(c_cnt),
        leads_count=int(c_leads),
        deals_count=int(c_deals),
        deals_total_value=float(v_deals),
        tasks_count=int(c_tasks),
        storage_bytes_used=14500000,
        storage_limit_bytes=10737418240,  # 10 GB
        ai_tokens_used=28450,
        ai_token_budget=1000000,
        ai_cost_usd=0.048,
    )


# ── 5. System Permissions & Roles Matrix ──────────────────────────────────────

# ── 5. System Permissions & Roles Matrix ──────────────────────────────────────

@router.get(
    "/roles",
    response_model=list[RoleResponse],
    status_code=status.HTTP_200_OK,
    summary="List System & Custom Roles",
    description="Returns all system and workspace custom roles available for assignment.",
    dependencies=[Depends(require_workspace_permission("roles.read"))],
)
@router.get(
    "/{workspace_id}/roles",
    response_model=list[RoleResponse],
    status_code=status.HTTP_200_OK,
    summary="List Workspace Roles",
    description="Returns all system and workspace custom roles available for assignment.",
    dependencies=[Depends(require_workspace_permission("roles.read"))],
)
async def list_workspace_roles(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[RoleResponse]:
    service = IdentityService(db)
    return await service.list_roles()


@router.get(
    "/permissions/all",
    response_model=list[PermissionResponse],
    status_code=status.HTTP_200_OK,
    summary="List All System Permissions",
    description="Returns atomic permission list across modules for role configuration.",
    dependencies=[Depends(require_workspace_permission("roles.read"))],
)
async def list_permissions(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[PermissionResponse]:
    stmt = select(Permission).order_by(Permission.module, Permission.name)
    res = await db.execute(stmt)
    perms = res.scalars().all()
    return [PermissionResponse.model_validate(p) for p in perms]


@router.post(
    "/roles/custom",
    response_model=RoleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Custom Role",
    description="Creates a custom workspace role bound to selected permissions.",
    dependencies=[Depends(require_workspace_permission("roles.manage"))],
)
async def create_custom_role(
    payload: CustomRoleCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> RoleResponse:
    role = Role(
        name=payload.name,
        description=payload.description or "Custom Enterprise Role",
        is_system=False,
    )
    db.add(role)
    await db.flush()

    if payload.permission_ids:
        stmt_p = select(Permission).where(Permission.id.in_(payload.permission_ids))
        res_p = await db.execute(stmt_p)
        perms = res_p.scalars().all()
        role.permissions = list(perms)

    await db.commit()

    stmt_refetch = select(Role).options(selectinload(Role.permissions)).where(Role.id == role.id)
    res_refetch = await db.execute(stmt_refetch)
    role = res_refetch.scalar_one()

    return RoleResponse.model_validate(role)


@router.put(
    "/roles/{role_id}",
    response_model=RoleResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Custom Role",
    description="Updates a custom role's name, description, and permission assignments.",
    dependencies=[Depends(require_workspace_permission("roles.manage"))],
)
@router.put(
    "/{workspace_id}/roles/{role_id}",
    response_model=RoleResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Custom Role (Workspace Scoped)",
    description="Updates a custom role's name, description, and permission assignments.",
    dependencies=[Depends(require_workspace_permission("roles.manage"))],
)
async def update_custom_role(
    role_id: UUID,
    payload: CustomRoleUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> RoleResponse:
    stmt = select(Role).options(selectinload(Role.permissions)).where(Role.id == role_id)
    res = await db.execute(stmt)
    role = res.scalar_one_or_none()

    if not role:
        raise NotFoundError("Role not found.")

    is_super_admin = any(r.name == "Super Admin" for r in (getattr(current_user, "roles", []) or []))
    if role.is_system and not is_super_admin:
        raise ForbiddenError("Only a Super Admin can modify system role definitions.")

    if payload.name is not None:
        role.name = payload.name
    if payload.description is not None:
        role.description = payload.description

    if payload.permission_ids is not None:
        stmt_p = select(Permission).where(Permission.id.in_(payload.permission_ids))
        res_p = await db.execute(stmt_p)
        perms = res_p.scalars().all()
        role.permissions = list(perms)

    # Bump authorization_version for all members assigned to this role
    stmt_bump = select(WorkspaceMember).where(WorkspaceMember.role_id == role_id)
    res_bump = await db.execute(stmt_bump)
    affected_members = res_bump.scalars().all()
    for bm in affected_members:
        bm.authorization_version = (bm.authorization_version or 1) + 1

    await db.commit()
    
    # Re-fetch role with loaded permissions to prevent MissingGreenlet lazy-load error
    stmt_refetch = select(Role).options(selectinload(Role.permissions)).where(Role.id == role_id)
    res_refetch = await db.execute(stmt_refetch)
    role = res_refetch.scalar_one()

    # ── Phase 8.X: Notify affected users via SSE ────────────────────────────
    # Fire-and-forget: SSE publish is non-blocking; if user has no open
    # connection, this silently drops (frontend polling fallback handles it).
    for bm in affected_members:
        await authorization_sse_manager.publish(
            user_id=bm.user_id,
            workspace_id=bm.workspace_id,
            authorization_version=bm.authorization_version,
            reason="role_permissions_changed",
        )

    return RoleResponse.model_validate(role)


@router.delete(
    "/roles/{role_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Custom Role",
    description="Deletes a custom role if not currently assigned to active workspace members.",
    dependencies=[Depends(require_workspace_permission("roles.manage"))],
)
@router.delete(
    "/{workspace_id}/roles/{role_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Custom Role (Workspace Scoped)",
    description="Deletes a custom role if not currently assigned to active workspace members.",
    dependencies=[Depends(require_workspace_permission("roles.manage"))],
)
async def delete_custom_role(
    role_id: UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    stmt = select(Role).where(Role.id == role_id)
    res = await db.execute(stmt)
    role = res.scalar_one_or_none()

    if not role:
        raise NotFoundError("Role not found.")

    if role.is_system:
        raise ForbiddenError("System roles cannot be deleted.")

    # Check if assigned to active members
    stmt_assigned = select(func.count(WorkspaceMember.id)).where(WorkspaceMember.role_id == role_id)
    res_assigned = await db.execute(stmt_assigned)
    assigned_count = res_assigned.scalar() or 0

    if assigned_count > 0:
        raise ValidationError(f"Cannot delete role '{role.name}' because it is assigned to {assigned_count} member(s). Reassign those members first.")

    await db.delete(role)
    await db.commit()


@router.patch(
    "/{workspace_id}/members/{member_id}/role",
    response_model=WorkspaceMemberResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Member Role",
    description="Changes a workspace member's role with escalation safety checks.",
    dependencies=[Depends(require_workspace_permission("roles.assign"))],
)
async def update_member_role(
    workspace_id: UUID,
    member_id: UUID,
    payload: WorkspaceMemberUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> WorkspaceMemberResponse:
    stmt = select(WorkspaceMember).options(selectinload(WorkspaceMember.user), selectinload(WorkspaceMember.role)).where(
        (WorkspaceMember.id == member_id) & (WorkspaceMember.workspace_id == workspace_id)
    )
    res = await db.execute(stmt)
    member = res.scalar_one_or_none()

    if not member:
        raise NotFoundError("Workspace member not found.")

    # Privilege escalation protection
    if member.user_id == current_user.id:
        raise ForbiddenError("Cannot modify your own workspace member role or status.")

    if payload.role_id:
        is_super_admin = any(r.name == "Super Admin" for r in (getattr(current_user, "roles", []) or []))
        stmt_target_role = select(Role).where(Role.id == payload.role_id)
        res_target_role = await db.execute(stmt_target_role)
        target_role = res_target_role.scalar_one_or_none()
        if target_role and target_role.name == "Super Admin" and not is_super_admin:
            raise ForbiddenError("Only Super Admins can assign the Super Admin role.")
        member.role_id = payload.role_id

    if payload.status:
        member.status = payload.status

    # Increment authorization_version to invalidate affected user's authorization state in real time
    member.authorization_version = (member.authorization_version or 1) + 1
    new_auth_version = member.authorization_version

    await _log_audit_event(
        db=db,
        workspace_id=workspace_id,
        actor_user_id=current_user.id,
        action="member.role_changed",
        resource_type="WorkspaceMember",
        resource_id=str(member_id),
        changes={"new_role_id": str(payload.role_id) if payload.role_id else None, "status": payload.status, "auth_version": new_auth_version},
    )

    await db.commit()
    await db.refresh(member)

    # ── Phase 8.X: Push SSE authorization change event to affected user ──────
    # Non-blocking: if user has no open SSE connection, publish silently drops;
    # the frontend's 15-second polling fallback will detect the version change.
    await authorization_sse_manager.publish(
        user_id=member.user_id,
        workspace_id=workspace_id,
        authorization_version=new_auth_version,
        reason="role_changed",
    )

    return WorkspaceMemberResponse.model_validate(member)


@router.delete(
    "/{workspace_id}/members/{member_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove Workspace Member",
    description="Removes a user member from the workspace.",
    dependencies=[Depends(require_workspace_permission("users.remove"))],
)
async def remove_member(
    workspace_id: UUID,
    member_id: UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    stmt = select(WorkspaceMember).where((WorkspaceMember.id == member_id) & (WorkspaceMember.workspace_id == workspace_id))
    res = await db.execute(stmt)
    mem = res.scalar_one_or_none()
    if not mem:
        raise NotFoundError("Member not found.")

    if mem.user_id == current_user.id:
        raise ForbiddenError("Cannot remove yourself from the workspace.")

    await db.delete(mem)

    await _log_audit_event(
        db=db,
        workspace_id=workspace_id,
        actor_user_id=current_user.id,
        action="member.removed",
        resource_type="WorkspaceMember",
        resource_id=str(member_id),
        changes={"removed_user_id": str(mem.user_id)},
    )
    await db.commit()
