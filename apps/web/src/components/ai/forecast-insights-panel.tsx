'use client';

import * as React from 'react';
import { Lightbulb } from 'lucide-react';

export interface ForecastDriver {
  type: 'tailwind' | 'headwind' | 'neutral';
  title: string;
  impact: string;
}

interface ForecastInsightsPanelProps {
  drivers?: ForecastDriver[] | undefined;
}

import { useFormatters } from '@/hooks/use-formatters';
import { CURRENCY_SYMBOLS } from '@/lib/formatters';

export interface ForecastDriver {
  type: 'tailwind' | 'headwind' | 'neutral';
  title: string;
  impact: string;
}

interface ForecastInsightsPanelProps {
  drivers?: ForecastDriver[] | undefined;
}

export function ForecastInsightsPanel({ drivers }: ForecastInsightsPanelProps) {
  const { currency } = useFormatters();
  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] ?? '$';

  const defaultDrivers: ForecastDriver[] = [
    { type: 'tailwind', title: 'Strong Enterprise Upsell Velocity', impact: `+${symbol}140K ARR` },
    { type: 'tailwind', title: 'SaaS Renewal Win Rate at 92%', impact: `+${symbol}90K ARR` },
    { type: 'headwind', title: '2 At-Risk Accounts in Mid-Market', impact: `-${symbol}45K Risk` },
  ];

  const activeDrivers = (drivers ?? defaultDrivers).map((d) => ({
    ...d,
    impact: d.impact.replace('$', symbol),
  }));

  return (
    <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-amber-400" />
        <h3 className="text-xs font-bold text-primary">Revenue Tailwinds & Headwinds</h3>
      </div>

      <div className="space-y-2">
        {activeDrivers.map((d, i) => (
          <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-elevated border border-border-subtle text-xs">
            <span className="text-secondary font-medium truncate max-w-[180px]">{d.title}</span>
            <span className={`text-[11px] font-bold tabular-nums shrink-0 px-1.5 py-0.5 rounded border ${d.type === 'tailwind' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
              {d.impact}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
