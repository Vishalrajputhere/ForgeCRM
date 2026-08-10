'use client';

import * as React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

export type ConfidenceLabel = 'HIGH' | 'MEDIUM' | 'LOW';

interface ConfidenceBadgeProps {
  score: number;              // 0–1
  label: ConfidenceLabel;
  explanation?: string;
  showScore?: boolean;
}

const config: Record<ConfidenceLabel, { icon: React.ReactNode; bg: string; text: string; border: string; glow: string }> = {
  HIGH: {
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/25',
    glow: 'shadow-emerald-500/10',
  },
  MEDIUM: {
    icon: <ShieldAlert className="h-3.5 w-3.5" />,
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/25',
    glow: 'shadow-amber-500/10',
  },
  LOW: {
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/25',
    glow: 'shadow-red-500/10',
  },
};

export function ConfidenceBadge({ score, label, explanation, showScore = true }: ConfidenceBadgeProps) {
  const [showTip, setShowTip] = React.useState(false);
  const c = config[label];
  const pct = Math.round(score * 100);

  return (
    <div className="relative inline-flex">
      <button
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold shadow-sm transition-all ${c.bg} ${c.text} ${c.border} ${c.glow} hover:shadow-md`}
      >
        {c.icon}
        <span>{label}</span>
        {showScore && <span className="opacity-70 text-[10px] tabular-nums">· {pct}%</span>}
      </button>

      {/* Tooltip */}
      {showTip && explanation && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 bg-popover border border-border-default rounded-lg shadow-xl p-2.5 pointer-events-none">
          <p className="text-[11px] text-secondary leading-relaxed">{explanation}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-border-default" />
        </div>
      )}
    </div>
  );
}
