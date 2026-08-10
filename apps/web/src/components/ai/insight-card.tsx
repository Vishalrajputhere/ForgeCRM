'use client';

import * as React from 'react';
import { AlertTriangle, TrendingUp, Lightbulb, Bell, BarChart2, Info, X, Check } from 'lucide-react';

export type InsightType = 'risk' | 'opportunity' | 'recommendation' | 'alert' | 'trend' | 'info';

export interface Insight {
  insight_type: InsightType;
  title: string;
  body: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  tags?: string[];
}

interface InsightCardProps {
  insight: Insight;
  onDismiss?: () => void;
  onAccept?: () => void;
}

const typeConfig: Record<InsightType, { icon: React.ReactNode; bg: string; text: string; border: string; label: string }> = {
  risk: {
    icon: <AlertTriangle className="h-4 w-4" />,
    bg: 'bg-red-500/8',
    text: 'text-red-400',
    border: 'border-red-500/20',
    label: 'Risk',
  },
  opportunity: {
    icon: <TrendingUp className="h-4 w-4" />,
    bg: 'bg-emerald-500/8',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    label: 'Opportunity',
  },
  recommendation: {
    icon: <Lightbulb className="h-4 w-4" />,
    bg: 'bg-blue-500/8',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
    label: 'Recommendation',
  },
  alert: {
    icon: <Bell className="h-4 w-4" />,
    bg: 'bg-amber-500/8',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    label: 'Alert',
  },
  trend: {
    icon: <BarChart2 className="h-4 w-4" />,
    bg: 'bg-purple-500/8',
    text: 'text-purple-400',
    border: 'border-purple-500/20',
    label: 'Trend',
  },
  info: {
    icon: <Info className="h-4 w-4" />,
    bg: 'bg-neutral-500/8',
    text: 'text-neutral-400',
    border: 'border-neutral-500/20',
    label: 'Info',
  },
};

const priorityDot: Record<string, string> = {
  high: 'bg-red-400',
  medium: 'bg-amber-400',
  low: 'bg-emerald-400',
};

export function InsightCard({ insight, onDismiss, onAccept }: InsightCardProps) {
  const c = typeConfig[insight.insight_type];
  const confPct = Math.round(insight.confidence * 100);

  return (
    <div className={`rounded-xl border p-3.5 transition-all hover:shadow-md ${c.bg} ${c.border}`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`${c.text}`}>{c.icon}</div>
          <span className={`text-xs font-semibold ${c.text}`}>{c.label}</span>
          <div className={`h-1.5 w-1.5 rounded-full ${priorityDot[insight.priority] ?? 'bg-neutral-400'}`} title={`${insight.priority} priority`} />
        </div>
        <span className="text-[10px] text-muted tabular-nums">{confPct}% confidence</span>
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-primary mb-1.5">{insight.title}</h4>

      {/* Body */}
      <p className="text-xs text-secondary leading-relaxed mb-3">{insight.body}</p>

      {/* Tags */}
      {insight.tags && insight.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {insight.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-border-subtle text-muted font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      {(onAccept || onDismiss) && (
        <div className="flex gap-2">
          {onAccept && (
            <button
              onClick={onAccept}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent text-xs font-medium border border-accent/20 transition-all"
            >
              <Check className="h-3 w-3" /> Accept
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg bg-surface-hover hover:bg-elevated text-muted text-xs font-medium border border-border-subtle transition-all"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
