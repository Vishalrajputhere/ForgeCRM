"""
ForgeCRM API — System Permissions Registry

Defines canonical permission strings and default system roles.
Business logic uses permissions, never role names directly.

Documentation: docs/05_Security/505_AUTHORIZATION_AND_RBAC.md
"""

from __future__ import annotations


class Permissions:
    """System permissions constants formatted as resource.action."""

    # Users & Identity
    USERS_READ = "users.read"
    USERS_CREATE = "users.create"
    USERS_UPDATE = "users.update"
    USERS_DELETE = "users.delete"
    USERS_INVITE = "users.invite"

    # Roles & Permissions
    ROLES_READ = "roles.read"
    ROLES_CREATE = "roles.create"
    ROLES_UPDATE = "roles.update"
    ROLES_DELETE = "roles.delete"
    ROLES_ASSIGN = "roles.assign"
    ROLES_MANAGE = "roles.manage"

    # Workspaces & Teams
    WORKSPACE_READ = "workspace.read"
    WORKSPACE_UPDATE = "workspace.update"
    WORKSPACE_MANAGE = "workspace.manage"
    TEAMS_READ = "teams.read"
    TEAMS_CREATE = "teams.create"
    TEAMS_UPDATE = "teams.update"
    TEAMS_DELETE = "teams.delete"
    TEAMS_MANAGE = "teams.manage"

    # Companies
    COMPANIES_READ = "companies.read"
    COMPANIES_CREATE = "companies.create"
    COMPANIES_UPDATE = "companies.update"
    COMPANIES_DELETE = "companies.delete"
    COMPANIES_EXPORT = "companies.export"

    # Contacts
    CONTACTS_READ = "contacts.read"
    CONTACTS_CREATE = "contacts.create"
    CONTACTS_UPDATE = "contacts.update"
    CONTACTS_DELETE = "contacts.delete"
    CONTACTS_EXPORT = "contacts.export"

    # Leads
    LEADS_READ = "leads.read"
    LEADS_CREATE = "leads.create"
    LEADS_UPDATE = "leads.update"
    LEADS_DELETE = "leads.delete"
    LEADS_CONVERT = "leads.convert"

    # Deals & Pipelines
    DEALS_READ = "deals.read"
    DEALS_CREATE = "deals.create"
    DEALS_UPDATE = "deals.update"
    DEALS_DELETE = "deals.delete"
    DEALS_MOVE_STAGE = "deals.move_stage"

    # Tasks & Activities
    TASKS_READ = "tasks.read"
    TASKS_CREATE = "tasks.create"
    TASKS_UPDATE = "tasks.update"
    TASKS_DELETE = "tasks.delete"
    TASKS_ASSIGN = "tasks.assign"

    # Storage & Attachments
    STORAGE_READ = "storage.read"
    STORAGE_UPLOAD = "storage.upload"
    STORAGE_DELETE = "storage.delete"

    # Automations & Background Jobs
    AUTOMATIONS_READ = "automations.read"
    AUTOMATIONS_CREATE = "automations.create"
    AUTOMATIONS_UPDATE = "automations.update"
    AUTOMATIONS_DELETE = "automations.delete"
    AUTOMATIONS_EXECUTE = "automations.execute"
    JOBS_READ = "jobs.read"
    JOBS_EXECUTE = "jobs.execute"

    # AI Subsystem
    AI_USE = "ai.use"
    AI_AGENTS_RUN = "ai.agents.run"
    AI_MEMORY_MANAGE = "ai.memory.manage"
    AI_MCP_APPROVE = "ai.mcp.approve"
    AI_ADMIN_VIEW = "ai.admin.view"
    AI_ADMIN_MANAGE = "ai.admin.manage"

    # Governance, Security & Telemetry
    AUDIT_READ = "audit.read"
    SECURITY_READ = "security.read"
    SECURITY_MANAGE = "security.manage"
    INTEGRATIONS_READ = "integrations.read"
    INTEGRATIONS_MANAGE = "integrations.manage"
    USAGE_READ = "usage.read"

    # Reports & System Settings
    REPORTS_READ = "reports.read"
    REPORTS_EXPORT = "reports.export"
    SETTINGS_READ = "settings.read"
    SETTINGS_UPDATE = "settings.update"


