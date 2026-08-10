'use client';

import * as React from 'react';
import {
  Send, Shield, Sparkles, RefreshCw,
  FileText, BarChart3, Briefcase, Target, Activity, DollarSign,
} from 'lucide-react';
import { AIResponseCard } from '@/components/ai/ai-response-card';
import { type Citation } from '@/components/ai/citation-card';
import { type ConfidenceLabel } from '@/components/ai/confidence-badge';
import { type Insight } from '@/components/ai/insight-card';
import { type ReasoningChain } from '@/components/ai/reasoning-panel';
import { RecommendationCard } from '@/components/ai/recommendation-card';
import { PromptSuggestionBar, type PromptSuggestion } from '@/components/ai/prompt-suggestion-bar';

import { ExecutiveKPICard } from '@/components/ai/executive-kpi-card';
import { ExecutiveInsightCard } from '@/components/ai/executive-insight-card';
import { RevenueTrendChart } from '@/components/ai/revenue-trend-chart';
import { PipelineHealthCard } from '@/components/ai/pipeline-health-card';
import { CompanyHealthCard } from '@/components/ai/company-health-card';
import { RiskOverviewPanel } from '@/components/ai/risk-overview-panel';
import { BoardSummaryPanel } from '@/components/ai/board-summary-panel';
import { StrategicOpportunitiesPanel } from '@/components/ai/strategic-opportunities-panel';
import { ExecutiveTimeline } from '@/components/ai/executive-timeline';
import { ExecutiveRecommendationPanel } from '@/components/ai/executive-recommendation-panel';

interface SkillMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  skill?: string;
  confidence?: number;
  confidence_label?: ConfidenceLabel;
  confidence_explanation?: string;
  citations?: Citation[];
  evidence?: string[];
  missing_context?: string[];
  insights?: Insight[];
  recommendations?: string[];
  next_actions?: string[];
  reasoning?: ReasoningChain;
  latency_ms?: number;
  isLoading?: boolean;
}

const EXECUTIVE_SUGGESTIONS: PromptSuggestion[] = [
  { icon: <Shield className="h-3.5 w-3.5" />, label: 'Synthesize executive dashboard briefing', skill: 'executive_dashboard' },
  { icon: <Activity className="h-3.5 w-3.5" />, label: 'Evaluate company commercial health score', skill: 'company_health' },
  { icon: <Briefcase className="h-3.5 w-3.5" />, label: 'Generate quarterly Board of Directors report', skill: 'board_report' },
  { icon: <BarChart3 className="h-3.5 w-3.5" />, label: 'Run SaaS KPI diagnostic & velocity audit', skill: 'kpi_analysis' },
  { icon: <Target className="h-3.5 w-3.5" />, label: 'Identify strategic growth opportunities', skill: 'strategic_opportunities' },
  { icon: <FileText className="h-3.5 w-3.5" />, label: 'Formulate C-suite strategic action plan', skill: 'executive_next_actions' },
];

import { useWorkspaceStore } from '@/stores/workspace-store';

