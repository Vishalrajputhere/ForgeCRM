'use client';

import * as React from 'react';
import { CheckCircle2, AlertTriangle, Clock, ShieldAlert } from 'lucide-react';

export interface DealStage {
  name: string;
  daysInStage: number;
  status: 'completed' | 'current' | 'upcoming' | 'stalled';
  healthScore: number;
  completedAt?: string | undefined;
}

interface DealHealthTimelineProps {
  dealName: string;
  healthScore: number;
  stages?: DealStage[] | undefined;
}

const DEFAULT_STAGES: DealStage[] = [
  { name: 'Qualification', daysInStage: 4, status: 'completed', healthScore: 90, completedAt: '12 days ago' },
  { name: 'Discovery', daysInStage: 7, status: 'completed', healthScore: 85, completedAt: '5 days ago' },
  { name: 'Proposal / Demo', daysInStage: 16, status: 'stalled', healthScore: 45 },
  { name: 'Negotiation', daysInStage: 0, status: 'upcoming', healthScore: 0 },
  { name: 'Closed Won', daysInStage: 0, status: 'upcoming', healthScore: 0 },
];

export function DealHealthTimeline({ dealName, healthScore, stages = DEFAULT_STAGES }: DealHealthTimelineProps) {
  const healthColor =
    healthScore >= 75
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      : healthScore >= 50
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      : 'text-rose-400 bg-rose-500/10 border-rose-500/20';

  return (
    <div className="space-y-4 p-4 rounded-xl bg-surface border border-border-subtle">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-primary truncate max-w-[200px]">{dealName}</h3>
          <p className="text-[10px] text-muted">Stage Health & Activity Timeline</p>
        </div>
        <div className={`px-2.5 py-1 rounded-full border text-xs font-bold ${healthColor}`}>
          Health: {healthScore}/100
        </div>
      </div>

      <div className="relative pl-4 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border-subtle">
        {stages.map((stage, i) => (
          <div key={i} className="relative flex items-start gap-3 text-xs">
            <div className="absolute -left-4 top-0.5 transform -translate-x-1/2">
              {stage.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-emerald-400 bg-surface rounded-full" />}
              {stage.status === 'stalled' && <ShieldAlert className="h-4 w-4 text-rose-400 bg-surface rounded-full animate-pulse" />}
              {stage.status === 'current' && <Clock className="h-4 w-4 text-accent bg-surface rounded-full" />}
              {stage.status === 'upcoming' && <div className="h-2.5 w-2.5 rounded-full bg-border-subtle bg-surface border-2 border-muted" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${stage.status === 'stalled' ? 'text-rose-400' : stage.status === 'completed' ? 'text-primary' : 'text-muted'}`}>
                  {stage.name}
                </span>
                <span className="text-[10px] text-muted">
                  {stage.status === 'completed' ? stage.completedAt : `${stage.daysInStage} days`}
                </span>
              </div>
              {stage.status === 'stalled' && (
                <p className="text-[10px] text-rose-400 flex items-center gap-1 mt-0.5">
                  <AlertTriangle className="h-3 w-3 shrink-0" /> Stalled for {stage.daysInStage} days (&gt;14d benchmark)
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
