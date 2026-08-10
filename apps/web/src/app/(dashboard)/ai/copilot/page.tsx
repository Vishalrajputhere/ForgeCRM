'use client';

import * as React from 'react';
import {
  Sparkles, Send, User, MessageSquare, Pin, FolderOpen,
  Download, RefreshCw, Clock, Users, Info,
} from 'lucide-react';
import { AIResponseCard } from '@/components/ai/ai-response-card';
import { CitationCard, type Citation } from '@/components/ai/citation-card';
import { type ConfidenceLabel } from '@/components/ai/confidence-badge';
import { InsightCard, type Insight } from '@/components/ai/insight-card';
import { ReasoningPanel, type ReasoningChain } from '@/components/ai/reasoning-panel';
import { RecommendationCard } from '@/components/ai/recommendation-card';
import { ActionCard } from '@/components/ai/action-card';
import { PromptSuggestionBar, type PromptSuggestion } from '@/components/ai/prompt-suggestion-bar';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExplainabilityData {
  evidence: string[];
  sources: string[];
  missing_context: string[];
  confidence_explanation: string;
  why_produced: string;
}

interface SkillMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  skill?: string;
  skill_type?: string;
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
  explainability?: ExplainabilityData;
  latency_ms?: number;
  estimated_cost_usd?: number;
  isLoading?: boolean;
}

import { useWorkspaceStore } from '@/stores/workspace-store';

interface Conversation {
  id: string;
  title: string;
  pinned: boolean;
  folder: string;
  updatedAt: string;
  messageCount: number;
}

