import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAIFetch } from '@/hooks/use-ai-fetch';

export interface AgentExecutionPlanStep {
  id: string;
  title: string;
  description: string;
  tool: string;
  status: string;
  approval_required: boolean;
}

export interface AgentExecutionPlan {
  plan_id: string;
  goal: string;
  steps: AgentExecutionPlanStep[];
  total_steps: number;
}

export interface AgentExecution {
  execution_id: string;
  workspace_id: string;
  user_id?: string | undefined;
  goal: string;
  state: 'Created' | 'Planning' | 'Running' | 'Paused' | 'Retrying' | 'Waiting Approval' | 'Completed' | 'Failed' | 'Rolled Back' | 'Cancelled';
  progress?: string;
  current_step?: string | null;
  completed_steps: number;
  total_steps: number;
  error?: string | null;
  created_at: string;
  plan?: AgentExecutionPlan | null;
  // Legacy optional fields (may be returned by older endpoints)
  steps_count?: number;
  tokens_used?: number;
  cost_usd?: number;
  latency_ms?: number;
  logs?: string[];
  tool_history?: Array<{ tool: string; duration_ms: number; status: string }>;
  checkpoints?: Array<{ id: string; step: string; timestamp: string }>;
}

export function useAIAgents() {
  const { aiFetch } = useAIFetch();
  const queryClient = useQueryClient();

  const runAgentMutation = useMutation({
    mutationFn: async (payload: { goal: string; priority?: string; provider?: string; model?: string }) => {
      const res = await aiFetch('/api/v1/ai/agents/run', payload);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to start AI Agent execution');
      }
      return res.json() as Promise<AgentExecution>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
    },
  });

  const fetchAgentStatus = async (executionId: string) => {
    const res = await aiFetch(`/api/v1/ai/agents/${executionId}`, null, 'GET');
    if (!res.ok) {
      throw new Error('Failed to fetch agent execution status');
    }
    return res.json() as Promise<AgentExecution>;
  };

  return {
    runAgent: runAgentMutation.mutateAsync,
    isRunning: runAgentMutation.isPending,
    fetchAgentStatus,
  };
}
