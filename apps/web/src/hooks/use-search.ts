'use client';

/**
 * ForgeCRM — useSearch Hook
 *
 * Custom React hook for global workspace search across Companies, Contacts,
 * Leads, Deals, and Tasks.
 *
 * Documentation: docs/04_Frontend/401_FRONTEND_OVERVIEW.md
 */

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';
import { useWorkspaceStore } from '@/stores/workspace-store';
import type { GlobalSearchResponse } from '@/types';

export function useSearch(query: string) {
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const workspaceId = currentWorkspace?.id;

  const searchQuery = useQuery({
    queryKey: ['global_search', workspaceId, query],
    queryFn: async () => {
      if (!workspaceId || query.trim().length < 2) {
        return { query, total: 0, results: [] } as GlobalSearchResponse;
      }
      return await apiGet<GlobalSearchResponse>(
        `/search?q=${encodeURIComponent(query.trim())}`,
      );
    },
    enabled: Boolean(workspaceId && query.trim().length >= 2),
  });

  return {
    results: searchQuery.data?.results ?? [],
    total: searchQuery.data?.total ?? 0,
    isLoading: searchQuery.isLoading,
  };
}
