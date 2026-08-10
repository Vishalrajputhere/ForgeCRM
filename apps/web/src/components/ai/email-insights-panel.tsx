'use client';

import * as React from 'react';
import { Lightbulb } from 'lucide-react';

export function EmailInsightsPanel() {
  return (
    <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-2.5">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-amber-400" />
        <h3 className="text-xs font-bold text-primary">Communication Intelligence</h3>
      </div>

      <div className="space-y-2 text-xs">
        <div className="p-2.5 rounded-lg bg-elevated border border-border-subtle">
          <p className="font-semibold text-primary">Engagement Score: 92/100</p>
          <p className="text-[11px] text-muted mt-0.5">Prospect opened emails within 15 minutes of delivery.</p>
        </div>
        <div className="p-2.5 rounded-lg bg-elevated border border-border-subtle">
          <p className="font-semibold text-primary">Optimal Send Time</p>
          <p className="text-[11px] text-muted mt-0.5">Tuesday & Thursday mornings between 9:00 AM – 11:00 AM EST.</p>
        </div>
      </div>
    </div>
  );
}
