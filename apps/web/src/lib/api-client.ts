/**
 * ForgeCRM — Centralized API Client
 *
 * Central authority for all HTTP communication with the backend.
 * Components and hooks never call fetch() or axios directly.
 *
 * Header Injection Policy (Centralized):
 * Every authenticated request automatically includes:
 *   1. Authorization: Bearer <access_token>
 *   2. X-Workspace-ID: <workspace_uuid>
 *   3. X-Request-ID: <correlation_id>
 *
 * No React component or hook is allowed to manually construct or attach headers.
 *
 * Documentation: docs/04_Frontend/401_FRONTEND_OVERVIEW.md §10
 */

import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import { useAuthStore } from '@/stores/auth-store';
import { getWorkspaceIdSync, useWorkspaceStore } from '@/stores/workspace-store';

// ── API Error ─────────────────────────────────────────────────────────────────

export interface ApiErrorResponse {
  error_code: string;
  message: string;
  details?: unknown;
  request_id?: string;
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details: unknown;
  public readonly requestId: string | undefined;

  constructor(response: ApiErrorResponse, statusCode: number) {
    super(response.message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = response.error_code;
    this.details = response.details;
    this.requestId = response.request_id;
  }

  get isNotFound(): boolean {
    return this.statusCode === 404;
  }

  get isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  get isForbidden(): boolean {
    return this.statusCode === 403;
  }

  get isValidationError(): boolean {
    return this.statusCode === 422;
  }

  get isServerError(): boolean {
    return this.statusCode >= 500;
  }
}

// ── Client Configuration ──────────────────────────────────────────────────────

// In the browser, use a relative base URL ("") so all requests go through
// the Next.js dev-server reverse proxy (configured in next.config.ts).
// This eliminates cross-origin requests to :8000 entirely — no CORS needed.
// For SSR (Node.js), we still need the absolute URL to reach the backend.
const API_BASE_URL =
  typeof window !== 'undefined'
    ? '' // relative → Next.js proxy → http://localhost:8000
    : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000');

const API_PREFIX = '/api/v1';

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: `${API_BASE_URL}${API_PREFIX}`,
    timeout: 30_000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    withCredentials: true,
  });

  // ── Centralized Request Interceptor ─────────────────────────────────────
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // 1. Correlation ID
      config.headers['X-Request-ID'] = generateRequestId();

      // 2. Authorization Header Injection
      let token = useAuthStore.getState().accessToken;
      if (!token && typeof window !== 'undefined') {
        try {
          const rawAuth = localStorage.getItem('forge_auth_storage');
          if (rawAuth) {
            const parsed = JSON.parse(rawAuth);
            token = parsed?.state?.accessToken ?? null;
          }
        } catch {
          // Ignore JSON parse errors
        }
      }
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // 3. X-Workspace-ID Header Injection
      // Only skip workspace header for routes that genuinely don't need a tenant context:
      //   - /auth/* (all auth operations)
      //   - GET /workspaces (list user workspaces — not tenant-scoped)
      //   - POST /workspaces (create workspace — not tenant-scoped)
      //   - /workspaces/invitations/accept (accept invite — not tenant-scoped)
      const isPublicRoute =
        config.url?.startsWith('/auth/') ||
        config.url === '/workspaces' ||
        config.url === '/workspaces/invitations/accept' ||
        config.url?.startsWith('/workspaces/invitations/accept') ||
        config.url === '/automations/schema';

      if (!isPublicRoute) {
        // getWorkspaceIdSync reads from Zustand state first, then falls back to
        // localStorage directly. This works even before Zustand completes
        // its async rehydration from localStorage.
        const wsId = getWorkspaceIdSync();
        if (wsId) {
          config.headers['X-Workspace-ID'] = wsId;
        }
      }

      return config;
    },
    (error: unknown) => Promise.reject(error),
  );

  // ── Centralized Response Interceptor ────────────────────────────────────
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError<ApiErrorResponse>) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retried?: boolean;
      };

      // Handle 401 Unauthorized — attempt token refresh
      if (
        error.response?.status === 401 &&
        !originalRequest._retried &&
        !originalRequest.url?.includes('/auth/refresh') &&
        !originalRequest.url?.includes('/auth/login')
      ) {
        originalRequest._retried = true;

        try {
          const newToken = await refreshAccessToken();
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return client(originalRequest);
        } catch {
          useAuthStore.getState().clearAuth();
          useWorkspaceStore.getState().clearWorkspaceState();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      }

      // Normalize error into ApiError
      if (error.response?.data != null) {
        let data = error.response.data as unknown as Record<string, unknown> | Blob;
        if (typeof Blob !== 'undefined' && data instanceof Blob) {
          try {
            const rawText = await data.text();
            data = JSON.parse(rawText) as Record<string, unknown>;
          } catch {
            data = { error_code: 'RESPONSE_ERROR', message: 'Failed to process server response.' };
          }
        }

        const errObj = data as Record<string, unknown>;
        throw new ApiError(
          {
            error_code: (errObj.error_code as string) ?? 'UNKNOWN_ERROR',
            message: (errObj.message as string) ?? (errObj.detail as string) ?? 'An unexpected error occurred.',
            details: errObj.details,
            ...(errObj.request_id ? { request_id: errObj.request_id as string } : {}),
          },
          error.response.status,
        );
      }

      if (error.code === 'ECONNABORTED') {
        throw new ApiError(
          { error_code: 'REQUEST_TIMEOUT', message: 'The request timed out.' },
          408,
        );
      }

      if (error.message === 'Network Error') {
        throw new ApiError(
          {
            error_code: 'NETWORK_ERROR',
            message: 'Unable to connect to the server.',
          },
          0,
        );
      }

      throw error;
    },
  );

  return client;
}

// ── Token Refresh ─────────────────────────────────────────────────────────────

async function refreshAccessToken(): Promise<string> {
  const { refreshToken, setAuth, user } = useAuthStore.getState();

  if (!refreshToken) {
    throw new Error('No refresh token stored.');
  }

  const response = await axios.post<{
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    user?: unknown;
  }>(`${API_BASE_URL}${API_PREFIX}/auth/refresh`, {
    refresh_token: refreshToken,
  });

  const { access_token, refresh_token } = response.data;

  if (user) {
    setAuth(user, access_token, refresh_token);
  }

  return access_token;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function generateRequestId(): string {
  return `req_${Math.random().toString(36).slice(2, 11)}`;
}

// ── Singleton Client ──────────────────────────────────────────────────────────

export const apiClient = createApiClient();

// ── Typed Request Helpers ─────────────────────────────────────────────────────

export async function apiGet<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.get<T>(url, config);
  return response.data;
}

export async function apiPost<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
}

export async function apiPatch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.patch<T>(url, data, config);
  return response.data;
}

export async function apiDelete<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
}

export function setAccessToken(_token: string): void {}
export function clearTokens(): void {}
