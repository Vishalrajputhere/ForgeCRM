"use client";

/**
 * ForgeCRM — AI Debug Dashboard & Telemetry Visualizer Component
 *
 * Provides Workspace Admins with complete visibility into assembled context,
 * RAG citations, token budget allocations, latency breakdown, tool call traces, and cost analytics.
 */

import React, { useState } from "react";
import {
  Activity,
  Brain,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  DollarSign,
  Layers,
  Shield,
  Terminal,
} from "lucide-react";

export function AIDebugDashboard() {
  const [activeTab, setActiveTab] = useState<
    "context" | "rag" | "tools" | "telemetry" | "sessions"
  >("context");

  return (
    <div className="space-y-6">
      {/* Header Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Requests (30d)</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">142</p>
          <span className="text-[11px] text-emerald-400">99.8% Success Rate</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Estimated Cost</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">$0.4285</p>
          <span className="text-[11px] text-slate-400">1.42M Tokens consumed</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Avg Latency</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">184 ms</p>
          <span className="text-[11px] text-blue-400">110ms TTFT</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>RAG Hit Accuracy</span>
            <Database className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">92.4%</p>
          <span className="text-[11px] text-purple-400">1536D Vector HNSW</span>
        </div>
      </div>

      {/* Debug Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("context")}
          className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors flex items-center space-x-2 ${
            activeTab === "context"
              ? "bg-slate-800 text-slate-100 border border-slate-700"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Prompt & Context Inspector</span>
        </button>

        <button
          onClick={() => setActiveTab("rag")}
          className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors flex items-center space-x-2 ${
            activeTab === "rag"
              ? "bg-slate-800 text-slate-100 border border-slate-700"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>RAG & Citations</span>
        </button>

        <button
          onClick={() => setActiveTab("tools")}
          className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors flex items-center space-x-2 ${
            activeTab === "tools"
              ? "bg-slate-800 text-slate-100 border border-slate-700"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>MCP Tools & Approvals</span>
        </button>

        <button
          onClick={() => setActiveTab("telemetry")}
          className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors flex items-center space-x-2 ${
            activeTab === "telemetry"
              ? "bg-slate-800 text-slate-100 border border-slate-700"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Token Budget & Latency</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "context" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
              <Brain className="w-4 h-4 text-blue-400" />
              <span>Assembled 6-Layer Context Payload</span>
            </h3>
            <pre className="p-3 bg-slate-950 text-emerald-400 text-xs font-mono rounded-lg overflow-x-auto border border-slate-800">
{`{
  "workspace_id": "ws-acme-corp",
  "route": "/companies/comp-acme",
  "active_entity": {
    "type": "Company",
    "name": "Acme Corp",
    "annual_revenue": 5000000,
    "password_hash": "[REDACTED_SENSITIVE]"
  },
  "quality_metrics": {
    "quality_score": 0.94,
    "coverage_score": 0.88,
    "confidence_score": 0.91
  }
}`}
            </pre>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Context Security & PII Protection</span>
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Prompt Injection Defense: PASSED</p>
                  <p className="text-[11px] text-emerald-400/80">No malicious system overrides detected.</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start space-x-2">
                <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">PII Field Sanitization: ACTIVE</p>
                  <p className="text-[11px] text-blue-400/80">Masked password_hash, credit_card, api_key.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "rag" && (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
            <Database className="w-4 h-4 text-purple-400" />
            <span>Retrieved Hybrid RAG Citations & Confidence</span>
          </h3>

          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-mono rounded">
                    CIT-ACME-001
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    Q3_Renewal_Proposal.pdf, Page 4
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  &quot;Enterprise Cloud Renewal ($450,000 ARR) scheduled for Q3 2026.&quot;
                </p>
              </div>

              <div className="text-right space-y-1">
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold rounded">
                  High Confidence (0.92)
                </span>
                <p className="text-[11px] text-slate-500">RRF Rank: #1</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "tools" && (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>MCP Tool Execution & Approval Timeline</span>
          </h3>

          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-semibold text-slate-200">create_lead</span>
                <p className="text-xs text-slate-400">Args: &#123; &quot;name&quot;: &quot;Sarah Connor&quot; &#125;</p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-medium rounded border border-emerald-500/20">
                Executed (24ms)
              </span>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-semibold text-amber-300">delete_company</span>
                <p className="text-xs text-amber-400/80">Tier 3 Destructive Action — Human Approval Pending</p>
              </div>
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-semibold rounded border border-amber-500/40">
                Approval Required
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "telemetry" && (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Latency Breakdown & Token Allocation</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Context Build: 12ms</span>
              <span>Memory Retrieval: 14ms</span>
              <span>RAG Search: 18ms</span>
              <span>LLM TTFT: 110ms</span>
            </div>
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden flex">
              <div className="bg-blue-500 h-full" style={{ width: "10%" }}></div>
              <div className="bg-purple-500 h-full" style={{ width: "12%" }}></div>
              <div className="bg-amber-500 h-full" style={{ width: "15%" }}></div>
              <div className="bg-emerald-500 h-full" style={{ width: "63%" }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
