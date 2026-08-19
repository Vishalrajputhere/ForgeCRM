'use client';

import * as React from 'react';
import { ArrowUpRight } from 'lucide-react';

import { AnimatedNumber } from '@/components/ui/motion';
import { Caption } from '@/components/ui/typography';
import { cn } from '@/lib/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'elevated' | 'overlay' | 'sunken';
  bordered?: boolean;
  interactive?: boolean;
}

export function Card({
  variant = 'surface',
  bordered = true,
  interactive = false,
  className,
  children,
  ...props
}: CardProps) {
  const bgMap = {
    surface: 'bg-surface',
    elevated: 'bg-elevated',
    overlay: 'bg-overlay',
    sunken: 'bg-sunken',
  }[variant];

  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-150',
        bgMap,
        bordered ? 'border border-border-default shadow-xs' : '',
        interactive ? 'motion-card cursor-pointer' : '',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 p-5 pb-3', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-base font-semibold leading-none tracking-tight text-primary', className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-xs text-muted', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center p-5 pt-0', className)} {...props} />;
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

export interface KPICardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  href?: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
}

export function KPICard({
  label,
  value,
  sub,
  icon,
  href,
  trend,
  trendDirection = 'up',
}: KPICardProps) {
  const content = (
    <Card variant="surface" interactive className="group p-4 relative">
      <div className="flex items-center justify-between">
        <Caption color="muted">{label}</Caption>
        {icon && <div className="text-muted">{icon}</div>}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <AnimatedNumber
          value={value}
          className="text-2xl font-bold tracking-tight text-primary tabular"
        />
        {trend && (
          <span
            className={cn(
              'text-xs font-semibold tabular',
              trendDirection === 'up'
                ? 'text-status-success-fg'
                : trendDirection === 'down'
                ? 'text-status-danger-fg'
                : 'text-muted'
            )}
          >
            {trend}
          </span>
        )}
      </div>
      {sub && (
        <Caption color="muted" className="mt-1 block">
          {sub}
        </Caption>
      )}
      {href && (
        <ArrowUpRight className="absolute right-3.5 top-3.5 h-3.5 w-3.5 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </Card>
  );

  return href ? (
    <a href={href} className="block">
      {content}
    </a>
  ) : (
    content
  );
}
