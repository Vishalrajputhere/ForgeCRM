'use client';

/**
 * ForgeCRM — Analytics Drilldown Drawer
 *
 * Interactive slide-over drawer enabling instant exploration of underlying CRM records
 * when clicking on analytics KPI cards, pipeline stages, or leaderboard metrics.
 */

import React from 'react';
import Link from 'next/link';
import { ExternalLink, Layers, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useFormatters } from '@/hooks/use-formatters';

export interface DrilldownItem {
  id: string;
  title: string;
  subtitle?: string | null | undefined;
  value?: number | null | undefined;
  status?: string | null | undefined;
  badgeColor?: string | null | undefined;
  linkHref?: string | null | undefined;
}

export interface DrilldownDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string | null | undefined;
  items: DrilldownItem[];
  entityRoute?: string | null | undefined;
  viewAllLabel?: string | undefined;
}

export function DrilldownDrawer({
  isOpen,
  onClose,
  title,
  description,
  items,
  entityRoute,
  viewAllLabel = 'View All in CRM',
}: DrilldownDrawerProps) {
  const { formatCurrency } = useFormatters();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md border-l border-border bg-card shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/80 p-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                {description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Records List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Layers className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs font-medium text-muted-foreground">
                  No records match the selected analytics filter criteria.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center justify-between rounded-lg border border-border/60 bg-background/50 p-3 hover:border-primary/40 hover:bg-muted/40 transition-all"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </p>
                      {item.status && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            item.badgeColor || 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {item.status}
                        </span>
                      )}
                    </div>
                    {item.subtitle && (
                      <p className="truncate text-[11px] text-muted-foreground mt-0.5">
                        {item.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {item.value !== undefined && item.value !== null && (
                      <span className="text-xs font-bold text-foreground">
                        {formatCurrency(item.value)}
                      </span>
                    )}

                    {item.linkHref && (
                      <Link
                        href={item.linkHref}
                        onClick={onClose}
                        className="rounded p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        title="Open Record"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Action */}
          {entityRoute && (
            <div className="border-t border-border/80 p-4 bg-muted/20">
              <Link href={entityRoute} onClick={onClose} className="w-full">
                <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>{viewAllLabel}</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
