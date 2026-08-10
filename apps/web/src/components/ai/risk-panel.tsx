'use client';

import * as React from 'react';
import { AlertOctagon, ArrowUpRight } from 'lucide-react';

export interface DealRisk {
  id: string;
  category: 'Stakeholder' | 'Competitive' | 'Timeline' | 'Budget' | 'Technical' | 'Hygiene';
  severity: 'high' | 'medium' | 'low';
  title: string;
  mitigation: string;
  impactScore?: number | undefined;
}

interface RiskPanelProps {
  risks?: DealRisk[] | undefined;
  overallRiskLevel?: 'Low' | 'Medium' | 'High' | 'Critical' | undefined;
  onMitigate?: ((risk: DealRisk) => void) | undefined;
}

const DEFAULT_RISKS: DealRisk[] = [
  {
    id: 'r1',
    category: 'Stakeholder',
    severity: 'high',
    title: 'Missing Economic Buyer Engagement',
    mitigation: 'Schedule executive alignment meeting with VP of Procurement within 3 business days.',
    impactScore: 85,
  },
  {
    id: 'r2',
    category: 'Timeline',
    severity: 'high',
    title: 'Stalled in Proposal Stage (>14 Days)',
    mitigation: 'Send revised ROI breakdown and offer 15-minute clarification call.',
    impactScore: 78,
  },
  {
    id: 'r3',
    category: 'Competitive',
    severity: 'medium',
    title: 'Competitor Mentioned in Meeting Notes',
    mitigation: 'Prepare competitive displacement matrix comparing security compliance.',
    impactScore: 60,
  },
];

export function RiskPanel({ risks = DEFAULT_RISKS, overallRiskLevel = 'High', onMitigate }: RiskPanelProps) {
  const riskBadgeColor =
    overallRiskLevel === 'Critical' || overallRiskLevel === 'High'
      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      : overallRiskLevel === 'Medium'
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

  return (
    <div className="space-y-3 p-4 rounded-xl bg-surface border border-border-subtle">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertOctagon className="h-4 w-4 text-rose-400" />
          <h3 className="text-xs font-bold text-primary">Deal Risk Radar</h3>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${riskBadgeColor}`}>
          {overallRiskLevel} Risk
        </span>
      </div>

      <div className="space-y-2.5">
        {risks.map((risk) => {
          const sevColor =
            risk.severity === 'high'
              ? 'border-rose-500/30 bg-rose-500/5 text-rose-400'
              : risk.severity === 'medium'
              ? 'border-amber-500/30 bg-amber-500/5 text-amber-400'
              : 'border-border-subtle bg-elevated text-secondary';

          return (
            <div key={risk.id} className={`p-3 rounded-lg border space-y-1.5 transition-all ${sevColor}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{risk.category} Risk</span>
                {risk.impactScore && <span className="text-[10px] font-semibold tabular-nums">Impact {risk.impactScore}/100</span>}
              </div>
              <p className="text-xs font-semibold text-primary">{risk.title}</p>
              <p className="text-[11px] text-muted leading-relaxed">{risk.mitigation}</p>
              {onMitigate && (
                <button
                  onClick={() => onMitigate(risk)}
                  className="flex items-center gap-1 text-[10px] font-semibold text-accent hover:underline pt-1"
                >
                  <span>Apply Mitigation</span>
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
