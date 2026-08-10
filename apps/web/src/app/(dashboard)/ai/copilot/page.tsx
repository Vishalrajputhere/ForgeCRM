'use client';

import * as React from 'react';
import {
  Sparkles, Send, Bot, User, Copy, Check, MessageSquare,
  Pin, FolderOpen, ChevronRight, Download, RefreshCw,
  BookOpen, Zap, Target, Clock, BarChart2, Mail, Users,
  Info,
} from 'lucide-react';
import { CitationCard, type Citation } from '@/components/ai/citation-card';
import { ConfidenceBadge, type ConfidenceLabel } from '@/components/ai/confidence-badge';
import { InsightCard, type Insight } from '@/components/ai/insight-card';
import { ReasoningPanel, type ReasoningChain } from '@/components/ai/reasoning-panel';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SkillMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  skill_type?: string;
  confidence?: number;
  confidence_label?: ConfidenceLabel;
  confidence_explanation?: string;
  citations?: Citation[];
  insights?: Insight[];
  recommendations?: string[];
  next_actions?: string[];
  reasoning_chain?: ReasoningChain;
  latency_ms?: number;
  estimated_cost_usd?: number;
  isLoading?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  pinned: boolean;
  folder: string;
  updatedAt: string;
  messageCount: number;
}

// ─── Suggested Prompts ───────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  { icon: <Target className="h-3.5 w-3.5" />, label: 'Summarize Acme Corp', skill: 'account_summary', entity: 'Acme Corp' },
  { icon: <BarChart2 className="h-3.5 w-3.5" />, label: 'Explain pipeline', skill: 'explain_pipeline', entity: null },
  { icon: <Zap className="h-3.5 w-3.5" />, label: 'Show blockers', skill: 'show_blockers', entity: null },
  { icon: <Clock className="h-3.5 w-3.5" />, label: "What happened this week?", skill: 'timeline_summary', entity: null },
  { icon: <BookOpen className="h-3.5 w-3.5" />, label: 'Opportunity summary', skill: 'opportunity_summary', entity: null },
  { icon: <Mail className="h-3.5 w-3.5" />, label: 'Meeting brief for Sarah', skill: 'meeting_brief', entity: 'Sarah Connor' },
];

// ─── Mock Conversations ───────────────────────────────────────────────────────

const MOCK_CONVERSATIONS: Conversation[] = [
  { id: '1', title: 'Acme Corp Account Review', pinned: true, folder: 'Accounts', updatedAt: '2m ago', messageCount: 8 },
  { id: '2', title: 'Q3 Pipeline Analysis', pinned: true, folder: 'Pipeline', updatedAt: '1h ago', messageCount: 12 },
  { id: '3', title: 'Deal Risk Assessment', pinned: false, folder: 'Deals', updatedAt: '3h ago', messageCount: 5 },
  { id: '4', title: 'Lead Qualification Session', pinned: false, folder: 'Leads', updatedAt: 'Yesterday', messageCount: 7 },
];

// ─── Skill Endpoint Map ───────────────────────────────────────────────────────

