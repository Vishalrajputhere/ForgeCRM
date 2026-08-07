'use client';

/**
 * ForgeCRM — Dedicated Automation Run History Page
 *
 * Dedicated route: /automations/[id]/runs
 * Displays full execution logs, summary metrics, step breakdowns, and retry capability.
 */

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  RotateCw,
  Loader2,
  Filter,
} from 'lucide-react';

import { useAutomation } from '@/hooks/use-automation';
import type { AutomationLog, AutomationRun } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  const map: Record<string, string> = {
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    failed:  'bg-red-500/10 text-red-400 border border-red-500/20',
    running: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    skipped: 'bg-[rgba(255,255,255,0.06)] text-[#65656e] border border-[rgba(255,255,255,0.08)]',
  };
  return map[status] ?? 'bg-[rgba(255,255,255,0.06)] text-[#9898a0]';
}

function statusIcon(status: string) {
  if (status === 'success') return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
  if (status === 'failed')  return <XCircle className="h-3.5 w-3.5 text-red-400" />;
  if (status === 'running') return <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />;
  return <Clock className="h-3.5 w-3.5 text-[#65656e]" />;
}

function RunCard({ run, onRetry }: { run: AutomationRun; onRetry: (runId: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#141416] overflow-hidden transition-all hover:border-[rgba(255,255,255,0.12)]">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5">
        {/* Status Badge */}
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge(run.status)}`}>
          {statusIcon(run.status)}
          <span className="capitalize">{run.status}</span>
        </span>

        {/* Timestamp */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-[#f2f2f3]">
            Run ID: <span className="font-mono text-[#9898a0]">{run.id.slice(0, 8)}…</span>
          </div>
          <div className="mt-0.5 text-[11px] text-[#65656e]">
            {new Date(run.started_at).toLocaleString()}
            {run.trigger_entity_type && (
              <span className="ml-2 rounded bg-[rgba(255,255,255,0.04)] px-1.5 py-0.5 text-[10px] text-[#9898a0]">
                {run.trigger_entity_type}
              </span>
            )}
          </div>
        </div>

        {/* Action Metrics & Duration */}
        <div className="flex items-center gap-4 text-xs text-[#9898a0]">
          <div>
            <span className="font-semibold text-[#f2f2f3]">{run.actions_executed}</span> executed
            {run.actions_failed > 0 && (
              <span className="ml-1.5 text-red-400">({run.actions_failed} failed)</span>
            )}
          </div>
          <div className="font-mono text-[#65656e]">
            {run.duration_ms != null ? `${run.duration_ms}ms` : '—'}
          </div>
        </div>

        {/* Retry & Expand Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onRetry(run.id)}
            title="Retry Execution"
            className="flex items-center gap-1 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-2.5 py-1.5 text-xs text-[#9898a0] transition-colors hover:bg-[rgba(255,255,255,0.08)] hover:text-[#f2f2f3]"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Retry</span>
          </button>
          <button
            onClick={() => setExpanded(e => !e)}
            className="rounded-lg p-1.5 text-[#65656e] transition-colors hover:bg-[rgba(255,255,255,0.08)] hover:text-[#f2f2f3]"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Step Logs Drawer */}
      {expanded && (
        <div className="border-t border-[rgba(255,255,255,0.06)] bg-[#0e0e10] p-4 flex flex-col gap-4">
          {/* Phase 12: Rule Debugger 'Explain Why' */}
          {(run.status === 'skipped' || run.status === 'failed') && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs">
              <div className="mb-2 font-semibold text-amber-400 flex items-center gap-1.5">
                <span>🔍 Rule Debugger — Explain Why</span>
              </div>
              <p className="text-[#9898a0] mb-2">
                {run.status === 'skipped'
                  ? 'This automation run was skipped because one or more rule conditions evaluated to FALSE.'
                  : 'This automation run failed during execution.'}
              </p>
              {run.error_message && (
                <div className="mb-2 rounded bg-red-500/10 p-2 font-mono text-[11px] text-red-400 border border-red-500/20">
                  Error: {run.error_message}
                </div>
              )}
            </div>
          )}

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#65656e]">
              Step Execution Breakdown ({run.logs.length})
            </h4>
            {run.logs.length === 0 ? (
              <p className="text-xs text-[#65656e]">No step logs recorded for this run.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {run.logs.map((log: AutomationLog) => (
                  <div
                    key={log.id}
                    className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#141416] p-3 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[rgba(245,158,11,0.15)] text-[10px] font-bold text-[#f59e0b]">
                          {log.position + 1}
                        </span>
                        <span className="font-semibold text-[#f2f2f3]">{log.action_type}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadge(log.status)}`}>
                        {statusIcon(log.status)}
                        {log.status}
                      </span>
                    </div>
                    {log.message && (
                      <p className="mt-1 text-[#9898a0]">{log.message}</p>
                    )}
                    {log.result_data && (
                      <pre className="mt-2 overflow-x-auto rounded bg-[#0a0a0c] p-2 font-mono text-[11px] text-[#22c55e]">
                        {JSON.stringify(log.result_data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────

export default function AutomationRunsPage() {
  const params = useParams();
  const router = useRouter();
  const ruleId = params.id as string;

  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [retryToast, setRetryToast] = useState<string | null>(null);

  const { useAutomationRule, useAutomationRuns, testAutomationRule } = useAutomation();
  const { data: rule } = useAutomationRule(ruleId);
  const { data: runs = [], isLoading: runsLoading } = useAutomationRuns(ruleId);

  const filteredRuns = statusFilter
    ? runs.filter(r => r.status === statusFilter)
    : runs;

  const totalRuns = runs.length;
  const successes = runs.filter(r => r.status === 'success').length;
  const failures = runs.filter(r => r.status === 'failed').length;
  const avgDuration = runs.length > 0
    ? Math.round(runs.reduce((acc, r) => acc + (r.duration_ms ?? 0), 0) / runs.length)
    : 0;

  const handleRetry = (runId: string) => {
    testAutomationRule.mutate(
      { ruleId, payload: { trigger_data: { _retry_from_run_id: runId } } },
      {
        onSuccess: () => {
          setRetryToast('✓ Retry triggered successfully.');
          setTimeout(() => setRetryToast(null), 3000);
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ── Breadcrumb Header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/automations/${ruleId}`)}
            className="rounded-lg p-2 text-[#65656e] transition-colors hover:bg-[rgba(255,255,255,0.06)] hover:text-[#f2f2f3]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-[#65656e]">
              <span className="hover:underline cursor-pointer" onClick={() => router.push('/automations')}>Automations</span>
              <span>/</span>
              <span className="hover:underline cursor-pointer" onClick={() => router.push(`/automations/${ruleId}`)}>
                {rule?.name ?? 'Rule'}
              </span>
              <span>/</span>
              <span className="text-[#f59e0b]">Runs</span>
            </div>
            <h1 className="mt-0.5 text-xl font-bold text-[#f2f2f3]">
              Execution History
            </h1>
          </div>
        </div>

        {retryToast && (
          <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
            {retryToast}
          </span>
        )}
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Executions', value: totalRuns, icon: <Activity className="h-4 w-4 text-[#3b82f6]" /> },
          { label: 'Successful', value: successes, icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" /> },
          { label: 'Failed', value: failures, icon: <XCircle className="h-4 w-4 text-red-400" /> },
          { label: 'Avg Duration', value: `${avgDuration}ms`, icon: <Clock className="h-4 w-4 text-[#f59e0b]" /> },
        ].map(card => (
          <div key={card.label} className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#141416] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#65656e]">{card.label}</span>
              {card.icon}
            </div>
            <div className="mt-2 text-xl font-bold text-[#f2f2f3]">{card.value}</div>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-[#65656e]" />
        <span className="text-xs text-[#65656e]">Filter:</span>
        {[
          { label: 'All Runs', value: undefined },
          { label: 'Success', value: 'success' },
          { label: 'Failed', value: 'failed' },
          { label: 'Skipped', value: 'skipped' },
        ].map(f => (
          <button
            key={f.label}
            onClick={() => setStatusFilter(f.value)}
            className={`rounded-lg px-3 py-1.5 text-xs transition-all ${
              statusFilter === f.value
                ? 'bg-[rgba(245,158,11,0.15)] text-[#f59e0b] border border-[rgba(245,158,11,0.3)]'
                : 'border border-[rgba(255,255,255,0.08)] text-[#9898a0] hover:text-[#f2f2f3]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Runs List ── */}
      {runsLoading ? (
        <div className="flex h-32 items-center justify-center text-sm text-[#65656e]">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#f59e0b]" />
          Loading execution runs…
        </div>
      ) : filteredRuns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(255,255,255,0.08)] bg-[#141416] py-16 text-center">
          <Activity className="mb-3 h-8 w-8 text-[#65656e]" />
          <h3 className="text-sm font-semibold text-[#f2f2f3]">No execution runs found</h3>
          <p className="mt-1 text-xs text-[#65656e]">
            {statusFilter ? `No runs with status '${statusFilter}'` : 'This automation has not been triggered yet.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredRuns.map(run => (
            <RunCard key={run.id} run={run} onRetry={handleRetry} />
          ))}
        </div>
      )}
    </div>
  );
}
