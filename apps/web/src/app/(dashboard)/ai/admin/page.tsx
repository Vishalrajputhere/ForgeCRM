'use client';

import * as React from 'react';
import {
  Shield, Cpu, FileText, BarChart3, DollarSign, Activity,
  AlertTriangle, Lock, RefreshCw, CheckCircle2, XCircle,
} from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAIFetch } from '@/hooks/use-ai-fetch';

type AdminTab = 'models' | 'prompts' | 'evaluations' | 'cost' | 'security' | 'health' | 'audit';

interface ModelEntry { model_name: string; provider: string; version: string; status: string; is_default: boolean; cost_per_1k_tokens: number; }
interface AdminData {
  models: { count: number; default_model: string; models: ModelEntry[] } | null;
  prompts: { templates_count: number; registered_keys: string[] } | null;
  evaluations: { golden_test_cases_count: number; overall_quality_avg: number; pass_rate_avg: number } | null;
  cost: { total_spend_usd: number; monthly_spend_usd: number; budget_limit_usd: number; budget_used_pct: number; savings_from_cache_usd: number } | null;
  security: { firewall_status: string; injection_defense: boolean; pii_masking: boolean; injection_rule_count: number; injection_rules: string[]; pii_masked_fields: string[] } | null;
  health: Record<string, string | null> | null;
  audit: { total_events: number; no_violations: boolean; events: Array<{ id: string; event_type: string; severity: string; blocked: boolean; created_at: string | null }> } | null;
}

const ENDPOINT_MAP: Record<AdminTab, string> = {
  models: '/api/v1/ai/admin/models',
  prompts: '/api/v1/ai/admin/prompts',
  evaluations: '/api/v1/ai/admin/evaluations',
  cost: '/api/v1/ai/admin/cost',
  security: '/api/v1/ai/admin/security',
  health: '/api/v1/ai/admin/health',
  audit: '/api/v1/ai/admin/audit',
};

