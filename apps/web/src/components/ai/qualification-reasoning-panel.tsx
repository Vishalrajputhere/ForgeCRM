'use client';

import * as React from 'react';
import { HelpCircle, ChevronDown, ChevronRight } from 'lucide-react';

interface RationalePoint {
  factor: string;
  weight: string;
  finding: string;
}

interface QualificationReasoningPanelProps {
  rationales?: RationalePoint[] | undefined;
}

const DEFAULT_RATIONALES: RationalePoint[] = [
  { factor: 'Firmographic Alignment', weight: '35%', finding: 'Company ARR > $20M and 300+ sales reps matching Enterprise ICP.' },
  { factor: 'Behavioral Intent', weight: '35%', finding: 'High intent: 4 pricing visits, whitepaper download, inbound demo request.' },
  { factor: 'Stakeholder Seniority', weight: '30%', finding: 'Lead title is VP of Sales — direct economic buyer decision maker.' },
];

export function QualificationReasoningPanel({ rationales = DEFAULT_RATIONALES }: QualificationReasoningPanelProps) {
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <div className="rounded-xl bg-surface border border-border-subtle overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3.5 hover:bg-surface-hover transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-accent" />
          <span className="text-xs font-bold text-primary">Qualification Rationale & Breakdown</span>
        </div>
        {isOpen ? <ChevronDown className="h-4 w-4 text-muted" /> : <ChevronRight className="h-4 w-4 text-muted" />}
      </button>

      {isOpen && (
        <div className="p-3 pt-0 space-y-2 border-t border-border-subtle/50 text-xs">
          {rationales.map((r, i) => (
            <div key={i} className="p-2 rounded-lg bg-elevated border border-border-subtle space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-primary">{r.factor}</span>
                <span className="text-[10px] font-bold text-accent">{r.weight}</span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">{r.finding}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
