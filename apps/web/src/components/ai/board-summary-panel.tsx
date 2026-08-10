'use client';

import * as React from 'react';
import { Briefcase } from 'lucide-react';

export function BoardSummaryPanel() {
  return (
    <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-3">
      <div className="flex items-center gap-2">
        <Briefcase className="h-4 w-4 text-accent" />
        <h3 className="text-xs font-bold text-primary">Board of Directors Briefing Snippet</h3>
      </div>

      <div className="p-3 rounded-lg bg-elevated border border-border-subtle text-xs text-secondary leading-relaxed space-y-2">
        <p className="font-semibold text-primary">Q3 2026 Board Summary:</p>
        <p>
          ForgeCRM achieved $580K ARR in Q3 (+81.2% YoY), driven by strong enterprise upsell adoption and 124% NRR. Pipeline coverage stands at 3.8x against Q4 ARR target of $750K. Key risks include mid-funnel technical clearance delays.
        </p>
      </div>
    </div>
  );
}
