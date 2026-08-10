'use client';

import * as React from 'react';
import { ExternalLink, FileText, Database, User, Building2 } from 'lucide-react';

export interface Citation {
  citation_id: string;
  source: string;
  entity_type: string;
  entity_id?: string | null;
  entity_name?: string;
  excerpt: string;
  relevance_score: number;
  url?: string | null;
}

interface CitationCardProps {
  citation: Citation;
  index: number;
}

const entityIcons: Record<string, React.ReactNode> = {
  company: <Building2 className="h-3 w-3" />,
  contact: <User className="h-3 w-3" />,
  deal: <Database className="h-3 w-3" />,
  document: <FileText className="h-3 w-3" />,
  default: <FileText className="h-3 w-3" />,
};

const entityColors: Record<string, string> = {
  company: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  contact: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  deal: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  document: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  default: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
};

export function CitationCard({ citation, index }: CitationCardProps) {
  const icon = entityIcons[citation.entity_type] ?? entityIcons.default;
  const colorClass = entityColors[citation.entity_type] ?? entityColors.default;
  const relevancePct = Math.round(citation.relevance_score * 100);

  return (
    <div className="group rounded-lg border border-border-subtle bg-elevated hover:border-accent/30 hover:bg-surface-hover transition-all p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-semibold text-muted shrink-0">[{index}]</span>
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border shrink-0 ${colorClass}`}>
            {icon}
            {citation.entity_type}
          </span>
          {citation.entity_name && (
            <span className="text-xs font-medium text-primary truncate">{citation.entity_name}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Relevance bar */}
          <div className="flex items-center gap-1">
            <div className="w-12 h-1.5 rounded-full bg-border-subtle overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent/60 to-accent transition-all"
                style={{ width: `${relevancePct}%` }}
              />
            </div>
            <span className="text-[10px] text-muted tabular-nums">{relevancePct}%</span>
          </div>
          {citation.url && (
            <a href={citation.url} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-accent transition-colors">
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {/* Source label */}
      <p className="text-[10px] text-muted font-medium uppercase tracking-wide">{citation.source}</p>

      {/* Excerpt */}
      <p className="text-xs text-secondary leading-relaxed line-clamp-3">{citation.excerpt}</p>
    </div>
  );
}