const INITIAL_CONVERSATIONS: Conversation[] = [
  { id: 'c-1', title: 'Pipeline Risk Assessment', pinned: true, folder: 'Pipeline', updatedAt: 'Just now', messageCount: 2 },
  { id: 'c-2', title: 'Q3 Forecast Intelligence', pinned: true, folder: 'Forecast', updatedAt: 'Today', messageCount: 4 },
  { id: 'c-3', title: 'Key Account Executive Brief', pinned: false, folder: 'Accounts', updatedAt: 'Yesterday', messageCount: 6 },
];

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function detectSkill(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('summar') && (lower.includes('corp') || lower.includes('company') || lower.includes('account'))) return 'account_summary';
  if (lower.includes('opportunit') || lower.includes('open deal')) return 'opportunity_summary';
  if (lower.includes('happened') || lower.includes('this week') || lower.includes('yesterday') || lower.includes('timeline')) return 'timeline_summary';
  if (lower.includes('blocker') || lower.includes('stuck') || lower.includes('blocked')) return 'show_blockers';
  if (lower.includes('pipeline') || lower.includes('explain')) return 'explain_pipeline';
  return 'crm_qa';
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
}: {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  const pinned = conversations.filter((c) => c.pinned);
  const recent = conversations.filter((c) => !c.pinned);

  return (
    <div className="flex flex-col h-full bg-elevated border-r border-border-subtle">
      <div className="p-3 border-b border-border-subtle">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-accent text-accent-fg text-xs font-semibold hover:bg-accent/90 transition-colors shadow-sm"
        >
          <Sparkles className="h-3.5 w-3.5" />
          New Conversation
        </button>
      </div>

      {pinned.length > 0 && (
        <div className="p-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted px-2 py-1.5 flex items-center gap-1.5">
            <Pin className="h-3 w-3" /> Pinned
          </p>
          {pinned.map((c) => (
            <ConvItem key={c.id} conv={c} active={c.id === activeId} onSelect={onSelect} />
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted px-2 py-1.5 flex items-center gap-1.5">
          <Clock className="h-3 w-3" /> Recent
        </p>
        {recent.map((c) => (
          <ConvItem key={c.id} conv={c} active={c.id === activeId} onSelect={onSelect} />
        ))}
      </div>

      <div className="p-2 border-t border-border-subtle">
        <div className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] text-muted">
          <Users className="h-3 w-3 text-emerald-400" />
          <span className="text-status-success-fg font-medium">RAG · Memory · MCP Active</span>
        </div>
      </div>
    </div>
  );
}

function ConvItem({ conv, active, onSelect }: { conv: Conversation; active: boolean; onSelect: (id: string) => void }) {
  return (
    <button
      onClick={() => onSelect(conv.id)}
      className={`w-full text-left px-2.5 py-2 rounded-lg transition-all group mb-0.5 ${
        active ? 'bg-accent/10 border border-accent/20' : 'hover:bg-surface-hover border border-transparent'
      }`}
    >
      <div className="flex items-center gap-2 mb-0.5">
        <MessageSquare className={`h-3 w-3 shrink-0 ${active ? 'text-accent' : 'text-muted'}`} />
        <span className={`text-xs font-medium truncate ${active ? 'text-accent' : 'text-primary'}`}>{conv.title}</span>
      </div>
      <div className="flex items-center gap-2 pl-5">
        <span className="text-[10px] text-muted">{conv.updatedAt}</span>
        <span className="text-[10px] text-muted">·</span>
        <span className="text-[10px] text-muted">{conv.messageCount} msgs</span>
      </div>
    </button>
  );
}

// ─── Right Context Panel ──────────────────────────────────────────────────────

function ContextPanel({ message }: { message: SkillMessage | null }) {
  const [activeTab, setActiveTab] = React.useState<'insights' | 'citations' | 'reasoning' | 'explainability'>('insights');

  if (!message || message.role === 'user') {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-6 bg-surface border-l border-border-subtle">
        <div className="h-12 w-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-3">
          <Info className="h-6 w-6" />
        </div>
        <p className="text-xs font-semibold text-primary mb-1">Context & Intelligence</p>
        <p className="text-xs text-muted">Select an AI response to inspect insights, RAG sources, reasoning, and explainability.</p>
      </div>
    );
  }

  const rchain = message.reasoning;
  const exp = message.explainability;

  const tabs: { id: typeof activeTab; label: string; count: number }[] = [
    { id: 'insights', label: 'Insights', count: message.insights?.length ?? 0 },
    { id: 'citations', label: 'Sources', count: message.citations?.length ?? 0 },
    { id: 'reasoning', label: 'Reasoning', count: rchain?.steps.length ?? 0 },
    { id: 'explainability', label: 'Why AI', count: exp ? 1 : 0 },
  ];

  return (
    <div className="flex flex-col h-full bg-surface border-l border-border-subtle">
      {/* Tab Header */}
      <div className="flex border-b border-border-subtle">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-primary'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`inline-flex items-center justify-center h-3.5 min-w-3.5 px-1 rounded-full text-[9px] font-bold ${activeTab === tab.id ? 'bg-accent text-accent-fg' : 'bg-border-subtle text-muted'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === 'insights' && (
          <>
            {message.insights && message.insights.length > 0 ? (
              message.insights.map((insight, i) => (
                <InsightCard key={i} insight={insight} />
              ))
            ) : (
              <p className="text-xs text-muted text-center py-6">No insights extracted for this answer.</p>
            )}
            {message.recommendations && message.recommendations.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Recommendations</p>
                {message.recommendations.map((rec, i) => (
                  <RecommendationCard key={i} recommendation={rec} index={i + 1} />
                ))}
              </div>
            )}
            {message.next_actions && message.next_actions.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Next Actions</p>
                {message.next_actions.map((act, i) => (
                  <ActionCard key={i} action={act} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'citations' && (
          <>
            {message.citations && message.citations.length > 0 ? (
              message.citations.map((citation, i) => (
                <CitationCard key={citation.citation_id} citation={citation} index={i + 1} />
              ))
            ) : (
              <p className="text-xs text-muted text-center py-6">No source citations for this query.</p>
            )}
          </>
        )}

        {activeTab === 'reasoning' && (
          <>
            {rchain ? (
              <ReasoningPanel chain={rchain} />
            ) : (
              <p className="text-xs text-muted text-center py-6">No step-by-step reasoning chain available.</p>
            )}
          </>
        )}

        {activeTab === 'explainability' && (
          <div className="space-y-3 text-xs">
            {exp?.why_produced && (
              <div className="p-2.5 rounded-lg bg-accent/5 border border-accent/15 space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-accent">Why This Answer</p>
                <p className="text-secondary leading-relaxed">{exp.why_produced}</p>
              </div>
            )}

            {exp?.evidence && exp.evidence.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Evidence & Grounding</p>
                {exp.evidence.map((ev, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-secondary">
                    <span className="text-accent shrink-0">•</span>
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            )}

            {exp?.missing_context && exp.missing_context.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-400">Context Gaps</p>
                {exp.missing_context.map((mc, i) => (
                  <div key={i} className="p-2 rounded-lg bg-amber-500/8 border border-amber-500/20 text-amber-300 text-[11px]">
                    {mc}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {message.estimated_cost_usd !== undefined && (
        <div className="p-2.5 border-t border-border-subtle flex items-center justify-between">
          <span className="text-[10px] text-muted">Cost</span>
          <span className="text-[10px] font-semibold text-primary tabular-nums">
            ${message.estimated_cost_usd.toFixed(6)} USD
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function AICopilotPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const [conversations, setConversations] = React.useState<Conversation[]>(() => {
    if (typeof window === 'undefined') return INITIAL_CONVERSATIONS;
    const stored = localStorage.getItem('forge-copilot-conversations');
    return stored ? JSON.parse(stored) : INITIAL_CONVERSATIONS;
  });

  const [activeConvId, setActiveConvId] = React.useState<string>('c-1');

  const [messages, setMessages] = React.useState<SkillMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your Enterprise Sales Copilot — powered by CRM data, RAG document intelligence, and long-term memory.\n\nTry asking me to:\n• Summarize an account (\"Summarize Acme Corp\")\n• Explain the pipeline\n• Show pipeline blockers\n• What happened this week?",
      timestamp: now(),
    },
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedMessage, setSelectedMessage] = React.useState<SkillMessage | null>(null);
  const [showSidebar, setShowSidebar] = React.useState(true);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('forge-copilot-conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (promptText?: string, promptSkill?: string) => {
    const prompt = (promptText ?? input).trim();
    if (!prompt || isLoading) return;
    setInput('');

    const skillType = promptSkill ?? detectSkill(prompt);

    const userMsg: SkillMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: now(),
    };

    const loadingId = `a-${Date.now()}`;
    const loadingMsg: SkillMessage = {
      id: loadingId,
      role: 'assistant',
      content: '',
      timestamp: now(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setIsLoading(true);

    try {
      // Single unified API endpoint (Rule 7)
      const res = await fetch('/api/v1/ai/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Workspace-ID': currentWorkspace?.id || '',
        },
        credentials: 'include',
        body: JSON.stringify({
          skill: skillType,
          question: prompt,
          workspace_id: currentWorkspace?.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: SkillMessage = {
          id: loadingId,
          role: 'assistant',
          content: data.summary ?? 'No response generated.',
          timestamp: now(),
          skill: data.skill ?? data.skill_type,
          skill_type: data.skill_type ?? data.skill,
          confidence: data.confidence,
          confidence_label: data.confidence_label,
          confidence_explanation: data.confidence_explanation,
          citations: data.citations ?? [],
          evidence: data.evidence ?? [],
          missing_context: data.missing_context ?? [],
          insights: data.insights ?? [],
          recommendations: data.recommendations ?? [],
          next_actions: data.next_actions ?? [],
          reasoning: data.reasoning ?? data.reasoning_chain ?? null,
          explainability: data.explainability ?? null,
          latency_ms: data.latency_ms,
          estimated_cost_usd: data.estimated_cost_usd,
        };
        setMessages((prev) => prev.map((m) => (m.id === loadingId ? assistantMsg : m)));
        setSelectedMessage(assistantMsg);

        // Update active conversation count
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId
              ? { ...c, messageCount: c.messageCount + 2, updatedAt: 'Just now' }
              : c
          )
        );
      } else {
        const errMsg: SkillMessage = {
          id: loadingId,
          role: 'assistant',
          content: 'Error processing your request via SkillRegistry. Please try again.',
          timestamp: now(),
        };
        setMessages((prev) => prev.map((m) => (m.id === loadingId ? errMsg : m)));
      }
    } catch {
      const errMsg: SkillMessage = {
        id: loadingId,
        role: 'assistant',
        content: 'Unable to connect to the AI backend. Please check your network connection.',
        timestamp: now(),
      };
      setMessages((prev) => prev.map((m) => (m.id === loadingId ? errMsg : m)));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleExport = () => {
    const text = messages
      .map((m) => `[${m.role.toUpperCase()} — ${m.timestamp}]\n${m.content}`)
      .join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'copilot-conversation.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNewConversation = () => {
    const newId = `c-${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      title: `New Session ${conversations.length + 1}`,
      pinned: false,
      folder: 'General',
      updatedAt: 'Just now',
      messageCount: 1,
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newId);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: 'New Copilot session initialized. Ask me anything about your deals, accounts, or pipeline.',
        timestamp: now(),
      },
    ]);
    setSelectedMessage(null);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-60 shrink-0 hidden lg:flex flex-col">
          <ConversationSidebar
            conversations={conversations}
            activeId={activeConvId}
            onSelect={setActiveConvId}
            onNew={handleNewConversation}
          />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-border-subtle">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-subtle bg-elevated/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-primary transition-colors lg:flex hidden"
            >
              <FolderOpen className="h-4 w-4" />
            </button>
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center text-accent-fg">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-primary leading-none">Enterprise Sales Copilot</h1>
              <p className="text-[10px] text-muted">SkillRegistry · Single Endpoint · Grounded RAG</p>
            </div>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted hover:text-primary hover:bg-surface-hover border border-transparent hover:border-border-subtle transition-all"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
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
                  <div className="max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed bg-gradient-to-br from-accent to-accent/80 text-accent-fg rounded-br-sm shadow-sm">
                    {msg.content}
                  </div>
                  <div className="h-8 w-8 rounded-xl bg-surface-hover border border-border-default flex items-center justify-center text-muted shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Suggestion Bar */}
        <PromptSuggestionBar
          disabled={isLoading}
          onSelect={(p: PromptSuggestion) => handleSend(p.label, p.skill)}
        />

        {/* Input Bar */}
        <div className="px-4 py-3 border-t border-border-subtle bg-elevated/40 backdrop-blur-sm shrink-0">
          <div className="flex items-end gap-2 bg-surface rounded-xl border border-border-default focus-within:border-accent/40 focus-within:ring-1 focus-within:ring-accent/20 transition-all shadow-sm">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Ask Sales Copilot about accounts, pipeline, blockers..."
              disabled={isLoading}
              className="flex-1 bg-transparent px-4 py-3 text-sm text-primary placeholder:text-muted outline-none resize-none disabled:opacity-50"
            />
            <div className="p-2 shrink-0">
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="h-8 w-8 rounded-lg bg-accent hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-accent-fg transition-all shadow-sm hover:shadow-md active:scale-95"
              >
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <p className="text-[10px] text-muted text-center mt-2">
            Single POST /api/v1/ai/copilot · Grounded CRM RAG · SkillRegistry Dispatch
          </p>
        </div>
      </div>

      {/* Right Context Panel */}
      <div className="w-72 shrink-0 hidden xl:flex flex-col">
        <ContextPanel message={selectedMessage} />
      </div>
    </div>
  );
}
