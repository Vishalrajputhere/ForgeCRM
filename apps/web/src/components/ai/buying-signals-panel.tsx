'use client';

import * as React from 'react';
import { Zap, Activity } from 'lucide-react';

export interface BuyingSignal {
  strength: 'Strong' | 'Moderate' | 'Weak';
  signal: string;
  timestamp: string;
}

interface BuyingSignalsPanelProps {
  signals?: BuyingSignal[] | undefined;
}

const DEFAULT_SIGNALS: BuyingSignal[] = [
  { strength: 'Strong', signal: 'Visited Enterprise Pricing page 4x in past 48h', timestamp: '2h ago' },
  { strength: 'Strong', signal: 'Downloaded Sales AI Security Compliance whitepaper', timestamp: '5h ago' },
  { strength: 'Moderate', signal: 'Opened product demo email link', timestamp: 'Yesterday' },
];

export function BuyingSignalsPanel({ signals = DEFAULT_SIGNALS }: BuyingSignalsPanelProps) {
  return (
    <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-amber-400" />
        <h3 className="text-xs font-bold text-primary">Buying Signals Radar</h3>
      </div>

      <div className="space-y-2">
        {signals.map((sig, i) => (
          <div key={i} className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-elevated border border-border-subtle text-xs">
            <div className="flex items-start gap-2 min-w-0">
              <Activity className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
              <span className="text-secondary leading-snug">{sig.signal}</span>
            </div>
            <span className={`text-[10px] font-bold shrink-0 px-1.5 py-0.5 rounded border uppercase ${sig.strength === 'Strong' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
              {sig.strength}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
