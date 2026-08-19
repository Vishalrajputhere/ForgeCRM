/**
 * Unit tests for the auth-store Zustand state.
 *
 * Tests cover:
 *   - setAuth: sets user, tokens, and isAuthenticated=true
 *   - clearAuth: resets all auth state to initial values
 *   - setEffectiveAuthorization: updates permissions, roles, version, isSuperAdmin
 *   - setUser: updates user without touching tokens/auth state
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/auth-store';
import type { UserState, EffectiveAuthData } from '@/stores/auth-store';

const MOCK_USER: UserState = {
  id: 'user-uuid-001',
  first_name: 'Alice',
  last_name: 'Smith',
  full_name: 'Alice Smith',
  email: 'alice@example.com',
  timezone: 'UTC',
  language: 'en',
  is_active: true,
  is_email_verified: true,
  roles: [{ id: 'role-001', name: 'member' }],
};

const MOCK_AUTH_DATA: EffectiveAuthData = {
  permissions: ['companies.view', 'deals.view', 'leads.create'],
  roles: [{ id: 'role-admin', name: 'workspace_admin' }],
  authorizationVersion: 5,
  isSuperAdmin: false,
};

// Reset store to a clean state before each test
beforeEach(() => {
  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    effectivePermissions: [],
    effectiveRoles: [],
    authorizationVersion: 1,
    isSuperAdmin: false,
    _hydrated: false,
  });
});

describe('Auth Store — setAuth', () => {
  it('stores user, access token, and refresh token', () => {
    useAuthStore.getState().setAuth(MOCK_USER, 'access-token-abc', 'refresh-token-xyz');
    const state = useAuthStore.getState();
    expect(state.user).toEqual(MOCK_USER);
    expect(state.accessToken).toBe('access-token-abc');
    expect(state.refreshToken).toBe('refresh-token-xyz');
  });

  it('sets isAuthenticated to true', () => {
    useAuthStore.getState().setAuth(MOCK_USER, 'token', 'refresh');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});

describe('Auth Store — clearAuth', () => {
  it('resets all auth state', () => {
    useAuthStore.getState().setAuth(MOCK_USER, 'token', 'refresh');
    useAuthStore.getState().clearAuth();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.effectivePermissions).toEqual([]);
    expect(state.isSuperAdmin).toBe(false);
  });
});

describe('Auth Store — setEffectiveAuthorization', () => {
  it('updates permissions and roles correctly', () => {
    useAuthStore.getState().setAuth(MOCK_USER, 'token', 'refresh');
    useAuthStore.getState().setEffectiveAuthorization(MOCK_AUTH_DATA);
    const state = useAuthStore.getState();
    expect(state.effectivePermissions).toEqual(MOCK_AUTH_DATA.permissions);
    expect(state.effectiveRoles).toEqual(MOCK_AUTH_DATA.roles);
    expect(state.authorizationVersion).toBe(5);
    expect(state.isSuperAdmin).toBe(false);
  });

  it('sets isSuperAdmin when provided', () => {
    useAuthStore.getState().setAuth(MOCK_USER, 'token', 'refresh');
    useAuthStore.getState().setEffectiveAuthorization({
      ...MOCK_AUTH_DATA,
      isSuperAdmin: true,
    });
    expect(useAuthStore.getState().isSuperAdmin).toBe(true);
  });

  it('merges user roles from effective roles when available', () => {
    useAuthStore.getState().setAuth(MOCK_USER, 'token', 'refresh');
    useAuthStore.getState().setEffectiveAuthorization(MOCK_AUTH_DATA);
    const { user } = useAuthStore.getState();
    expect(user?.roles).toEqual(MOCK_AUTH_DATA.roles);
  });
});

describe('Auth Store — setUser', () => {
  it('updates user without changing tokens', () => {
    useAuthStore.getState().setAuth(MOCK_USER, 'access-token', 'refresh-token');
    const updatedUser = { ...MOCK_USER, first_name: 'Bob', full_name: 'Bob Smith' };
    useAuthStore.getState().setUser(updatedUser);
    const state = useAuthStore.getState();
    expect(state.user?.first_name).toBe('Bob');
    expect(state.accessToken).toBe('access-token'); // unchanged
    expect(state.isAuthenticated).toBe(true); // unchanged
  });
});
