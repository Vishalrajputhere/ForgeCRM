'use client';

import * as React from 'react';
import { Layers } from 'lucide-react';

import { useFormatters } from '@/hooks/use-formatters';
import { CURRENCY_SYMBOLS } from '@/lib/formatters';

interface ForecastScenarioCardProps {
  bestCase?: string | undefined;
  expectedCase?: string | undefined;
  worstCase?: string | undefined;
}

export function ForecastScenarioCard({
  bestCase,
  expectedCase,
  worstCase,
}: ForecastScenarioCardProps) {
  const { currency } = useFormatters();
  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] ?? '$';

  return (
    <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-3">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-accent" />
        <h3 className="text-xs font-bold text-primary">What-If Scenario Projections</h3>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">Best Case</p>
          <p className="text-xs font-extrabold text-primary tabular-nums">{bestCase ?? `${symbol}1,520,000`}</p>
        </div>
        <div className="p-2.5 rounded-lg bg-accent/5 border border-accent/20">
          <p className="text-[10px] font-bold uppercase tracking-wider text-accent mb-1">Expected</p>
          <p className="text-xs font-extrabold text-primary tabular-nums">{expectedCase ?? `${symbol}1,250,000`}</p>
        </div>
        <div className="p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/20">
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-1">Worst Case</p>
          <p className="text-xs font-extrabold text-primary tabular-nums">{worstCase ?? `${symbol}980,000`}</p>
        </div>
      </div>
    </div>
  );
}
