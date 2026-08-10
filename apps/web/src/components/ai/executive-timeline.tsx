'use client';

import * as React from 'react';
import { Calendar, CheckCircle2 } from 'lucide-react';

export function ExecutiveTimeline() {
  const events = [
    { title: 'Q3 Board Deck Finalized', date: 'Aug 8, 2026', status: 'Completed' },
    { title: 'Q3 Revenue & Quota Audit', date: 'Aug 10, 2026', status: 'In Progress' },
    { title: 'Enterprise Customer Advisory Council', date: 'Aug 18, 2026', status: 'Upcoming' },
    { title: 'Q4 Budget & Capacity Planning', date: 'Sep 1, 2026', status: 'Upcoming' },
  ];

  return (
    <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-accent" />
        <h3 className="text-xs font-bold text-primary">Executive Leadership Timeline</h3>
      </div>

      <div className="space-y-2 text-xs">
        {events.map((e, i) => (
          <div key={i} className="p-2.5 rounded-lg bg-elevated border border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`h-3.5 w-3.5 ${e.status === 'Completed' ? 'text-emerald-400' : 'text-accent'} shrink-0`} />
              <div>
                <p className="font-semibold text-primary">{e.title}</p>
                <p className="text-[10px] text-muted">{e.date}</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-secondary">{e.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
