'use client';

import * as React from 'react';
import { Mail, ArrowRight } from 'lucide-react';

export interface FollowUpStep {
  stepNumber: number;
  channel: string;
  angle: string;
  timing: string;
}

interface FollowUpRecommendationsProps {
  steps?: FollowUpStep[] | undefined;
  onExecute?: ((step: FollowUpStep) => void) | undefined;
}

const DEFAULT_STEPS: FollowUpStep[] = [
  { stepNumber: 1, channel: 'Email', angle: 'ROI & Security compliance focus', timing: 'Within 2 hours' },
  { stepNumber: 2, channel: 'LinkedIn', angle: 'Connect with VP of Sales & share customer case study', timing: 'Day 3' },
  { stepNumber: 3, channel: 'Phone Call', angle: 'Executive demo invitation call', timing: 'Day 5' },
];

export function FollowUpRecommendations({ steps = DEFAULT_STEPS, onExecute }: FollowUpRecommendationsProps) {
  return (
    <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-3">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-accent" />
        <h3 className="text-xs font-bold text-primary">Outreach & Follow-up Plan</h3>
      </div>

      <div className="space-y-2">
        {steps.map((st) => (
          <div key={st.stepNumber} className="p-2.5 rounded-lg bg-elevated border border-border-subtle text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-primary">Touch {st.stepNumber} · {st.channel}</span>
              <span className="text-[10px] text-muted">{st.timing}</span>
            </div>
            <p className="text-[11px] text-secondary leading-relaxed">{st.angle}</p>
            {onExecute && (
              <button
                onClick={() => onExecute(st)}
                className="flex items-center gap-1 text-[10px] font-semibold text-accent hover:underline pt-1"
              >
                <span>Draft Touch {st.stepNumber}</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
