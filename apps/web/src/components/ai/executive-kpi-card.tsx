'use client';

import * as React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ExecutiveKPICardProps {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  target?: string | undefined;
  icon?: React.ReactNode | undefined;
}

export function ExecutiveKPICard({
  label,
  value,
  change,
  trend,
  target,
  icon,
}: ExecutiveKPICardProps) {
  const isUp = trend === 'up';

  return (
    <div className="p-4 rounded-xl bg-surface border border-border-subtle hover:border-accent/30 transition-all space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-muted uppercase tracking-wider">{label}</span>
        {icon && <div className="p-1.5 rounded-lg bg-accent/10 text-accent">{icon}</div>}
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-black text-primary tracking-tight">{value}</span>
        <div className={`flex items-center gap-1 text-xs font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          <span>{change}</span>
        </div>
      </div>

      {target && (
        <p className="text-[10px] text-muted">Target: <strong className="text-primary font-semibold">{target}</strong></p>
      )}
    </div>
  );
}
