'use client';

import * as React from 'react';
import { ShieldCheck } from 'lucide-react';

interface ForecastConfidencePanelProps {
  confidencePercent?: number | undefined;
  confidenceInterval?: string | undefined;
  dataQualityRating?: string | undefined;
}

export function ForecastConfidencePanel({
  confidencePercent = 88,
  confidenceInterval = '[$1,180,000 – $1,320,000]',
  dataQualityRating = 'A+ High Confidence',
}: ForecastConfidencePanelProps) {
  return (
    <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-primary">Forecast Model Confidence</h3>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {confidencePercent}% Model Certainty
        </span>
      </div>

      <div className="p-2.5 rounded-lg bg-elevated border border-border-subtle text-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-muted text-[10px]">95% Confidence Band</span>
          <span className="font-bold text-primary tabular-nums">{confidenceInterval}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted text-[10px]">CRM Data Quality Rating</span>
          <span className="font-bold text-emerald-400">{dataQualityRating}</span>
        </div>
      </div>
    </div>
  );
}
