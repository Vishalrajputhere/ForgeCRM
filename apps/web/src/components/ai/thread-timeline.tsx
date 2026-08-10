'use client';

import * as React from 'react';
import { MessageSquare, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export interface EmailThreadItem {
  sender: string;
  type: 'inbound' | 'outbound';
  snippet: string;
  timestamp: string;
}

interface ThreadTimelineProps {
  items?: EmailThreadItem[] | undefined;
}

const DEFAULT_THREAD: EmailThreadItem[] = [
  { sender: 'Sarah Jenkins (VP Sales)', type: 'inbound', snippet: 'Can you share your SOC2 report and schedule a demo?', timestamp: 'Yesterday 3:45 PM' },
  { sender: 'You (Account Rep)', type: 'outbound', snippet: 'Hi Sarah, absolutely! Attached is our security overview...', timestamp: 'Yesterday 5:12 PM' },
  { sender: 'Sarah Jenkins (VP Sales)', type: 'inbound', snippet: 'Thanks! Does Tuesday at 2 PM EST work for the demo call?', timestamp: 'Today 9:15 AM' },
];

export function ThreadTimeline({ items = DEFAULT_THREAD }: ThreadTimelineProps) {
  return (
    <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-accent" />
        <h3 className="text-xs font-bold text-primary">Email Thread Activity</h3>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="p-2.5 rounded-lg bg-elevated border border-border-subtle text-xs space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-primary">
                {item.type === 'inbound' ? (
                  <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <ArrowUpRight className="h-3.5 w-3.5 text-accent shrink-0" />
                )}
                <span>{item.sender}</span>
              </div>
              <span className="text-[10px] text-muted">{item.timestamp}</span>
            </div>
            <p className="text-[11px] text-muted leading-relaxed pl-5">{item.snippet}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
