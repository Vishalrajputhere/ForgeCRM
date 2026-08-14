'use client';

import * as React from 'react';
import {
  Bot, Pause, RotateCcw, CheckCircle2, Clock, XCircle,
  ArrowRight, Layers, Search, Plus, Shield, RefreshCw, FileText,
  AlertCircle, Inbox
} from 'lucide-react';
import { useAIAgents } from '@/hooks/use-ai-agents';
import type { AgentExecution } from '@/hooks/use-ai-agents';
import { useAIFetch } from '@/hooks/use-ai-fetch';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useToast } from '@/components/ui/toast';

export default function AIAgentsPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const { runAgent, isRunning } = useAIAgents();
  const { aiFetch } = useAIFetch({ workspaceId: currentWorkspace?.id });
  const { toast } = useToast();

  const [agents, setAgents] = React.useState<AgentExecution[]>([]);
  const [selectedAgent, setSelectedAgent] = React.useState<AgentExecution | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterState, setFilterState] = React.useState<string>('all');
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  // New Agent Form State
  const [goal, setGoal] = React.useState('');

  const filteredAgents = React.useMemo(() => {
    return agents.filter((a) => {
      const matchesSearch =
        a.goal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.execution_id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterState === 'all' || a.state.toLowerCase() === filterState.toLowerCase();
      return matchesSearch && matchesFilter;
    });
  }, [agents, searchQuery, filterState]);

  const handleRunAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;

    try {
      const result = await runAgent({ goal });

      // Use only real fields from AgentExecutionStatus backend response
      const newExec: AgentExecution = {
        execution_id: result.execution_id || String(result.execution_id),
        workspace_id: result.workspace_id || currentWorkspace?.id || '',
        user_id: result.user_id,
        goal: result.goal || goal,
        state: result.state || 'Running',
        completed_steps: result.completed_steps ?? 0,
        total_steps: result.total_steps ?? 0,
        current_step: result.current_step ?? null,
        error: result.error ?? null,
        created_at: result.created_at || new Date().toISOString(),
        plan: result.plan ?? null,
      };

      setAgents((prev) => [newExec, ...prev]);
      setSelectedAgent(newExec);
      setShowCreateModal(false);
      setGoal('');
      toast('success', 'AI Agent Launched', `Execution ${newExec.execution_id} started — State: ${newExec.state}`);
    } catch (err: any) {
      toast('error', 'Execution Failed', err.message || 'Failed to start AI Agent');
    }
  };

  const refreshAgentStatus = async (executionId: string) => {
    try {
      const res = await aiFetch(`/api/v1/ai/agents/${executionId}`, null, 'GET');
      if (res.ok) {
        const data = await res.json();
        setAgents((prev) =>
          prev.map((a) => (a.execution_id === executionId ? { ...a, ...data } : a))
        );
        if (selectedAgent?.execution_id === executionId) {
          setSelectedAgent((prev) => (prev ? { ...prev, ...data } : null));
        }
      }
    } catch {
      // silent
    }
  };

  const handleCancelAgent = (id: string) => {
    setAgents((prev) =>
      prev.map((a) => (a.execution_id === id ? { ...a, state: 'Cancelled' } : a))
    );
    if (selectedAgent?.execution_id === id) {
      setSelectedAgent((prev) => (prev ? { ...prev, state: 'Cancelled' } : null));
    }
    toast('success', 'Agent Cancelled', `Execution ${id} was cancelled.`);
  };

  const getStateBadge = (state: AgentExecution['state']) => {
    switch (state) {
      case 'Running':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5"><RefreshCw className="h-3 w-3 animate-spin" /> Running</span>;
      case 'Completed':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> Completed</span>;
      case 'Waiting Approval':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5"><Shield className="h-3 w-3" /> Waiting Approval</span>;
      case 'Paused':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 flex items-center gap-1.5"><Pause className="h-3 w-3" /> Paused</span>;
      case 'Failed':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5"><XCircle className="h-3 w-3" /> Failed</span>;
      case 'Rolled Back':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center gap-1.5"><AlertCircle className="h-3 w-3" /> Rolled Back</span>;
      case 'Planning':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1.5"><RefreshCw className="h-3 w-3 animate-spin" /> Planning</span>;
      case 'Cancelled':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5"><XCircle className="h-3 w-3" /> Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">{state}</span>;
    }
  };

  const progressPct = (exec: AgentExecution) => {
    if (!exec.total_steps) return '0%';
    if (exec.state === 'Completed') return '100%';
    return `${Math.round((exec.completed_steps / exec.total_steps) * 100)}%`;
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Autonomous AI Agents Workspace</h1>
              <p className="text-sm text-slate-400">Multi-step goal orchestration, visual execution DAGs, checkpoint rollbacks &amp; MCP tool guardrails</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-sm hover:from-cyan-400 hover:to-blue-500 transition-all shadow-md shadow-cyan-500/20 active:scale-95"
        >
          <Plus className="h-4 w-4" /> Launch Autonomous Agent
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column — Agent Executions List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search executions by goal or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-400 font-medium">Filter State:</span>
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:outline-none"
              >
                <option value="all">All States</option>
                <option value="running">Running</option>
                <option value="planning">Planning</option>
                <option value="completed">Completed</option>
                <option value="waiting approval">Waiting Approval</option>
                <option value="failed">Failed</option>
                <option value="rolled back">Rolled Back</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Empty State */}
          {filteredAgents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80 border-dashed space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Inbox className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-300">No Agent Executions</p>
                <p className="text-xs text-slate-500 mt-1">Launch your first autonomous goal above</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAgents.map((agent) => {
                const isSelected = selectedAgent?.execution_id === agent.execution_id;
                return (
                  <div
                    key={agent.execution_id}
                    onClick={() => setSelectedAgent(agent)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-500/40 shadow-lg shadow-cyan-500/5'
                        : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs text-cyan-400 font-semibold truncate max-w-[140px]">{agent.execution_id}</span>
                      {getStateBadge(agent.state)}
                    </div>
                    <p className="text-sm font-medium text-slate-200 line-clamp-2 mb-3">{agent.goal}</p>
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(agent.created_at).toLocaleTimeString()}</span>
                      <span className="text-slate-300 font-semibold">{progressPct(agent)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column — Agent Detail */}
        {selectedAgent ? (
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm text-cyan-400 font-bold truncate max-w-[220px]">{selectedAgent.execution_id}</span>
                    {getStateBadge(selectedAgent.state)}
                  </div>
                  <h2 className="text-lg font-semibold text-white">{selectedAgent.goal}</h2>
                  {selectedAgent.current_step && (
                    <p className="text-xs text-slate-400 mt-1">Current step: {selectedAgent.current_step}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => refreshAgentStatus(selectedAgent.execution_id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium flex items-center gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Refresh
                  </button>
                  {(selectedAgent.state === 'Running' || selectedAgent.state === 'Planning') && (
                    <button
                      onClick={() => handleCancelAgent(selectedAgent.execution_id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 text-xs font-medium flex items-center gap-1.5"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Progress & Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-xs text-slate-400 block mb-1">Progress</span>
                  <span className="text-base font-bold text-cyan-400">{progressPct(selectedAgent)}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-xs text-slate-400 block mb-1">Steps</span>
                  <span className="text-base font-bold text-slate-200">{selectedAgent.completed_steps} / {selectedAgent.total_steps}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-xs text-slate-400 block mb-1">State</span>
                  <span className="text-base font-bold text-slate-200">{selectedAgent.state}</span>
                </div>
              </div>

              {/* Error Display */}
              {selectedAgent.error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
                  <p className="text-xs font-semibold text-rose-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Execution Error
                  </p>
                  <p className="text-xs text-rose-300 mt-1 font-mono">{selectedAgent.error}</p>
                </div>
              )}

              {/* Waiting Approval Banner */}
              {selectedAgent.state === 'Waiting Approval' && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <p className="text-xs font-semibold text-amber-400 flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Tier 3 Human Approval Required
                  </p>
                  <p className="text-xs text-amber-300 mt-1">
                    This agent execution triggered a destructive MCP tool. Open the <span className="font-semibold">MCP Approval Center</span> (shield icon in the topbar) to approve or reject.
                  </p>
                </div>
              )}

              {/* Visual DAG Plan */}
              {selectedAgent.plan && selectedAgent.plan.steps.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-cyan-400" /> Execution Plan DAG ({selectedAgent.plan.total_steps} Steps)
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-wrap items-center gap-2">
                    {selectedAgent.plan.steps.map((step, idx) => (
                      <React.Fragment key={step.id}>
                        <div className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
                          step.status === 'completed' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' :
                          step.status === 'running' ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400 animate-pulse' :
                          step.status === 'failed' ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400' :
                          step.approval_required ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' :
                          'bg-slate-900 border border-slate-800 text-slate-500'
                        }`}>
                          {step.status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5" />}
                          {step.status === 'running' && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                          {step.approval_required && step.status === 'pending' && <Shield className="h-3.5 w-3.5" />}
                          {idx + 1}. {step.title}
                        </div>
                        {idx < selectedAgent.plan!.steps.length - 1 && (
                          <ArrowRight className="h-4 w-4 text-slate-600 shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Execution Info */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cyan-400" /> Execution Record
                </h3>
                <div className="p-4 rounded-xl bg-black/80 border border-slate-800 font-mono text-xs space-y-1.5 text-slate-300">
                  <div>Execution ID: <span className="text-cyan-400">{selectedAgent.execution_id}</span></div>
                  <div>Goal: <span className="text-slate-200">{selectedAgent.goal}</span></div>
                  <div>State: <span className="text-slate-200">{selectedAgent.state}</span></div>
                  <div>Steps: <span className="text-slate-200">{selectedAgent.completed_steps} of {selectedAgent.total_steps} completed</span></div>
                  {selectedAgent.current_step && <div>Current Step: <span className="text-slate-200">{selectedAgent.current_step}</span></div>}
                  <div>Started: <span className="text-slate-200">{new Date(selectedAgent.created_at).toLocaleString()}</span></div>
                  {selectedAgent.workspace_id && <div>Workspace: <span className="text-slate-400">{selectedAgent.workspace_id}</span></div>}
                </div>
              </div>
            </div>
          </div>
        ) : (
          agents.length > 0 && (
            <div className="lg:col-span-8 flex items-center justify-center">
              <div className="text-center text-slate-500 space-y-2">
                <Bot className="h-10 w-10 mx-auto text-slate-700" />
                <p className="text-sm">Select an execution from the list to view details</p>
              </div>
            </div>
          )
        )}
      </div>

      {/* Create Agent Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Bot className="h-5 w-5 text-cyan-400" /> Launch Autonomous AI Agent
            </h2>
            <form onSubmit={handleRunAgent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Autonomous Goal Description</label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Find leads stuck in Stage 2, research company news, and generate custom outreach strategy..."
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <p className="text-xs text-amber-400 flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5" /> Destructive actions require Tier 3 human approval via MCP guardrails
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRunning}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-sm hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
                >
                  {isRunning ? 'Launching...' : 'Execute Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
