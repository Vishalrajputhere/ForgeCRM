'use client';

import * as React from 'react';
import { ChevronDown, ChevronRight, Brain, CheckCircle, AlertCircle } from 'lucide-react';

export interface ReasoningStep {
  step_number: number;
  title: string;
  description: string;
  evidence: string[];
  confidence: number;
}

export interface ReasoningChain {
  goal: string;
  steps: ReasoningStep[];
  conclusion: string;
  overall_confidence: number;
}

interface ReasoningPanelProps {
  chain: ReasoningChain;
}

function ConfidenceIcon({ confidence }: { confidence: number }) {
  if (confidence >= 0.8) return <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
  if (confidence >= 0.55) return <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
  return <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />;
}

function StepRow({ step }: { step: ReasoningStep }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="border border-border-subtle rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 p-2.5 hover:bg-surface-hover transition-colors text-left"
      >
        <div className="h-5 w-5 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-[10px] font-bold shrink-0">
          {step.step_number}
        </div>
        <span className="text-xs font-medium text-primary flex-1">{step.title}</span>
        <ConfidenceIcon confidence={step.confidence} />
        <span className="text-[10px] text-muted tabular-nums">{Math.round(step.confidence * 100)}%</span>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-border-subtle bg-elevated/50">
          <p className="text-xs text-secondary leading-relaxed pt-2">{step.description}</p>
          {step.evidence.length > 0 && (
            <div className="space-y-1">
              {step.evidence.filter(Boolean).map((ev, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="text-accent mt-0.5 shrink-0">•</span>
                  <span className="text-[11px] text-muted">{ev}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ReasoningPanel({ chain }: ReasoningPanelProps) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="rounded-xl border border-border-subtle bg-surface overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2.5 p-3 hover:bg-surface-hover transition-colors"
      >
        <div className="h-7 w-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
          <Brain className="h-4 w-4" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-xs font-semibold text-primary">AI Reasoning Chain</p>
          <p className="text-[10px] text-muted">{chain.steps.length} steps · {Math.round(chain.overall_confidence * 100)}% overall confidence</p>
        </div>
        {collapsed ? (
          <ChevronRight className="h-4 w-4 text-muted shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted shrink-0" />
        )}
      </button>

      {!collapsed && (
        <div className="px-3 pb-3 space-y-2 border-t border-border-subtle">
          {/* Steps */}
          <div className="pt-2 space-y-1.5">
            {chain.steps.map((step) => (
              <StepRow key={step.step_number} step={step} />
            ))}
          </div>

          {/* Conclusion */}
          <div className="rounded-lg bg-accent/5 border border-accent/15 p-2.5">
            <p className="text-[10px] font-semibold text-accent uppercase tracking-wide mb-1">Conclusion</p>
            <p className="text-xs text-secondary leading-relaxed">{chain.conclusion}</p>
          </div>
        </div>
      )}
    </div>
  );
}
