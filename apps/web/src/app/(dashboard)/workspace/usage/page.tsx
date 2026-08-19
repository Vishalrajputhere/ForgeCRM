'use client';

/**
 * ForgeCRM V2 — Workspace Telemetry, Usage Metrics & Limits
 *
 * Real API-backed workspace telemetry viewer.
 * Connects directly to GET /api/v1/workspaces/{workspace_id}/usage.
 * Displays real resource quotas for members, teams, CRM entities, storage, and AI tokens.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { BarChart3, Users, Building2, HardDrive, RefreshCw, AlertTriangle, Zap } from 'lucide-react';
import { WorkspaceAdminNav } from '@/components/navigation/workspace-admin-nav';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAIFetch } from '@/hooks/use-ai-fetch';
import { useFormatters } from '@/hooks/use-formatters';
import { PagePermissionGuard } from '@/components/auth/permission-guard';

interface WorkspaceUsage {
  subscription_plan: string;
  members_count: number;
  members_limit: number;
  teams_count: number;
  teams_limit: number;
  companies_count: number;
  contacts_count: number;
  leads_count: number;
  deals_count: number;
  deals_total_value: number;
  tasks_count: number;
  storage_bytes_used: number;
  storage_limit_bytes?: number;
  ai_tokens_used: number;
  ai_token_budget?: number;
  ai_cost_usd: number;
}

export default function WorkspaceUsagePage(): React.JSX.Element {
  const { currentWorkspace } = useWorkspaceStore();
  const { aiFetch } = useAIFetch({ workspaceId: currentWorkspace?.id });
  const { formatCurrency } = useFormatters();

  const [usage, setUsage] = useState<WorkspaceUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await aiFetch(`/api/v1/workspaces/${currentWorkspace.id}/usage`, null, 'GET');
      if (res.ok) {
        const data = await res.json();
        setUsage(data as WorkspaceUsage);
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMsg(errData.detail || `Failed to fetch usage metrics (HTTP ${res.status})`);
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Error connecting to usage telemetry service');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace?.id, aiFetch]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const storageMB = usage ? (usage.storage_bytes_used / (1024 * 1024)).toFixed(2) : '0';
  const storageLimitGB = usage?.storage_limit_bytes ? (usage.storage_limit_bytes / (1024 * 1024 * 1024)).toFixed(0) : '50';

  return (
    <PagePermissionGuard permission="usage.read">
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-100">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Usage &amp; Quota Telemetry</h1>
              <p className="text-sm text-slate-400">Monitor active workspace member seats, CRM entity counts, storage, and AI token consumption</p>
            </div>
          </div>

          <button
            onClick={fetchUsage}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5 self-start md:self-auto"
          >
            <RefreshCw className="h-4 w-4" /> Refresh Telemetry
          </button>
        </div>

        {/* Workspace Admin Navigation */}
        <WorkspaceAdminNav />

        {/* Error State */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={fetchUsage} className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-xs font-semibold">
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
            Loading real workspace usage telemetry...
          </div>
        ) : !usage ? (
          <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-xs">
            No telemetry metrics returned for current workspace.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Quota Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Member Seats */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Users className="h-4 w-4 text-cyan-400" /> Member Seats
                  </div>
                  <span className="text-xs font-mono text-cyan-400">
                    {Math.round((usage.members_count / usage.members_limit) * 100)}% Used
                  </span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {usage.members_count} <span className="text-xs font-normal text-slate-500">/ {usage.members_limit} Seats</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${Math.min(100, (usage.members_count / usage.members_limit) * 100)}%` }} />
                </div>
              </div>

              {/* AI Token Budget */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Zap className="h-4 w-4 text-amber-400" /> AI Tokens &amp; Cost
                  </div>
                  <span className="text-xs font-mono text-amber-400">{formatCurrency(usage.ai_cost_usd)}</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {usage.ai_tokens_used.toLocaleString()} <span className="text-xs font-normal text-slate-500">Tokens</span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  Allocated Token Budget: {(usage.ai_token_budget || 1000000).toLocaleString()}
                </p>
              </div>

              {/* Storage Quota */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <HardDrive className="h-4 w-4 text-purple-400" /> Storage Consumption
                  </div>
                  <span className="text-xs font-mono text-purple-400">{storageMB} MB</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {storageMB} <span className="text-xs font-normal text-slate-500">MB / {storageLimitGB} GB</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.min(100, (usage.storage_bytes_used / (50 * 1024 * 1024 * 1024)) * 100)}%` }} />
                </div>
              </div>
            </div>

            {/* CRM Entity Telemetry Matrix */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-accent" /> Active CRM Entity Records
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Companies</span>
                  <p className="text-2xl font-bold text-white">{usage.companies_count}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Contacts</span>
                  <p className="text-2xl font-bold text-white">{usage.contacts_count}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Leads</span>
                  <p className="text-2xl font-bold text-white">{usage.leads_count}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Deals</span>
                  <p className="text-2xl font-bold text-white">{usage.deals_count}</p>
                  <p className="text-[10px] text-emerald-400 font-mono font-bold">{formatCurrency(usage.deals_total_value)}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tasks</span>
                  <p className="text-2xl font-bold text-white">{usage.tasks_count}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PagePermissionGuard>
  );
}
