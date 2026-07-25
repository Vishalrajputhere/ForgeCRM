'use client';

/**
 * ForgeCRM — useAnalytics Hook
 *
 * Custom React hook for fetching executive overview KPIs, lead funnel metrics,
 * deal revenue forecasts, and pipeline analytics.
 *
 * Documentation: docs/04_Frontend/401_FRONTEND_OVERVIEW.md
 */

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';
import { useWorkspaceStore } from '@/stores/workspace-store';
import type {
  DealMetricsResponse,
  ExecutiveOverviewResponse,
  LeadMetricsResponse,
  PipelineAnalyticsResponse,
} from '@/types';

export function useAnalytics() {
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const workspaceId = currentWorkspace?.id;

  const getOptions = () => (workspaceId ? { headers: { 'X-Workspace-ID': workspaceId } } : {});

  // ── Executive Overview Query ──────────────────────────────────────────────
  const overviewQuery = useQuery({
    queryKey: ['analytics_overview', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;
      return await apiGet<ExecutiveOverviewResponse>('/analytics/overview', getOptions());
    },
    enabled: Boolean(workspaceId),
  });

  // ── Lead Metrics Query ───────────────────────────────────────────────────
  const leadMetricsQuery = useQuery({
    queryKey: ['analytics_leads', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;
      return await apiGet<LeadMetricsResponse>('/analytics/leads', getOptions());
    },
    enabled: Boolean(workspaceId),
  });

  // ── Deal Metrics Query ───────────────────────────────────────────────────
  const dealMetricsQuery = useQuery({
    queryKey: ['analytics_deals', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;
      return await apiGet<DealMetricsResponse>('/analytics/deals', getOptions());
    },
    enabled: Boolean(workspaceId),
  });

  // ── Pipeline Analytics Query ──────────────────────────────────────────────
  const pipelineQuery = useQuery({
    queryKey: ['analytics_pipeline', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      return await apiGet<PipelineAnalyticsResponse[]>('/analytics/pipeline', getOptions());
    },
    enabled: Boolean(workspaceId),
  });

  return {
    overview: overviewQuery.data,
    isLoadingOverview: overviewQuery.isLoading,

    leadMetrics: leadMetricsQuery.data,
    isLoadingLeadMetrics: leadMetricsQuery.isLoading,

    dealMetrics: dealMetricsQuery.data,
    isLoadingDealMetrics: dealMetricsQuery.isLoading,

    pipelines: pipelineQuery.data ?? [],
    isLoadingPipelines: pipelineQuery.isLoading,
  };
}
