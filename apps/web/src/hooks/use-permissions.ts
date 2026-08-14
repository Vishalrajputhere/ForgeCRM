'use client';

/**
 * ForgeCRM — Dynamic Real-Time Permissions & Authorization Hook (Phase 8.X)
 *
 * Fully dynamic, database-driven, server-authoritative RBAC hook.
 *
 * Real-time propagation strategy (layered):
 *   1. PRIMARY: SSE stream (GET /auth/me/events) — instant push on role change
 *   2. FALLBACK: 15s lightweight version check (GET /auth/me/authorization-version)
 *      — only fetches full permissions if version has actually changed
 *
 * Backend is always the authoritative source. Frontend only renders/hides UI.
 * Every sensitive action is independently enforced server-side.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

  // Tracks last known version for efficient polling comparison
  const lastKnownVersionRef = useRef<number>(authorizationVersion);

  // ── Helper: get auth token ────────────────────────────────────────────────
  const getToken = useCallback((): string | null => {
    const storeToken = useAuthStore.getState().accessToken;
    if (storeToken) return storeToken;
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('forge_auth_storage');
      return raw ? JSON.parse(raw)?.state?.accessToken ?? null : null;
    } catch {
      return null;
    }
  }, []);

  // ── Core: Fetch full effective permissions from backend ─────────────────────
  const fetchEffectivePermissions = useCallback(async () => {
    if (!isAuthenticated) return;
    const token = getToken();
    if (!token) return;

    try {
      setIsLoadingPermissions(true);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
      if (currentWorkspace?.id) headers['X-Workspace-ID'] = currentWorkspace.id;

      const res = await fetch('/api/v1/auth/me/permissions', {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        const newVersion =
          typeof data.authorization_version === 'number' ? data.authorization_version : 1;
        setEffectiveAuthorization({
          permissions: Array.isArray(data.permissions) ? data.permissions : [],
          roles: Array.isArray(data.roles) ? data.roles : [],
          authorizationVersion: newVersion,
          isSuperAdmin: !!data.is_super_admin,
        });
        lastKnownVersionRef.current = newVersion;
      }
    } catch {
      // Keep existing effective permissions on transient network error
    } finally {
      setIsLoadingPermissions(false);
    }
  }, [isAuthenticated, currentWorkspace?.id, setEffectiveAuthorization, getToken]);

  // ── Lightweight version check ─────────────────────────────────────────────
  // Used by polling fallback — only fetches full permissions when version changes
  const checkAuthorizationVersion = useCallback(async () => {
    if (!isAuthenticated) return;
    const token = getToken();
    if (!token) return;

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };
      if (currentWorkspace?.id) headers['X-Workspace-ID'] = currentWorkspace.id;

      const res = await fetch('/api/v1/auth/me/authorization-version', {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        const serverVersion =
          typeof data.authorization_version === 'number' ? data.authorization_version : 1;
        if (serverVersion !== lastKnownVersionRef.current) {
          await fetchEffectivePermissions();
        }
      }
    } catch {
      // Silently ignore — will retry on next interval
    }
  }, [isAuthenticated, currentWorkspace?.id, fetchEffectivePermissions, getToken]);

  // ── Phase 8.X: SSE primary real-time channel ─────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return;

    const token = getToken();
    if (!token) return;

    let aborted = false;
    const controller = new AbortController();

    const connectSSE = async () => {
      try {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
        };
        if (currentWorkspace?.id) headers['X-Workspace-ID'] = currentWorkspace.id;

        const response = await fetch('/api/v1/auth/me/events', {
          headers,
          signal: controller.signal,
          credentials: 'include',
        });

        if (!response.ok || !response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let currentEvent = '';
        let currentData = '';

        while (!aborted) {
          const { value, done } = await reader.read();
          if (done || aborted) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('event:')) {
              currentEvent = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              currentData = line.slice(5).trim();
            } else if (line === '') {
              // End of SSE message block
              if (currentEvent === 'authorization.changed' && currentData) {
                try {
                  const payload = JSON.parse(currentData);
                  const serverVersion =
                    typeof payload.authorization_version === 'number'
                      ? payload.authorization_version
                      : 0;
                  if (serverVersion > lastKnownVersionRef.current) {
                    // Immediate: fetch new permissions — no delay
                    await fetchEffectivePermissions();
                  }
                } catch { /* malformed JSON — ignore */ }
              }
              currentEvent = '';
              currentData = '';
            }
          }
        }
      } catch {
        // SSE connection failed or was aborted — polling fallback handles eventual consistency
      }
    };

    connectSSE();

    return () => {
      aborted = true;
      controller.abort();
    };
    // Re-connect SSE when workspace changes or auth state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, currentWorkspace?.id]);

  // ── Initial permission fetch on mount / workspace change ──────────────────
  useEffect(() => {
    fetchEffectivePermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, currentWorkspace?.id]);

  // ── Polling fallback (15 seconds) ─────────────────────────────────────────
  // Handles: browsers blocking SSE, backgrounded tabs, corporate proxies.
  // Only calls full permissions endpoint when version actually changed.
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(checkAuthorizationVersion, 15_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, checkAuthorizationVersion]);

  // ── Derived permission state ──────────────────────────────────────────────
  const isSuperAdmin = useMemo(() => {
    if (storeIsSuperAdmin) return true;
    return effectiveRoles.some((r) => r.name === 'Super Admin');
  }, [storeIsSuperAdmin, effectiveRoles]);

  const isWorkspaceAdmin = useMemo(() => {
    if (isSuperAdmin) return true;
    return (
      effectiveRoles.some((r) => r.name === 'Workspace Admin') ||
      effectivePermissions.includes('*')
    );
  }, [isSuperAdmin, effectiveRoles, effectivePermissions]);

  const roles = useMemo(() => {
    if (effectiveRoles.length > 0) return effectiveRoles.map((r) => r.name);
    if (user?.roles && user.roles.length > 0) return user.roles.map((r) => r.name);
    return ['Viewer'];
  }, [effectiveRoles, user]);

  const primaryRole = roles[0] || 'Viewer';

  const permSet = useMemo(() => {
    const set = new Set<string>(effectivePermissions);
    if (isSuperAdmin || isWorkspaceAdmin) set.add('*');
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
