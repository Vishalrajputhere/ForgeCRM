'use client';

import * as React from 'react';
import {
  Send, DollarSign, TrendingUp, Layers, BarChart3, RefreshCw,
  Award, ShieldAlert,
} from 'lucide-react';
import { AIResponseCard } from '@/components/ai/ai-response-card';
import { type Citation } from '@/components/ai/citation-card';
import { type ConfidenceLabel } from '@/components/ai/confidence-badge';
import { type Insight } from '@/components/ai/insight-card';
import { type ReasoningChain } from '@/components/ai/reasoning-panel';
import { RecommendationCard } from '@/components/ai/recommendation-card';
import { PromptSuggestionBar, type PromptSuggestion } from '@/components/ai/prompt-suggestion-bar';
import { RevenueForecastCard } from '@/components/ai/revenue-forecast-card';
import { PipelineForecastChart } from '@/components/ai/pipeline-forecast-chart';
import { ForecastScenarioCard } from '@/components/ai/forecast-scenario-card';
import { QuotaAttainmentCard } from '@/components/ai/quota-attainment-card';
import { ForecastConfidencePanel } from '@/components/ai/forecast-confidence-panel';
import { ForecastTimeline } from '@/components/ai/forecast-timeline';
import { ForecastInsightsPanel } from '@/components/ai/forecast-insights-panel';

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

const FORECAST_SUGGESTIONS: PromptSuggestion[] = [
  { icon: <DollarSign className="h-3.5 w-3.5" />, label: 'Quarterly revenue forecast', skill: 'revenue_forecast' },
  { icon: <BarChart3 className="h-3.5 w-3.5" />, label: 'Pipeline coverage & funnel', skill: 'pipeline_forecast' },
  { icon: <Layers className="h-3.5 w-3.5" />, label: 'What-if scenario simulation', skill: 'scenario_analysis' },
  { icon: <ShieldAlert className="h-3.5 w-3.5" />, label: 'Churn risk & NRR impact', skill: 'churn_prediction' },
  { icon: <TrendingUp className="h-3.5 w-3.5" />, label: 'Account expansion forecast', skill: 'expansion_prediction' },
  { icon: <Award className="h-3.5 w-3.5" />, label: 'Executive forecast briefing', skill: 'executive_forecast' },
];

export default function AIForecastPage() {
  const [messages, setMessages] = React.useState<SkillMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Welcome to Enterprise Forecast AI & Revenue Intelligence! I generate revenue forecasts, quota predictions, what-if scenario simulations (Best/Expected/Worst), churn risk analysis, and board-level executive briefings.\n\nSelect a time window or ask me to:\n• Forecast quarterly revenue\n• Analyze pipeline coverage\n• Run what-if scenario simulations\n• Predict churn & expansion ARR\n• Generate executive briefing",
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

    const skillKey = promptSkill ?? 'revenue_forecast';

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
      const res = await fetch('/api/v1/ai/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          skill: skillKey,
          question: prompt,
          entity_type: 'workspace',
          time_window: selectedPeriod,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: SkillMessage = {
          id: loadingId,
          role: 'assistant',
          content: data.summary ?? 'Forecast analysis complete.',
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
          content: 'Unable to complete Forecast AI analysis. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => prev.map((m) => (m.id === loadingId ? errMsg : m)));
      }
    } catch {
      const errMsg: SkillMessage = {
        id: loadingId,
        role: 'assistant',
        content: 'Connection error calling Forecast AI API.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => prev.map((m) => (m.id === loadingId ? errMsg : m)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden">
      {/* Center Chat */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-border-subtle">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-elevated/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-accent/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-primary leading-none">Enterprise Forecast AI & Revenue Intelligence</h1>
              <p className="text-[10px] text-muted">Revenue Predictions · Scenario Simulations · Quota Attainment · Board Briefings</p>
            </div>
          </div>

          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-surface border border-border-default text-xs font-semibold text-primary outline-none focus:border-accent"
          >
            <option value="Q3 2026">Q3 2026</option>
            <option value="Q4 2026">Q4 2026</option>
            <option value="FY 2026">FY 2026</option>
          </select>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
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
          suggestions={FORECAST_SUGGESTIONS}
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
              placeholder={`Ask Forecast AI about ${selectedPeriod} revenue predictions...`}
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
        <RevenueForecastCard period={selectedPeriod} />
        <ForecastScenarioCard />
        <QuotaAttainmentCard />
        <PipelineForecastChart />
        <ForecastConfidencePanel />
        <ForecastTimeline />
        <ForecastInsightsPanel />

        {selectedMessage?.recommendations && selectedMessage.recommendations.length > 0 && (
          <div className="space-y-2 pt-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Recommended Strategic Actions</p>
            {selectedMessage.recommendations.map((rec, i) => (
              <RecommendationCard key={i} recommendation={rec} index={i + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
