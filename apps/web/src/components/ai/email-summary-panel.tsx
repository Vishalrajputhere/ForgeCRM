'use client';

import * as React from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';

interface ActionItem {
  task: string;
  owner: string;
}

interface EmailSummaryPanelProps {
  summary?: string | undefined;
  sentiment?: string | undefined;
  actionItems?: ActionItem[] | undefined;
}

const DEFAULT_ACTION_ITEMS: ActionItem[] = [
  { task: 'Send SOC2 compliance documentation', owner: 'Sales Engineer' },
  { task: 'Schedule technical deep dive meeting', owner: 'Account Executive' },
];

export function EmailSummaryPanel({
  summary = 'Customer is interested in platform expansion but requested security documentation and pricing clarification.',
  sentiment = 'Positive',
  actionItems = DEFAULT_ACTION_ITEMS,
}: EmailSummaryPanelProps) {
  return (
    <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold text-primary">Thread Intelligence Summary</h3>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Sentiment: {sentiment}
        </span>
      </div>

      <p className="text-xs text-secondary leading-relaxed">{summary}</p>

      <div className="space-y-1.5 pt-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Extracted Action Items</p>
        {actionItems.map((act, i) => (
          <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-elevated border border-border-subtle">
            <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-primary">{act.task}</p>
              <p className="text-[10px] text-muted">Owner: {act.owner}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
