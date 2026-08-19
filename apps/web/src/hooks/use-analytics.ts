'use client';

/**
 * ForgeCRM — useAnalytics Hook Suite
 *
 * Custom React hooks for fetching live executive KPIs, sales leaderboards,
 * pipeline velocity, lead conversion funnels, activity productivity,
 * automation telemetry, AI cost tracking, custom dashboards, saved reports, and CSV export.
 *
 * Documentation: docs/04_Frontend/401_FRONTEND_OVERVIEW.md
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiDelete, apiGet, apiPost } from '@/lib/api-client';
import { useAnalyticsStore } from '@/stores/analytics-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import type {
  AccountAnalyticsResponse,
  ActivityAnalyticsResponse,
  AIAnalyticsResponse,
  AnalyticsDashboard,
  AnalyticsExportPayload,
  AutomationAnalyticsResponse,
  DashboardCreatePayload,
  DealMetricsResponse,
  ExecutiveOverviewResponse,
  LeadMetricsResponse,
  PipelineAnalyticsResponse,
  SalesPerformanceResponse,
  SavedReport,
  SavedReportCreatePayload,
} from '@/types';

function buildQueryString(params: Record<string, string | number | boolean | null | undefined>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, String(val));
    }
  });
  const str = query.toString();
  return str ? `?${str}` : '';
}

export function useAnalytics() {
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const workspaceId = currentWorkspace?.id;
  const queryClient = useQueryClient();

  const { timeRange, startDate, endDate, selectedOwnerId, selectedPipelineId } =
    useAnalyticsStore();

  const filterParams = {
    time_range: timeRange !== 'custom' ? timeRange : undefined,
    start_date: timeRange === 'custom' ? startDate : undefined,
    end_date: timeRange === 'custom' ? endDate : undefined,
    owner_id: selectedOwnerId || undefined,
  };

  // ── 1. Executive Overview Query ───────────────────────────────────────────
  const overviewQuery = useQuery({
    queryKey: ['analytics_overview', workspaceId, filterParams],
    queryFn: async () => {
      return await apiGet<ExecutiveOverviewResponse>(
        `/analytics/overview${buildQueryString(filterParams)}`
      );
    },
    enabled: Boolean(workspaceId),
  });

  // ── 2. Lead Metrics Query ────────────────────────────────────────────────
  const leadMetricsQuery = useQuery({
    queryKey: ['analytics_leads', workspaceId, filterParams],
    queryFn: async () => {
      return await apiGet<LeadMetricsResponse>(
        `/analytics/leads${buildQueryString(filterParams)}`
      );
    },
    enabled: Boolean(workspaceId),
  });

  // ── 3. Deal Metrics Query ────────────────────────────────────────────────
  const dealMetricsQuery = useQuery({
    queryKey: ['analytics_deals', workspaceId, filterParams],
    queryFn: async () => {
      return await apiGet<DealMetricsResponse>(
        `/analytics/deals${buildQueryString(filterParams)}`
      );
    },
    enabled: Boolean(workspaceId),
  });

  // ── 4. Pipeline Analytics Query ───────────────────────────────────────────
  const pipelineQuery = useQuery({
    queryKey: ['analytics_pipeline', workspaceId, filterParams, selectedPipelineId],
    queryFn: async () => {
      const pParams = {
        ...filterParams,
        pipeline_id: selectedPipelineId || undefined,
      };
      return await apiGet<PipelineAnalyticsResponse[]>(
        `/analytics/pipeline${buildQueryString(pParams)}`
      );
    },
    enabled: Boolean(workspaceId),
  });

  // ── 5. Sales Performance Leaderboard Query ────────────────────────────────
  const salesQuery = useQuery({
    queryKey: ['analytics_sales', workspaceId, filterParams],
    queryFn: async () => {
      return await apiGet<SalesPerformanceResponse>(
        `/analytics/sales${buildQueryString(filterParams)}`
      );
    },
    enabled: Boolean(workspaceId),
  });

  // ── 6. Activity Productivity Query ────────────────────────────────────────
  const activityQuery = useQuery({
    queryKey: ['analytics_activities', workspaceId, filterParams],
    queryFn: async () => {
      return await apiGet<ActivityAnalyticsResponse>(
        `/analytics/activities${buildQueryString(filterParams)}`
      );
    },
    enabled: Boolean(workspaceId),
  });

  // ── 7. Automation Telemetry Query ─────────────────────────────────────────
  const automationQuery = useQuery({
    queryKey: ['analytics_automation', workspaceId, filterParams],
    queryFn: async () => {
      return await apiGet<AutomationAnalyticsResponse>(
        `/analytics/automation${buildQueryString(filterParams)}`
      );
    },
    enabled: Boolean(workspaceId),
  });

  // ── 8. AI Subsystem & Cost Query ──────────────────────────────────────────
  const aiQuery = useQuery({
    queryKey: ['analytics_ai', workspaceId, filterParams],
    queryFn: async () => {
      return await apiGet<AIAnalyticsResponse>(
        `/analytics/ai${buildQueryString(filterParams)}`
      );
    },
    enabled: Boolean(workspaceId),
  });

  // ── 9. Accounts & Growth Query ────────────────────────────────────────────
  const accountsQuery = useQuery({
    queryKey: ['analytics_accounts', workspaceId, filterParams],
    queryFn: async () => {
      return await apiGet<AccountAnalyticsResponse>(
        `/analytics/accounts${buildQueryString(filterParams)}`
      );
    },
    enabled: Boolean(workspaceId),
  });

  // ── 10. Custom Dashboards Query & Mutations ───────────────────────────────
  const dashboardsQuery = useQuery({
    queryKey: ['analytics_dashboards', workspaceId],
    queryFn: async () => {
      return await apiGet<AnalyticsDashboard[]>('/analytics/dashboards');
    },
    enabled: Boolean(workspaceId),
  });

  const createDashboardMutation = useMutation({
    mutationFn: async (payload: DashboardCreatePayload) => {
      return await apiPost<AnalyticsDashboard>('/analytics/dashboards', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics_dashboards', workspaceId] });
    },
  });

  const deleteDashboardMutation = useMutation({
    mutationFn: async (dashboardId: string) => {
      return await apiDelete(`/analytics/dashboards/${dashboardId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics_dashboards', workspaceId] });
    },
  });

  // ── 11. Saved Reports Query & Mutations ───────────────────────────────────
  const reportsQuery = useQuery({
    queryKey: ['analytics_reports', workspaceId],
    queryFn: async () => {
      return await apiGet<SavedReport[]>('/analytics/reports');
    },
    enabled: Boolean(workspaceId),
  });

  const createReportMutation = useMutation({
    mutationFn: async (payload: SavedReportCreatePayload) => {
      return await apiPost<SavedReport>('/analytics/reports', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics_reports', workspaceId] });
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      return await apiDelete(`/analytics/reports/${reportId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics_reports', workspaceId] });
    },
  });

  // ── 12. CSV Export Handler ────────────────────────────────────────────────
  const exportCsv = async (payload: AnalyticsExportPayload) => {
    const res = await fetch('/api/v1/analytics/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Workspace-ID': workspaceId || '',
        Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error('Failed to export analytics CSV');

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forgecrm_${payload.report_type}_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return {
    overview: overviewQuery.data,
    isLoadingOverview: overviewQuery.isLoading,
    refetchOverview: overviewQuery.refetch,

    leadMetrics: leadMetricsQuery.data,
    isLoadingLeadMetrics: leadMetricsQuery.isLoading,

    dealMetrics: dealMetricsQuery.data,
    isLoadingDealMetrics: dealMetricsQuery.isLoading,

    pipelines: pipelineQuery.data ?? [],
    isLoadingPipelines: pipelineQuery.isLoading,

    salesPerformance: salesQuery.data,
    isLoadingSales: salesQuery.isLoading,

    activityAnalytics: activityQuery.data,
    isLoadingActivities: activityQuery.isLoading,

    automationAnalytics: automationQuery.data,
    isLoadingAutomation: automationQuery.isLoading,

    aiAnalytics: aiQuery.data,
    isLoadingAI: aiQuery.isLoading,

    accountAnalytics: accountsQuery.data,
    isLoadingAccounts: accountsQuery.isLoading,

    dashboards: dashboardsQuery.data ?? [],
    isLoadingDashboards: dashboardsQuery.isLoading,
    createDashboard: createDashboardMutation.mutateAsync,
    isCreatingDashboard: createDashboardMutation.isPending,
    deleteDashboard: deleteDashboardMutation.mutateAsync,

    savedReports: reportsQuery.data ?? [],
    isLoadingReports: reportsQuery.isLoading,
    createReport: createReportMutation.mutateAsync,
    isCreatingReport: createReportMutation.isPending,
    deleteReport: deleteReportMutation.mutateAsync,

    exportCsv,
  };
}
