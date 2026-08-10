'use client';

import * as React from 'react';
import { Eye, Clock } from 'lucide-react';

interface EmailPreviewCardProps {
  recipient?: string | undefined;
  readingTime?: string | undefined;
  sentiment?: string | undefined;
}

export function EmailPreviewCard({
  recipient = 'sarah.jenkins@nexacorp.com',
  readingTime = '45 sec read',
  sentiment = 'Positive / High Urgency',
}: EmailPreviewCardProps) {
  return (
    <div className="p-3.5 rounded-xl bg-surface border border-border-subtle space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-accent" />
          <span className="font-bold text-primary">Email Delivery Preview</span>
        </div>
        <span className="text-[10px] text-muted flex items-center gap-1">
          <Clock className="h-3 w-3" /> {readingTime}
        </span>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border-subtle/50 text-[11px]">
        <span className="text-muted">To: <strong className="text-primary">{recipient}</strong></span>
        <span className="text-emerald-400 font-semibold">{sentiment}</span>
      </div>
    </div>
  );
}
