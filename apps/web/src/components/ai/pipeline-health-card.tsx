'use client';

import * as React from 'react';
import { Layers } from 'lucide-react';

export function PipelineHealthCard() {
  const stages = [
    { name: 'Qualification', value: '$1.4M', count: 18, pct: 100 },
    { name: 'Technical Eval', value: '$980K', count: 12, pct: 70 },
    { name: 'Proposal', value: '$650K', count: 8, pct: 46 },
    { name: 'Closing', value: '$420K', count: 4, pct: 30 },
  ];

  return (
    <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold text-primary">Pipeline Health & Coverage</h3>
        </div>
        <span className="text-[10px] text-accent font-bold">3.8x Target Coverage</span>
      </div>

      <div className="space-y-2 text-xs">
        {stages.map((st, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-primary">{st.name} ({st.count})</span>
              <span className="font-bold text-secondary">{st.value}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-elevated overflow-hidden">
              <div className="h-full rounded-full bg-accent" style={{ width: `${st.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
