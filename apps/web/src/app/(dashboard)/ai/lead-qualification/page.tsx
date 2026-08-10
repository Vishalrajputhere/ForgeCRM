'use client';

import * as React from 'react';
import {
  Send, ShieldCheck, Zap, Mail, RefreshCw,
  UserCheck, Award,
} from 'lucide-react';
import { AIResponseCard } from '@/components/ai/ai-response-card';
import { type Citation } from '@/components/ai/citation-card';
import { type ConfidenceLabel } from '@/components/ai/confidence-badge';
import { type Insight } from '@/components/ai/insight-card';
import { type ReasoningChain } from '@/components/ai/reasoning-panel';
import { RecommendationCard } from '@/components/ai/recommendation-card';
import { PromptSuggestionBar, type PromptSuggestion } from '@/components/ai/prompt-suggestion-bar';
import { LeadScoreCard } from '@/components/ai/lead-score-card';
import { ICPMatchCard } from '@/components/ai/icp-match-card';
import { QualificationTimeline } from '@/components/ai/qualification-timeline';
import { BuyingSignalsPanel } from '@/components/ai/buying-signals-panel';
import { FollowUpRecommendations } from '@/components/ai/follow-up-recommendations';
import { QualificationReasoningPanel } from '@/components/ai/qualification-reasoning-panel';

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

const LEAD_QUALIFICATION_SUGGESTIONS: PromptSuggestion[] = [
  { icon: <UserCheck className="h-3.5 w-3.5" />, label: 'Qualify lead BANT', skill: 'qualify_lead' },
  { icon: <Award className="h-3.5 w-3.5" />, label: 'Calculate composite lead score', skill: 'lead_score' },
  { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: 'ICP match analysis', skill: 'icp_match' },
  { icon: <Zap className="h-3.5 w-3.5" />, label: 'Detect buying signals', skill: 'buying_signals' },
  { icon: <Mail className="h-3.5 w-3.5" />, label: 'Outreach & follow-up strategy', skill: 'follow_up_strategy' },
];

export default function AILeadQualificationPage() {
  const [messages, setMessages] = React.useState<SkillMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Welcome to Enterprise Lead Qualification AI! I evaluate inbound and outbound leads against BANT/MEDDPICC, calculate ICP fit scores, detect buying signals, and generate personalized outreach strategies.\n\nSelect a lead or ask me to:\n• Qualify lead BANT\n• Calculate lead score\n• Evaluate ICP match\n• Detect buying signals\n• Generate follow-up strategy",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedLeadName, setSelectedLeadName] = React.useState('Sarah Jenkins — VP Sales at NexaCorp');
  const [selectedMessage, setSelectedMessage] = React.useState<SkillMessage | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (promptText?: string, promptSkill?: string) => {
    const prompt = (promptText ?? input).trim();
    if (!prompt || isLoading) return;
    setInput('');

    const skillKey = promptSkill ?? 'qualify_lead';

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
      const res = await fetch('/api/v1/ai/lead-qualification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          skill: skillKey,
          question: prompt,
          entity_type: 'lead',
          entity_name: selectedLeadName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: SkillMessage = {
          id: loadingId,
          role: 'assistant',
          content: data.summary ?? 'Lead qualification complete.',
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
          content: 'Unable to complete Lead Qualification analysis. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => prev.map((m) => (m.id === loadingId ? errMsg : m)));
      }
    } catch {
      const errMsg: SkillMessage = {
        id: loadingId,
        role: 'assistant',
        content: 'Connection error calling Lead Qualification API.',
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
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-primary leading-none">Enterprise Lead Qualification AI</h1>
              <p className="text-[10px] text-muted">BANT Assessment · ICP Match Score · Buying Signals · Outreach Plan</p>
            </div>
          </div>

          <select
            value={selectedLeadName}
            onChange={(e) => setSelectedLeadName(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-surface border border-border-default text-xs font-semibold text-primary outline-none focus:border-accent"
          >
            <option value="Sarah Jenkins — VP Sales at NexaCorp">Sarah Jenkins — VP Sales at NexaCorp</option>
            <option value="Marcus Vance — CTO at Apex Systems">Marcus Vance — CTO at Apex Systems</option>
            <option value="Elena Rostova — Head of Growth at Scale AI">Elena Rostova — Head of Growth at Scale AI</option>
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
          suggestions={LEAD_QUALIFICATION_SUGGESTIONS}
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
              placeholder={`Ask Lead Qualification AI about ${selectedLeadName}...`}
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
        <LeadScoreCard fitScore={88} intentScore={80} compositeScore={84} priority="Hot" />
        <ICPMatchCard matchScore={90} isMatch={true} />
        <QualificationTimeline />
        <BuyingSignalsPanel />
        <FollowUpRecommendations />
        <QualificationReasoningPanel />

        {selectedMessage?.recommendations && selectedMessage.recommendations.length > 0 && (
          <div className="space-y-2 pt-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Recommended Actions</p>
            {selectedMessage.recommendations.map((rec, i) => (
              <RecommendationCard key={i} recommendation={rec} index={i + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
