/**
 * ForgeCRM — useAIFetch Hook
 *
 * Centralized authenticated fetch for all AI API calls.
 * Automatically injects:
 *   - Authorization: Bearer <access_token>  (from auth store / localStorage)
 *   - Content-Type: application/json
 *   - X-Workspace-ID: <workspace_uuid>
 *
 * All AI pages MUST use this hook instead of raw fetch().
 * This mirrors the header injection logic in api-client.ts.
 */

'use client';

import { useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { getWorkspaceIdSync } from '@/stores/workspace-store';

export interface AIFetchOptions {
  workspaceId?: string | undefined;
}

export function useAIFetch(options?: AIFetchOptions) {
  /**
   * Builds authenticated headers for every AI request.
   * Reads the access token from Zustand store first, then falls back to
   * localStorage (handles SSR/hydration timing edge cases).
   */
  const buildHeaders = useCallback((): Record<string, string> => {
    // ── 1. Authorization ─────────────────────────────────────────────────────
    let token = useAuthStore.getState().accessToken;
    if (!token && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('forge_auth_storage');
        if (raw) {
          const parsed = JSON.parse(raw);
          token = parsed?.state?.accessToken ?? null;
        }
      } catch {
        // ignore
      }
    }

    // ── 2. X-Workspace-ID ────────────────────────────────────────────────────
    const wsId = options?.workspaceId || getWorkspaceIdSync() || '';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Workspace-ID': wsId,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Debug: log once per request so auth issues are immediately visible
    if (process.env.NODE_ENV === 'development') {
      console.debug('[useAIFetch] headers built:', {
        hasToken: !!token,
        tokenPreview: token ? token.slice(0, 20) + '...' : 'MISSING',
        workspaceId: wsId || 'MISSING',
      });
    }

    return headers;
  }, [options?.workspaceId]);

  /**
   * Authenticated request to any AI endpoint (defaults to POST, supports GET/DELETE).
   */
  const aiFetch = useCallback(
    async (url: string, body: unknown = null, method: string = 'POST'): Promise<Response> => {
      const headers = buildHeaders();
      const options: RequestInit = {
        method: method.toUpperCase(),
        headers,
        credentials: 'include',
      };
      if (body !== null && body !== undefined) {
        options.body = JSON.stringify(body);
      }
      const res = await fetch(url, options);
      return res;
    },
    [buildHeaders],
  );

  return { aiFetch, buildHeaders };
}
