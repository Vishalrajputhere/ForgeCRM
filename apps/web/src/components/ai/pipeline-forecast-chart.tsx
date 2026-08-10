'use client';

import * as React from 'react';
import { BarChart3 } from 'lucide-react';

export interface StageFunnel {
  stage: string;
  count: number;
  value: string;
  conversionRate: number;
}

interface PipelineForecastChartProps {
  stages?: StageFunnel[] | undefined;
}

const DEFAULT_STAGES: StageFunnel[] = [
  { stage: 'Qualification', count: 42, value: '$3.4M', conversionRate: 85 },
  { stage: 'Discovery', count: 28, value: '$2.2M', conversionRate: 70 },
  { stage: 'Proposal / Demo', count: 18, value: '$1.5M', conversionRate: 55 },
  { stage: 'Negotiation', count: 11, value: '$920K', conversionRate: 80 },
  { stage: 'Closed Won', count: 8, value: '$650K', conversionRate: 100 },
];

export function PipelineForecastChart({ stages = DEFAULT_STAGES }: PipelineForecastChartProps) {
  return (
    <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-accent" />
        <h3 className="text-xs font-bold text-primary">Pipeline Funnel & Conversion Velocity</h3>
      </div>

      <div className="space-y-2">
        {stages.map((st, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-primary">{st.stage} ({st.count})</span>
              <span className="text-[11px] font-bold text-accent tabular-nums">{st.value} · {st.conversionRate}% Conv</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-elevated border border-border-subtle overflow-hidden">
              <div
                className="h-full bg-accent/80 rounded-full transition-all"
                style={{ width: `${st.conversionRate}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
