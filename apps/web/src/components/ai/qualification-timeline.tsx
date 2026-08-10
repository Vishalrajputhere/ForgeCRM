'use client';

import * as React from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';

export interface QualificationStep {
  stage: 'Budget' | 'Authority' | 'Need' | 'Timeline';
  status: 'verified' | 'pending' | 'unclear';
  detail: string;
}

interface QualificationTimelineProps {
  steps?: QualificationStep[] | undefined;
}

const DEFAULT_STEPS: QualificationStep[] = [
  { stage: 'Budget', status: 'verified', detail: '$50K–$100K ARR allocated for Q3' },
  { stage: 'Authority', status: 'verified', detail: 'VP Sales + VP Procurement signed off' },
  { stage: 'Need', status: 'verified', detail: 'Pain point: manual CRM data entry & pipeline risk' },
  { stage: 'Timeline', status: 'pending', detail: 'Target deployment before end of fiscal Q3' },
];

export function QualificationTimeline({ steps = DEFAULT_STEPS }: QualificationTimelineProps) {
  return (
    <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-accent" />
        <h3 className="text-xs font-bold text-primary">BANT Qualification Checklist</h3>
      </div>

      <div className="space-y-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg bg-elevated border border-border-subtle text-xs">
            <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${s.status === 'verified' ? 'text-emerald-400' : 'text-amber-400'}`} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-primary">{s.stage}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded uppercase ${s.status === 'verified' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {s.status}
                </span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed mt-0.5">{s.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
