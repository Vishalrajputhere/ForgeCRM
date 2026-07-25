'use client';

/**
 * ForgeCRM — useCRM Hook
 *
 * Custom React hook for CRM Core entity queries, mutations, and pipeline drag-and-drop operations.
 * Automatically attaches X-Workspace-ID header via API client.
 *
 * Documentation: docs/04_Frontend/401_FRONTEND_OVERVIEW.md
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiPost } from '@/lib/api-client';
import { useWorkspaceStore } from '@/stores/workspace-store';
import type {
  CompanyCreate,
  CompanyResponse,
  ContactCreate,
  ContactResponse,
  DealCreate,
  DealResponse,
  DealStageMoveRequest,
  LeadConvertRequest,
  LeadCreate,
  LeadResponse,
  PipelineResponse,
  TaskCreate,
  TaskResponse,
} from '@/types';

export function useCRM() {
  const queryClient = useQueryClient();
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const workspaceId = currentWorkspace?.id;

  const getOptions = () => (workspaceId ? { headers: { 'X-Workspace-ID': workspaceId } } : {});

  // ── Companies ─────────────────────────────────────────────────────────────
  const companiesQuery = useQuery({
    queryKey: ['companies', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      return await apiGet<CompanyResponse[]>('/companies', getOptions());
    },
    enabled: Boolean(workspaceId),
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (payload: CompanyCreate) => {
      return await apiPost<CompanyResponse>('/companies', payload, getOptions());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies', workspaceId] });
    },
  });

  // ── Contacts ──────────────────────────────────────────────────────────────
  const contactsQuery = useQuery({
    queryKey: ['contacts', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      return await apiGet<ContactResponse[]>('/contacts', getOptions());
    },
    enabled: Boolean(workspaceId),
  });

  const createContactMutation = useMutation({
    mutationFn: async (payload: ContactCreate) => {
      return await apiPost<ContactResponse>('/contacts', payload, getOptions());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', workspaceId] });
    },
  });

  // ── Leads ─────────────────────────────────────────────────────────────────
  const leadsQuery = useQuery({
    queryKey: ['leads', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      return await apiGet<LeadResponse[]>('/leads', getOptions());
    },
    enabled: Boolean(workspaceId),
  });

  const createLeadMutation = useMutation({
    mutationFn: async (payload: LeadCreate) => {
      return await apiPost<LeadResponse>('/leads', payload, getOptions());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', workspaceId] });
    },
  });

  const convertLeadMutation = useMutation({
    mutationFn: async ({ leadId, payload }: { leadId: string; payload: LeadConvertRequest }) => {
      return await apiPost(`/leads/${leadId}/convert`, payload, getOptions());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['companies', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['contacts', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['deals', workspaceId] });
    },
  });

  // ── Pipelines & Deals ──────────────────────────────────────────────────────
  const pipelinesQuery = useQuery({
    queryKey: ['pipelines', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      return await apiGet<PipelineResponse[]>('/pipelines', getOptions());
    },
    enabled: Boolean(workspaceId),
  });

  const dealsQuery = useQuery({
    queryKey: ['deals', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      return await apiGet<DealResponse[]>('/deals', getOptions());
    },
    enabled: Boolean(workspaceId),
  });

  const createDealMutation = useMutation({
    mutationFn: async (payload: DealCreate) => {
      return await apiPost<DealResponse>('/deals', payload, getOptions());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals', workspaceId] });
    },
  });

  const moveDealStageMutation = useMutation({
    mutationFn: async ({ dealId, payload }: { dealId: string; payload: DealStageMoveRequest }) => {
      return await apiPost<DealResponse>(`/deals/${dealId}/move-stage`, payload, getOptions());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals', workspaceId] });
    },
  });

  // ── Tasks ──────────────────────────────────────────────────────────────────
  const tasksQuery = useQuery({
    queryKey: ['tasks', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      return await apiGet<TaskResponse[]>('/tasks', getOptions());
    },
    enabled: Boolean(workspaceId),
  });

  const createTaskMutation = useMutation({
    mutationFn: async (payload: TaskCreate) => {
      return await apiPost<TaskResponse>('/tasks', payload, getOptions());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] });
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return await apiPost<TaskResponse>(`/tasks/${taskId}/complete`, {}, getOptions());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] });
    },
  });

  return {
    companies: companiesQuery.data ?? [],
    isLoadingCompanies: companiesQuery.isLoading,
    createCompany: createCompanyMutation.mutateAsync,

    contacts: contactsQuery.data ?? [],
    isLoadingContacts: contactsQuery.isLoading,
    createContact: createContactMutation.mutateAsync,

    leads: leadsQuery.data ?? [],
    isLoadingLeads: leadsQuery.isLoading,
    createLead: createLeadMutation.mutateAsync,
    convertLead: convertLeadMutation.mutateAsync,

    pipelines: pipelinesQuery.data ?? [],
    deals: dealsQuery.data ?? [],
    isLoadingDeals: dealsQuery.isLoading,
    createDeal: createDealMutation.mutateAsync,
    moveDealStage: moveDealStageMutation.mutateAsync,

    tasks: tasksQuery.data ?? [],
    isLoadingTasks: tasksQuery.isLoading,
    createTask: createTaskMutation.mutateAsync,
    completeTask: completeTaskMutation.mutateAsync,
  };
}
