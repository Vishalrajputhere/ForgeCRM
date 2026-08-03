'use client';

/**
 * ForgeCRM — useStorage Hook
 *
 * Custom React hook for requesting presigned upload URLs, confirming uploads,
 * querying entity attachments, and generating presigned download links.
 *
 * Documentation: docs/04_Frontend/401_FRONTEND_OVERVIEW.md
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiPost } from '@/lib/api-client';
import { useWorkspaceStore } from '@/stores/workspace-store';
import type {
  ConfirmUploadRequest,
  DocumentAttachmentResponse,
  PresignedDownloadResponse,
  PresignedUploadResponse,
  RequestUploadUrlRequest,
} from '@/types';

export function useStorage() {
  const queryClient = useQueryClient();
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const workspaceId = currentWorkspace?.id;

  // ── Request Upload URL Mutation ──────────────────────────────────────────
  const requestUploadUrlMutation = useMutation({
    mutationFn: async (payload: RequestUploadUrlRequest) => {
      return await apiPost<PresignedUploadResponse>('/storage/upload-url', payload);
    },
  });

  // ── Confirm Upload Mutation ──────────────────────────────────────────────
  const confirmUploadMutation = useMutation({
    mutationFn: async (payload: ConfirmUploadRequest) => {
      return await apiPost<DocumentAttachmentResponse>('/storage/confirm', payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['attachments', workspaceId, variables.entity_type, variables.entity_id],
      });
    },
  });

  // ── List Entity Attachments Query ─────────────────────────────────────────
  const useEntityAttachments = (entityType: string, entityId: string | undefined) =>
    useQuery({
      queryKey: ['attachments', workspaceId, entityType, entityId],
      queryFn: async () => {
        if (!entityId) return [];
        return await apiGet<DocumentAttachmentResponse[]>(
          `/storage/attachments?entity_type=${entityType}&entity_id=${entityId}`,
        );
      },
      enabled: Boolean(workspaceId && entityId),
    });

  // ── Get Download URL Mutation ─────────────────────────────────────────────
  const getDownloadUrlMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      return await apiGet<PresignedDownloadResponse>(
        `/storage/attachments/${attachmentId}/download-url`,
      );
    },
  });

  return {
    requestUploadUrl: requestUploadUrlMutation.mutateAsync,
    confirmUpload: confirmUploadMutation.mutateAsync,
    getDownloadUrl: getDownloadUrlMutation.mutateAsync,
    useEntityAttachments,
  };
}
