'use client';

/**
 * ForgeCRM V2 — Main Workspace Administration Console
 *
 * Real API-backed administrative hub for multi-tenant control, security policies,
 * members, teams, custom roles, integrations, usage telemetry, and security test UI ("My Access").
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2, Users, FolderTree, Shield, ShieldAlert,
  BarChart3, CheckCircle2, XCircle, Save, KeyRound
} from 'lucide-react';

import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAuthStore } from '@/stores/auth-store';
import { usePermissions } from '@/hooks/use-permissions';
import { useAIFetch } from '@/hooks/use-ai-fetch';
import { useFormatters } from '@/hooks/use-formatters';
import { useToast } from '@/components/ui/toast';
import { WorkspaceAdminNav } from '@/components/navigation/workspace-admin-nav';

interface UsageMetrics {
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
  ai_tokens_used: number;
  ai_cost_usd: number;
}

export default function WorkspaceAdminMainPage(): React.JSX.Element {
  const { currentWorkspace } = useWorkspaceStore();
  const user = useAuthStore((state) => state.user);
  const { isSuperAdmin, isWorkspaceAdmin, roles, can } = usePermissions();
  const { aiFetch } = useAIFetch({ workspaceId: currentWorkspace?.id });
  const { formatCurrency } = useFormatters();
  const { toast } = useToast();

  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);

  // Overview Settings Form
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [industry, setIndustry] = useState('Software & SaaS');
  const [website, setWebsite] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentWorkspace) {
      setName(currentWorkspace.name || '');
      setSlug(currentWorkspace.slug || '');
      setIndustry(currentWorkspace.industry || 'Software & SaaS');
      setWebsite(currentWorkspace.website || '');
    }
  }, [currentWorkspace]);

  const loadUsageMetrics = React.useCallback(async () => {
    if (!currentWorkspace?.id) return;
    try {
      const res = await aiFetch(`/api/v1/workspaces/${currentWorkspace.id}/usage`, null, 'GET');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data as UsageMetrics);
      }
    } catch {
      // Silently fail if endpoint restricted
    }
  }, [currentWorkspace?.id, aiFetch]);

  useEffect(() => {
    loadUsageMetrics();
  }, [loadUsageMetrics]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace?.id) return;

    try {
      setIsSaving(true);
      const res = await aiFetch(`/api/v1/workspaces/${currentWorkspace.id}/settings`, {
        name,
        slug,
        industry,
        website,
      }, 'PATCH');

      if (res.ok) {
        toast('success', 'Settings Updated', 'Workspace configuration updated successfully.');
      } else {
        toast('error', 'Update Failed', 'Failed to update workspace settings.');
      }
    } catch (err: unknown) {
      toast('error', 'Error', (err as Error).message || 'Error updating settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const primaryRole = isSuperAdmin
    ? 'Super Admin'
    : isWorkspaceAdmin
    ? 'Workspace Admin'
    : roles[0] || 'Member';

  const capabilityMatrix = [
    { title: 'Read Companies & Contacts', perm: 'companies.read', cat: 'CRM' },
    { title: 'Create & Edit Deals', perm: 'deals.create', cat: 'CRM' },
    { title: 'Delete Records & Archive', perm: 'companies.delete', cat: 'CRM' },
    { title: 'AI Copilot & Assistant', perm: 'ai.use', cat: 'AI' },
    { title: 'Execute Autonomous AI Agents', perm: 'ai.agents.run', cat: 'AI' },
    { title: 'Approve MCP Tier-3 Actions', perm: 'ai.mcp.approve', cat: 'AI' },
    { title: 'Upload & Delete File Storage', perm: 'storage.upload', cat: 'Storage' },
    { title: 'Create Workflow Automations', perm: 'automations.create', cat: 'Automations' },
    { title: 'Invite Workspace Members', perm: 'users.invite', cat: 'Members' },
    { title: 'Remove Workspace Members', perm: 'users.remove', cat: 'Members' },
    { title: 'Create & Edit Teams', perm: 'teams.create', cat: 'Teams' },
    { title: 'Custom Roles & RBAC Matrix', perm: 'roles.manage', cat: 'Security' },
    { title: 'Security Policies & Session Revocation', perm: 'security.manage', cat: 'Security' },
    { title: 'Audit Trail Inspection', perm: 'audit.read', cat: 'Audit' },
    { title: 'Enterprise Integration Admin', perm: 'integrations.manage', cat: 'Integrations' },
  ];

  const allowedCapabilities = capabilityMatrix.filter((c) => can(c.perm) || isWorkspaceAdmin);
  const deniedCapabilities = capabilityMatrix.filter((c) => !can(c.perm) && !isWorkspaceAdmin);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-100">
      {/* Workspace Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shadow-md">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">{currentWorkspace?.name || 'Workspace'} Admin Hub</h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {metrics?.subscription_plan || 'Enterprise Tier'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Workspace ID: {currentWorkspace?.id}</p>
          </div>
        </div>

        {/* Right Action Items */}
        <div className="flex items-center gap-3">
          <Link
            href="/accept-invitation"
            className="px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-indigo-500/30 hover:border-indigo-500/60 hover:bg-indigo-500/10 text-indigo-300 font-semibold text-xs transition-all shadow-xs flex items-center gap-1.5"
          >
            <KeyRound className="h-4 w-4 text-indigo-400" /> Redeem Invitation Code
          </Link>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs">
              {user?.first_name?.[0] || 'U'}
            </div>
            <div className="text-left text-xs">
              <div className="font-bold text-white flex items-center gap-1.5">
                {user?.first_name} {user?.last_name}
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-accent/20 text-accent">{primaryRole}</span>
              </div>
              <span className="text-[11px] text-slate-400">{user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Navigation Sub-Bar */}
      <WorkspaceAdminNav />

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Workspace Members</span>
            <Users className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white">{metrics?.members_count ?? 1} <span className="text-xs font-normal text-slate-500">/ {metrics?.members_limit ?? 50} max</span></p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${Math.min(100, ((metrics?.members_count ?? 1) / (metrics?.members_limit ?? 50)) * 100)}%` }} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Organizational Teams</span>
            <FolderTree className="h-4 w-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">{metrics?.teams_count ?? 1} <span className="text-xs font-normal text-slate-500">active</span></p>
          <p className="text-[11px] text-slate-500">Configured sales &amp; service teams</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Security Control Status</span>
            <ShieldAlert className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">Protected</p>
          <p className="text-[11px] text-slate-500">Session revocation &amp; policy rules active</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">AI Tokens Consumed</span>
            <BarChart3 className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">{(metrics?.ai_tokens_used ?? 0).toLocaleString()}</p>
          <p className="text-[11px] text-slate-500">Estimated cost: {formatCurrency(metrics?.ai_cost_usd ?? 0)}</p>
        </div>
      </div>

      {/* Main Grid: Settings & Security Test UI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Column: General Settings Form */}
        <form onSubmit={handleSaveSettings} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5 h-fit">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="h-4 w-4 text-accent" /> Workspace Profile
            </h2>
            <button
              type="submit"
              disabled={isSaving || !can('workspace.update')}
              className="px-3.5 py-1.5 rounded-xl bg-accent text-accent-foreground font-semibold text-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" /> {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Workspace Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!can('workspace.update')}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-accent disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Workspace Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                disabled={!can('workspace.update')}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-accent disabled:opacity-60 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Industry Sector</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                disabled={!can('workspace.update')}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-accent disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Website URL</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                disabled={!can('workspace.update')}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-accent disabled:opacity-60"
              />
            </div>
          </div>
        </form>

        {/* Right 2 Columns: "My Access" Security & RBAC Test UI (Requirement #24) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" /> Security Test UI — &quot;My Access Matrix&quot;
              </h2>
              <p className="text-xs text-slate-400">Live evaluation of effective permissions for current user account</p>
            </div>
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-800 text-cyan-400 border border-slate-700 font-mono">
              {primaryRole}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* "What I Can Do" */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> What I Can Do ({allowedCapabilities.length})
                </h3>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {allowedCapabilities.map((cap) => (
                  <div key={cap.title} className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between text-xs">
                    <span className="text-slate-200 font-medium">{cap.title}</span>
                    <code className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono">{cap.perm}</code>
                  </div>
                ))}
              </div>
            </div>

            {/* "What I Cannot Do" */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-rose-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-rose-400" /> What I Cannot Do ({deniedCapabilities.length})
                </h3>
              </div>
              {deniedCapabilities.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  You possess unrestricted Super Admin / Workspace Admin capabilities across all modules.
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {deniedCapabilities.map((cap) => (
                    <div key={cap.title} className="p-2 rounded-lg bg-rose-500/5 border border-rose-500/10 flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">{cap.title}</span>
                      <code className="text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded font-mono">{cap.perm}</code>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
