'use client';

import * as React from 'react';
import { Target, Zap } from 'lucide-react';

export function StrategicOpportunitiesPanel() {
  const opps = [
    { title: 'Fintech Vertical Expansion', arr: '+$180K ARR', timeline: 'Q4 2026' },
    { title: 'Enterprise SSO & Audit Module', arr: '+$120K ARR', timeline: 'Q4 2026' },
    { title: 'AI Copilot Add-On Pricing Tier', arr: '+$95K ARR', timeline: 'Q1 2027' },
  ];

  return (
    <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-amber-400" />
          <h3 className="text-xs font-bold text-primary">Strategic Growth Opportunities</h3>
        </div>
        <span className="text-[10px] text-amber-400 font-bold">+$395K Potential ARR</span>
      </div>

      <div className="space-y-2 text-xs">
        {opps.map((o, i) => (
          <div key={i} className="p-2.5 rounded-lg bg-elevated border border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <div>
                <p className="font-semibold text-primary">{o.title}</p>
                <p className="text-[10px] text-muted">Target Launch: {o.timeline}</p>
              </div>
            </div>
            <span className="font-bold text-emerald-400 text-xs">{o.arr}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
