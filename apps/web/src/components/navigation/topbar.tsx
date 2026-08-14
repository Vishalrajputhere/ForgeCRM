'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Bell, LogOut, Settings, Sparkles, ShieldAlert, Shield, CheckCircle, XCircle, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { Breadcrumb } from '@/components/navigation/breadcrumb';
import { QuickCreateMenu } from '@/components/navigation/quick-create';
import { MCPApprovalDrawer } from '@/components/ai/mcp-approval-drawer';
import { useNavigationStore } from '@/stores/navigation-store';
import { useAuth } from '@/hooks/use-auth';
import { usePermissions } from '@/hooks/use-permissions';
import { useAIFetch } from '@/hooks/use-ai-fetch';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { IconButton } from '@/components/ui/button';
import { Avatar } from '@/components/ui/badge';
import { Caption, Text } from '@/components/ui/typography';

/** Polls GET /api/v1/ai/mcp/approvals/pending every 30 seconds and returns the real count. */
function useMCPPendingCount(enabled: boolean) {
  const { currentWorkspace } = useWorkspaceStore();
  const { aiFetch } = useAIFetch({ workspaceId: currentWorkspace?.id });
  const [count, setCount] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCount = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    try {
      const res = await aiFetch('/api/v1/ai/mcp/approvals/pending', null, 'GET');
      if (res.ok) {
        const data: unknown[] = await res.json();
        setCount(Array.isArray(data) ? data.length : 0);
      }
    } catch {
      // silently ignore
    }
  }, [aiFetch, currentWorkspace?.id]);

  useEffect(() => {
    if (!enabled) return;
    fetchCount();
    intervalRef.current = setInterval(fetchCount, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, fetchCount]);

  return { count, refetch: fetchCount };
}

