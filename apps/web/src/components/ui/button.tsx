'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Spinner } from '@/components/ui/feedback';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'bg-accent text-accent-foreground font-semibold hover:opacity-90 shadow-xs active:opacity-100',
  secondary: 'bg-surface text-primary border border-border-default hover:bg-hover hover:border-border-strong',
  ghost:     'bg-transparent text-secondary hover:text-primary hover:bg-hover',
  outline:   'bg-transparent border border-border-strong text-primary hover:bg-hover hover:border-border-strong',
  danger:    'bg-status-danger-bg text-status-danger-fg border border-status-danger/30 hover:bg-status-danger-bg/80',
  success:   'bg-status-success-bg text-status-success-fg border border-status-success/30 hover:bg-status-success-bg/80',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-xs rounded-md gap-1.5',
  md: 'h-8 px-3.5 text-xs font-medium rounded-md gap-2',
  lg: 'h-10 px-4 text-sm font-medium rounded-lg gap-2',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, icon, iconPosition = 'left', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-100 cursor-pointer select-none',
          'active:scale-[0.98] hover:-translate-y-0.5',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
          'disabled:pointer-events-none disabled:opacity-40 disabled:transform-none',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <Spinner className="h-3.5 w-3.5" />
        ) : (
          icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>
        )}
        {children && <span>{children}</span>}
        {!loading && icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
      </button>
    );
  }
);
Button.displayName = 'Button';

// ── Icon Button ──────────────────────────────────────────────────────────────

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  'aria-label': string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, variant = 'secondary', size = 'md', className, ...props }, ref) => {
    const iconSizeClasses = {
      sm: 'h-7 w-7 rounded-md text-xs',
      md: 'h-8 w-8 rounded-md text-xs',
      lg: 'h-10 w-10 rounded-lg text-sm',
    }[size];

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-150 cursor-pointer select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
          'disabled:pointer-events-none disabled:opacity-40',
          variantClasses[variant],
          iconSizeClasses,
          className
        )}
        {...props}
      >
        {icon}
      </button>
    );
  }
);
IconButton.displayName = 'IconButton';

// ── Split Button ─────────────────────────────────────────────────────────────

export interface SplitButtonAction {
  label: string;
  onClick: () => void;
}

export interface SplitButtonProps {
  primaryAction: { label: string; onClick: () => void; loading?: boolean };
  dropdownActions: SplitButtonAction[];
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function SplitButton({ primaryAction, dropdownActions, variant = 'primary', size = 'md' }: SplitButtonProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative inline-flex rounded-md shadow-xs">
      <Button variant={variant} size={size} loading={primaryAction.loading ?? false} onClick={primaryAction.onClick} className="rounded-r-none border-r border-black/20">
        {primaryAction.label}
      </Button>
      <IconButton
        icon={<ChevronDown className="h-3.5 w-3.5" />}
        variant={variant}
        size={size}
        aria-label="More actions"
        onClick={() => setOpen(!open)}
        className="rounded-l-none px-1.5"
      />
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-border-default bg-overlay p-1 shadow-lg">
          {dropdownActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => { action.onClick(); setOpen(false); }}
              className="flex w-full items-center rounded-md px-3 py-1.5 text-xs text-secondary hover:text-primary hover:bg-hover transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