const SKILL_ENDPOINT_MAP: Record<string, string> = {
  account_summary: '/api/v1/ai/copilot/account',
  opportunity_summary: '/api/v1/ai/copilot/opportunity',
  timeline_summary: '/api/v1/ai/copilot/timeline',
  meeting_brief: '/api/v1/ai/copilot/meeting',
  show_blockers: '/api/v1/ai/copilot/blockers',
  explain_pipeline: '/api/v1/ai/copilot/pipeline',
  crm_qa: '/api/v1/ai/copilot',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function detectSkillType(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('summar') && (lower.includes('corp') || lower.includes('company') || lower.includes('account'))) return 'account_summary';
  if (lower.includes('opportunit') || lower.includes('open deal')) return 'opportunity_summary';
  if (lower.includes('happened') || lower.includes('this week') || lower.includes('yesterday') || lower.includes('timeline')) return 'timeline_summary';
  if (lower.includes('meeting') || lower.includes('brief') || lower.includes('prepare')) return 'meeting_brief';
  if (lower.includes('blocker') || lower.includes('stuck') || lower.includes('blocked')) return 'show_blockers';
  if (lower.includes('pipeline') || lower.includes('explain')) return 'explain_pipeline';
  return 'crm_qa';
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: SkillMessage; onCopy?: (id: string, text: string) => void }) {
  const [copied, setCopied] = React.useState(false);
  const isUser = msg.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} group`}>
      {!isUser && (
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/25 flex items-center justify-center text-accent shrink-0 shadow-sm">
          {msg.isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
        </div>
      )}

      <div className={`max-w-[85%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
            isUser
              ? 'bg-gradient-to-br from-accent to-accent/80 text-accent-fg rounded-br-sm'
              : 'bg-elevated border border-border-subtle text-primary rounded-bl-sm'
          }`}
        >
          {msg.isLoading ? (
            <div className="flex items-center gap-2 text-muted">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              <span className="text-xs">AI is analyzing your CRM data…</span>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          )}
        </div>

        {/* Metadata row */}
        {!isUser && !msg.isLoading && (
          <div className="flex flex-wrap items-center gap-2 px-1">
            <span className="text-[10px] text-muted">{msg.timestamp}</span>

            {msg.confidence !== undefined && msg.confidence_label && (
              <ConfidenceBadge
                score={msg.confidence}
                label={msg.confidence_label}
                explanation={msg.confidence_explanation ?? ''}
              />
            )}

            {msg.latency_ms !== undefined && (
              <span className="text-[10px] text-muted tabular-nums">{msg.latency_ms}ms</span>
            )}

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[10px] text-muted hover:text-primary transition-colors"
            >
              {copied ? <><Check className="h-3 w-3 text-emerald-400" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
            </button>
          </div>
        )}

        {/* Recommendations / Next Actions */}
        {!isUser && !msg.isLoading && msg.next_actions && msg.next_actions.length > 0 && (
          <div className="ml-1 space-y-1">
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wide">Recommended Actions</p>
            {msg.next_actions.map((action, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-accent/5 border border-accent/15">
                <Zap className="h-3 w-3 text-accent mt-0.5 shrink-0" />
                <span className="text-xs text-secondary">{action}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <div className="h-8 w-8 rounded-xl bg-surface-hover border border-border-default flex items-center justify-center text-muted shrink-0">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
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
      {/* Header */}
      <div className="p-3 border-b border-border-subtle">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-accent text-accent-fg text-xs font-semibold hover:bg-accent/90 transition-colors shadow-sm"
        >
          <Sparkles className="h-3.5 w-3.5" />
          New Conversation
        </button>
      </div>

      {/* Pinned */}
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

      {/* Recent */}
      <div className="flex-1 overflow-y-auto p-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted px-2 py-1.5 flex items-center gap-1.5">
          <Clock className="h-3 w-3" /> Recent
        </p>
        {recent.map((c) => (
          <ConvItem key={c.id} conv={c} active={c.id === activeId} onSelect={onSelect} />
        ))}
      </div>

      {/* Footer */}
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

// ─── Context Panel ────────────────────────────────────────────────────────────

function ContextPanel({ message }: { message: SkillMessage | null }) {
  const [activeTab, setActiveTab] = React.useState<'insights' | 'citations' | 'reasoning'>('insights');

  if (!message || message.role === 'user') {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-6 bg-surface border-l border-border-subtle">
        <div className="h-12 w-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-3">
          <Info className="h-6 w-6" />
        </div>
        <p className="text-xs font-semibold text-primary mb-1">Context Panel</p>
        <p className="text-xs text-muted">Send a message to see AI insights, citations, and reasoning steps.</p>
      </div>
    );
  }

  const tabs: { id: typeof activeTab; label: string; count: number }[] = [
    { id: 'insights', label: 'Insights', count: message.insights?.length ?? 0 },
    { id: 'citations', label: 'Sources', count: message.citations?.length ?? 0 },
    { id: 'reasoning', label: 'Reasoning', count: message.reasoning_chain?.steps.length ?? 0 },
  ];

  return (
    <div className="flex flex-col h-full bg-surface border-l border-border-subtle">
      {/* Tab bar */}
      <div className="flex border-b border-border-subtle">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-primary'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-bold ${activeTab === tab.id ? 'bg-accent text-accent-fg' : 'bg-border-subtle text-muted'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === 'insights' && (
          <>
            {message.insights && message.insights.length > 0 ? (
              message.insights.map((insight, i) => (
                <InsightCard key={i} insight={insight} />
              ))
            ) : (
              <p className="text-xs text-muted text-center py-6">No insights for this response.</p>
            )}
            {message.recommendations && message.recommendations.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">All Recommendations</p>
                {message.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-elevated border border-border-subtle">
                    <ChevronRight className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
                    <span className="text-xs text-secondary">{rec}</span>
                  </div>
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
              <p className="text-xs text-muted text-center py-6">No source citations for this response.</p>
            )}
          </>
        )}

        {activeTab === 'reasoning' && (
          <>
            {message.reasoning_chain ? (
              <ReasoningPanel chain={message.reasoning_chain} />
            ) : (
              <p className="text-xs text-muted text-center py-6">No reasoning chain available.</p>
            )}
          </>
        )}
      </div>

      {/* Cost footer */}
      {message.estimated_cost_usd !== undefined && (
        <div className="p-2.5 border-t border-border-subtle flex items-center justify-between">
          <span className="text-[10px] text-muted">Estimated cost</span>
          <span className="text-[10px] font-semibold text-primary tabular-nums">
            ${message.estimated_cost_usd.toFixed(6)} USD
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AICopilotPage() {
  const [messages, setMessages] = React.useState<SkillMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your Enterprise Sales Copilot — powered by CRM data, RAG document intelligence, and long-term memory.\n\nTry asking me to:\n• Summarize an account (\"Summarize Acme Corp\")\n• Explain the pipeline\n• Show pipeline blockers\n• Brief me on my next meeting\n• What happened this week?",
      timestamp: now(),
    },
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeConvId, setActiveConvId] = React.useState('1');
  const [selectedMessage, setSelectedMessage] = React.useState<SkillMessage | null>(null);
  const [showSidebar, setShowSidebar] = React.useState(true);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const prompt = (text ?? input).trim();
    if (!prompt || isLoading) return;
    setInput('');

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
      const skillType = detectSkillType(prompt);
      const endpoint = SKILL_ENDPOINT_MAP[skillType] ?? '/api/v1/ai/copilot';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ question: prompt }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: SkillMessage = {
          id: loadingId,
          role: 'assistant',
          content: data.summary ?? data.message?.content ?? 'No response generated.',
          timestamp: now(),
          skill_type: data.skill_type,
          confidence: data.confidence,
          confidence_label: data.confidence_label,
          confidence_explanation: data.confidence_explanation,
          citations: data.citations ?? [],
          insights: data.insights ?? [],
          recommendations: data.recommendations ?? [],
          next_actions: data.next_actions ?? [],
          reasoning_chain: data.reasoning_chain ?? null,
          latency_ms: data.latency_ms,
          estimated_cost_usd: data.estimated_cost_usd,
        };
        setMessages((prev) => prev.map((m) => (m.id === loadingId ? assistantMsg : m)));
        setSelectedMessage(assistantMsg);
      } else {
        const errMsg: SkillMessage = {
          id: loadingId,
          role: 'assistant',
          content: 'I encountered an error processing your request. Please try again.',
          timestamp: now(),
        };
        setMessages((prev) => prev.map((m) => (m.id === loadingId ? errMsg : m)));
      }
    } catch {
      const errMsg: SkillMessage = {
        id: loadingId,
        role: 'assistant',
        content: 'Unable to connect to the AI backend. Please check your connection.',
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

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden">
      {/* ── Left Sidebar: Conversation History ─────────────────────────────── */}
      {showSidebar && (
        <div className="w-60 shrink-0 hidden lg:flex flex-col">
          <ConversationSidebar
            conversations={MOCK_CONVERSATIONS}
            activeId={activeConvId}
            onSelect={setActiveConvId}
            onNew={() => {
              setMessages([]);
              setSelectedMessage(null);
            }}
          />
        </div>
      )}

      {/* ── Center: Chat Area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-border-subtle">
        {/* Top bar */}
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
              <p className="text-[10px] text-muted">CRM · RAG · Memory · MCP · Multi-Provider</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted hover:text-primary hover:bg-surface-hover border border-transparent hover:border-border-subtle transition-all"
            >
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {messages.map((msg) => (
            <button
              key={msg.id}
              className="w-full text-left"
              onClick={() => msg.role === 'assistant' && !msg.isLoading && setSelectedMessage(msg)}
            >
              <MessageBubble msg={msg} onCopy={() => {}} />
            </button>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        <div className="px-4 py-2 border-t border-border-subtle overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p.label}
                onClick={() => handleSend(p.label)}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-elevated border border-border-subtle hover:border-accent/30 hover:bg-accent/5 text-xs text-secondary hover:text-accent transition-all whitespace-nowrap disabled:opacity-40"
              >
                <span className="text-accent">{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input bar */}
        <div className="px-4 py-3 border-t border-border-subtle bg-elevated/40 backdrop-blur-sm shrink-0">
          <div className="flex items-end gap-2 bg-surface rounded-xl border border-border-default focus-within:border-accent/40 focus-within:ring-1 focus-within:ring-accent/20 transition-all shadow-sm">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Ask about deals, accounts, pipeline, blockers, meetings…"
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
            Grounded in your CRM data · RAG citations · Conversation memory · RBAC enforced
          </p>
        </div>
      </div>

      {/* ── Right Panel: Context (Insights / Citations / Reasoning) ────────── */}
      <div className="w-72 shrink-0 hidden xl:flex flex-col">
        <ContextPanel message={selectedMessage} />
      </div>
    </div>
  );
}
