'use client';

import * as React from 'react';
import { Target, BarChart2, Zap, Clock, BookOpen } from 'lucide-react';

export interface PromptSuggestion {
  icon?: React.ReactNode;
  label: string;
  skill: string;
  entity?: string | null;
}

interface PromptSuggestionBarProps {
  suggestions?: PromptSuggestion[];
  onSelect: (suggestion: PromptSuggestion) => void;
  disabled?: boolean;
}

const DEFAULT_SUGGESTIONS: PromptSuggestion[] = [
  { icon: <Target className="h-3.5 w-3.5" />, label: 'Summarize Acme Corp', skill: 'account_summary', entity: 'Acme Corp' },
  { icon: <BarChart2 className="h-3.5 w-3.5" />, label: 'Explain pipeline', skill: 'explain_pipeline', entity: null },
  { icon: <Zap className="h-3.5 w-3.5" />, label: 'Show blockers', skill: 'show_blockers', entity: null },
  { icon: <Clock className="h-3.5 w-3.5" />, label: 'What happened this week?', skill: 'timeline_summary', entity: null },
  { icon: <BookOpen className="h-3.5 w-3.5" />, label: 'Opportunity summary', skill: 'opportunity_summary', entity: null },
];

export function PromptSuggestionBar({ suggestions = DEFAULT_SUGGESTIONS, onSelect, disabled }: PromptSuggestionBarProps) {
  return (
    <div className="px-4 py-2 border-t border-border-subtle overflow-x-auto">
      <div className="flex gap-2 min-w-max">
        {suggestions.map((p) => (
          <button
            key={p.label}
            onClick={() => onSelect(p)}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-elevated border border-border-subtle hover:border-accent/30 hover:bg-accent/5 text-xs text-secondary hover:text-accent transition-all whitespace-nowrap disabled:opacity-40"
          >
            {p.icon && <span className="text-accent">{p.icon}</span>}
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
