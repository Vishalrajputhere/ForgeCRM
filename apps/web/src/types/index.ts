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

// ── Role & User DTOs ──────────────────────────────────────────────────────────

export interface RoleResponse {
  id: string;
  name: string;
  description?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  is_active: boolean;
  roles?: RoleResponse[];
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user?: UserResponse;
}

export interface UserProfileUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
}

// ── Workspace Domain DTOs ──────────────────────────────────────────────────────

export interface WorkspaceResponse {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  industry?: string;
  website?: string;
  company_size?: number;
  subscription_plan: string;
  status: string;
  created_at: string;
  role?: RoleResponse;
}

export interface WorkspaceCreate {
  name: string;
  slug?: string;
  industry?: string;
  website?: string;
  company_size?: number;
}

export interface WorkspaceMemberResponse {
  id: string;
  workspace_id: string;
  user_id: string;
  user: UserResponse;
  role: RoleResponse;
  status: string;
  joined_at: string;
  last_active_at?: string;
  is_default_workspace: boolean;
}

export interface InviteMemberRequest {
  email: string;
  role_id: string;
}

export interface WorkspaceSettingsResponse {
  workspace_id: string;
  timezone: string;
  currency: string;
  language: string;
  date_format: string;
  time_format: string;
  week_start_day: number;
  branding_primary_color?: string;
  branding_logo_url?: string;
}

// ── CRM Domain DTOs ───────────────────────────────────────────────────────────

export interface CompanyResponse {
  id: string;
  workspace_id: string;
  owner_member_id: string;
  name: string;
  legal_name?: string;
  industry_id?: string;
  website?: string;
  email?: string;
  phone?: string;
  annual_revenue?: number;
  employee_count?: number;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyCreate {
  name: string;
  legal_name?: string;
  industry_id?: string;
  website?: string;
  email?: string;
  phone?: string;
  annual_revenue?: number;
  employee_count?: number;
  description?: string;
}

export interface ContactResponse {
  id: string;
  workspace_id: string;
  company_id: string;
  owner_member_id: string;
  first_name: string;
  last_name: string;
  job_title?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  linkedin_url?: string;
  birthday?: string;
  is_primary: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ContactCreate {
  company_id: string;
  first_name: string;
  last_name: string;
  job_title?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  linkedin_url?: string;
  birthday?: string;
  is_primary?: boolean;
}

export interface LeadResponse {
  id: string;
  workspace_id: string;
  owner_member_id: string;
  source_id?: string;
  status_id: string;
  first_name: string;
  last_name?: string;
  company_name?: string;
  job_title?: string;
  email?: string;
  phone?: string;
  website?: string;
  estimated_value?: number;
  priority: string;
  description?: string;
  converted_at?: string;
  created_at: string;
}

export interface LeadCreate {
  first_name: string;
  last_name?: string;
  company_name?: string;
  job_title?: string;
  email?: string;
  phone?: string;
  website?: string;
  estimated_value?: number;
  priority?: string;
  description?: string;
  source_id?: string;
  status_id?: string;
}

export interface LeadConvertRequest {
  create_deal?: boolean;
  deal_name?: string;
  deal_value?: number;
  pipeline_id?: string;
  stage_id?: string;
}

export interface StageResponse {
  id: string;
  pipeline_id: string;
  name: string;
  sort_order: number;
  probability: number;
  is_closed: boolean;
  is_won: boolean;
  color?: string;
}

export interface PipelineResponse {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  is_default: boolean;
  is_active: boolean;
  stages: StageResponse[];
}

export interface DealProductSchema {
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  line_total: number;
}

export interface DealResponse {
  id: string;
  workspace_id: string;
  pipeline_id: string;
  stage_id: string;
  company_id: string;
  primary_contact_id?: string;
  owner_member_id: string;
  name: string;
  value: number;
  expected_close_date?: string;
  probability?: number;
  status: string;
  loss_reason?: string;
  description?: string;
  created_at: string;
  products?: DealProductSchema[];
}

export interface DealCreate {
  name: string;
  company_id: string;
  pipeline_id?: string;
  stage_id?: string;
  primary_contact_id?: string;
  value?: number;
  expected_close_date?: string;
  probability?: number;
  description?: string;
}

export interface DealStageMoveRequest {
  stage_id: string;
  loss_reason?: string;
}

export interface TaskResponse {
  id: string;
  workspace_id: string;
  owner_member_id: string;
  assigned_member_id: string;
  entity_type?: string;
  entity_id?: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  priority?: string;
  due_date?: string;
  assigned_member_id?: string;
  entity_type?: string;
  entity_id?: string;
}

// ── Storage Domain DTOs ───────────────────────────────────────────────────────

export interface DocumentAttachmentResponse {
  id: string;
  workspace_id: string;
  uploaded_by_member_id: string;
  entity_type: string;
  entity_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  storage_key: string;
  storage_provider: string;
  created_at: string;
}

export interface PresignedUploadResponse {
  storage_key: string;
  upload_url: string;
  expires_in_seconds: number;
}

export interface PresignedDownloadResponse {
  download_url: string;
  expires_in_seconds: number;
}

export interface RequestUploadUrlRequest {
  entity_type: string;
  entity_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
}

export interface ConfirmUploadRequest {
  storage_key: string;
  entity_type: string;
  entity_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
}

// ── Global Search Domain DTOs ──────────────────────────────────────────────────

export interface SearchResultItem {
  id: string;
  entity_type: string;
  title: string;
  subtitle?: string;
  url?: string;
}

export interface GlobalSearchResponse {
  query: string;
  total: number;
  results: SearchResultItem[];
}


