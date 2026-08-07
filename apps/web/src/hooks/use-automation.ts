'use client';

/**
 * ForgeCRM — useAutomation Hook
 *
 * TanStack Query hooks for the Workflow Automation Engine REST API.
 * Provides CRUD, toggle, test trigger, run history, and templates.
 *
 * All headers (Authorization, X-Workspace-ID) are injected by the
 * centralized API client.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api-client';
import { useWorkspaceStore } from '@/stores/workspace-store';
import type {
  AutomationListResponse,
  AutomationRuleCreate,
  AutomationRuleDetail,
  AutomationRuleUpdate,
  AutomationRun,
  AutomationTemplate,
  TestAutomationRequest,
  TestAutomationResponse,
  ToggleResponse,
  UseTemplateRequest,
} from '@/types';

export function useAutomation() {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspaceStore();
  const workspaceId = currentWorkspace?.id;

  // ── List Rules ──────────────────────────────────────────────────────────────

  const useAutomationRules = (params?: {
    page?: number | undefined;
    page_size?: number | undefined;
    search?: string | undefined;
    is_active?: boolean | undefined;
  }) => {
    const qp = new URLSearchParams();
    if (params?.page) qp.set('page', String(params.page));
    if (params?.page_size) qp.set('page_size', String(params.page_size));
    if (params?.search) qp.set('search', params.search);
    if (params?.is_active !== undefined) qp.set('is_active', String(params.is_active));

    return useQuery<AutomationListResponse>({
      queryKey: ['automations', workspaceId, params],
      queryFn: () => apiGet<AutomationListResponse>(`/automations?${qp.toString()}`),
      enabled: !!workspaceId,
    });
  };

  // ── Get Rule Detail ─────────────────────────────────────────────────────────

  const useAutomationRule = (ruleId: string | undefined) =>
    useQuery<AutomationRuleDetail>({
      queryKey: ['automation', workspaceId, ruleId],
      queryFn: () => apiGet<AutomationRuleDetail>(`/automations/${ruleId}`),
      enabled: !!workspaceId && !!ruleId,
    });

  // ── Create Rule ─────────────────────────────────────────────────────────────

  const createAutomationRule = useMutation({
    mutationFn: (payload: AutomationRuleCreate) =>
      apiPost<AutomationRuleDetail>('/automations', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations', workspaceId] });
    },
  });

  // ── Update Rule ─────────────────────────────────────────────────────────────

  const updateAutomationRule = useMutation({
    mutationFn: ({ ruleId, payload }: { ruleId: string; payload: AutomationRuleUpdate }) =>
      apiPatch<AutomationRuleDetail>(`/automations/${ruleId}`, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['automations', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['automation', workspaceId, variables.ruleId] });
    },
  });

  // ── Delete Rule ─────────────────────────────────────────────────────────────

  const deleteAutomationRule = useMutation({
    mutationFn: (ruleId: string) => apiDelete<void>(`/automations/${ruleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations', workspaceId] });
    },
  });

  // ── Toggle Rule ─────────────────────────────────────────────────────────────

  const toggleAutomationRule = useMutation({
    mutationFn: (ruleId: string) => apiPost<ToggleResponse>(`/automations/${ruleId}/toggle`, {}),
    onSuccess: (_data, ruleId) => {
      queryClient.invalidateQueries({ queryKey: ['automations', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['automation', workspaceId, ruleId] });
    },
  });

  // ── Test Rule ───────────────────────────────────────────────────────────────

  const testAutomationRule = useMutation({
    mutationFn: ({ ruleId, payload }: { ruleId: string; payload: TestAutomationRequest }) =>
      apiPost<TestAutomationResponse>(`/automations/${ruleId}/test`, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['automation-runs', workspaceId, variables.ruleId] });
    },
  });

  // ── Run History ─────────────────────────────────────────────────────────────

  const useAutomationRuns = (ruleId: string | undefined, page = 1) =>
    useQuery<AutomationRun[]>({
      queryKey: ['automation-runs', workspaceId, ruleId, page],
      queryFn: () => apiGet<AutomationRun[]>(`/automations/${ruleId}/runs?page=${page}&page_size=20`),
      enabled: !!workspaceId && !!ruleId,
    });

  const useAutomationRunDetail = (ruleId: string | undefined, runId: string | undefined) =>
    useQuery<AutomationRun>({
      queryKey: ['automation-run', workspaceId, ruleId, runId],
      queryFn: () => apiGet<AutomationRun>(`/automations/${ruleId}/runs/${runId}`),
      enabled: !!workspaceId && !!ruleId && !!runId,
    });

  // ── Templates ───────────────────────────────────────────────────────────────

  const useAutomationTemplates = (category?: string) =>
    useQuery<AutomationTemplate[]>({
      queryKey: ['automation-templates', category],
      queryFn: () => {
        const qp = category ? `?category=${encodeURIComponent(category)}` : '';
        return apiGet<AutomationTemplate[]>(`/automation-templates${qp}`);
      },
      enabled: !!workspaceId,
      staleTime: 5 * 60 * 1000, // Templates rarely change — 5 min cache
    });

  const useTemplateForRule = useMutation({
    mutationFn: ({ templateId, payload }: { templateId: string; payload: UseTemplateRequest }) =>
      apiPost<AutomationRuleDetail>(`/automation-templates/${templateId}/use`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automations', workspaceId] });
    },
  });

  const useAutomationSchema = () =>
    useQuery<Record<string, unknown>>({
      queryKey: ['automation-schema', workspaceId],
      queryFn: () => apiGet<Record<string, unknown>>('/automations/schema'),
      enabled: !!workspaceId,
      staleTime: 10 * 60 * 1000,
    });

  return {
    // Queries
    useAutomationRules,
    useAutomationRule,
    useAutomationRuns,
    useAutomationRunDetail,
    useAutomationTemplates,
    useAutomationSchema,

    // Mutations
    createAutomationRule,
    updateAutomationRule,
    deleteAutomationRule,
    toggleAutomationRule,
    testAutomationRule,
    useTemplateForRule,
  };
}

