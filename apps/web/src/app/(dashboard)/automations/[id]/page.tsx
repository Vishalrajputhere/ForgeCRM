'use client';

/**
 * ForgeCRM — Automation Rule Detail Page
 *
 * Shows rule configuration, toggle, run history, and step logs.
 */

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Zap,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Play,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Loader2,
  Wrench,
  X,
} from 'lucide-react';

import { useAutomation } from '@/hooks/use-automation';
import { getFieldDefinition, getFieldsForTrigger } from '@/lib/automation-registry';
import type { AutomationRun } from '@/types';

// ── Helpers ────────────────────────────────────────────────────────────────────

const TRIGGER_LABELS: Record<string, string> = {
  LEAD_CREATED: 'Lead Created', LEAD_UPDATED: 'Lead Updated', LEAD_CONVERTED: 'Lead Converted',
  DEAL_CREATED: 'Deal Created', DEAL_UPDATED: 'Deal Updated', DEAL_STAGE_CHANGED: 'Deal Stage Changed',
  TASK_CREATED: 'Task Created', TASK_COMPLETED: 'Task Completed',
  CONTACT_CREATED: 'Contact Created', CONTACT_UPDATED: 'Contact Updated',
  COMPANY_CREATED: 'Company Created', COMPANY_UPDATED: 'Company Updated',
  MANUAL: 'Manual Trigger', SCHEDULED: 'Scheduled',
};

function statusBadge(status: string) {
  const map: Record<string, string> = {
    success: 'bg-emerald-500/10 text-emerald-400',
    failed:  'bg-red-500/10 text-red-400',
    running: 'bg-blue-500/10 text-blue-400',
    skipped: 'bg-[rgba(255,255,255,0.06)] text-[#65656e]',
  };
  return map[status] ?? 'bg-[rgba(255,255,255,0.06)] text-[#9898a0]';
}

function statusIcon(status: string) {
  if (status === 'success') return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (status === 'failed')  return <XCircle className="h-3.5 w-3.5" />;
  if (status === 'running') return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
  return <Clock className="h-3.5 w-3.5" />;
}

