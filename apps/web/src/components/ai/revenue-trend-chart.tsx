'use client';

import * as React from 'react';
import { BarChart3 } from 'lucide-react';

import { useFormatters } from '@/hooks/use-formatters';
import { CURRENCY_SYMBOLS } from '@/lib/formatters';

export function RevenueTrendChart() {
  const { currency } = useFormatters();
  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] ?? '$';

  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  const values = [320, 350, 410, 460, 520, 580]; // ARR in thousands

  return (
    <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-primary">ARR Revenue Trajectory ({symbol}K)</h3>
        </div>
        <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
          +81.2% YoY
        </span>
      </div>

      <div className="h-28 flex items-end justify-between gap-2 pt-2 border-b border-border-subtle pb-2">
        {values.map((v, i) => {
          const heightPct = Math.round((v / 600) * 100);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <span className="text-[9px] font-bold text-muted group-hover:text-primary transition-colors">{symbol}{v}K</span>
              <div
                className="w-full rounded-t-sm bg-gradient-to-t from-emerald-500/20 to-emerald-500/80 group-hover:to-emerald-400 transition-all"
                style={{ height: `${heightPct}%` }}
              />
              <span className="text-[10px] text-muted">{months[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
