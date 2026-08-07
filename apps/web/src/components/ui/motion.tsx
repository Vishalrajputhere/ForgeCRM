'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

// ── 1. Animated Number Count-Up Primitive ────────────────────────────────────

export interface AnimatedNumberProps {
  value: number | string;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  duration = 400,
  className,
}: AnimatedNumberProps) {
  const numericVal = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, ''));
  const [displayVal, setDisplayVal] = useState(isNaN(numericVal) ? 0 : numericVal);

  useEffect(() => {
    if (isNaN(numericVal)) return;

    let startTimestamp: number | null = null;
    const startVal = displayVal;
    const endVal = numericVal;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * easedProgress;

      setDisplayVal(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [numericVal, duration]);

  if (isNaN(numericVal)) {
    return <span className={cn('tabular', className)}>{value}</span>;
  }

  const formatted = displayVal.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return (
    <span className={cn('tabular transition-all duration-75', className)}>
      {prefix}{formatted}{suffix}
    </span>
  );
}

// ── 2. Page Crossfade Transition Container ────────────────────────────────────

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-fade-in transition-opacity duration-180">
      {children}
    </div>
  );
}

// ── 3. Animated Staggered List Container ─────────────────────────────────────

export function AnimatedList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-2 animate-fade-in', className)}>
      {React.Children.map(children, (child, idx) => (
        <div
          key={idx}
          className="transition-all duration-200"
          style={{ animationDelay: `${idx * 40}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

// ── 4. Tactile Micro-Press Button Container ───────────────────────────────────

export function ScaleButton({ children, onClick, className, disabled }: { children: React.ReactNode; onClick?: () => void; className?: string; disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn('motion-press transition-transform duration-80 active:scale-95 disabled:pointer-events-none disabled:opacity-50', className)}
    >
      {children}
    </button>
  );
}

// ── 5. Hover Elevating Motion Card Surface ────────────────────────────────────

export function MotionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('motion-card rounded-xl border border-border-default bg-surface p-4 shadow-xs transition-all duration-150', className)}>
      {children}
    </div>
  );
}

// ── 6. Shimmer Skeleton Loader ────────────────────────────────────────────────

export function ShimmerSkeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-md bg-sunken', className)} />;
}
