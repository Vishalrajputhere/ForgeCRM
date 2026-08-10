'use client';

import * as React from 'react';
import { Zap, ArrowRight } from 'lucide-react';

interface ActionCardProps {
  action: string;
  onExecute?: (action: string) => void;
}

export function ActionCard({ action, onExecute }: ActionCardProps) {
  return (
    <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-elevated border border-border-subtle hover:border-accent/30 transition-all">
      <div className="flex items-center gap-2 min-w-0">
        <Zap className="h-3.5 w-3.5 text-accent shrink-0" />
        <span className="text-xs text-primary truncate">{action}</span>
      </div>
      {onExecute && (
        <button
          onClick={() => onExecute(action)}
          className="flex items-center gap-1 px-2 py-1 rounded bg-accent/10 hover:bg-accent/20 text-accent text-[10px] font-semibold transition-colors shrink-0"
        >
          <span>Run</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
