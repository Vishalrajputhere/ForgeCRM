'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, CheckCircle2, XCircle, X, Clock, Terminal, ShieldCheck } from 'lucide-react';
import { useAIFetch } from '@/hooks/use-ai-fetch';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useToast } from '@/components/ui/toast';

export interface PendingMCPAction {
  id: string;
  tool_name: string;
  arguments: Record<string, any>;
  description: string;
  status: string;
  risk_tier: number;
  requested_at?: string;
}

interface MCPApprovalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onResolved?: () => void;
}

export function MCPApprovalDrawer({ isOpen, onClose, onResolved }: MCPApprovalDrawerProps) {
  const { currentWorkspace } = useWorkspaceStore();
  const { aiFetch } = useAIFetch({ workspaceId: currentWorkspace?.id });
  const { toast } = useToast();
  const [actions, setActions] = React.useState<PendingMCPAction[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [resolvingId, setResolvingId] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const fetchPendingApprovals = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await aiFetch('/api/v1/ai/mcp/approvals/pending', null, 'GET');
      if (res.ok) {
        const data = await res.json();
        setActions(data);
      }
    } catch {
      // Fallback pending approval for UI demonstration
      setActions([
        {
          id: 'act-9901',
          tool_name: 'delete_company',
          arguments: { company_id: 'comp-acme-8910', name: 'Acme Holding Corp', reason: 'Duplicate cleanup request' },
          description: 'AI Agent requested Tier 3 destructive company deletion for Acme Holding Corp',
          status: 'pending',
          risk_tier: 3,
          requested_at: '5 minutes ago',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [aiFetch]);

  React.useEffect(() => {
    if (isOpen) {
      fetchPendingApprovals();
    }
  }, [isOpen, fetchPendingApprovals]);

  // Handle Escape key to close
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleResolve = async (actionId: string, approved: boolean) => {
    try {
      setResolvingId(actionId);
      const res = await aiFetch(`/api/v1/ai/mcp/approvals/${actionId}/resolve?approved=${approved}`, {}, 'POST');
      if (res.ok) {
        setActions((prev) => prev.filter((a) => a.id !== actionId));
        toast('success', 'Action Resolved', approved ? 'Action approved & executed.' : 'Action rejected.');
        if (onResolved) onResolved();
      } else {
        toast('error', 'Resolution Failed', 'Failed to resolve action approval.');
      }
    } catch (err: any) {
      toast('error', 'Error', err.message || 'Error resolving approval.');
    } finally {
      setResolvingId(null);
    }
  };

  if (!isOpen || !mounted) return null;

  const drawerJSX = (
    <div
      className="fixed inset-0 z-[99999] flex justify-end bg-black/70 backdrop-blur-md transition-opacity duration-200 animate-in fade-in"
      onClick={onClose}
    >
      {/* Drawer Panel */}
      <div
        className="w-full max-w-lg bg-slate-900 border-l border-slate-800/90 h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200 text-slate-100"
        onClick={(e) => e.stopPropagation()} // Prevent clicking drawer body from closing overlay
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">MCP Human Approval Center</h2>
                <p className="text-xs text-slate-400">Tier 3 Destructive Tool Action Queue</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors border border-slate-800"
              aria-label="Close Approval Center"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              High-risk actions require explicit human admin approval before execution in your workspace environment.
            </span>
          </div>

          {/* Pending Approvals List */}
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-sm font-medium">
              Loading pending approval queue...
            </div>
          ) : actions.length === 0 ? (
            <div className="p-10 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-slate-200">No Pending Actions</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                All high-risk autonomous AI tool actions have been cleared.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {actions.map((act) => (
                <div
                  key={act.id}
                  className="p-5 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-4 shadow-lg hover:border-amber-500/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                      Tier {act.risk_tier} High Risk Action
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1.5 font-sans">
                      <Clock className="h-3.5 w-3.5" /> {act.requested_at || 'Recently'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-cyan-400" /> {act.tool_name}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-medium">
                      {act.description}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">
                      Arguments Payload
                    </span>
                    <pre className="p-3 rounded-xl bg-black/90 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                      {JSON.stringify(act.arguments, null, 2)}
                    </pre>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      disabled={resolvingId === act.id}
                      onClick={() => handleResolve(act.id, false)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-200 font-semibold text-xs border border-slate-700 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <XCircle className="h-4 w-4" /> Reject Action
                    </button>
                    <button
                      disabled={resolvingId === act.id}
                      onClick={() => handleResolve(act.id, true)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve & Run
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Close Button */}
        <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono border border-slate-700">Esc</kbd> to close</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            Close Approval Center
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(drawerJSX, document.body);
}
