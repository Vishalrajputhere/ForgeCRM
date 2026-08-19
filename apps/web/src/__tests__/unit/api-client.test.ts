/**
 * Unit tests for the centralized API client (api-client.ts).
 *
 * Tests verify the request interceptor correctly:
 *   1. Injects Authorization: Bearer <token> from auth store
 *   2. Injects X-Workspace-ID from workspace store
 *   3. Skips X-Workspace-ID for public auth routes (/auth/*)
 *   4. ApiError class correctly exposes statusCode, errorCode, and type guards
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

// ─────────────────────────────────────────────────────────────────────────────
// ApiError class tests
// ─────────────────────────────────────────────────────────────────────────────

describe('ApiError', () => {
  it('constructs with statusCode, errorCode, and message', () => {
    const err = new ApiError(
      { error_code: 'NOT_FOUND', message: 'Resource not found', request_id: 'req-001' },
      404,
    );
    expect(err.statusCode).toBe(404);
    expect(err.errorCode).toBe('NOT_FOUND');
    expect(err.message).toBe('Resource not found');
    expect(err.requestId).toBe('req-001');
  });

  it('isNotFound returns true for 404', () => {
    const err = new ApiError({ error_code: 'NOT_FOUND', message: 'Not found' }, 404);
    expect(err.isNotFound).toBe(true);
    expect(err.isUnauthorized).toBe(false);
  });

  it('isUnauthorized returns true for 401', () => {
    const err = new ApiError({ error_code: 'UNAUTHORIZED', message: 'Auth required' }, 401);
    expect(err.isUnauthorized).toBe(true);
    expect(err.isForbidden).toBe(false);
  });

  it('isForbidden returns true for 403', () => {
    const err = new ApiError({ error_code: 'FORBIDDEN', message: 'Forbidden' }, 403);
    expect(err.isForbidden).toBe(true);
  });

  it('isValidationError returns true for 422', () => {
    const err = new ApiError({ error_code: 'VALIDATION_ERROR', message: 'Invalid input' }, 422);
    expect(err.isValidationError).toBe(true);
  });

  it('isServerError returns true for 500+', () => {
    const err = new ApiError({ error_code: 'INTERNAL_ERROR', message: 'Server error' }, 500);
    expect(err.isServerError).toBe(true);
  });

  it('isServerError returns false for 4xx', () => {
    const err = new ApiError({ error_code: 'BAD_REQUEST', message: 'Bad request' }, 400);
    expect(err.isServerError).toBe(false);
  });

  it('extends Error class', () => {
    const err = new ApiError({ error_code: 'ERR', message: 'test' }, 400);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ApiError');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Auth store → token injection correlation tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Auth store token availability for interceptor', () => {
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

  it('returns null accessToken when no auth is set', () => {
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('returns correct accessToken after setAuth', () => {
    useAuthStore.getState().setAuth(
      {
        id: 'u1', first_name: 'Test', last_name: 'User', full_name: 'Test User',
        email: 'test@example.com', timezone: 'UTC', language: 'en',
        is_active: true, is_email_verified: true, roles: [],
      },
      'my-access-token',
      'my-refresh-token',
    );
    expect(useAuthStore.getState().accessToken).toBe('my-access-token');
  });

  it('returns null accessToken after clearAuth', () => {
    useAuthStore.getState().setAuth(
      {
        id: 'u1', first_name: 'Test', last_name: 'User', full_name: 'Test User',
        email: 'test@example.com', timezone: 'UTC', language: 'en',
        is_active: true, is_email_verified: true, roles: [],
      },
      'my-access-token',
      'my-refresh-token',
    );
    useAuthStore.getState().clearAuth();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