export default function AIAdminPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const { aiFetch } = useAIFetch({ workspaceId: currentWorkspace?.id });
  const [activeTab, setActiveTab] = React.useState<AdminTab>('models');
  const [data, setData] = React.useState<AdminData>({ models: null, prompts: null, evaluations: null, cost: null, security: null, health: null, audit: null });
  const [loading, setLoading] = React.useState<Partial<Record<AdminTab, boolean>>>({});
  const [errors, setErrors] = React.useState<Partial<Record<AdminTab, string>>>({});

  const fetchTab = React.useCallback(async (tab: AdminTab, force = false) => {
    if (!force && data[tab] !== null) return;
    setLoading((prev) => ({ ...prev, [tab]: true }));
    setErrors((prev) => ({ ...prev, [tab]: undefined }));
    try {
      const res = await aiFetch(ENDPOINT_MAP[tab], null, 'GET');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData((prev) => ({ ...prev, [tab]: json }));
    } catch (e) {
      setErrors((prev) => ({ ...prev, [tab]: e instanceof Error ? e.message : 'Failed to load' }));
    } finally {
      setLoading((prev) => ({ ...prev, [tab]: false }));
    }
  }, [data, aiFetch]);

  React.useEffect(() => { fetchTab(activeTab); }, [activeTab, fetchTab]);

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'models', label: 'Model Registry', icon: <Cpu className="h-3.5 w-3.5" /> },
    { id: 'prompts', label: 'Prompt Management', icon: <FileText className="h-3.5 w-3.5" /> },
    { id: 'evaluations', label: 'Evaluation & Benchmarks', icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { id: 'cost', label: 'Cost & Budget Analytics', icon: <DollarSign className="h-3.5 w-3.5" /> },
    { id: 'security', label: 'Prompt Firewall & DLP', icon: <Lock className="h-3.5 w-3.5" /> },
    { id: 'health', label: 'Provider Failover', icon: <Activity className="h-3.5 w-3.5" /> },
    { id: 'audit', label: 'Security Audit Log', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  ];

  const isLoading = loading[activeTab];
  const error = errors[activeTab];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background text-primary overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-elevated/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-primary leading-none">Enterprise AI Operations &amp; Governance Console</h1>
            <p className="text-xs text-muted">Model Lifecycle · Prompt Firewall · Semantic Cache · Evaluation Benchmarks · Cost Analytics</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          AI System Status: Operational
        </span>
      </div>

      <div className="flex items-center gap-1 px-6 border-b border-border-subtle bg-surface shrink-0 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === tab.id ? 'border-accent text-accent bg-accent/5' : 'border-transparent text-muted hover:text-primary hover:bg-surface-hover'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="h-5 w-5 animate-spin text-accent mr-2" />
            <span className="text-sm text-muted">Loading admin data…</span>
          </div>
        )}

        {!isLoading && error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <XCircle className="h-4 w-4 shrink-0" />
            <span>Failed to load {activeTab} data: {error}</span>
            <button onClick={() => { setData((prev) => ({ ...prev, [activeTab]: null })); fetchTab(activeTab, true); }} className="ml-auto text-xs font-semibold underline">Retry</button>
          </div>
        )}

        {!isLoading && !error && activeTab === 'models' && data.models && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-primary">Active Model Registry — {data.models.count} Models · Default: <span className="text-accent">{data.models.default_model}</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.models.models.map((m) => (
                <div key={m.model_name} className="p-4 rounded-xl bg-surface border border-border-subtle space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">{m.model_name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${m.is_default ? 'bg-accent/10 text-accent border-accent/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {m.is_default ? 'Default' : m.status}
                    </span>
                  </div>
                  <p className="text-muted">Provider: <strong className="text-primary">{m.provider}</strong></p>
                  <p className="text-muted">Cost: <strong className="text-primary">${m.cost_per_1k_tokens.toFixed(5)} / 1K tokens</strong></p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && !error && activeTab === 'prompts' && data.prompts && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-primary">PromptRegistry — {data.prompts.templates_count} Templates</h2>
            <div className="p-4 rounded-xl bg-surface border border-border-subtle text-xs space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {data.prompts.registered_keys.map((key) => (
                  <span key={key} className="px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 text-[10px] font-mono font-semibold">{key}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && activeTab === 'evaluations' && data.evaluations && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-primary">AI Evaluation Engine &amp; Benchmark Quality Metrics</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-surface border border-border-subtle">
                <p className="text-[10px] font-bold text-muted uppercase">Overall Quality Score</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">{data.evaluations.overall_quality_avg.toFixed(1)} / 100</p>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-border-subtle">
                <p className="text-[10px] font-bold text-muted uppercase">Benchmark Pass Rate</p>
                <p className="text-2xl font-black text-primary mt-1">{(data.evaluations.pass_rate_avg * 100).toFixed(1)}%</p>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-border-subtle">
                <p className="text-[10px] font-bold text-muted uppercase">Golden Test Cases</p>
                <p className="text-2xl font-black text-primary mt-1">{data.evaluations.golden_test_cases_count}</p>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && activeTab === 'cost' && data.cost && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-primary">Token Spend Analytics &amp; Budget Limits</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-surface border border-border-subtle">
                <p className="text-[10px] font-bold text-muted uppercase">Monthly AI Spend</p>
                <p className="text-2xl font-black text-primary mt-1">${data.cost.monthly_spend_usd.toFixed(2)}</p>
                <p className="text-[10px] text-muted mt-1">Limit: ${data.cost.budget_limit_usd.toFixed(2)} / mo ({data.cost.budget_used_pct.toFixed(1)}% used)</p>
                <div className="mt-2 h-1.5 bg-border-subtle rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(data.cost.budget_used_pct, 100)}%` }} />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-border-subtle">
                <p className="text-[10px] font-bold text-muted uppercase">Total AI Spend</p>
                <p className="text-2xl font-black text-primary mt-1">${data.cost.total_spend_usd.toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-border-subtle">
                <p className="text-[10px] font-bold text-muted uppercase">Cache Savings</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">${data.cost.savings_from_cache_usd.toFixed(2)} saved</p>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && activeTab === 'security' && data.security && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-primary">Prompt Firewall &amp; PII Redaction Settings</h2>
            <div className="p-4 rounded-xl bg-surface border border-border-subtle text-xs space-y-3">
              {[
                { label: 'Prompt Injection Defense', active: data.security.injection_defense, activeLabel: 'Active' },
                { label: 'Automatic PII Masking', active: data.security.pii_masking, activeLabel: 'Enforced' },
              ].map(({ label, active, activeLabel }) => (
                <div key={label} className="flex items-center justify-between pt-2 first:pt-0 border-t first:border-t-0 border-border-subtle">
                  <span className="font-bold text-primary">{label}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {active ? activeLabel : 'Disabled'}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-border-subtle">
                <p className="text-[10px] font-semibold text-muted uppercase mb-1.5">Injection Rules ({data.security.injection_rule_count})</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.security.injection_rules.map((rule) => (
                    <span key={rule} className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-mono">{rule}</span>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t border-border-subtle">
                <p className="text-[10px] font-semibold text-muted uppercase mb-1.5">PII Fields Masked</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.security.pii_masked_fields.map((field) => (
                    <span key={field} className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono">{field}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && activeTab === 'health' && data.health && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-primary">Provider Failover &amp; Circuit Breaker Monitor</h2>
            <div className="space-y-3">
              {Object.entries(data.health).map(([provider, providerStatus]) => (
                <div key={provider} className="p-4 rounded-xl bg-surface border border-border-subtle flex items-center justify-between text-xs">
                  <span className="font-bold text-primary capitalize">{provider}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${providerStatus ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {providerStatus ?? 'Unavailable'}
                  </span>
                </div>
              ))}
              <p className="text-xs text-muted px-1">Fallback Chain: Gemini → OpenAI → Ollama</p>
            </div>
          </div>
        )}

        {!isLoading && !error && activeTab === 'audit' && data.audit && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-primary">Security Audit Log &amp; Incident Register</h2>
            {data.audit.no_violations ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                No security violations or prompt injection incidents logged for this workspace.
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted">{data.audit.total_events} events found</p>
                {data.audit.events.map((event) => (
                  <div key={event.id} className="p-3 rounded-lg bg-surface border border-border-subtle text-xs flex items-center justify-between gap-4">
                    <div>
                      <span className="font-bold text-primary">{event.event_type}</span>
                      {event.created_at && <span className="text-muted ml-2 text-[10px]">{new Date(event.created_at).toLocaleString()}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${event.severity === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>{event.severity}</span>
                      {event.blocked && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Blocked</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
