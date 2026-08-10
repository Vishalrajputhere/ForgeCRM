'use client';

import * as React from 'react';
import { Lightbulb } from 'lucide-react';

interface RecommendationCardProps {
  recommendation: string;
  index?: number;
  onAction?: (rec: string) => void;
}

export function RecommendationCard({ recommendation, index: _index, onAction }: RecommendationCardProps) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-accent/5 border border-accent/15 hover:border-accent/30 transition-all">
      <div className="h-6 w-6 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0 mt-0.5">
        <Lightbulb className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-secondary leading-relaxed">{recommendation}</p>
      </div>
      {onAction && (
        <button
          onClick={() => onAction(recommendation)}
          className="text-[10px] font-semibold text-accent hover:underline shrink-0"
        >
          Execute
        </button>
      )}
    </div>
  );
}
