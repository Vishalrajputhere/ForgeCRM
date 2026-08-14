'use client';

/**
 * ForgeCRM — Centralized Permissions & Security Hook
 *
 * Client-side RBAC permission evaluator hook.
 * Checks effective user roles and granular permissions.
 */

import { useMemo } from 'react';
import { useAuthStore } from '@/stores/auth-store';

// System Roles
export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'Super Admin',
  WORKSPACE_ADMIN: 'Workspace Admin',
  SALES_MANAGER: 'Sales Manager',
  SALES_EXECUTIVE: 'Sales Executive',
  VIEWER: 'Viewer',
} as const;

// Default Role to Permissions Mapping for Frontend Fallbacks
const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  [SYSTEM_ROLES.SUPER_ADMIN]: ['*'],
  [SYSTEM_ROLES.WORKSPACE_ADMIN]: ['*'],
  [SYSTEM_ROLES.SALES_MANAGER]: [
    'users.read',
    'teams.read',
    'teams.update',
    'companies.read',
    'companies.create',
    'companies.update',
    'companies.export',
    'contacts.read',
    'contacts.create',
    'contacts.update',
    'contacts.export',
    'leads.read',
    'leads.create',
    'leads.update',
    'leads.convert',
    'deals.read',
    'deals.create',
    'deals.update',
    'deals.move_stage',
    'tasks.read',
    'tasks.create',
    'tasks.update',
    'tasks.assign',
    'storage.read',
    'storage.upload',
    'ai.use',
    'ai.agents.run',
    'ai.mcp.approve',
    'reports.read',
    'reports.export',
    'usage.read',
  ],
  [SYSTEM_ROLES.SALES_EXECUTIVE]: [
    'companies.read',
    'companies.create',
    'companies.update',
    'contacts.read',
    'contacts.create',
    'contacts.update',
    'leads.read',
    'leads.create',
    'leads.update',
    'leads.convert',
    'deals.read',
    'deals.create',
    'deals.update',
    'deals.move_stage',
    'tasks.read',
    'tasks.create',
    'tasks.update',
    'storage.read',
    'storage.upload',
    'ai.use',
  ],
  [SYSTEM_ROLES.VIEWER]: [
    'companies.read',
    'contacts.read',
    'leads.read',
    'deals.read',
    'tasks.read',
    'storage.read',
    'reports.read',
  ],
};

export interface UsePermissionsReturn {
  isSuperAdmin: boolean;
  isWorkspaceAdmin: boolean;
  userRole: string;
  roles: string[];
  userRoles: string[];
  permissions: Set<string>;
  can: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const user = useAuthStore((state) => state.user);

  const roles = useMemo(() => {
    return user?.roles?.map((r) => r.name) || [SYSTEM_ROLES.WORKSPACE_ADMIN];
  }, [user]);

  const isSuperAdmin = useMemo(() => {
    return roles.includes(SYSTEM_ROLES.SUPER_ADMIN);
  }, [roles]);

  const isWorkspaceAdmin = useMemo(() => {
    return isSuperAdmin || roles.includes(SYSTEM_ROLES.WORKSPACE_ADMIN);
  }, [isSuperAdmin, roles]);

  const primaryRole = roles[0] || SYSTEM_ROLES.WORKSPACE_ADMIN;

  const permissions = useMemo(() => {
    const permSet = new Set<string>();

    if (isWorkspaceAdmin) {
      permSet.add('*');
      return permSet;
    }

    roles.forEach((roleName) => {
      const perms = DEFAULT_ROLE_PERMISSIONS[roleName] || [];
      perms.forEach((p) => permSet.add(p));
    });

    return permSet;
  }, [roles, isWorkspaceAdmin]);

  const can = (permission: string): boolean => {
    if (isWorkspaceAdmin || permissions.has('*')) return true;
    return permissions.has(permission);
  };

  const hasAnyPermission = (permList: string[]): boolean => {
    if (isWorkspaceAdmin || permissions.has('*')) return true;
    return permList.some((p) => permissions.has(p));
  };

  const hasAllPermissions = (permList: string[]): boolean => {
    if (isWorkspaceAdmin || permissions.has('*')) return true;
    return permList.every((p) => permissions.has(p));
  };

  return {
    isSuperAdmin,
    isWorkspaceAdmin,
    userRole: primaryRole,
    roles,
    userRoles: roles,
    permissions,
    can,
    hasAnyPermission,
    hasAllPermissions,
  };
}
