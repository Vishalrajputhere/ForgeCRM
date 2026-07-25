'use client';

/**
 * ForgeCRM — useAuth Hook
 *
 * Custom React hook wrapping authentication workflows (login, register, logout, profile update).
 * Integrates TanStack Query with Zustand auth store.
 *
 * Documentation: docs/04_Frontend/401_FRONTEND_OVERVIEW.md
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { apiGet, apiPatch, apiPost, setAccessToken, clearTokens } from '@/lib/api-client';
import { useAuthStore, type UserState } from '@/stores/auth-store';
import type { LoginRequest, RegisterRequest, TokenResponse, UserProfileUpdate } from '@/types';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, setAuth, setUser, clearAuth } = useAuthStore();

  // ── Login Mutation ──────────────────────────────────────────────────────────
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await apiPost<TokenResponse>('/auth/login', credentials);
      return response;
    },
    onSuccess: (data) => {
      setAccessToken(data.access_token);
      setAuth(data.user as unknown as UserState, data.access_token, data.refresh_token);
      queryClient.setQueryData(['current_user'], data.user);
      router.push('/dashboard');
    },
  });

  // ── Register Mutation ───────────────────────────────────────────────────────
  const registerMutation = useMutation({
    mutationFn: async (payload: RegisterRequest) => {
      const response = await apiPost<TokenResponse>('/auth/register', payload);
      return response;
    },
    onSuccess: (data) => {
      setAccessToken(data.access_token);
      setAuth(data.user as unknown as UserState, data.access_token, data.refresh_token);
      queryClient.setQueryData(['current_user'], data.user);
      router.push('/dashboard');
    },
  });

  // ── Logout Mutation ─────────────────────────────────────────────────────────
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await apiPost('/auth/logout');
      } catch {
        // Ignore logout network errors — always clear local session
      }
    },
    onSettled: () => {
      clearTokens();
      clearAuth();
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
