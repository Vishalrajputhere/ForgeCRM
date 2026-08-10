'use client';

import * as React from 'react';
import { ShieldAlert, Zap, TrendingUp, Users, Target } from 'lucide-react';

export type InsightCategory = 'revenue' | 'risk' | 'opportunity' | 'team' | 'market';
export type InsightPriority = 'critical' | 'high' | 'medium' | 'low';

interface ExecutiveInsightCardProps {
  title: string;
  description: string;
  category?: InsightCategory | undefined;
  priority?: InsightPriority | undefined;
  confidence?: number | undefined;
}

export function ExecutiveInsightCard({
  title,
  description,
  category = 'opportunity',
  priority = 'high',
  confidence = 0.92,
}: ExecutiveInsightCardProps) {
  const categoryIcon = {
    revenue: <TrendingUp className="h-4 w-4 text-emerald-400" />,
    risk: <ShieldAlert className="h-4 w-4 text-rose-400" />,
    opportunity: <Zap className="h-4 w-4 text-amber-400" />,
    team: <Users className="h-4 w-4 text-indigo-400" />,
    market: <Target className="h-4 w-4 text-accent" />,
  }[category];

  const priorityBadge = {
    critical: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    high: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    medium: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    low: 'bg-muted/10 text-muted border-muted/30',
  }[priority];

  return (
    <div className="p-3.5 rounded-xl bg-surface border border-border-subtle hover:border-accent/30 transition-all space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {categoryIcon}
          <span className="font-bold text-primary">{title}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${priorityBadge}`}>
          {priority}
        </span>
      </div>

      <p className="text-secondary leading-relaxed text-[11px]">{description}</p>

      <div className="flex items-center justify-between text-[10px] text-muted pt-1 border-t border-border-subtle/40">
        <span>Category: <strong className="text-primary font-semibold uppercase">{category}</strong></span>
        <span>Confidence: <strong className="text-emerald-400 font-semibold">{Math.round(confidence * 100)}%</strong></span>
      </div>
    </div>
  );
}
