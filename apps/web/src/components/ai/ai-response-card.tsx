'use client';

import * as React from 'react';
import { Bot, RefreshCw, Copy, Check } from 'lucide-react';
import { ConfidenceBadge, type ConfidenceLabel } from '@/components/ai/confidence-badge';

export interface AIResponseCardProps {
  summary: string;
  confidence?: number | undefined;
  confidenceLabel?: ConfidenceLabel | undefined;
  confidenceExplanation?: string | undefined;
  latencyMs?: number | undefined;
  isLoading?: boolean | undefined;
  timestamp?: string | undefined;
}

export function AIResponseCard({
  summary,
  confidence,
  confidenceLabel,
  confidenceExplanation,
  latencyMs,
  isLoading,
  timestamp,
}: AIResponseCardProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-3 group">
      <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/25 flex items-center justify-center text-accent shrink-0 shadow-sm">
        {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className="max-w-[85%] space-y-2">
        <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm bg-elevated border border-border-subtle text-primary rounded-bl-sm">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              <span className="text-xs">Analyzing CRM intelligence…</span>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{summary}</p>
          )}
        </div>

        {!isLoading && (
          <div className="flex flex-wrap items-center gap-2 px-1">
            {timestamp && <span className="text-[10px] text-muted">{timestamp}</span>}

            {confidence !== undefined && confidenceLabel && (
              <ConfidenceBadge
                score={confidence}
                label={confidenceLabel}
                explanation={confidenceExplanation ?? ''}
              />
            )}

            {latencyMs !== undefined && (
              <span className="text-[10px] text-muted tabular-nums">{latencyMs}ms</span>
            )}

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[10px] text-muted hover:text-primary transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copy
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
