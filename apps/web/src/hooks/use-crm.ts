'use client';

/**
 * ForgeCRM — useCRM Hook
 *
 * Custom React hook for CRM Core entity queries, mutations, and pipeline operations.
 * Provides full CRUD for Companies, Contacts, Leads, Deals, Tasks.
 * All headers (Authorization, X-Workspace-ID, X-Request-ID) are automatically
 * attached by the central API client.
 *
 * Documentation: docs/04_Frontend/401_FRONTEND_OVERVIEW.md
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api-client';
import { useWorkspaceStore } from '@/stores/workspace-store';
import type {
  ActivityResponse,
  BulkArchiveRequest,
  BulkAssignOwnerRequest,
  BulkDeleteRequest,
  BulkDeleteResponse,
  BulkMoveStageRequest,
  BulkRestoreRequest,
  BulkUpdateStatusRequest,
  CSVImportRequest,
  CSVImportSummaryResponse,
  CompanyCreate,
  CompanyResponse,
  CompanyUpdate,
  ContactCreate,
  ContactResponse,
  ContactUpdate,
  DealCreate,
  DealResponse,
  DealStageMoveRequest,
  DealUpdate,
  ExportJobResponse,
  ExportRequest,
  ImportJobResponse,
  LeadConvertRequest,
  LeadCreate,
  LeadResponse,
  LeadUpdate,
  PipelineCreate,
  PipelineResponse,
  PipelineUpdate,
  StageCreate,
  StageReorderRequest,
  StageResponse,
  StageUpdate,
  TaskCreate,
  TaskResponse,
  TaskUpdate,
  WorkspaceResponse,
} from '@/types';

export function useCRM() {
  const queryClient = useQueryClient();
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const workspaceId = currentWorkspace?.id;

  /**
   * Returns the current workspace ID.
   * This is a final safety net that reads from both Zustand state
   * (fast path, post-hydration) and localStorage directly.
   */
  function requireWorkspace(): string {
    if (workspaceId) return workspaceId;

    const storeState = useWorkspaceStore.getState();
    if (storeState.currentWorkspace?.id) return storeState.currentWorkspace.id;
    if (storeState.userWorkspaces.length > 0 && storeState.userWorkspaces[0]?.id) {
      const firstWs = storeState.userWorkspaces[0];
      storeState.setCurrentWorkspace(firstWs);
      return firstWs.id;
    }

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('forge_workspace_storage');
        if (raw) {
          const parsed = JSON.parse(raw) as {
            state?: {
              currentWorkspace?: { id?: string };
              userWorkspaces?: WorkspaceResponse[];
            };
          };
          const wsId =
            parsed.state?.currentWorkspace?.id ??
            parsed.state?.userWorkspaces?.[0]?.id;
          if (wsId) {
            if (parsed.state?.userWorkspaces && parsed.state.userWorkspaces.length > 0) {
              useWorkspaceStore.getState().setUserWorkspaces(parsed.state.userWorkspaces);
            }
            return wsId;
          }
        }
      } catch {
        // Ignore parse errors
      }
    }

    throw new Error('Workspace not available. Please sign out and sign in again.');
  }

  // ── Companies ─────────────────────────────────────────────────────────────

  const companiesQuery = useQuery({
    queryKey: ['companies', workspaceId],
    queryFn: async () => apiGet<CompanyResponse[]>('/companies'),
    enabled: Boolean(workspaceId),
  });

  const useCompany = (companyId: string | undefined) =>
    useQuery({
      queryKey: ['company', workspaceId, companyId],
      queryFn: async () => apiGet<CompanyResponse>(`/companies/${companyId}`),
      enabled: Boolean(workspaceId) && Boolean(companyId),
    });

  const createCompanyMutation = useMutation({
    mutationFn: async (payload: CompanyCreate) => {
      requireWorkspace();
      return await apiPost<CompanyResponse>('/companies', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies', workspaceId] });
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: CompanyUpdate }) => {
      requireWorkspace();
      return await apiPatch<CompanyResponse>(`/companies/${id}`, payload as Record<string, unknown>);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['company', workspaceId, variables.id] });
    },
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: string) => {
      requireWorkspace();
      return await apiPatch<CompanyResponse>(`/companies/${id}`, { status: 'Inactive' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies', workspaceId] });
    },
  });

  // ── Contacts ──────────────────────────────────────────────────────────────

  const contactsQuery = useQuery({
    queryKey: ['contacts', workspaceId],
    queryFn: async () => apiGet<ContactResponse[]>('/contacts'),
    enabled: Boolean(workspaceId),
  });

  const useContactsByCompany = (companyId: string | undefined) =>
    useQuery({
      queryKey: ['contacts', workspaceId, 'company', companyId],
      queryFn: async () =>
        apiGet<ContactResponse[]>(`/contacts?company_id=${companyId}`),
      enabled: Boolean(workspaceId) && Boolean(companyId),
    });

  const useContact = (contactId: string | undefined) =>
    useQuery({
      queryKey: ['contact', workspaceId, contactId],
      queryFn: async () => apiGet<ContactResponse>(`/contacts/${contactId}`),
      enabled: Boolean(workspaceId) && Boolean(contactId),
    });

  const createContactMutation = useMutation({
    mutationFn: async (payload: ContactCreate) => {
      requireWorkspace();
      return await apiPost<ContactResponse>('/contacts', payload);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts', workspaceId] });
      queryClient.invalidateQueries({
        queryKey: ['contacts', workspaceId, 'company', variables.company_id],
      });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ContactUpdate }) => {
      requireWorkspace();
      return await apiPatch<ContactResponse>(`/contacts/${id}`, payload as Record<string, unknown>);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['contact', workspaceId, variables.id] });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      requireWorkspace();
      return await apiDelete<void>(`/contacts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', workspaceId] });
    },
  });

  // ── Leads ─────────────────────────────────────────────────────────────────

  const leadsQuery = useQuery({
    queryKey: ['leads', workspaceId],
    queryFn: async () => apiGet<LeadResponse[]>('/leads'),
    enabled: Boolean(workspaceId),
  });

  const useLead = (leadId: string | undefined) =>
    useQuery({
      queryKey: ['lead', workspaceId, leadId],
      queryFn: async () => apiGet<LeadResponse>(`/leads/${leadId}`),
      enabled: Boolean(workspaceId) && Boolean(leadId),
    });

  const createLeadMutation = useMutation({
    mutationFn: async (payload: LeadCreate) => {
      requireWorkspace();
      return await apiPost<LeadResponse>('/leads', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', workspaceId] });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: LeadUpdate }) => {
      requireWorkspace();
      return await apiPatch<LeadResponse>(`/leads/${id}`, payload as Record<string, unknown>);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['lead', workspaceId, variables.id] });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      requireWorkspace();
      return await apiDelete<void>(`/leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', workspaceId] });
    },
  });

  const convertLeadMutation = useMutation({
    mutationFn: async ({ leadId, payload }: { leadId: string; payload: LeadConvertRequest }) => {
      requireWorkspace();
      return apiPost(`/leads/${leadId}/convert`, payload);
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
    queryFn: async () => apiGet<PipelineResponse[]>('/pipelines'),
    enabled: Boolean(workspaceId),
  });

  const createPipelineMutation = useMutation({
    mutationFn: async (payload: PipelineCreate) => {
      requireWorkspace();
      return await apiPost<PipelineResponse>('/pipelines', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines', workspaceId] });
    },
  });

  const updatePipelineMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: PipelineUpdate }) => {
      requireWorkspace();
      return await apiPatch<PipelineResponse>(`/pipelines/${id}`, payload as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines', workspaceId] });
    },
  });

  const deletePipelineMutation = useMutation({
    mutationFn: async (id: string) => {
      requireWorkspace();
      return await apiDelete<void>(`/pipelines/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines', workspaceId] });
    },
  });

  const duplicatePipelineMutation = useMutation({
    mutationFn: async (id: string) => {
      requireWorkspace();
      return await apiPost<PipelineResponse>(`/pipelines/${id}/duplicate`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines', workspaceId] });
    },
  });

  const createStageMutation = useMutation({
    mutationFn: async ({ pipelineId, payload }: { pipelineId: string; payload: StageCreate }) => {
      requireWorkspace();
      return await apiPost<StageResponse>(`/pipelines/${pipelineId}/stages`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines', workspaceId] });
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ pipelineId, stageId, payload }: { pipelineId: string; stageId: string; payload: StageUpdate }) => {
      requireWorkspace();
      return await apiPatch<StageResponse>(`/pipelines/${pipelineId}/stages/${stageId}`, payload as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['deals', workspaceId] });
    },
  });

  const deleteStageMutation = useMutation({
    mutationFn: async ({ pipelineId, stageId }: { pipelineId: string; stageId: string }) => {
      requireWorkspace();
      return await apiDelete<void>(`/pipelines/${pipelineId}/stages/${stageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines', workspaceId] });
    },
  });

  const reorderStagesMutation = useMutation({
    mutationFn: async ({ pipelineId, payload }: { pipelineId: string; payload: StageReorderRequest }) => {
      requireWorkspace();
      return await apiPost<PipelineResponse>(`/pipelines/${pipelineId}/stages/reorder`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['deals', workspaceId] });
    },
  });

  const dealsQuery = useQuery({
    queryKey: ['deals', workspaceId],
    queryFn: async () => apiGet<DealResponse[]>('/deals'),
    enabled: Boolean(workspaceId),
  });

  const useDeal = (dealId: string | undefined) =>
    useQuery({
      queryKey: ['deal', workspaceId, dealId],
      queryFn: async () => apiGet<DealResponse>(`/deals/${dealId}`),
      enabled: Boolean(workspaceId) && Boolean(dealId),
    });

  const createDealMutation = useMutation({
    mutationFn: async (payload: DealCreate) => {
      requireWorkspace();
      return await apiPost<DealResponse>('/deals', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals', workspaceId] });
    },
  });

  const updateDealMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: DealUpdate }) => {
      requireWorkspace();
      return await apiPatch<DealResponse>(`/deals/${id}`, payload as Record<string, unknown>);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deals', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['deal', workspaceId, variables.id] });
    },
  });

  const deleteDealMutation = useMutation({
    mutationFn: async (id: string) => {
      requireWorkspace();
      return await apiDelete<void>(`/deals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals', workspaceId] });
    },
  });

  const moveDealStageMutation = useMutation({
    mutationFn: async ({ dealId, payload }: { dealId: string; payload: DealStageMoveRequest }) => {
      requireWorkspace();
      return await apiPost<DealResponse>(`/deals/${dealId}/move-stage`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals', workspaceId] });
    },
  });

  // ── Tasks ──────────────────────────────────────────────────────────────────

  const tasksQuery = useQuery({
    queryKey: ['tasks', workspaceId],
    queryFn: async () => apiGet<TaskResponse[]>('/tasks'),
    enabled: Boolean(workspaceId),
  });

  const useTask = (taskId: string | undefined) =>
    useQuery({
      queryKey: ['task', workspaceId, taskId],
      queryFn: async () => apiGet<TaskResponse>(`/tasks/${taskId}`),
      enabled: Boolean(workspaceId) && Boolean(taskId),
    });

  const createTaskMutation = useMutation({
    mutationFn: async (payload: TaskCreate) => {
      requireWorkspace();
      return await apiPost<TaskResponse>('/tasks', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: TaskUpdate }) => {
      requireWorkspace();
      return await apiPatch<TaskResponse>(`/tasks/${id}`, payload as Record<string, unknown>);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['task', workspaceId, variables.id] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      requireWorkspace();
      return await apiDelete<void>(`/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] });
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      requireWorkspace();
      return await apiPost<TaskResponse>(`/tasks/${taskId}/complete`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] });
    },
  });

  // ── Timeline ───────────────────────────────────────────────────────────────

  const useTimeline = (entityType: string, entityId: string | undefined) =>
    useQuery({
      queryKey: ['timeline', workspaceId, entityType, entityId],
      queryFn: async () =>
        apiGet<ActivityResponse[]>(`/timeline?entity_type=${entityType}&entity_id=${entityId}`),
      enabled: Boolean(workspaceId) && Boolean(entityId),
    });

  // ── Bulk Operations & Import/Export Hooks ─────────────────────────────────

  const bulkDeleteMutation = useMutation({
    mutationFn: async (payload: BulkDeleteRequest) => {
      requireWorkspace();
      return await apiPost<BulkDeleteResponse>('/bulk/delete', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['contacts', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['leads', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['deals', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] });
    },
  });

  const bulkArchiveMutation = useMutation({
    mutationFn: async (payload: BulkArchiveRequest) => {
      requireWorkspace();
      return await apiPost<{ archived_count: number }>('/bulk/archive', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['contacts', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['leads', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['deals', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] });
    },
  });

  const bulkRestoreMutation = useMutation({
    mutationFn: async (payload: BulkRestoreRequest) => {
      requireWorkspace();
      return await apiPost<{ restored_count: number }>('/bulk/restore', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['contacts', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['leads', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['deals', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] });
    },
  });

  const bulkAssignOwnerMutation = useMutation({
    mutationFn: async (payload: BulkAssignOwnerRequest) => {
      requireWorkspace();
      return await apiPost<{ reassigned_count: number }>('/bulk/assign-owner', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['contacts', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['leads', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['deals', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] });
    },
  });

  const bulkUpdateStatusMutation = useMutation({
    mutationFn: async (payload: BulkUpdateStatusRequest) => {
      requireWorkspace();
      return await apiPost<{ updated_count: number }>('/bulk/update-status', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['contacts', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['leads', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['deals', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] });
    },
  });

  const bulkMoveStageMutation = useMutation({
    mutationFn: async (payload: BulkMoveStageRequest) => {
      requireWorkspace();
      return await apiPost<{ moved_count: number }>('/bulk/move-stage', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals', workspaceId] });
    },
  });

  const importCSVMutation = useMutation({
    mutationFn: async (payload: CSVImportRequest) => {
      requireWorkspace();
      return await apiPost<CSVImportSummaryResponse>('/import/csv', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['contacts', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['leads', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['deals', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['import-history', workspaceId] });
    },
  });

  const exportDatasetMutation = useMutation({
    mutationFn: async (payload: ExportRequest) => {
      requireWorkspace();
      return await apiPost<Blob>('/export/dataset', payload, { responseType: 'blob' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['export-history', workspaceId] });
    },
  });

  const importHistoryQuery = useQuery({
    queryKey: ['import-history', workspaceId],
    queryFn: async () => apiGet<ImportJobResponse[]>('/import/history'),
    enabled: Boolean(workspaceId),
  });

  const exportHistoryQuery = useQuery({
    queryKey: ['export-history', workspaceId],
    queryFn: async () => apiGet<ExportJobResponse[]>('/export/history'),
    enabled: Boolean(workspaceId),
  });

  return {
    // Companies
    companies: companiesQuery.data ?? [],
    isLoadingCompanies: companiesQuery.isLoading,
    useCompany,
    createCompany: createCompanyMutation.mutateAsync,
    isCreatingCompany: createCompanyMutation.isPending,
    updateCompany: updateCompanyMutation.mutateAsync,
    isUpdatingCompany: updateCompanyMutation.isPending,
    deleteCompany: deleteCompanyMutation.mutateAsync,
    isDeletingCompany: deleteCompanyMutation.isPending,

    // Contacts
    contacts: contactsQuery.data ?? [],
    isLoadingContacts: contactsQuery.isLoading,
    useContact,
    useContactsByCompany,
    createContact: createContactMutation.mutateAsync,
    isCreatingContact: createContactMutation.isPending,
    updateContact: updateContactMutation.mutateAsync,
    isUpdatingContact: updateContactMutation.isPending,
    deleteContact: deleteContactMutation.mutateAsync,
    isDeletingContact: deleteContactMutation.isPending,

    // Leads
    leads: leadsQuery.data ?? [],
    isLoadingLeads: leadsQuery.isLoading,
    useLead,
    createLead: createLeadMutation.mutateAsync,
    isCreatingLead: createLeadMutation.isPending,
    updateLead: updateLeadMutation.mutateAsync,
    isUpdatingLead: updateLeadMutation.isPending,
    deleteLead: deleteLeadMutation.mutateAsync,
    isDeletingLead: deleteLeadMutation.isPending,
    convertLead: convertLeadMutation.mutateAsync,
    isConvertingLead: convertLeadMutation.isPending,

    // Pipelines & Deals
    pipelines: pipelinesQuery.data ?? [],
    isLoadingPipelines: pipelinesQuery.isLoading,
    createPipeline: createPipelineMutation.mutateAsync,
    isCreatingPipeline: createPipelineMutation.isPending,
    updatePipeline: updatePipelineMutation.mutateAsync,
    isUpdatingPipeline: updatePipelineMutation.isPending,
    deletePipeline: deletePipelineMutation.mutateAsync,
    isDeletingPipeline: deletePipelineMutation.isPending,
    duplicatePipeline: duplicatePipelineMutation.mutateAsync,
    isDuplicatingPipeline: duplicatePipelineMutation.isPending,
    createStage: createStageMutation.mutateAsync,
    isCreatingStage: createStageMutation.isPending,
    updateStage: updateStageMutation.mutateAsync,
    isUpdatingStage: updateStageMutation.isPending,
    deleteStage: deleteStageMutation.mutateAsync,
    isDeletingStage: deleteStageMutation.isPending,
    reorderStages: reorderStagesMutation.mutateAsync,
    isReorderingStages: reorderStagesMutation.isPending,
    deals: dealsQuery.data ?? [],
    isLoadingDeals: dealsQuery.isLoading,
    useDeal,
    createDeal: createDealMutation.mutateAsync,
    isCreatingDeal: createDealMutation.isPending,
    updateDeal: updateDealMutation.mutateAsync,
    isUpdatingDeal: updateDealMutation.isPending,
    deleteDeal: deleteDealMutation.mutateAsync,
    isDeletingDeal: deleteDealMutation.isPending,
    moveDealStage: moveDealStageMutation.mutateAsync,

    // Tasks
    tasks: tasksQuery.data ?? [],
    isLoadingTasks: tasksQuery.isLoading,
    useTask,
    createTask: createTaskMutation.mutateAsync,
    isCreatingTask: createTaskMutation.isPending,
    updateTask: updateTaskMutation.mutateAsync,
    isUpdatingTask: updateTaskMutation.isPending,
    deleteTask: deleteTaskMutation.mutateAsync,
    isDeletingTask: deleteTaskMutation.isPending,
    completeTask: completeTaskMutation.mutateAsync,

    // Timeline
    useTimeline,

    // Bulk Operations & Import/Export
    bulkDelete: bulkDeleteMutation.mutateAsync,
    bulkArchive: bulkArchiveMutation.mutateAsync,
    bulkRestore: bulkRestoreMutation.mutateAsync,
    bulkAssignOwner: bulkAssignOwnerMutation.mutateAsync,
    bulkUpdateStatus: bulkUpdateStatusMutation.mutateAsync,
    bulkMoveStage: bulkMoveStageMutation.mutateAsync,
    importCSV: importCSVMutation.mutateAsync,
    exportDataset: exportDatasetMutation.mutateAsync,
    importHistory: importHistoryQuery.data ?? [],
    isLoadingImportHistory: importHistoryQuery.isLoading,
    exportHistory: exportHistoryQuery.data ?? [],
    isLoadingExportHistory: exportHistoryQuery.isLoading,
  };
}