class SystemRoles:
    """System role names."""

    SUPER_ADMIN = "Super Admin"
    WORKSPACE_ADMIN = "Workspace Admin"
    SALES_MANAGER = "Sales Manager"
    SALES_EXECUTIVE = "Sales Executive"
    VIEWER = "Viewer"


# Mapping of system roles to default permissions
DEFAULT_ROLE_PERMISSIONS: dict[str, list[str]] = {
    SystemRoles.SUPER_ADMIN: [
        getattr(Permissions, attr)
        for attr in dir(Permissions)
        if not attr.startswith("_") and isinstance(getattr(Permissions, attr), str)
    ],
    SystemRoles.WORKSPACE_ADMIN: [
        getattr(Permissions, attr)
        for attr in dir(Permissions)
        if not attr.startswith("_") and isinstance(getattr(Permissions, attr), str)
    ],
    SystemRoles.SALES_MANAGER: [
        Permissions.USERS_READ,
        Permissions.TEAMS_READ,
        Permissions.TEAMS_UPDATE,
        Permissions.COMPANIES_READ,
        Permissions.COMPANIES_CREATE,
        Permissions.COMPANIES_UPDATE,
        Permissions.COMPANIES_EXPORT,
        Permissions.CONTACTS_READ,
        Permissions.CONTACTS_CREATE,
        Permissions.CONTACTS_UPDATE,
        Permissions.CONTACTS_EXPORT,
        Permissions.LEADS_READ,
        Permissions.LEADS_CREATE,
        Permissions.LEADS_UPDATE,
        Permissions.LEADS_CONVERT,
        Permissions.DEALS_READ,
        Permissions.DEALS_CREATE,
        Permissions.DEALS_UPDATE,
        Permissions.DEALS_MOVE_STAGE,
        Permissions.TASKS_READ,
        Permissions.TASKS_CREATE,
        Permissions.TASKS_UPDATE,
        Permissions.TASKS_ASSIGN,
        Permissions.STORAGE_READ,
        Permissions.STORAGE_UPLOAD,
        Permissions.AI_USE,
        Permissions.AI_AGENTS_RUN,
        Permissions.AI_MCP_APPROVE,
        Permissions.REPORTS_READ,
        Permissions.REPORTS_EXPORT,
        Permissions.USAGE_READ,
    ],
    SystemRoles.SALES_EXECUTIVE: [
        Permissions.COMPANIES_READ,
        Permissions.COMPANIES_CREATE,
        Permissions.COMPANIES_UPDATE,
        Permissions.CONTACTS_READ,
        Permissions.CONTACTS_CREATE,
        Permissions.CONTACTS_UPDATE,
        Permissions.LEADS_READ,
        Permissions.LEADS_CREATE,
        Permissions.LEADS_UPDATE,
        Permissions.LEADS_CONVERT,
        Permissions.DEALS_READ,
        Permissions.DEALS_CREATE,
        Permissions.DEALS_UPDATE,
        Permissions.DEALS_MOVE_STAGE,
        Permissions.TASKS_READ,
        Permissions.TASKS_CREATE,
        Permissions.TASKS_UPDATE,
        Permissions.STORAGE_READ,
        Permissions.STORAGE_UPLOAD,
        Permissions.AI_USE,
    ],
    SystemRoles.VIEWER: [
        Permissions.COMPANIES_READ,
        Permissions.CONTACTS_READ,
        Permissions.LEADS_READ,
        Permissions.DEALS_READ,
        Permissions.TASKS_READ,
        Permissions.STORAGE_READ,
        Permissions.REPORTS_READ,
    ],
}
