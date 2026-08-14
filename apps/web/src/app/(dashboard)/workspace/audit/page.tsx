'use client';

/**
 * ForgeCRM V2 — Enterprise Audit Trail
 *
 * Real API-backed audit log viewer.
 * Searchable & filterable immutable audit trail for security events, member mutations,
 * role assignments, and system policy updates. Read-only.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { FileText, Search, ChevronRight, X, RefreshCw, AlertTriangle, Filter } from 'lucide-react';
import { WorkspaceAdminNav } from '@/components/navigation/workspace-admin-nav';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAIFetch } from '@/hooks/use-ai-fetch';
import { PagePermissionGuard } from '@/components/auth/permission-guard';

interface AuditEvent {
  id: string;
  workspace_id: string;
  actor_user_id?: string;
  actor_email?: string;
  actor_name?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  status: string;
  changes_json?: Record<string, unknown>;
  created_at: string;
}

export default function WorkspaceAuditLogsPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const { aiFetch } = useAIFetch({ workspaceId: currentWorkspace?.id });

  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAuditLogs = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    try {
      setIsLoading(true);
      setErrorMsg(null);

      let url = `/api/v1/workspaces/${currentWorkspace.id}/audit?limit=100`;
      if (actionFilter) url += `&action=${encodeURIComponent(actionFilter)}`;
      if (resourceFilter) url += `&resource_type=${encodeURIComponent(resourceFilter)}`;

      const res = await aiFetch(url, null, 'GET');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setEvents(data as AuditEvent[]);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMsg(errData.detail || `Failed to fetch audit logs (HTTP ${res.status})`);
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Error connecting to audit log service');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace?.id, actionFilter, resourceFilter, aiFetch]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const filteredEvents = events.filter((ev) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ev.action.toLowerCase().includes(q) ||
      ev.resource_type.toLowerCase().includes(q) ||
      (ev.actor_email || '').toLowerCase().includes(q) ||
      (ev.actor_name || '').toLowerCase().includes(q) ||
      (ev.resource_id || '').toLowerCase().includes(q)
    );
  });

  return (
    <PagePermissionGuard permission="audit.read">
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-100">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Enterprise Audit Logs</h1>
              <p className="text-sm text-slate-400">Immutable security event records, privilege modifications, and system administration activity</p>
            </div>
          </div>

          <button
            onClick={fetchAuditLogs}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5 self-start md:self-auto"
          >
            <RefreshCw className="h-4 w-4" /> Refresh Audit Trail
          </button>
        </div>

        {/* Workspace Admin Navigation */}
        <WorkspaceAdminNav />

        {/* Search & Filter Bar */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search audit trail by actor, action, resource..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-400 font-semibold">Action:</span>
              <input
                type="text"
                placeholder="e.g., member.role_changed"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-accent font-mono"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold">Resource:</span>
              <input
                type="text"
                placeholder="e.g., WorkspaceMember"
                value={resourceFilter}
                onChange={(e) => setResourceFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-accent font-mono"
              />
            </div>
          </div>
        </div>

        {/* Error State */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={fetchAuditLogs} className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-xs font-semibold">
              Retry
            </button>
          </div>
        )}

        {/* Audit Log Table */}
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
              Loading workspace audit logs...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FileText className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No matching audit events found</p>
              <p className="text-xs text-slate-500">Security actions and administrative mutations will appear here in real-time.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  <tr>
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Actor</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Target Resource</th>
                    <th className="py-3.5 px-4">IP Address</th>
                    <th className="py-3.5 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredEvents.map((ev) => (
                    <tr
                      key={ev.id}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedEvent(ev)}
                    >
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        {new Date(ev.created_at).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{ev.actor_name || 'System / Service'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{ev.actor_email || ev.actor_user_id || 'system'}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-950 border border-slate-700 text-amber-400 font-mono">
                          {ev.action}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-200">{ev.resource_type}</span>
                        {ev.resource_id && (
                          <span className="text-[11px] text-slate-500 font-mono block truncate max-w-[150px]">
                            ID: {ev.resource_id}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        {ev.ip_address || '127.0.0.1'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <ChevronRight className="h-4 w-4 text-slate-500 ml-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Audit Event Detail Drawer ────────────────────────────────────────── */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-slate-950 border-l border-slate-800 p-6 overflow-y-auto space-y-6 text-slate-100 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Audit Event Details</h3>
                  <p className="text-xs text-slate-400 font-mono">Event ID: {selectedEvent.id}</p>
                </div>
                <button onClick={() => setSelectedEvent(null)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Action Performed</span>
                  <p className="font-bold text-amber-400 font-mono text-sm">{selectedEvent.action}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Actor</span>
                    <p className="font-bold text-white">{selectedEvent.actor_name || 'System'}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{selectedEvent.actor_email}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Resource Type</span>
                    <p className="font-bold text-white">{selectedEvent.resource_type}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{selectedEvent.resource_id}</p>
                  </div>
                </div>

                {selectedEvent.changes_json && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">State Changes &amp; Payload</span>
                    <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-400 overflow-x-auto">
                      {JSON.stringify(selectedEvent.changes_json, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PagePermissionGuard>
  );
}
