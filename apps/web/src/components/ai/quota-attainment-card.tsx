'use client';

import * as React from 'react';
import { Target } from 'lucide-react';

interface QuotaAttainmentCardProps {
  closedWon?: string | undefined;
  commitForecast?: string | undefined;
  quotaGap?: string | undefined;
  coverageRatio?: string | undefined;
}

export function QuotaAttainmentCard({
  closedWon = '$650,000',
  commitForecast = '$600,000',
  quotaGap = '$0 (Met)',
  coverageRatio = '3.4x',
}: QuotaAttainmentCardProps) {
  return (
    <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-3">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-emerald-400" />
        <h3 className="text-xs font-bold text-primary">Quota Attainment & Coverage</h3>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-lg bg-elevated border border-border-subtle">
          <p className="text-[10px] text-muted mb-0.5">Closed Won</p>
          <p className="font-bold text-primary tabular-nums">{closedWon}</p>
        </div>
        <div className="p-2.5 rounded-lg bg-elevated border border-border-subtle">
          <p className="text-[10px] text-muted mb-0.5">Commit Forecast</p>
          <p className="font-bold text-primary tabular-nums">{commitForecast}</p>
        </div>
        <div className="p-2.5 rounded-lg bg-elevated border border-border-subtle">
          <p className="text-[10px] text-muted mb-0.5">Quota Gap</p>
          <p className="font-bold text-emerald-400 tabular-nums">{quotaGap}</p>
        </div>
        <div className="p-2.5 rounded-lg bg-elevated border border-border-subtle">
          <p className="text-[10px] text-muted mb-0.5">Pipeline Coverage</p>
          <p className="font-bold text-accent tabular-nums">{coverageRatio}</p>
        </div>
      </div>
    </div>
  );
}
