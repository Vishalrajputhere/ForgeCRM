'use client';

import * as React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface SuggestedRepliesProps {
  replies?: string[] | undefined;
  onSelectReply?: ((reply: string) => void) | undefined;
}

const DEFAULT_REPLIES = [
  'Yes, Tuesday at 2 PM EST works perfectly. I will send a calendar invite.',
  'Thanks Sarah! Is there anyone else from IT or Security who should join?',
  'Could we push to 3 PM EST? Our lead architect is available then.',
];

export function SuggestedReplies({ replies = DEFAULT_REPLIES, onSelectReply }: SuggestedRepliesProps) {
  return (
    <div className="p-3.5 rounded-xl bg-surface border border-border-subtle space-y-2.5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-400" />
        <h3 className="text-xs font-bold text-primary">1-Click AI Reply Suggestions</h3>
      </div>

      <div className="space-y-1.5">
        {replies.map((r, i) => (
          <button
            key={i}
            onClick={() => onSelectReply?.(r)}
            className="w-full text-left p-2.5 rounded-lg bg-elevated hover:bg-surface-hover border border-border-subtle text-xs text-secondary hover:text-primary transition-colors flex items-center justify-between gap-2 group"
          >
            <span className="leading-snug truncate">{r}</span>
            <ArrowRight className="h-3.5 w-3.5 text-accent opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
