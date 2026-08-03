'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

// =============================================================================
// Button
// =============================================================================

type ButtonVariant = 'default' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const buttonVariants: Record<ButtonVariant, string> = {
  default:   'bg-forge-500 text-[#0e0e10] font-semibold hover:bg-forge-400 shadow-xs active:bg-forge-600',
  secondary: 'bg-surface-overlay text-text-primary hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)]',
  ghost:     'text-text-secondary hover:text-text-primary hover:bg-[rgba(255,255,255,0.06)]',
  danger:    'bg-[rgba(239,68,68,0.12)] text-red-400 hover:bg-[rgba(239,68,68,0.2)] border border-[rgba(239,68,68,0.2)]',
  outline:   'border border-[rgba(255,255,255,0.12)] text-text-primary hover:border-[rgba(255,255,255,0.22)] hover:bg-[rgba(255,255,255,0.04)]',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm:   'h-7 px-3 text-caption rounded-md gap-1.5',
  md:   'h-8 px-3.5 text-label rounded-md gap-2',
  lg:   'h-10 px-4 text-body rounded-lg gap-2',
  icon: 'h-8 w-8 rounded-md',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled ?? loading}
        className={cn(
          'inline-flex items-center justify-center transition-colors duration-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base',
          'disabled:pointer-events-none disabled:opacity-40',
          buttonVariants[variant],
          buttonSizes[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <>
            <Spinner className="h-3.5 w-3.5" />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

// =============================================================================
// Input
// =============================================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full rounded-md border px-3 py-2.5 text-body',
          'bg-surface-sunken text-text-primary placeholder:text-text-tertiary',
          'transition-colors duration-100',
          'focus:outline-none focus:ring-2 focus:ring-forge-500 focus:ring-offset-0',
          error
            ? 'border-red-500/50 focus:ring-red-500'
            : 'border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.14)] focus:border-forge-500',
          'disabled:pointer-events-none disabled:opacity-40',
          className,
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

// =============================================================================
// Textarea
// =============================================================================

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }
>(({ className, error, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-md border px-3 py-2.5 text-body',
        'bg-surface-sunken text-text-primary placeholder:text-text-tertiary',
        'transition-colors duration-100 resize-none',
        'focus:outline-none focus:ring-2 focus:ring-forge-500 focus:ring-offset-0',
        error
          ? 'border-red-500/50 focus:ring-red-500'
          : 'border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.14)] focus:border-forge-500',
        'disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

// =============================================================================
// Label
// =============================================================================

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn('text-label text-text-secondary', className)}
    {...props}
  />
));
Label.displayName = 'Label';

// =============================================================================
// Select
// =============================================================================

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }
>(({ className, error, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'w-full rounded-md border px-3 py-2.5 text-body appearance-none',
      'bg-surface-sunken text-text-primary',
      'transition-colors duration-100',
      'focus:outline-none focus:ring-2 focus:ring-forge-500 focus:ring-offset-0',
      error
        ? 'border-red-500/50'
        : 'border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.14)] focus:border-forge-500',
      'disabled:pointer-events-none disabled:opacity-40',
      className,
    )}
    {...props}
  />
));
Select.displayName = 'Select';

// =============================================================================
// Badge
// =============================================================================

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-forge-500/15 text-forge-400 border-forge-500/25',
  success: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/12 text-amber-400 border-amber-500/20',
  danger:  'bg-red-500/12 text-red-400 border-red-500/20',
  info:    'bg-indigo-500/12 text-indigo-400 border-indigo-500/20',
  neutral: 'bg-[rgba(255,255,255,0.06)] text-text-secondary border-[rgba(255,255,255,0.08)]',
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border px-1.5 py-0.5 text-micro font-medium',
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}

// =============================================================================
// Spinner
// =============================================================================

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className ?? 'h-4 w-4')}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// =============================================================================
// Skeleton
// =============================================================================

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('skeleton rounded-md', className)}
      aria-hidden="true"
    />
  );
}

// =============================================================================
// FormField — wraps label + input + error message
// =============================================================================

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string | undefined;
  hint?: string | undefined;
  required?: boolean;
  children: React.ReactNode;
}

export function FormField({ label, htmlFor, error, hint, required, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-caption text-text-tertiary">{hint}</p>}
      {error && <p className="text-caption text-red-400">{error}</p>}
    </div>
  );
}

// =============================================================================
// Card
// =============================================================================

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-lg border border-[rgba(255,255,255,0.08)] bg-surface-raised',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
