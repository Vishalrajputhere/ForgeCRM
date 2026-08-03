'use client';

/**
 * ForgeCRM — useWorkspace Hook
 *
 * Custom React hook for workspace operations: fetching workspaces,
 * creating new workspaces, switching active tenant context, member invitations,
 * settings, and roles.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiPatch, apiPost } from '@/lib/api-client';
import { useWorkspaceStore } from '@/stores/workspace-store';
import type {
  InviteMemberRequest,
  RoleResponse,
  WorkspaceCreate,
  WorkspaceInvitationResponse,
  WorkspaceMemberResponse,
  WorkspaceResponse,
  WorkspaceSettingsResponse,
  WorkspaceSettingsUpdate,
  WorkspaceUpdate,
} from '@/types';

export function useWorkspace() {
  const queryClient = useQueryClient();
  const {
    currentWorkspace,
    userWorkspaces,
    setCurrentWorkspace,
    setUserWorkspaces,
  } = useWorkspaceStore();

  // ── Fetch User Workspaces Query ──────────────────────────────────────────────
  const workspacesQuery = useQuery({
    queryKey: ['user_workspaces'],
    queryFn: async () => {
      const data = await apiGet<WorkspaceResponse[]>('/workspaces');
      setUserWorkspaces(data);
      if (data.length > 0 && !useWorkspaceStore.getState().currentWorkspace) {
        setCurrentWorkspace(data[0] ?? null);
      }
      return data;
    },
  });

  // ── Switch Active Workspace Context ──────────────────────────────────────────
  const switchWorkspace = (workspace: WorkspaceResponse) => {
    setCurrentWorkspace(workspace);
    // Invalidate all query caches to reload CRM data for the new tenant context
    queryClient.invalidateQueries();
  };

  // ── Create Workspace Mutation ──────────────────────────────────────────────
  const createWorkspaceMutation = useMutation({
    mutationFn: async (payload: WorkspaceCreate) => {
      const response = await apiPost<WorkspaceResponse>('/workspaces', payload);
      return response;
    },
    onSuccess: (newWorkspace) => {
      queryClient.invalidateQueries({ queryKey: ['user_workspaces'] });
      switchWorkspace(newWorkspace);
    },
  });

  // ── Update Workspace Mutation ──────────────────────────────────────────────
  const updateWorkspaceMutation = useMutation({
    mutationFn: async ({
      workspaceId,
      payload,
    }: {
      workspaceId: string;
      payload: WorkspaceUpdate;
    }) => {
      const response = await apiPatch<WorkspaceResponse>(
        `/workspaces/${workspaceId}`,
        payload,
      );
      return response;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['user_workspaces'] });
      setCurrentWorkspace(updated);
    },
  });

  // ── Update Workspace Settings Mutation ────────────────────────────────────
  const updateWorkspaceSettingsMutation = useMutation({
    mutationFn: async ({
      workspaceId,
      payload,
    }: {
      workspaceId: string;
      payload: WorkspaceSettingsUpdate;
    }) => {
      const response = await apiPatch<WorkspaceSettingsResponse>(
        `/workspaces/${workspaceId}/settings`,
        payload,
      );
      return response;
    },
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['workspace_settings', workspaceId] });
    },
  });

  // ── Invite Member Mutation ──────────────────────────────────────────────────
  const inviteMemberMutation = useMutation({
    mutationFn: async ({
      workspaceId,
      payload,
    }: {
      workspaceId: string;
      payload: InviteMemberRequest;
    }) => {
      const response = await apiPost<WorkspaceInvitationResponse>(
        `/workspaces/${workspaceId}/invitations`,
        payload,
      );
      return response;
    },
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['workspace_members', workspaceId] });
    },
  });

  // ── Fetch Workspace Members Query ────────────────────────────────────────────
  const useWorkspaceMembers = (workspaceId: string | undefined) =>
    useQuery({
      queryKey: ['workspace_members', workspaceId],
      queryFn: async () => {
        if (workspaceId === undefined) return [];
        return await apiGet<WorkspaceMemberResponse[]>(
          `/workspaces/${workspaceId}/members`,
        );
      },
      enabled: workspaceId !== undefined,
    });

  // ── Fetch Workspace Settings Query ───────────────────────────────────────────
  const useWorkspaceSettings = (workspaceId: string | undefined) =>
    useQuery({
      queryKey: ['workspace_settings', workspaceId],
      queryFn: async () => {
        if (workspaceId === undefined) return null;
        return await apiGet<WorkspaceSettingsResponse>(
          `/workspaces/${workspaceId}/settings`,
        );
      },
      enabled: workspaceId !== undefined,
    });

  // ── Fetch System Roles Query ─────────────────────────────────────────────────
  const useRoles = () =>
    useQuery({
      queryKey: ['system_roles'],
      queryFn: async () => await apiGet<RoleResponse[]>('/auth/roles'),
    });

  return {
    currentWorkspace,
    userWorkspaces: workspacesQuery.data ?? userWorkspaces,
    isLoading: workspacesQuery.isLoading,
    switchWorkspace,
    createWorkspace: createWorkspaceMutation.mutateAsync,
    isCreating: createWorkspaceMutation.isPending,
    updateWorkspace: updateWorkspaceMutation.mutateAsync,
    isUpdating: updateWorkspaceMutation.isPending,
    updateWorkspaceSettings: updateWorkspaceSettingsMutation.mutateAsync,
    isUpdatingSettings: updateWorkspaceSettingsMutation.isPending,
    inviteMember: inviteMemberMutation.mutateAsync,
    isInviting: inviteMemberMutation.isPending,
    useWorkspaceMembers,
    useWorkspaceSettings,
    useRoles,
  };
}
