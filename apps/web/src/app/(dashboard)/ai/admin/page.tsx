'use client';

import * as React from 'react';
import {
  Shield, Cpu, FileText, BarChart3, DollarSign, Activity,
  AlertTriangle, Lock,
} from 'lucide-react';

export default function AIAdminPage() {
  const [activeTab, setActiveTab] = React.useState<
    'models' | 'prompts' | 'evaluations' | 'cost' | 'security' | 'health' | 'audit'
  >('models');

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background text-primary overflow-hidden">
      {/* Top Console Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-elevated/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-primary leading-none">Enterprise AI Operations & Governance Console</h1>
            <p className="text-xs text-muted">Model Lifecycle · Prompt Firewall · Semantic Cache · Evaluation Benchmarks · Cost Analytics</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            AI System Status: Operational
          </span>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-1 px-6 border-b border-border-subtle bg-surface shrink-0 overflow-x-auto">
        {[
          { id: 'models', label: 'Model Registry', icon: <Cpu className="h-3.5 w-3.5" /> },
          { id: 'prompts', label: 'Prompt Management', icon: <FileText className="h-3.5 w-3.5" /> },
          { id: 'evaluations', label: 'Evaluation & Benchmarks', icon: <BarChart3 className="h-3.5 w-3.5" /> },
          { id: 'cost', label: 'Cost & Budget Analytics', icon: <DollarSign className="h-3.5 w-3.5" /> },
          { id: 'security', label: 'Prompt Firewall & DLP', icon: <Lock className="h-3.5 w-3.5" /> },
          { id: 'health', label: 'Provider Failover', icon: <Activity className="h-3.5 w-3.5" /> },
          { id: 'audit', label: 'Security Audit Log', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all shrink-0 ${
                isActive
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-transparent text-muted hover:text-primary hover:bg-surface-hover'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab View Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === 'models' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-primary">Active Model Registry & Fallback Config</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'gemini-2.5-flash', provider: 'Gemini', status: 'Active (Default)', cost: '$0.00015 / 1K tokens' },
                { name: 'gpt-4o', provider: 'OpenAI', status: 'Active (Fallback)', cost: '$0.00250 / 1K tokens' },
                { name: 'llama3.3:70b', provider: 'Ollama', status: 'Local Sandbox', cost: 'Free (Self-Hosted)' },
              ].map((m, i) => (
                <div key={i} className="p-4 rounded-xl bg-surface border border-border-subtle space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">{m.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{m.status}</span>
                  </div>
                  <p className="text-muted">Provider: <strong className="text-primary">{m.provider}</strong></p>
                  <p className="text-muted">Cost Rate: <strong className="text-primary">{m.cost}</strong></p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'prompts' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-primary">PromptRegistry Version Management</h2>
            <div className="p-4 rounded-xl bg-surface border border-border-subtle text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-primary">Registered Templates: 34 Templates</span>
                <span className="text-[10px] text-accent font-bold">Latest System Version: 1.0.0</span>
              </div>
              <p className="text-muted leading-relaxed">All templates in PromptRegistry are version-controlled with unified diff comparisons and instant rollback capabilities.</p>
            </div>
          </div>
        )}

        {activeTab === 'evaluations' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-primary">AI Evaluation Engine & Benchmark Quality Metrics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-surface border border-border-subtle">
                <p className="text-[10px] font-bold text-muted uppercase">Overall Quality Score</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">92.4 / 100</p>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-border-subtle">
                <p className="text-[10px] font-bold text-muted uppercase">Faithfulness Score</p>
                <p className="text-2xl font-black text-primary mt-1">94.2%</p>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-border-subtle">
                <p className="text-[10px] font-bold text-muted uppercase">Hallucination Rate</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">2.1%</p>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-border-subtle">
                <p className="text-[10px] font-bold text-muted uppercase">Benchmark Pass Rate</p>
                <p className="text-2xl font-black text-primary mt-1">96.0%</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cost' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-primary">Token Spend Analytics & Budget Limits</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-surface border border-border-subtle">
                <p className="text-[10px] font-bold text-muted uppercase">Monthly AI Spend</p>
                <p className="text-2xl font-black text-primary mt-1">$18.45</p>
                <p className="text-[10px] text-muted mt-1">Limit: $100.00 / mo (18.5% used)</p>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-border-subtle">
                <p className="text-[10px] font-bold text-muted uppercase">Total Tokens Processed</p>
                <p className="text-2xl font-black text-primary mt-1">123,000</p>
                <p className="text-[10px] text-muted mt-1">Avg 800 tokens / prompt</p>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-border-subtle">
                <p className="text-[10px] font-bold text-muted uppercase">Estimated Cache Savings</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">$4.20 saved</p>
                <p className="text-[10px] text-muted mt-1">Semantic Cache Hit Rate: 22.8%</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-primary">Prompt Firewall & PII Redaction Settings</h2>
            <div className="p-4 rounded-xl bg-surface border border-border-subtle text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary">Prompt Injection Defense</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                <span className="font-bold text-primary">Automatic PII Masking (Email, Phone, SSN)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Enforced</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'health' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-primary">Provider Failover & Circuit Breaker Monitor</h2>
            <div className="p-4 rounded-xl bg-surface border border-border-subtle text-xs space-y-2">
              <p className="font-bold text-primary">Fallback Chain: Gemini → OpenAI → Ollama</p>
              <p className="text-muted text-[11px]">If Gemini latency exceeds 15s or error rate hits 10%, requests automatically failover to OpenAI.</p>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-primary">Security Audit Log & Incident Register</h2>
            <div className="p-4 rounded-xl bg-surface border border-border-subtle text-xs text-muted">
              No security violations or prompt injection incidents logged in the past 24 hours.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
