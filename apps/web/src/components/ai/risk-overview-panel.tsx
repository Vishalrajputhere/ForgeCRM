'use client';

import * as React from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';

export function RiskOverviewPanel() {
  const risks = [
    { title: 'Top Account Concentration Risk', desc: 'Apex Systems represents 22% of Q3 expansion pipeline.', severity: 'High' },
    { title: 'Mid-Funnel Bottleneck', desc: 'Average days in Technical Eval increased from 14 to 26 days.', severity: 'Medium' },
    { title: 'Key Rep Reliance', desc: 'Top 2 AE reps generated 64% of total closed revenue.', severity: 'Medium' },
  ];

  return (
    <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-rose-400" />
        <h3 className="text-xs font-bold text-primary">Top Executive Risk Alerts</h3>
      </div>

      <div className="space-y-2 text-xs">
        {risks.map((r, i) => (
          <div key={i} className="p-2.5 rounded-lg bg-elevated border border-border-subtle space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-primary flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                {r.title}
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase">
                {r.severity}
              </span>
            </div>
            <p className="text-[11px] text-muted leading-relaxed pl-5">{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
