'use client';

/**
 * ForgeCRM — useAuth Hook
 *
 * Custom React hook wrapping authentication workflows (login, register, logout, profile update).
 * Integrates TanStack Query with Zustand auth store.
 *
 * Tokens are stored exclusively in Zustand (persisted via localStorage).
 * The API client reads tokens directly from the store — no sessionStorage.
 *
 * Documentation: docs/04_Frontend/401_FRONTEND_OVERVIEW.md
 *
 * CRITICAL: After login/register, workspace is fetched immediately and stored
 * in Zustand + localStorage BEFORE redirect. This ensures X-Workspace-ID is
 * always available in the API client interceptor for all subsequent CRM requests.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { apiGet, apiPatch, apiPost } from '@/lib/api-client';
import { useAuthStore, type UserState } from '@/stores/auth-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import type { LoginRequest, RegisterRequest, TokenResponse, UserProfileUpdate, WorkspaceResponse } from '@/types';

// ── Internal helper: fetch and persist workspace after auth ───────────────────

/**
 * Fetches the user's workspaces immediately after authentication and writes
 * the first workspace into the Zustand store (and therefore localStorage).
 *
 * This MUST be called before router.push('/dashboard') so that the
 * X-Workspace-ID header is available for all CRM requests from the first render.
 */
async function hydrateWorkspaceAfterAuth(): Promise<void> {
  try {
    const workspaces = await apiGet<WorkspaceResponse[]>('/workspaces');
    if (workspaces && workspaces.length > 0) {
      // Write directly into the store. Zustand persist middleware will
      // immediately sync this to localStorage (forge_workspace_storage).
      useWorkspaceStore.getState().setUserWorkspaces(workspaces);
      // Explicitly set current workspace so the api-client interceptor
      // can find it from getState() synchronously on the very next request.
      const current = useWorkspaceStore.getState().currentWorkspace;
      if (!current) {
        useWorkspaceStore.getState().setCurrentWorkspace(workspaces[0] ?? null);
      }
    }
  } catch {
    // Non-fatal: workspace will be fetched again by useWorkspace() in the layout.
    // The user may see a brief workspace-loading state on first CRM operation.
  }
}

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, setAuth, setUser, clearAuth } = useAuthStore();
  const clearWorkspaceState = useWorkspaceStore((s) => s.clearWorkspaceState);

  // ── Login Mutation ──────────────────────────────────────────────────────────
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await apiPost<TokenResponse>('/auth/login', credentials);
      return response;
    },
    onSuccess: async (data) => {
      // 1. Write tokens and user into Zustand (synced to localStorage immediately)
      setAuth(data.user as unknown as UserState, data.access_token, data.refresh_token);
      queryClient.setQueryData(['current_user'], data.user);

      // 2. Immediately fetch and store workspace BEFORE redirect.
      //    This ensures X-Workspace-ID is ready for all CRM requests.
      await hydrateWorkspaceAfterAuth();

      // 3. Redirect to dashboard — workspace is now in localStorage
      router.push('/dashboard');
    },
  });

  // ── Register Mutation ───────────────────────────────────────────────────────
  const registerMutation = useMutation({
    mutationFn: async (payload: RegisterRequest) => {
      const response = await apiPost<TokenResponse>('/auth/register', payload);
      return response;
    },
    onSuccess: async (data) => {
      // 1. Write tokens and user into Zustand
      setAuth(data.user as unknown as UserState, data.access_token, data.refresh_token);
      queryClient.setQueryData(['current_user'], data.user);

      // 2. Fetch and persist workspace before redirect.
      //    For new users, the backend auto-creates a default workspace on registration.
      await hydrateWorkspaceAfterAuth();

      // 3. Redirect
      router.push('/dashboard');
    },
  });

  // ── Logout Mutation ─────────────────────────────────────────────────────────
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await apiPost('/auth/logout');
      } catch {
        // Always complete local logout even if server call fails
      }
    },
    onSettled: () => {
      // Clear auth state from Zustand (localStorage)
      clearAuth();
      // Clear workspace state so no stale X-Workspace-ID leaks into next session
      clearWorkspaceState();
      // Clear all cached query data
      queryClient.clear();
      router.push('/login');
    },
  });

  // ── Update Profile Mutation ─────────────────────────────────────────────────
  const updateProfileMutation = useMutation({
    mutationFn: async (payload: UserProfileUpdate) => {
      const updatedUser = await apiPatch<UserState>('/auth/me', payload);
      return updatedUser;
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.setQueryData(['current_user'], updatedUser);
    },
  });

  // ── Fetch Profile Query ─────────────────────────────────────────────────────
  const userQuery = useQuery({
    queryKey: ['current_user'],
    queryFn: async () => {
      const userProfile = await apiGet<UserState>('/auth/me');
      setUser(userProfile);
      return userProfile;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false, // Don't retry auth queries — 401 means session is invalid
  });

  return {
    user: userQuery.data ?? user,
    isAuthenticated,
    isLoading: userQuery.isLoading,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
}
