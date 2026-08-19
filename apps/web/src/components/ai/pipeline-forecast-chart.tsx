'use client';

import * as React from 'react';
import { BarChart3, Inbox } from 'lucide-react';

import { useFormatters } from '@/hooks/use-formatters';
import { CURRENCY_SYMBOLS } from '@/lib/formatters';

export interface StageFunnel {
  stage: string;
  count: number;
  value: string;
  conversionRate: number;
}

interface PipelineForecastChartProps {
  stages?: StageFunnel[];
  isLoading?: boolean;
}

export function PipelineForecastChart({ stages, isLoading }: PipelineForecastChartProps) {
  const { currency } = useFormatters();
  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] ?? '$';

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-3 animate-pulse">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-accent/40" />
          <div className="h-3 w-40 rounded bg-elevated" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="h-2.5 w-28 rounded bg-elevated" />
                <div className="h-2.5 w-20 rounded bg-elevated" />
              </div>
              <div className="w-full h-1.5 rounded-full bg-elevated" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stages || stages.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-surface border border-border-subtle">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold text-primary">Pipeline Funnel & Conversion Velocity</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-4 gap-2 text-center">
          <Inbox className="h-6 w-6 text-muted/40" />
          <p className="text-[11px] text-muted">No pipeline data yet.</p>
          <p className="text-[10px] text-muted/60">Create deals and assign pipeline stages to see funnel metrics here.</p>
        </div>
      </div>
    );
  }

  // Normalise currency symbol in pre-formatted value strings
  const activeStages = stages.map((s) => ({
    ...s,
    value: s.value.startsWith('$') ? `${symbol}${s.value.slice(1)}` : s.value,
  }));

  return (
    <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-accent" />
        <h3 className="text-xs font-bold text-primary">Pipeline Funnel & Conversion Velocity</h3>
      </div>

      <div className="space-y-2">
        {activeStages.map((st, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-primary">{st.stage} ({st.count})</span>
              <span className="text-[11px] font-bold text-accent tabular-nums">
                {st.value} · {st.conversionRate}% Conv
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-elevated border border-border-subtle overflow-hidden">
              <div
                className="h-full bg-accent/80 rounded-full transition-all"
                style={{ width: `${Math.min(st.conversionRate, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
