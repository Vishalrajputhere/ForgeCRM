'use client';

/**
 * ForgeCRM — useWorkspace Hook
 *
 * Custom React hook for workspace operations: fetching workspaces,
 * creating new workspaces, switching active tenant context, and member invitations.
 *
 * Documentation: docs/04_Frontend/401_FRONTEND_OVERVIEW.md
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiPost } from '@/lib/api-client';
import { useWorkspaceStore } from '@/stores/workspace-store';
import type {
  InviteMemberRequest,
  WorkspaceCreate,
  WorkspaceMemberResponse,
  WorkspaceResponse,
  WorkspaceSettingsResponse,
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
      return data;
    },
  });

  // ── Create Workspace Mutation ──────────────────────────────────────────────
  const createWorkspaceMutation = useMutation({
    mutationFn: async (payload: WorkspaceCreate) => {
      const response = await apiPost<WorkspaceResponse>('/workspaces', payload);
      return response;
    },
    onSuccess: (newWorkspace) => {
      queryClient.invalidateQueries({ queryKey: ['user_workspaces'] });
      setCurrentWorkspace(newWorkspace);
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
      const response = await apiPost(
        `/workspaces/${workspaceId}/invitations`,
        payload,
      );
      return response;
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

  return {
    currentWorkspace,
    userWorkspaces: workspacesQuery.data ?? userWorkspaces,
    isLoading: workspacesQuery.isLoading,
    switchWorkspace: (workspace: WorkspaceResponse) => setCurrentWorkspace(workspace),
    createWorkspace: createWorkspaceMutation.mutateAsync,
    isCreating: createWorkspaceMutation.isPending,
    inviteMember: inviteMemberMutation.mutateAsync,
    isInviting: inviteMemberMutation.isPending,
    useWorkspaceMembers,
    useWorkspaceSettings,
  };
}
