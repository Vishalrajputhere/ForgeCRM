'use client';

import * as React from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';

interface RevenueForecastCardProps {
  period?: string | undefined;
  predictedRevenue?: string | undefined;
  quotaTarget?: string | undefined;
  attainmentPercent?: number | undefined;
}

export function RevenueForecastCard({
  period = 'Q3 2026',
  predictedRevenue = '$1,250,000',
  quotaTarget = '$1,000,000',
  attainmentPercent = 125,
}: RevenueForecastCardProps) {
  return (
    <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-primary">Revenue Prediction ({period})</h3>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" /> {attainmentPercent}% Quota
        </span>
      </div>

      <div className="space-y-1 pt-1">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-extrabold text-primary tabular-nums">{predictedRevenue}</span>
          <span className="text-xs text-muted">Target: {quotaTarget}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-elevated overflow-hidden border border-border-subtle">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-accent rounded-full transition-all duration-500"
            style={{ width: `${Math.min(attainmentPercent, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