export default function AIExecutivePage() {
  const { currentWorkspace } = useWorkspaceStore();
  const [messages, setMessages] = React.useState<SkillMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Welcome to Executive Copilot & Strategic Intelligence! I synthesize cross-functional revenue metrics, quarterly performance, customer health, renewal outlooks, and board-level risk overviews.\n\nSelect a time window or ask me to:\n• Executive briefing & board summary\n• Company health & KPI scorecards\n• Quarterly sales velocity review\n• Customer churn & renewal outlook\n• Strategic revenue opportunities",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedPeriod, setSelectedPeriod] = React.useState('Q3 2026');
  const [selectedMessage, setSelectedMessage] = React.useState<SkillMessage | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (promptText?: string, promptSkill?: string) => {
    const prompt = (promptText ?? input).trim();
    if (!prompt || isLoading) return;
    setInput('');

    const skillKey = promptSkill ?? 'executive_dashboard';

    const userMsg: SkillMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const loadingId = `a-${Date.now()}`;
    const loadingMsg: SkillMessage = {
      id: loadingId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/ai/executive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Workspace-ID': currentWorkspace?.id || '',
        },
        credentials: 'include',
        body: JSON.stringify({
          skill: skillKey,
          question: prompt,
          entity_type: 'workspace',
          time_window: selectedPeriod,
          workspace_id: currentWorkspace?.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: SkillMessage = {
          id: loadingId,
          role: 'assistant',
          content: data.summary ?? 'Executive intelligence briefing complete.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          skill: data.skill,
          confidence: data.confidence,
          confidence_label: data.confidence_label,
          confidence_explanation: data.confidence_explanation,
          citations: data.citations ?? [],
          evidence: data.evidence ?? [],
          missing_context: data.missing_context ?? [],
          insights: data.insights ?? [],
          recommendations: data.recommendations ?? [],
          next_actions: data.next_actions ?? [],
          reasoning: data.reasoning ?? null,
          latency_ms: data.latency_ms,
        };
        setMessages((prev) => prev.map((m) => (m.id === loadingId ? assistantMsg : m)));
        setSelectedMessage(assistantMsg);
      } else {
        const errMsg: SkillMessage = {
          id: loadingId,
          role: 'assistant',
          content: 'Unable to complete Executive Copilot request. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => prev.map((m) => (m.id === loadingId ? errMsg : m)));
      }
    } catch {
      const errMsg: SkillMessage = {
        id: loadingId,
        role: 'assistant',
        content: 'Connection error calling Executive Copilot API.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => prev.map((m) => (m.id === loadingId ? errMsg : m)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden">
      {/* Main Center Area */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-border-subtle">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-elevated/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-accent/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-primary leading-none">Enterprise Executive Copilot & Strategic Intelligence</h1>
              <p className="text-[10px] text-muted">Board Reports · Health Diagnostics · KPI Analysis · Strategic Growth Directives</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-surface border border-border-default text-xs font-semibold text-primary outline-none focus:border-accent"
            >
              <option value="Q3 2026">Q3 2026</option>
              <option value="Q2 2026">Q2 2026</option>
              <option value="Q1 2026">Q1 2026</option>
              <option value="FY 2026">FY 2026</option>
            </select>
          </div>
        </div>

        {/* Executive KPI Header Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-elevated/20 border-b border-border-subtle shrink-0">
          <ExecutiveKPICard label="Annual Recurring Revenue" value="$580K" change="+18.4%" trend="up" target="$600K" icon={<DollarSign className="h-4 w-4" />} />
          <ExecutiveKPICard label="Pipeline Coverage" value="3.8x" change="+0.4x" trend="up" target="3.5x" icon={<BarChart3 className="h-4 w-4" />} />
          <ExecutiveKPICard label="Net Retention Rate" value="124%" change="+4.2%" trend="up" target="120%" icon={<Activity className="h-4 w-4" />} />
          <ExecutiveKPICard label="Sales Velocity" value="34 Days" change="-3 Days" trend="up" target="30 Days" icon={<Sparkles className="h-4 w-4" />} />
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              onClick={() => msg.role === 'assistant' && !msg.isLoading && setSelectedMessage(msg)}
              className="cursor-pointer"
            >
              {msg.role === 'assistant' ? (
                <AIResponseCard
                  summary={msg.content}
                  confidence={msg.confidence}
                  confidenceLabel={msg.confidence_label}
                  confidenceExplanation={msg.confidence_explanation}
                  latencyMs={msg.latency_ms}
                  isLoading={msg.isLoading}
                  timestamp={msg.timestamp}
                />
              ) : (
                <div className="flex justify-end gap-3">
                  <div className="max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed bg-accent text-accent-fg rounded-br-sm shadow-sm">
                    {msg.content}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Suggestion Bar */}
        <PromptSuggestionBar
          suggestions={EXECUTIVE_SUGGESTIONS}
          disabled={isLoading}
          onSelect={(p: PromptSuggestion) => handleSend(p.label, p.skill)}
        />

        {/* Input Bar */}
        <div className="px-4 py-3 border-t border-border-subtle bg-elevated/40 backdrop-blur-sm shrink-0">
          <div className="flex items-end gap-2 bg-surface rounded-xl border border-border-default focus-within:border-accent/40 focus-within:ring-1 focus-within:ring-accent/20 transition-all shadow-sm">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder={`Ask Executive Copilot for board report, company health, KPI audit, or strategic action plan...`}
              disabled={isLoading}
              className="flex-1 bg-transparent px-4 py-3 text-sm text-primary placeholder:text-muted outline-none resize-none disabled:opacity-50"
            />
            <div className="p-2 shrink-0">
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="h-8 w-8 rounded-lg bg-accent hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-accent-fg transition-all shadow-sm"
              >
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Intelligence Panel */}
      <div className="w-80 shrink-0 hidden lg:flex flex-col bg-surface border-l border-border-subtle overflow-y-auto p-4 space-y-4">
        <CompanyHealthCard />
        <RevenueTrendChart />
        <PipelineHealthCard />
        <ExecutiveInsightCard title="High Enterprise Expansion Velocity" description="Top 10 accounts increased seat count by 34% post-onboarding." category="revenue" priority="high" />
        <RiskOverviewPanel />
        <BoardSummaryPanel />
        <StrategicOpportunitiesPanel />
        <ExecutiveTimeline />
        <ExecutiveRecommendationPanel />

        {selectedMessage?.recommendations && selectedMessage.recommendations.length > 0 && (
          <div className="space-y-2 pt-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Strategic Directives</p>
            {selectedMessage.recommendations.map((rec, i) => (
              <RecommendationCard key={i} recommendation={rec} index={i + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
