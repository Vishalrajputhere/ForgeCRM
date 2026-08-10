'use client';

import * as React from 'react';
import { Target } from 'lucide-react';

interface LeadScoreCardProps {
  fitScore?: number | undefined;
  intentScore?: number | undefined;
  compositeScore?: number | undefined;
  priority?: 'Hot' | 'Warm' | 'Cold' | undefined;
}

export function LeadScoreCard({
  fitScore = 85,
  intentScore = 78,
  compositeScore = 82,
  priority = 'Hot',
}: LeadScoreCardProps) {
  const priorityColor =
    priority === 'Hot'
      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      : priority === 'Warm'
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

  return (
    <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold text-primary">Lead Score Radar</h3>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${priorityColor}`}>
          {priority} Lead
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center pt-1">
        <div className="p-2.5 rounded-lg bg-elevated border border-border-subtle">
          <p className="text-[10px] text-muted font-medium mb-1">Composite</p>
          <p className="text-base font-extrabold text-accent tabular-nums">{compositeScore}</p>
        </div>
        <div className="p-2.5 rounded-lg bg-elevated border border-border-subtle">
          <p className="text-[10px] text-muted font-medium mb-1">Fit Score</p>
          <p className="text-base font-extrabold text-emerald-400 tabular-nums">{fitScore}</p>
        </div>
        <div className="p-2.5 rounded-lg bg-elevated border border-border-subtle">
          <p className="text-[10px] text-muted font-medium mb-1">Intent Score</p>
          <p className="text-base font-extrabold text-amber-400 tabular-nums">{intentScore}</p>
        </div>
      </div>
    </div>
  );
}
