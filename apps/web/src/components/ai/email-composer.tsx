'use client';

import * as React from 'react';
import { Mail, Sparkles, Copy, Check } from 'lucide-react';

interface EmailComposerProps {
  subject?: string | undefined;
  body?: string | undefined;
  onSubjectChange?: ((sub: string) => void) | undefined;
  onBodyChange?: ((b: string) => void) | undefined;
  onGenerateAI?: (() => void) | undefined;
  isLoading?: boolean | undefined;
}

export function EmailComposer({
  subject = 'Follow-up: ForgeCRM Enterprise Security & Deployment',
  body = 'Hi Sarah,\n\nThank you for taking the time to speak with our team yesterday regarding NexaCorp\'s CRM requirements.\n\nAttached is our security whitepaper outlining SOC2 Type II compliance and SSO capabilities. Would Tuesday at 2:00 PM EST work for a brief 15-minute technical deep dive?\n\nBest regards,\nForgeCRM Team',
  onSubjectChange,
  onBodyChange,
  onGenerateAI,
  isLoading = false,
}: EmailComposerProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold text-primary">AI Email Composer & Editor</h3>
        </div>
        <div className="flex items-center gap-2">
          {onGenerateAI && (
            <button
              onClick={onGenerateAI}
              disabled={isLoading}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Polish</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="p-1 rounded-lg hover:bg-elevated text-muted hover:text-primary transition-colors"
            title="Copy email to clipboard"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Subject Line</label>
          <input
            value={subject}
            onChange={(e) => onSubjectChange?.(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-elevated border border-border-subtle text-primary font-medium outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Email Body</label>
          <textarea
            value={body}
            onChange={(e) => onBodyChange?.(e.target.value)}
            rows={7}
            className="w-full px-3 py-2 rounded-lg bg-elevated border border-border-subtle text-primary leading-relaxed outline-none focus:border-accent resize-none font-sans"
          />
        </div>
      </div>
    </div>
  );
}
