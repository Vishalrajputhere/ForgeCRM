/**
 * ForgeCRM — Auth Zustand Store
 *
 * Client-side global authentication state management.
 * Persists user state and tokens.
 *
 * Documentation: docs/04_Frontend/404_STATE_MANAGEMENT.md
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface UserState {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  job_title?: string | null;
  timezone: string;
  language: string;
  is_active: boolean;
  is_email_verified: boolean;
  roles: { id: string; name: string }[];
}

export interface EffectiveAuthData {
  permissions: string[];
  roles: { id: string; name: string }[];
  authorizationVersion: number;
  isSuperAdmin: boolean;
}

interface AuthStore {
  user: UserState | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  effectivePermissions: string[];
  effectiveRoles: { id: string; name: string }[];
  authorizationVersion: number;
  isSuperAdmin: boolean;
  /** True once Zustand has finished reading from localStorage. */
  _hydrated: boolean;

  setAuth: (user: UserState, accessToken: string, refreshToken: string) => void;
  setUser: (user: UserState) => void;
  setEffectiveAuthorization: (data: EffectiveAuthData) => void;
  clearAuth: () => void;
  _setHydrated: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      effectivePermissions: [],
      effectiveRoles: [],
      authorizationVersion: 1,
      isSuperAdmin: false,
      _hydrated: false,

      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      setUser: (user) =>
        set({
          user,
        }),

      setEffectiveAuthorization: (data) =>
        set((state) => ({
          effectivePermissions: data.permissions,
          effectiveRoles: data.roles,
          authorizationVersion: data.authorizationVersion,
          isSuperAdmin: data.isSuperAdmin,
          user: state.user
            ? {
                ...state.user,
                roles: data.roles.length > 0 ? data.roles : state.user.roles,
              }
            : null,
        })),

      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          effectivePermissions: [],
          effectiveRoles: [],
          authorizationVersion: 1,
          isSuperAdmin: false,
        }),

      _setHydrated: () => set({ _hydrated: true }),
    }),
    {
      name: 'forge_auth_storage',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : ({} as Storage),
      ),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        effectivePermissions: state.effectivePermissions,
        effectiveRoles: state.effectiveRoles,
        authorizationVersion: state.authorizationVersion,
        isSuperAdmin: state.isSuperAdmin,
      }),
      onRehydrateStorage: () => (state) => {
        state?._setHydrated();
      },
    },
  ),
);
