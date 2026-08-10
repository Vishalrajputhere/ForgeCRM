'use client';

import * as React from 'react';
import { ShieldCheck, Check, X } from 'lucide-react';

export interface ICPDimension {
  name: string;
  matched: boolean;
  value: string;
}

interface ICPMatchCardProps {
  matchScore?: number | undefined;
  isMatch?: boolean | undefined;
  dimensions?: ICPDimension[] | undefined;
}

const DEFAULT_DIMENSIONS: ICPDimension[] = [
  { name: 'Company Size', matched: true, value: '250-500 employees' },
  { name: 'Industry', matched: true, value: 'Enterprise SaaS' },
  { name: 'Job Seniority', matched: true, value: 'VP of Sales' },
  { name: 'Geography', matched: true, value: 'North America' },
  { name: 'Tech Stack', matched: false, value: 'Legacy CRM' },
];

export function ICPMatchCard({ matchScore = 88, isMatch = true, dimensions = DEFAULT_DIMENSIONS }: ICPMatchCardProps) {
  return (
    <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-primary">ICP Alignment</h3>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isMatch ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
          {matchScore}% Match
        </span>
      </div>

      <div className="space-y-1.5">
        {dimensions.map((dim, i) => (
          <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border-subtle/50 last:border-0">
            <div className="flex items-center gap-1.5 min-w-0">
              {dim.matched ? (
                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              ) : (
                <X className="h-3.5 w-3.5 text-rose-400 shrink-0" />
              )}
              <span className="text-secondary font-medium truncate">{dim.name}</span>
            </div>
            <span className="text-[11px] text-muted truncate max-w-[120px]">{dim.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
