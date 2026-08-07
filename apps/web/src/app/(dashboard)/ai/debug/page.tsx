import React from "react";
import { AIDebugDashboard } from "@/components/ai/ai-debug-dashboard";
import { Container, PageHeader } from "@/components/ui/layout-primitives";
import { Shield } from "lucide-react";

export const metadata = {
  title: "AI Debug Dashboard — ForgeCRM",
  description: "Enterprise AI pipeline visualizer, RAG citations, prompt inspector, and telemetry",
};

export default function AIDebugPage() {
  return (
    <Container>
      <PageHeader>
        <div>
          <h1 className="text-xl font-bold text-slate-100">AI Subsystem Debug Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Inspect assembled prompt context, RAG citations, MCP tool calls, token budgets, and cost telemetry.
          </p>
        </div>
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5" />
          <span>Workspace Admin RBAC Verified</span>
        </div>
      </PageHeader>
      <div className="mt-6">
        <AIDebugDashboard />
      </div>
    </Container>
  );
}
