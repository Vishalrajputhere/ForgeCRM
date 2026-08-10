'use client';

import * as React from 'react';
import { Compass, CheckSquare } from 'lucide-react';

export function ExecutiveRecommendationPanel() {
  const directives = [
    { text: 'Approve hiring 2 Senior Sales Engineers to unblock technical evaluation stage.', owner: 'VP Sales' },
    { text: 'Implement mandatory 3-year term requirement for discounts exceeding 15%.', owner: 'CFO' },
    { text: 'Schedule Q3 executive sponsor call with Apex Systems leadership.', owner: 'CEO' },
  ];

  return (
    <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-3">
      <div className="flex items-center gap-2">
        <Compass className="h-4 w-4 text-emerald-400" />
        <h3 className="text-xs font-bold text-primary">Strategic Directives & Actions</h3>
      </div>

      <div className="space-y-2 text-xs">
        {directives.map((d, i) => (
          <div key={i} className="p-2.5 rounded-lg bg-elevated border border-border-subtle space-y-1">
            <div className="flex items-start gap-2">
              <CheckSquare className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-primary">{d.text}</p>
                <p className="text-[10px] text-muted">Owner: <strong className="text-secondary">{d.owner}</strong></p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
