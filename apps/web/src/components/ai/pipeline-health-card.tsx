'use client';

import * as React from 'react';
import { Layers, Inbox } from 'lucide-react';

import { useFormatters } from '@/hooks/use-formatters';
import { CURRENCY_SYMBOLS } from '@/lib/formatters';

interface PipelineHealthStage {
  name: string;
  value: string;
  count: number;
  pct: number;
}

interface PipelineHealthCardProps {
  stages?: PipelineHealthStage[];
  coverageLabel?: string;
  isLoading?: boolean;
}

export function PipelineHealthCard({ stages, coverageLabel, isLoading }: PipelineHealthCardProps) {
  const { currency } = useFormatters();
  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] ?? '$';

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-3 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-accent/40" />
            <div className="h-3 w-36 rounded bg-elevated" />
          </div>
          <div className="h-3 w-20 rounded bg-elevated" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="h-2.5 w-28 rounded bg-elevated" />
                <div className="h-2.5 w-16 rounded bg-elevated" />
              </div>
              <div className="h-1.5 w-full rounded-full bg-elevated" />
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
          <Layers className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold text-primary">Pipeline Health & Coverage</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-4 gap-2 text-center">
          <Inbox className="h-6 w-6 text-muted/40" />
          <p className="text-[11px] text-muted">No pipeline stages yet.</p>
          <p className="text-[10px] text-muted/60">Add deals to your pipeline to see health metrics here.</p>
        </div>
      </div>
    );
  }

  // Normalise currency symbol in pre-formatted value strings
  const activeStages = stages.map((st) => ({
    ...st,
    value: st.value.startsWith('$') ? `${symbol}${st.value.slice(1)}` : st.value,
  }));

  return (
    <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold text-primary">Pipeline Health & Coverage</h3>
        </div>
        {coverageLabel && (
          <span className="text-[10px] text-accent font-bold">{coverageLabel}</span>
        )}
      </div>

      <div className="space-y-2 text-xs">
        {activeStages.map((st, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-primary">{st.name} ({st.count})</span>
              <span className="font-bold text-secondary">{st.value}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-elevated overflow-hidden">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${Math.min(st.pct, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
