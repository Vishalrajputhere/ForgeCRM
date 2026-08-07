'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const badgeVariantMap: Record<BadgeVariant, string> = {
  default: 'bg-subtle text-accent border-border-default',
  success: 'bg-status-success-bg text-status-success-fg border-status-success/30',
  warning: 'bg-status-warning-bg text-status-warning-fg border-status-warning/30',
  danger:  'bg-status-danger-bg text-status-danger-fg border-status-danger/30',
  info:    'bg-status-info-bg text-status-info-fg border-status-info/30',
  neutral: 'bg-sunken text-secondary border-border-subtle',
};

const dotColorMap: Record<BadgeVariant, string> = {
  default: 'bg-accent',
  success: 'bg-status-success-fg',
  warning: 'bg-status-warning-fg',
  danger:  'bg-status-danger-fg',
  info:    'bg-status-info-fg',
  neutral: 'bg-muted',
};

export function Badge({ className, variant = 'default', dot = false, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-tight',
        badgeVariantMap[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColorMap[variant])} />}
      {children}
    </span>
  );
}

// ── Avatar Component ─────────────────────────────────────────────────────────

export interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ name, src, size = 'md' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeMap = {
    sm: 'h-6 w-6 text-[10px]',
    md: 'h-8 w-8 text-xs',
    lg: 'h-10 w-10 text-sm',
  }[size];

  if (src) {
    return <img src={src} alt={name} className={cn('rounded-full object-cover border border-border-default', sizeMap)} />;
  }

  return (
    <div className={cn('flex items-center justify-center rounded-full bg-accent text-accent-foreground font-semibold shadow-xs', sizeMap)}>
      {initials}
    </div>
  );
}
