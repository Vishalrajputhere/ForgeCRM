/**
 * ForgeCRM — Shared TypeScript Types
 *
 * Common types used across the frontend application.
 * These mirror the backend Pydantic schemas.
 *
 * Documentation: docs/04_Frontend/401_FRONTEND_OVERVIEW.md
 */

// ── Common ────────────────────────────────────────────────────────────────────

export type UUID = string;

export interface Timestamps {
  readonly created_at: string;
  readonly updated_at: string;
}

export interface SoftDelete {
  readonly deleted_at: string | null;
}

export interface AuditFields extends Timestamps {
  readonly created_by: UUID | null;
  readonly updated_by: UUID | null;
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly page_size: number;
  readonly pages: number;
  readonly has_next: boolean;
  readonly has_prev: boolean;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export interface SortParams {
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface SearchParams {
  search?: string;
}

export type ListParams = PaginationParams & SortParams & SearchParams;

// ── API Error ─────────────────────────────────────────────────────────────────

export interface ApiErrorDetail {
  readonly field?: string;
  readonly message: string;
  readonly code?: string;
}

export interface ApiErrorResponse {
  readonly error_code: string;
  readonly message: string;
  readonly details?: readonly ApiErrorDetail[] | Record<string, unknown> | string;
  readonly request_id?: string;
}

// ── Health ────────────────────────────────────────────────────────────────────

export type ServiceStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface ServiceCheck {
  readonly status: ServiceStatus;
  readonly latency_ms?: number;
  readonly message?: string;
}

export interface HealthResponse {
  readonly status: ServiceStatus;
  readonly timestamp: string;
  readonly version: string;
  readonly environment: string;
  readonly uptime_seconds: number;
  readonly services: Record<string, ServiceCheck>;
}

// ── App State ─────────────────────────────────────────────────────────────────

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type Theme = 'light' | 'dark' | 'system';

// ── Forms ─────────────────────────────────────────────────────────────────────

export interface FormState<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
}

// ── Select Option ─────────────────────────────────────────────────────────────

export interface SelectOption<T = string> {
  readonly value: T;
  readonly label: string;
  readonly disabled?: boolean;
  readonly description?: string;
}
