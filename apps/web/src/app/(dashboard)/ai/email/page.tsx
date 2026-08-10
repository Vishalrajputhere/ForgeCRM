'use client';

import * as React from 'react';
import {
  Send, Mail, Sparkles, RefreshCw,
  FileText, Wand2, Calendar, Languages,
} from 'lucide-react';
import { AIResponseCard } from '@/components/ai/ai-response-card';
import { type Citation } from '@/components/ai/citation-card';
import { type ConfidenceLabel } from '@/components/ai/confidence-badge';
import { type Insight } from '@/components/ai/insight-card';
import { type ReasoningChain } from '@/components/ai/reasoning-panel';
import { RecommendationCard } from '@/components/ai/recommendation-card';
import { PromptSuggestionBar, type PromptSuggestion } from '@/components/ai/prompt-suggestion-bar';
import { EmailComposer } from '@/components/ai/email-composer';
import { EmailPreviewCard } from '@/components/ai/email-preview-card';
import { ToneSelector, type EmailTone } from '@/components/ai/tone-selector';
import { EmailSummaryPanel } from '@/components/ai/email-summary-panel';
import { ThreadTimeline } from '@/components/ai/thread-timeline';
import { SuggestedReplies } from '@/components/ai/suggested-replies';
import { EmailInsightsPanel } from '@/components/ai/email-insights-panel';
import { EmailTranslationPanel } from '@/components/ai/email-translation-panel';

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

const EMAIL_SUGGESTIONS: PromptSuggestion[] = [
  { icon: <Mail className="h-3.5 w-3.5" />, label: 'Draft context-aware email reply', skill: 'reply_email' },
  { icon: <FileText className="h-3.5 w-3.5" />, label: 'Summarize email thread & action items', skill: 'summarize_thread' },
  { icon: <Wand2 className="h-3.5 w-3.5" />, label: 'Rewrite email for conciseness & impact', skill: 'rewrite_email' },
  { icon: <Calendar className="h-3.5 w-3.5" />, label: 'Generate post-meeting follow-up', skill: 'meeting_followup' },
  { icon: <Sparkles className="h-3.5 w-3.5" />, label: 'Draft cold sales outreach', skill: 'cold_outreach' },
  { icon: <Languages className="h-3.5 w-3.5" />, label: 'Translate email into Spanish', skill: 'multilingual_translation' },
];

export default function AIEmailPage() {
  const [messages, setMessages] = React.useState<SkillMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Welcome to Enterprise Email Copilot & Communication Assistant! I draft context-aware email replies, rewrite drafts for impact, summarize email threads, extract action items, adjust communication tone, and translate emails across 6 languages.\n\nSelect a contact or ask me to:\n• Reply to an incoming message\n• Rewrite email draft for clarity\n• Summarize thread & action items\n• Generate meeting follow-up\n• Adjust tone or translate email",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedContact, setSelectedContact] = React.useState('Sarah Jenkins — VP Sales at NexaCorp');
  const [selectedTone, setSelectedTone] = React.useState<EmailTone>('Executive');
  const [subject, setSubject] = React.useState('Follow-up: ForgeCRM Enterprise Security & Deployment');
  const [body, setBody] = React.useState('Hi Sarah,\n\nThank you for taking the time to speak with our team yesterday regarding NexaCorp\'s CRM requirements.\n\nAttached is our security whitepaper outlining SOC2 Type II compliance and SSO capabilities. Would Tuesday at 2:00 PM EST work for a brief 15-minute technical deep dive?\n\nBest regards,\nForgeCRM Team');
  const [selectedMessage, setSelectedMessage] = React.useState<SkillMessage | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (promptText?: string, promptSkill?: string) => {
    const prompt = (promptText ?? input).trim();
    if (!prompt || isLoading) return;
    setInput('');

    const skillKey = promptSkill ?? 'reply_email';

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
      const res = await fetch('/api/v1/ai/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          skill: skillKey,
          question: prompt,
          entity_type: 'contact',
          entity_name: selectedContact,
          focus_areas: selectedTone,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: SkillMessage = {
          id: loadingId,
          role: 'assistant',
          content: data.summary ?? 'Email generation complete.',
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

        if (data.summary && data.summary.includes('Subject:')) {
          const parts = data.summary.split('\n\n');
          if (parts.length > 1) {
            setSubject(parts[0].replace('Subject:', '').trim());
            setBody(parts.slice(1).join('\n\n'));
          }
        }
      } else {
        const errMsg: SkillMessage = {
          id: loadingId,
          role: 'assistant',
          content: 'Unable to complete Email Copilot request. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => prev.map((m) => (m.id === loadingId ? errMsg : m)));
      }
    } catch {
      const errMsg: SkillMessage = {
        id: loadingId,
        role: 'assistant',
        content: 'Connection error calling Email Copilot API.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => prev.map((m) => (m.id === loadingId ? errMsg : m)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden">
      {/* Center Chat & Editor */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-border-subtle">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-elevated/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-accent/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-primary leading-none">Enterprise Communication Assistant & Email Copilot</h1>
              <p className="text-[10px] text-muted">Smart Replies · Tone Rewriter · Thread Summaries · Multilingual Translation</p>
            </div>
          </div>

          <select
            value={selectedContact}
            onChange={(e) => setSelectedContact(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-surface border border-border-default text-xs font-semibold text-primary outline-none focus:border-accent"
          >
            <option value="Sarah Jenkins — VP Sales at NexaCorp">Sarah Jenkins — VP Sales at NexaCorp</option>
            <option value="Marcus Vance — CTO at Apex Systems">Marcus Vance — CTO at Apex Systems</option>
            <option value="Elena Rostova — Head of Growth at Scale AI">Elena Rostova — Head of Growth at Scale AI</option>
          </select>
        </div>

        {/* Message Stream & Composer split */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <EmailComposer
            subject={subject}
            body={body}
            onSubjectChange={setSubject}
            onBodyChange={setBody}
            onGenerateAI={() => handleSend('Rewrite this email draft for clarity and conciseness', 'rewrite_email')}
            isLoading={isLoading}
          />

          <div className="space-y-4 pt-2">
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
        </div>

        {/* Prompt Suggestion Bar */}
        <PromptSuggestionBar
          suggestions={EMAIL_SUGGESTIONS}
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
              placeholder={`Ask Email Copilot to reply, rewrite, summarize, or translate...`}
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
        <EmailPreviewCard />
        <ToneSelector selectedTone={selectedTone} onSelectTone={(t) => { setSelectedTone(t); handleSend(`Adjust tone to ${t}`, 'improve_tone'); }} />
        <SuggestedReplies onSelectReply={(r) => setBody(r)} />
        <EmailSummaryPanel />
        <ThreadTimeline />
        <EmailTranslationPanel onTranslate={(lang) => handleSend(`Translate email to ${lang}`, 'multilingual_translation')} />
        <EmailInsightsPanel />

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
