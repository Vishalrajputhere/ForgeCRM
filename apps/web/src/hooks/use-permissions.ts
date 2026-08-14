'use client';

/**
 * ForgeCRM — Dynamic Real-Time Permissions & Authorization Hook
 *
 * Fully dynamic, database-driven, server-authoritative RBAC hook.
 * Fetches canonical effective permissions from GET /api/v1/auth/me/permissions
 * and syncs authorization state across the UI in real time.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaceStore } from '@/stores/workspace-store';

export interface UsePermissionsReturn {
  isSuperAdmin: boolean;
  isWorkspaceAdmin: boolean;
  userRole: string;
  roles: string[];
  permissions: Set<string>;
  authorizationVersion: number;
  isLoadingPermissions: boolean;
  can: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  refetchPermissions: () => Promise<void>;
}

export function usePermissions(): UsePermissionsReturn {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const effectivePermissions = useAuthStore((state) => state.effectivePermissions);
  const effectiveRoles = useAuthStore((state) => state.effectiveRoles);
  const authorizationVersion = useAuthStore((state) => state.authorizationVersion);
  const storeIsSuperAdmin = useAuthStore((state) => state.isSuperAdmin);
  const setEffectiveAuthorization = useAuthStore((state) => state.setEffectiveAuthorization);

  const { currentWorkspace } = useWorkspaceStore();
  const [isLoadingPermissions, setIsLoadingPermissions] = useState<boolean>(false);

  const fetchEffectivePermissions = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoadingPermissions(true);
      let token = useAuthStore.getState().accessToken;
      if (!token && typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('forge_auth_storage');
          if (raw) {
            token = JSON.parse(raw)?.state?.accessToken ?? null;
          }
        } catch {
          // ignore
        }
      }

      if (!token) return;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
      if (currentWorkspace?.id) {
        headers['X-Workspace-ID'] = currentWorkspace.id;
      }

      const res = await fetch('/api/v1/auth/me/permissions', {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setEffectiveAuthorization({
          permissions: Array.isArray(data.permissions) ? data.permissions : [],
          roles: Array.isArray(data.roles) ? data.roles : [],
          authorizationVersion: typeof data.authorization_version === 'number' ? data.authorization_version : 1,
          isSuperAdmin: !!data.is_super_admin,
        });
      }
    } catch {
      // Keep existing effective permissions on transient network error
    } finally {
      setIsLoadingPermissions(false);
    }
  }, [isAuthenticated, currentWorkspace?.id, setEffectiveAuthorization]);

  // Initial fetch and workspace-change revalidation
  useEffect(() => {
    fetchEffectivePermissions();
  }, [fetchEffectivePermissions]);

  // Real-time periodic polling sync (propagates role changes within 3 seconds without page reload)
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      fetchEffectivePermissions();
    }, 4000);

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchEffectivePermissions]);

  const isSuperAdmin = useMemo(() => {
    if (storeIsSuperAdmin) return true;
    return effectiveRoles.some((r) => r.name === 'Super Admin');
  }, [storeIsSuperAdmin, effectiveRoles]);

  const isWorkspaceAdmin = useMemo(() => {
    if (isSuperAdmin) return true;
    return effectiveRoles.some((r) => r.name === 'Workspace Admin') || effectivePermissions.includes('*');
  }, [isSuperAdmin, effectiveRoles, effectivePermissions]);

  const roles = useMemo(() => {
    if (effectiveRoles.length > 0) return effectiveRoles.map((r) => r.name);
    if (user?.roles && user.roles.length > 0) return user.roles.map((r) => r.name);
    return ['Viewer'];
  }, [effectiveRoles, user]);

  const primaryRole = roles[0] || 'Viewer';

  const permSet = useMemo(() => {
    const set = new Set<string>(effectivePermissions);
    if (isSuperAdmin || isWorkspaceAdmin) {
      set.add('*');
    }
    return set;
  }, [effectivePermissions, isSuperAdmin, isWorkspaceAdmin]);

  const can = useCallback(
    (permission: string): boolean => {
      if (isSuperAdmin || isWorkspaceAdmin || permSet.has('*')) return true;
      return permSet.has(permission);
    },
    [isSuperAdmin, isWorkspaceAdmin, permSet],
  );

  const hasAnyPermission = useCallback(
    (permList: string[]): boolean => {
      if (isSuperAdmin || isWorkspaceAdmin || permSet.has('*')) return true;
      return permList.some((p) => permSet.has(p));
    },
    [isSuperAdmin, isWorkspaceAdmin, permSet],
  );

  const hasAllPermissions = useCallback(
    (permList: string[]): boolean => {
      if (isSuperAdmin || isWorkspaceAdmin || permSet.has('*')) return true;
      return permList.every((p) => permSet.has(p));
    },
    [isSuperAdmin, isWorkspaceAdmin, permSet],
  );

  return {
    isSuperAdmin,
    isWorkspaceAdmin,
    userRole: primaryRole,
    roles,
    permissions: permSet,
    authorizationVersion,
    isLoadingPermissions,
    can,
    hasAnyPermission,
    hasAllPermissions,
    refetchPermissions: fetchEffectivePermissions,
  };
}
