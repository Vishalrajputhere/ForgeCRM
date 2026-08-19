'use client';

import * as React from 'react';
import { Calendar } from 'lucide-react';

export interface MonthlyProjection {
  month: string;
  projected: string;
  status: 'actual' | 'forecast' | 'projected';
}

interface ForecastTimelineProps {
  projections?: MonthlyProjection[] | undefined;
}

import { useFormatters } from '@/hooks/use-formatters';
import { CURRENCY_SYMBOLS } from '@/lib/formatters';

export interface MonthlyProjection {
  month: string;
  projected: string;
  status: 'actual' | 'forecast' | 'projected';
}

interface ForecastTimelineProps {
  projections?: MonthlyProjection[] | undefined;
}

export function ForecastTimeline({ projections }: ForecastTimelineProps) {
  const { currency } = useFormatters();
  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] ?? '$';

  const defaultProjections: MonthlyProjection[] = [
    { month: 'July 2026', projected: `${symbol}380,000`, status: 'actual' },
    { month: 'August 2026', projected: `${symbol}410,000`, status: 'forecast' },
    { month: 'September 2026', projected: `${symbol}460,000`, status: 'projected' },
  ];

  const activeProjections = (projections ?? defaultProjections).map((p) => ({
    ...p,
    projected: p.projected.startsWith('$') ? `${symbol}${p.projected.slice(1)}` : p.projected,
  }));

  return (
    <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-accent" />
        <h3 className="text-xs font-bold text-primary">Monthly Revenue Trajectory</h3>
      </div>

      <div className="space-y-2">
        {activeProjections.map((p, i) => (
          <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-elevated border border-border-subtle text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary">{p.month}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${p.status === 'actual' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-accent/10 text-accent'}`}>
                {p.status}
              </span>
            </div>
            <span className="font-extrabold text-primary tabular-nums">{p.projected}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