export function Topbar({ onOpenCmdK }: { onOpenCmdK: () => void }) {
  const { user, logout } = useAuth();
  const { isSuperAdmin, isWorkspaceAdmin, roles, can } = usePermissions();
  const { currentWorkspace } = useWorkspaceStore();
  const { notificationOpen, setNotificationOpen } = useNavigationStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [mcpDrawerOpen, setMcpDrawerOpen] = useState(false);

  const { count: pendingCount, refetch: refetchMCPCount } = useMCPPendingCount(true);

  const handleMcpDrawerClose = () => {
    setMcpDrawerOpen(false);
    refetchMCPCount();
  };

  const primaryRole = isSuperAdmin
    ? 'Super Admin'
    : isWorkspaceAdmin
    ? 'Workspace Admin'
    : roles[0] || 'Member';

  const accessLabel = isSuperAdmin
    ? 'Full System Control'
    : isWorkspaceAdmin
    ? 'Full Workspace Access'
    : 'Scoped Member Access';

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-border-default bg-surface/80 backdrop-blur-md px-4 md:px-6">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Breadcrumb />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Global Search Trigger */}
        <button
          onClick={onOpenCmdK}
          className="hidden sm:flex items-center gap-2 rounded-lg border border-border-default bg-sunken px-3 py-1.5 text-xs text-muted hover:text-primary hover:border-border-strong transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search or jump to…</span>
          <kbd className="ml-2 rounded border border-border-strong bg-overlay px-1.5 font-mono text-[10px]">Cmd+K</kbd>
        </button>

        {/* Top-Level User Security Indicator Badge */}
        <button
          onClick={() => setSecurityModalOpen(true)}
          className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-medium text-slate-200 hover:border-accent/50 hover:bg-slate-900 transition-all cursor-pointer shadow-xs"
          title="Click to view full security role & effective permission matrix"
        >
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-accent">{primaryRole}</span>
          <span className="text-slate-500">•</span>
          <span className="text-[11px] text-slate-400">{accessLabel}</span>
        </button>

        {/* AI Quick Copilot Action */}
        <Link
          href="/ai"
          className="hidden md:flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1.5 text-xs font-semibold text-accent hover:bg-accent/20 transition-all shadow-xs"
          title="Open AI Workspace & Sales Copilot"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>AI Copilot</span>
        </Link>

        {/* Quick Create Menu */}
        <QuickCreateMenu />

        {/* MCP Approvals Trigger */}
        <div className="relative">
          <button
            onClick={() => setMcpDrawerOpen(true)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-amber-400 hover:bg-hover transition-colors cursor-pointer"
            title="MCP Human Approval Center"
            aria-label="Open MCP Approval Queue"
          >
            <ShieldAlert className="h-4 w-4" />
            {pendingCount !== null && pendingCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-black shadow-xs">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </button>
        </div>

        <MCPApprovalDrawer isOpen={mcpDrawerOpen} onClose={handleMcpDrawerClose} onResolved={refetchMCPCount} />

        {/* Notifications */}
        <div className="relative">
          <IconButton
            icon={<Bell className="h-4 w-4" />}
            variant="ghost"
            size="sm"
            aria-label="Open notifications"
            onClick={() => setNotificationOpen(!notificationOpen)}
          />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent animate-pulse" />
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-full p-0.5 hover:ring-2 hover:ring-accent transition-all cursor-pointer"
          >
            <Avatar name={user ? `${user.first_name} ${user.last_name ?? ''}` : 'User'} size="sm" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border-default bg-overlay p-1.5 shadow-xl animate-in fade-in duration-100">
              <div className="px-3 py-2 border-b border-border-subtle mb-1">
                <Text variant="body-s" className="font-semibold text-primary">
                  {user ? `${user.first_name} ${user.last_name ?? ''}` : 'User'}
                </Text>
                <Caption color="muted" className="block truncate">{user?.email}</Caption>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-accent/15 text-accent border border-accent/20">
                    {primaryRole}
                  </span>
                </div>
              </div>
              <Link
                href="/workspace"
                onClick={() => setUserMenuOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-secondary hover:text-primary hover:bg-hover transition-colors"
              >
                <Settings className="h-3.5 w-3.5 text-muted" /> Workspace Admin
              </Link>
              <Link
                href="/accept-invitation"
                onClick={() => setUserMenuOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
              >
                <KeyRound className="h-3.5 w-3.5 text-indigo-400" /> Redeem Invitation Code
              </Link>
              <button
                onClick={() => { setUserMenuOpen(false); setSecurityModalOpen(true); }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-secondary hover:text-primary hover:bg-hover transition-colors"
              >
                <Shield className="h-3.5 w-3.5 text-muted" /> Security Role Summary
              </button>
              <button
                onClick={() => { void logout(); }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-status-danger-fg hover:bg-status-danger-bg transition-colors mt-1"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Security Context Modal */}
      {securityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-5 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Security Role &amp; Permission Summary</h3>
                  <p className="text-xs text-slate-400">Authenticated RBAC session state for current user</p>
                </div>
              </div>
              <button
                onClick={() => setSecurityModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">User</span>
                <p className="font-bold text-white truncate">{user?.first_name} {user?.last_name}</p>
                <p className="text-[11px] text-slate-400 font-mono truncate">{user?.email}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Assigned Role</span>
                <p className="font-bold text-accent">{primaryRole}</p>
                <p className="text-[11px] text-emerald-400 font-medium">{accessLabel}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1 col-span-2">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Active Workspace</span>
                <p className="font-bold text-white">{currentWorkspace?.name || 'Default Workspace'}</p>
                <p className="font-mono text-[10px] text-cyan-400">ID: {currentWorkspace?.id}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Module Capability Matrix</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { name: 'CRM Directory Read/Write', allowed: can('companies.read') || isWorkspaceAdmin },
                  { name: 'CRM Bulk Delete/Archive', allowed: can('companies.delete') || isWorkspaceAdmin },
                  { name: 'AI Sales Copilot & Tools', allowed: can('ai.use') || isWorkspaceAdmin },
                  { name: 'AI Governance Admin', allowed: can('ai.admin.view') || isWorkspaceAdmin },
                  { name: 'File Storage Upload/Delete', allowed: can('storage.upload') || isWorkspaceAdmin },
                  { name: 'Workflow Automations', allowed: can('automations.read') || isWorkspaceAdmin },
                  { name: 'Member Invites & Management', allowed: can('users.invite') || isWorkspaceAdmin },
                  { name: 'Roles & RBAC Customization', allowed: can('roles.manage') || isWorkspaceAdmin },
                  { name: 'Security Policy Updates', allowed: can('security.manage') || isWorkspaceAdmin },
                  { name: 'Audit Log Inspection', allowed: can('audit.read') || isWorkspaceAdmin },
                ].map((cap) => (
                  <div key={cap.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-[11px] text-slate-300 truncate">{cap.name}</span>
                    {cap.allowed ? (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSecurityModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
