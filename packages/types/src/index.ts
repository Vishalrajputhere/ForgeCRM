/**
 * @forgecrm/types — Shared TypeScript Types
 *
 * Common types shared between the web application and any future
 * additional applications (e.g., mobile, CLI tools).
 *
 * These types mirror the backend API contract.
 */

// Re-export all shared types
export type { UUID, Timestamps, SoftDelete, AuditFields } from './common';
export type { PaginatedResponse, PaginationParams, SortParams, SearchParams, ListParams } from './pagination';
export type { ApiErrorDetail, ApiErrorResponse } from './errors';
export type { ServiceStatus, ServiceCheck, HealthResponse } from './health';
