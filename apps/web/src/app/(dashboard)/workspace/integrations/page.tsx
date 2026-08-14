'use client';

/**
 * ForgeCRM V2 — Enterprise Integrations Control Panel
 *
 * Real API-backed integration administration interface.
 * Connects directly to GET /api/v1/workspaces/{workspace_id}/integrations and
 * POST /api/v1/workspaces/{workspace_id}/integrations/{integration_id}/toggle.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Puzzle, CheckCircle2, Power, ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react';
import { WorkspaceAdminNav } from '@/components/navigation/workspace-admin-nav';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAIFetch } from '@/hooks/use-ai-fetch';
import { useToast } from '@/components/ui/toast';
import { PermissionGuard, PagePermissionGuard } from '@/components/auth/permission-guard';

interface Integration {
  id?: string;
  workspace_id: string;
  provider: string;
  name: string;
  status: string;
  connected_by?: string;
  connector_name?: string;
  connected_at?: string;
  last_sync_at?: string;
  config_json?: Record<string, unknown>;
}

export default function WorkspaceIntegrationsPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const { aiFetch } = useAIFetch({ workspaceId: currentWorkspace?.id });
  const { toast } = useToast();

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [togglingProvider, setTogglingProvider] = useState<string | null>(null);

  const fetchIntegrations = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await aiFetch(`/api/v1/workspaces/${currentWorkspace.id}/integrations`, null, 'GET');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setIntegrations(data as Integration[]);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMsg(errData.detail || `Failed to fetch integrations (HTTP ${res.status})`);
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Error connecting to integration administration service');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace?.id, aiFetch]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const handleToggleIntegration = async (integ: Integration) => {
    if (!currentWorkspace?.id || !integ.id) return;
    const isCurrentlyConnected = integ.status === 'Connected' || integ.status === 'active';
    const newStatus = isCurrentlyConnected ? 'disabled' : 'active';

    try {
      setTogglingProvider(integ.provider);
      const res = await aiFetch(
        `/api/v1/workspaces/${currentWorkspace.id}/integrations/${integ.id}/toggle`,
        { status: newStatus },
        'POST'
      );

      if (res.ok) {
        toast(
          'success',
          'Integration Updated',
          `${integ.name} integration ${newStatus === 'active' ? 'enabled' : 'disabled'} successfully.`
        );
        fetchIntegrations();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast('error', 'Toggle Failed', errData.detail || 'Failed to update integration state.');
      }
    } catch {
      toast('error', 'Error', 'Error toggling integration.');
    } finally {
      setTogglingProvider(null);
    }
  };

  return (
    <PagePermissionGuard permission="integrations.read">
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-100">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Puzzle className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Enterprise Integrations</h1>
              <p className="text-sm text-slate-400">Manage third-party CRM connectors, webhook data channels, and external OAuth authorizations</p>
            </div>
          </div>

          <button
            onClick={fetchIntegrations}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5 self-start md:self-auto"
          >
            <RefreshCw className="h-4 w-4" /> Refresh Integrations
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
            <button onClick={fetchIntegrations} className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-xs font-semibold">
              Retry
            </button>
          </div>
        )}

        {/* Integration Grid */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
            Loading enterprise integrations status...
          </div>
        ) : integrations.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
            <Puzzle className="h-8 w-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No enterprise integrations registered</p>
            <p className="text-xs text-slate-500">Configured connectors and webhooks will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integ) => {
              const isConnected = integ.status === 'Connected' || integ.status === 'active';
              const isBusy = togglingProvider === integ.provider;

              return (
                <div key={integ.provider} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base text-white">{integ.name}</h3>
                      {isConnected ? (
                        <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Connected
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-950 text-slate-400 border border-slate-800">
                          Disabled
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-mono">Provider: {integ.provider}</p>
                    {integ.connected_at && (
                      <p className="text-[11px] text-slate-500">
                        Connected on {new Date(integ.connected_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" /> API Authenticated
                    </span>

                    <PermissionGuard permission="integrations.manage">
                      {integ.id && (
                        <button
                          onClick={() => handleToggleIntegration(integ)}
                          disabled={isBusy}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            isConnected
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'
                              : 'bg-accent hover:bg-accent/90 text-accent-foreground shadow-xs'
                          } disabled:opacity-50`}
                        >
                          <Power className="h-3.5 w-3.5" />
                          {isBusy ? 'Saving...' : isConnected ? 'Disconnect' : 'Connect'}
                        </button>
                      )}
                    </PermissionGuard>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PagePermissionGuard>
  );
}
