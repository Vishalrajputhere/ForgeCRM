'use client';

import * as React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle, Inbox } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Heading, Text, Caption } from '@/components/ui/typography';

// ── Spinner ──────────────────────────────────────────────────────────────────

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className ?? 'h-4 w-4')}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('skeleton rounded-md bg-subtle animate-pulse', className)} aria-hidden="true" />
  );
}

// ── Callout / Alert ──────────────────────────────────────────────────────────

export type CalloutVariant = 'info' | 'success' | 'warning' | 'danger';

export interface CalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CalloutVariant;
  title?: string;
}

const calloutVariantMap: Record<CalloutVariant, { bg: string; icon: React.ReactNode }> = {
  info:    { bg: 'bg-subtle text-primary border-border-default', icon: <Info className="h-4 w-4 text-accent" /> },
  success: { bg: 'bg-status-success-bg text-status-success-fg border-status-success/30', icon: <CheckCircle2 className="h-4 w-4" /> },
  warning: { bg: 'bg-status-warning-bg text-status-warning-fg border-status-warning/30', icon: <AlertTriangle className="h-4 w-4" /> },
  danger:  { bg: 'bg-status-danger-bg text-status-danger-fg border-status-danger/30', icon: <XCircle className="h-4 w-4" /> },
};

export function Callout({ variant = 'info', title, className, children, ...props }: CalloutProps) {
  const item = calloutVariantMap[variant];
  return (
    <div className={cn('flex gap-3 rounded-lg border p-3 text-xs', item.bg, className)} {...props}>
      <div className="shrink-0 mt-0.5">{item.icon}</div>
      <div className="flex-1">
        {title && <Text variant="body-s" className="font-semibold mb-0.5">{title}</Text>}
        {children}
      </div>
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = <Inbox className="h-8 w-8 text-muted" />, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border-default bg-subtle mb-3">
        {icon}
      </div>
      <Heading level="h4">{title}</Heading>
      {description && <Caption color="muted" className="mt-1 max-w-sm">{description}</Caption>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── Progress Bar ─────────────────────────────────────────────────────────────

export function ProgressBar({ value, max = 100, className }: { value: number; max?: number; className?: string }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn('h-1.5 w-full rounded-full bg-sunken overflow-hidden', className)}>
      <div className="h-full bg-accent transition-all duration-300 rounded-full" style={{ width: `${percentage}%` }} />
    </div>
  );
}
