'use client';

/**
 * ForgeCRM — Automations List Page
 *
 * Shows all automation rules for the workspace.
 * Premium dark glass UI matching existing ForgeCRM design language.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PagePermissionGuard } from '@/components/auth/permission-guard';
import {
  Zap,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Activity,
  LayoutTemplate,
} from 'lucide-react';

import { useAutomation } from '@/hooks/use-automation';
import type { AutomationRuleSummary } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const TRIGGER_LABELS: Record<string, string> = {
  LEAD_CREATED: 'Lead Created',
  LEAD_UPDATED: 'Lead Updated',
  LEAD_CONVERTED: 'Lead Converted',
  DEAL_CREATED: 'Deal Created',
  DEAL_UPDATED: 'Deal Updated',
  DEAL_STAGE_CHANGED: 'Deal Stage Changed',
  TASK_CREATED: 'Task Created',
  TASK_COMPLETED: 'Task Completed',
  CONTACT_CREATED: 'Contact Created',
  CONTACT_UPDATED: 'Contact Updated',
  COMPANY_CREATED: 'Company Created',
  COMPANY_UPDATED: 'Company Updated',
  MANUAL: 'Manual Trigger',
  SCHEDULED: 'Scheduled',
};

const TRIGGER_COLORS: Record<string, string> = {
  LEAD_CREATED: '#f59e0b',
  LEAD_UPDATED: '#d97706',
  LEAD_CONVERTED: '#10b981',
  DEAL_CREATED: '#3b82f6',
  DEAL_UPDATED: '#6366f1',
  DEAL_STAGE_CHANGED: '#8b5cf6',
  TASK_CREATED: '#06b6d4',
  TASK_COMPLETED: '#22c55e',
  CONTACT_CREATED: '#f43f5e',
  CONTACT_UPDATED: '#fb923c',
  COMPANY_CREATED: '#a78bfa',
  COMPANY_UPDATED: '#c084fc',
  MANUAL: '#64748b',
  SCHEDULED: '#64748b',
};

function formatRelativeTime(dateStr: string | null) {
  if (!dateStr) return 'Never';
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#141416] p-4 animate-pulse">
      <div className="h-10 w-10 rounded-lg bg-[rgba(255,255,255,0.06)]" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-48 rounded bg-[rgba(255,255,255,0.06)]" />
        <div className="h-3 w-32 rounded bg-[rgba(255,255,255,0.04)]" />
      </div>
      <div className="h-6 w-24 rounded-full bg-[rgba(255,255,255,0.06)]" />
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(255,255,255,0.1)] bg-[#141416] py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgba(245,158,11,0.1)] shadow-[0_0_32px_rgba(245,158,11,0.15)]">
        <Zap className="h-8 w-8 text-[#f59e0b]" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-[#f2f2f3]">No automations yet</h3>
      <p className="mb-6 max-w-sm text-sm text-[#9898a0]">
        Build your first workflow automation to eliminate repetitive tasks and supercharge your sales process.
      </p>
      <button
        id="automation-create-first-btn"
        onClick={onNew}
        className="inline-flex items-center gap-2 rounded-lg bg-[#f59e0b] px-4 py-2.5 text-sm font-semibold text-[#0e0e10] shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all hover:bg-[#d97706] hover:shadow-[0_0_28px_rgba(245,158,11,0.5)] active:scale-95"
      >
        <Plus className="h-4 w-4" />
        Create Your First Automation
      </button>
    </div>
  );
}

function RuleCard({
  rule,
  onToggle,
  onDelete,
}: {
  rule: AutomationRuleSummary;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const successRate = rule.total_runs > 0
    ? Math.round((rule.successful_runs / rule.total_runs) * 100)
    : null;
  const triggerColor = TRIGGER_COLORS[rule.trigger_event] ?? '#64748b';
  const triggerLabel = TRIGGER_LABELS[rule.trigger_event] ?? rule.trigger_event;

  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#141416] transition-all duration-200 hover:border-[rgba(255,255,255,0.12)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
      style={{ borderLeft: `3px solid ${triggerColor}` }}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Icon */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${triggerColor}18` }}
        >
          <Zap className="h-5 w-5" style={{ color: triggerColor }} />
        </div>

        {/* Name + Trigger */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-[#f2f2f3] group-hover:text-white">
              {rule.name}
            </h3>
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
              style={{ backgroundColor: `${triggerColor}20`, color: triggerColor }}
            >
              {triggerLabel}
            </span>
          </div>
          {rule.description && (
            <p className="mt-0.5 truncate text-xs text-[#9898a0]">{rule.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="hidden shrink-0 items-center gap-5 sm:flex">
          <div className="text-center">
            <div className="text-sm font-semibold text-[#f2f2f3]">{rule.total_runs}</div>
            <div className="text-[10px] text-[#65656e]">Runs</div>
          </div>
          {successRate !== null && (
            <div className="text-center">
              <div className={`text-sm font-semibold ${successRate >= 80 ? 'text-emerald-400' : successRate >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                {successRate}%
              </div>
              <div className="text-[10px] text-[#65656e]">Success</div>
            </div>
          )}
          <div className="text-center">
            <div className="text-xs text-[#9898a0]">{formatRelativeTime(rule.last_run_at)}</div>
            <div className="text-[10px] text-[#65656e]">Last run</div>
          </div>
        </div>

        {/* Status + Actions */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Active badge */}
          <span
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
              rule.is_active
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-[rgba(255,255,255,0.06)] text-[#65656e]'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${rule.is_active ? 'bg-emerald-400' : 'bg-[#65656e]'}`} />
            {rule.is_active ? 'Active' : 'Inactive'}
          </span>

          {/* Action buttons */}
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              id={`automation-view-${rule.id}`}
              title="View detail"
              onClick={() => router.push(`/automations/${rule.id}`)}
              className="rounded-lg p-1.5 text-[#65656e] transition-colors hover:bg-[rgba(255,255,255,0.08)] hover:text-[#f2f2f3]"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              id={`automation-toggle-${rule.id}`}
              title={rule.is_active ? 'Disable' : 'Enable'}
              onClick={() => onToggle(rule.id)}
              className="rounded-lg p-1.5 text-[#65656e] transition-colors hover:bg-[rgba(255,255,255,0.08)] hover:text-[#f59e0b]"
            >
              {rule.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
            </button>
            <button
              id={`automation-delete-${rule.id}`}
              title="Delete"
              onClick={() => onDelete(rule.id)}
              className="rounded-lg p-1.5 text-[#65656e] transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AutomationsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { useAutomationRules, toggleAutomationRule, deleteAutomationRule } = useAutomation();

  const { data, isLoading, error } = useAutomationRules({
    search: search || undefined,
    is_active: activeFilter ?? undefined,
  });

  const rules = data?.items ?? [];

  const handleToggle = (id: string) => {
    toggleAutomationRule.mutate(id);
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      deleteAutomationRule.mutate(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      // Auto-cancel confirmation after 3s
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  return (
    <PagePermissionGuard permission="automations.read">
      <div className="flex flex-col gap-6 p-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(245,158,11,0.12)] shadow-[0_0_16px_rgba(245,158,11,0.2)]">
              <Zap className="h-4 w-4 text-[#f59e0b]" />
            </div>
            <h1 className="text-xl font-bold text-[#f2f2f3]">Automations</h1>
          </div>
          <p className="mt-1 text-sm text-[#9898a0]">
            Build workflow automations that react to CRM events automatically.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="automation-templates-btn"
            onClick={() => router.push('/automations/new?tab=templates')}
            className="flex items-center gap-1.5 rounded-lg border border-[rgba(255,255,255,0.1)] px-3 py-2 text-sm text-[#9898a0] transition-all hover:border-[rgba(255,255,255,0.2)] hover:text-[#f2f2f3]"
          >
            <LayoutTemplate className="h-4 w-4" />
            Templates
          </button>
          <button
            id="automation-new-btn"
            onClick={() => router.push('/automations/new')}
            className="flex items-center gap-1.5 rounded-lg bg-[#f59e0b] px-3 py-2 text-sm font-semibold text-[#0e0e10] shadow-[0_0_16px_rgba(245,158,11,0.35)] transition-all hover:bg-[#d97706] hover:shadow-[0_0_22px_rgba(245,158,11,0.45)] active:scale-95"
          >
            <Plus className="h-4 w-4" />
            New Automation
          </button>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      {!isLoading && rules.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total Rules', value: data?.total ?? 0, icon: <Zap className="h-4 w-4" />, color: '#f59e0b' },
            { label: 'Active', value: rules.filter(r => r.is_active).length, icon: <CheckCircle2 className="h-4 w-4" />, color: '#22c55e' },
            { label: 'Total Runs', value: rules.reduce((s, r) => s + r.total_runs, 0), icon: <Activity className="h-4 w-4" />, color: '#3b82f6' },
            { label: 'Failed Runs', value: rules.reduce((s, r) => s + r.failed_runs, 0), icon: <XCircle className="h-4 w-4" />, color: '#ef4444' },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#141416] p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9898a0]">{stat.label}</span>
                <span style={{ color: stat.color }}>{stat.icon}</span>
              </div>
              <div className="mt-1.5 text-xl font-bold text-[#f2f2f3]">{stat.value.toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#65656e]" />
          <input
            id="automation-search"
            type="text"
            placeholder="Search automations…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#141416] py-2.5 pl-9 pr-3 text-sm text-[#f2f2f3] placeholder-[#65656e] outline-none transition-all focus:border-[rgba(245,158,11,0.4)] focus:ring-1 focus:ring-[rgba(245,158,11,0.2)]"
          />
        </div>
        <div className="flex items-center gap-2">
          {[
            { label: 'All', value: undefined },
            { label: 'Active', value: true },
            { label: 'Inactive', value: false },
          ].map(f => (
            <button
              key={f.label}
              onClick={() => setActiveFilter(f.value as boolean | undefined)}
              className={`rounded-lg px-3 py-2 text-sm transition-all ${
                activeFilter === f.value
                  ? 'bg-[rgba(245,158,11,0.15)] text-[#f59e0b] shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                  : 'border border-[rgba(255,255,255,0.08)] text-[#9898a0] hover:border-[rgba(255,255,255,0.14)] hover:text-[#f2f2f3]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Rules List ── */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          <XCircle className="h-4 w-4 shrink-0" />
          Failed to load automations. Please refresh the page.
        </div>
      ) : rules.length === 0 ? (
        <EmptyState onNew={() => router.push('/automations/new')} />
      ) : (
        <div className="flex flex-col gap-2">
          {rules.map(rule => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onToggle={handleToggle}
              onDelete={() => handleDelete(rule.id)}
            />
          ))}
        </div>
      )}

      {/* ── Delete confirm toast ── */}
      {confirmDeleteId && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-red-500/30 bg-[#1a1a1d] px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.7)]">
          <XCircle className="h-4 w-4 text-red-400" />
          <span className="text-sm text-[#f2f2f3]">Click delete again to confirm.</span>
          <button
            onClick={() => setConfirmDeleteId(null)}
            className="text-xs text-[#65656e] hover:text-[#9898a0]"
          >
            Cancel
          </button>
        </div>
      )}
      </div>
    </PagePermissionGuard>
  );
}
