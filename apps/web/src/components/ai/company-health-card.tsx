'use client';

import * as React from 'react';
import { Activity } from 'lucide-react';

interface CompanyHealthCardProps {
  score?: number | undefined;
  status?: string | undefined;
}

export function CompanyHealthCard({ score = 88, status = 'Strong Growth' }: CompanyHealthCardProps) {
  return (
    <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-primary">Commercial Health Index</h3>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {status}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <span className="text-3xl font-black text-primary tracking-tight">{score}</span>
          <span className="text-xs text-muted"> / 100</span>
        </div>
        <div className="text-right text-[11px] space-y-0.5">
          <p className="text-muted">NRR: <strong className="text-emerald-400 font-bold">124%</strong></p>
          <p className="text-muted">CAC Payback: <strong className="text-primary font-bold">11 mos</strong></p>
          <p className="text-muted">LTV:CAC: <strong className="text-primary font-bold">4.2x</strong></p>
        </div>
      </div>
    </div>
  );
}