function RunRow({ run }: { run: AutomationRun }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#141416] overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[rgba(255,255,255,0.03)]"
      >
        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusBadge(run.status)}`}>
          {statusIcon(run.status)}
          {run.status}
        </span>
        <span className="flex-1 text-xs text-[#9898a0]">
          {new Date(run.started_at).toLocaleString()}
        </span>
        <span className="text-xs text-[#65656e]">
          {run.actions_executed} actions
          {run.duration_ms != null && ` · ${run.duration_ms}ms`}
        </span>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-[#65656e]" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-[#65656e]" />
        )}
      </button>
      {expanded && run.logs.length > 0 && (
        <div className="border-t border-[rgba(255,255,255,0.06)] px-4 pb-3 pt-2">
          <div className="flex flex-col gap-1.5">
            {run.logs.map(log => (
              <div key={log.id} className="flex items-start gap-2 text-xs">
                <span className={`mt-0.5 flex items-center gap-1 rounded-full px-1.5 py-0.5 ${statusBadge(log.status)}`}>
                  {statusIcon(log.status)}
                </span>
                <span className="text-[#9898a0]">
                  <span className="font-medium text-[#f2f2f3]">{log.action_type}</span>
                  {log.message && ` — ${log.message}`}
                </span>
                {log.duration_ms != null && (
                  <span className="ml-auto shrink-0 text-[#65656e]">{log.duration_ms}ms</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AutomationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ruleId = params.id as string;

  const { useAutomationRule, useAutomationRuns, toggleAutomationRule, testAutomationRule } = useAutomation();

  const { data: rule, isLoading, error } = useAutomationRule(ruleId);
  const { data: runs = [], isLoading: runsLoading } = useAutomationRuns(ruleId);

  // Test Run Modal State
  const [showTestModal, setShowTestModal] = useState(false);
  const [samplePayload, setSamplePayload] = useState<Record<string, string>>({});
  const [testResultMsg, setTestResultMsg] = useState<string | null>(null);

  const handleToggle = () => {
    toggleAutomationRule.mutate(ruleId);
  };

  const handleExecuteTest = () => {
    const numericParsedPayload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(samplePayload)) {
      if (v.trim()) {
        numericParsedPayload[k] = !isNaN(Number(v)) ? Number(v) : v;
      }
    }

    testAutomationRule.mutate(
      { ruleId, payload: { trigger_data: numericParsedPayload } },
      {
        onSuccess: (res) => {
          setTestResultMsg(res.status === 'success' ? '✓ Test passed & executed actions' : `✗ Test status: ${res.status}`);
        },
        onError: (err: unknown) => {
          setTestResultMsg(`✗ Test error: ${err instanceof Error ? err.message : 'Execution failed'}`);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#f59e0b]" />
      </div>
    );
  }

  if (error || !rule) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          Automation rule not found.
        </div>
      </div>
    );
  }

  // Phase 9: Rule Validator
  const invalidConditions = rule.conditions.filter(c => !getFieldDefinition(rule.trigger_event, c.field_path));
  const isRuleInvalid = invalidConditions.length > 0;

  const successRate = rule.total_runs > 0
    ? Math.round((rule.successful_runs / rule.total_runs) * 100)
    : null;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Phase 9: Invalid Rule Warning Banner */}
      {isRuleInvalid && (
        <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <div className="font-semibold">⚠ Invalid Rule Configuration Detected</div>
              <div className="text-xs text-amber-300/80">
                {invalidConditions.length} condition(s) use unrecognized field names ({invalidConditions.map(c => `'${c.field_path}'`).join(', ')}).
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push(`/automations/${ruleId}/edit`)}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400"
          >
            <Wrench className="h-3.5 w-3.5" />
            Repair Rule
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => router.push('/automations')}
          className="mt-0.5 rounded-lg p-2 text-[#65656e] transition-colors hover:bg-[rgba(255,255,255,0.06)] hover:text-[#f2f2f3]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(245,158,11,0.12)]">
              <Zap className="h-4.5 w-4.5 text-[#f59e0b]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#f2f2f3]">{rule.name}</h1>
              {rule.description && (
                <p className="text-sm text-[#9898a0]">{rule.description}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="automation-test-btn"
            onClick={() => { setShowTestModal(true); setTestResultMsg(null); }}
            className="flex items-center gap-1.5 rounded-lg border border-[rgba(255,255,255,0.1)] px-3 py-2 text-sm text-[#9898a0] transition-all hover:border-[rgba(255,255,255,0.2)] hover:text-[#f2f2f3]"
          >
            <Play className="h-4 w-4" />
            Interactive Test Run
          </button>
          <button
            id="automation-edit-btn"
            onClick={() => router.push(`/automations/${ruleId}/edit`)}
            className="flex items-center gap-1.5 rounded-lg border border-[rgba(255,255,255,0.1)] px-3 py-2 text-sm text-[#9898a0] transition-all hover:border-[rgba(255,255,255,0.2)] hover:text-[#f2f2f3]"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
          <button
            id="automation-toggle-btn"
            onClick={handleToggle}
            disabled={toggleAutomationRule.isPending}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              rule.is_active
                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-[rgba(245,158,11,0.15)] text-[#f59e0b] hover:bg-[rgba(245,158,11,0.25)]'
            } disabled:opacity-50`}
          >
            {rule.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
            {rule.is_active ? 'Active' : 'Inactive'}
          </button>
        </div>
      </div>

      {/* Phase 10: Interactive Test Run Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#141416] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-bold text-[#f2f2f3]">
                <Play className="h-4 w-4 text-[#f59e0b]" />
                Test Run: {rule.name}
              </h3>
              <button onClick={() => setShowTestModal(false)} className="text-[#65656e] hover:text-[#f2f2f3]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-4 text-xs text-[#9898a0]">
              Supply custom sample entity values to evaluate conditions live.
            </p>

            <div className="mb-4 flex flex-col gap-3">
              {getFieldsForTrigger(rule.trigger_event).map(field => (
                <div key={field.key}>
                  <label className="mb-1 block text-xs text-[#9898a0]">{field.label} ({field.key})</label>
                  <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#0e0e10] px-3 py-2 text-xs text-[#f2f2f3] outline-none focus:border-[#f59e0b]"
                    placeholder={`e.g. ${field.type === 'number' ? '250000' : 'Sample ' + field.label}`}
                    value={samplePayload[field.key] ?? ''}
                    onChange={e => setSamplePayload(prev => ({ ...prev, [field.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>

            {testResultMsg && (
              <div className={`mb-4 rounded-lg px-3 py-2 text-xs font-medium ${testResultMsg.includes('✓') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {testResultMsg}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowTestModal(false)}
                className="rounded-lg px-3 py-1.5 text-xs text-[#9898a0] hover:bg-[rgba(255,255,255,0.05)]"
              >
                Close
              </button>
              <button
                onClick={handleExecuteTest}
                disabled={testAutomationRule.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-[#f59e0b] px-4 py-1.5 text-xs font-semibold text-black hover:bg-[#d97706] disabled:opacity-50"
              >
                {testAutomationRule.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Execute Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Runs', value: rule.total_runs },
          { label: 'Successful', value: rule.successful_runs, color: 'text-emerald-400' },
          { label: 'Failed', value: rule.failed_runs, color: 'text-red-400' },
          { label: 'Success Rate', value: successRate !== null ? `${successRate}%` : '—', color: successRate !== null && successRate >= 80 ? 'text-emerald-400' : 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#141416] p-4 text-center">
            <div className={`text-2xl font-bold ${s.color ?? 'text-[#f2f2f3]'}`}>{s.value}</div>
            <div className="mt-1 text-xs text-[#65656e]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Configuration */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Trigger */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#141416] p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#65656e]">Trigger</h3>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#f59e0b]" />
            <span className="text-sm font-medium text-[#f2f2f3]">
              {TRIGGER_LABELS[rule.trigger_event] ?? rule.trigger_event}
            </span>
          </div>
          {rule.trigger_entity_type && (
            <p className="mt-1 text-xs text-[#9898a0]">Entity: {rule.trigger_entity_type}</p>
          )}
        </div>

        {/* Conditions */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#141416] p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#65656e]">
            Conditions ({rule.condition_logic})
          </h3>
          {rule.conditions.length === 0 ? (
            <p className="text-xs text-[#65656e]">No conditions — always runs</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {rule.conditions.map(c => (
                <div key={c.id} className="rounded-lg bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-xs">
                  <span className="text-[#f2f2f3]">{c.field_path}</span>
                  <span className="mx-1.5 text-[#65656e]">{c.operator.toLowerCase().replace('_', ' ')}</span>
                  {c.value && <span className="text-[#f59e0b]">{c.value}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#141416] p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#65656e]">
            Actions ({rule.actions.length})
          </h3>
          <div className="flex flex-col gap-1.5">
            {rule.actions.map((a, i) => (
              <div key={a.id} className="flex items-center gap-2 rounded-lg bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-xs">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[rgba(245,158,11,0.2)] text-[10px] font-bold text-[#f59e0b]">
                  {i + 1}
                </span>
                <span className="text-[#f2f2f3]">{a.action_type.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Run History */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[#9898a0]">
            <Activity className="h-4 w-4" />
            Execution History
          </h2>
          <button
            onClick={() => router.push(`/automations/${ruleId}/runs`)}
            className="text-xs text-[#f59e0b] hover:underline"
          >
            View Full Run History →
          </button>
        </div>
        {runsLoading ? (
          <div className="flex items-center gap-2 text-sm text-[#65656e]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading runs…
          </div>
        ) : runs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[rgba(255,255,255,0.07)] bg-[#141416] py-8 text-center text-sm text-[#65656e]">
            No runs yet. Enable the rule or click "Test Run" above.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {runs.map(run => <RunRow key={run.id} run={run} />)}
          </div>
        )}
      </div>
    </div>
  );
}


