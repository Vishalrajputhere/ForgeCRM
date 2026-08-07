import React from 'react';

/**
 * ForgeCRM V2 — Reusable Semantic Typography Primitives Component System
 * Implements the 15-tier Geist & Geist Mono typography scale.
 */

// ── Shared Color Mapping ──────────────────────────────────────────────────────

type TextColor = 'primary' | 'secondary' | 'muted' | 'inverse' | 'accent' | 'success' | 'warning' | 'danger';

const colorClassMap: Record<TextColor, string> = {
  primary:   'text-primary',
  secondary: 'text-secondary',
  muted:     'text-muted',
  inverse:   'text-inverse',
  accent:    'text-accent',
  success:   'text-status-success-fg',
  warning:   'text-status-warning-fg',
  danger:    'text-status-danger-fg',
};

// ── 1. Heading Component ──────────────────────────────────────────────────────

export type HeadingLevel =
  | 'display-xl'
  | 'display-l'
  | 'display-m'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'title-l'
  | 'title-m'
  | 'title-s';

const headingClassMap: Record<HeadingLevel, string> = {
  'display-xl': 'text-display-xl font-bold tracking-tight',
  'display-l':  'text-display-l font-bold tracking-tight',
  'display-m':  'text-display-m font-semibold tracking-tight',
  'h1':         'text-heading-xl font-semibold tracking-tight',
  'h2':         'text-heading-l font-semibold tracking-tight',
  'h3':         'text-heading-m font-semibold',
  'h4':         'text-heading-s font-medium',
  'title-l':    'text-title-l font-semibold',
  'title-m':    'text-title-m font-medium',
  'title-s':    'text-title-s font-medium',
};

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
  color?: TextColor;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div' | 'span';
}

export function Heading({
  level = 'h2',
  color = 'primary',
  as,
  className = '',
  children,
  ...props
}: HeadingProps) {
  const Component = (as || (level.startsWith('display') ? 'h1' : level.startsWith('h') ? level : 'h3')) as React.ElementType;
  return (
    <Component
      className={`${headingClassMap[level]} ${colorClassMap[color]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

// ── 2. Text Component ─────────────────────────────────────────────────────────

export type TextVariant =
  | 'lead'
  | 'body-l'
  | 'body-m'
  | 'body-s'
  | 'caption'
  | 'overline';

const textVariantMap: Record<TextVariant, string> = {
  'lead':     'text-body-l font-normal leading-relaxed',
  'body-l':   'text-body-l font-normal',
  'body-m':   'text-body-m font-normal',
  'body-s':   'text-body-s font-normal',
  'caption':  'text-caption font-normal',
  'overline': 'text-overline font-semibold uppercase tracking-wider',
};

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TextVariant;
  color?: TextColor;
  tabular?: boolean;
  as?: 'p' | 'span' | 'div' | 'label';
}

export function Text({
  variant = 'body-m',
  color = 'primary',
  tabular = false,
  as = 'p',
  className = '',
  children,
  ...props
}: TextProps) {
  const Component = as as React.ElementType;
  return (
    <Component
      className={`${textVariantMap[variant]} ${colorClassMap[color]} ${tabular ? 'tabular-nums' : ''} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

// ── 3. Metric Component (Numeric Data, Currency, Analytics) ────────────────────

export interface MetricProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string | number;
  label?: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
}

export function Metric({
  value,
  label,
  trend,
  trendDirection = 'up',
  size = 'md',
  className = '',
  ...props
}: MetricProps) {
  const sizeClasses = {
    sm: 'text-heading-m font-bold',
    md: 'text-heading-xl font-bold',
    lg: 'text-display-m font-bold',
  }[size];

  const trendColors = {
    up: 'text-status-success-fg',
    down: 'text-status-danger-fg',
    neutral: 'text-muted',
  }[trendDirection];

  return (
    <div className={`flex flex-col gap-1 ${className}`} {...props}>
      {label && <span className="text-caption font-medium uppercase tracking-wider text-muted">{label}</span>}
      <div className="flex items-baseline gap-2">
        <span className={`tabular-nums text-primary ${sizeClasses}`}>{value}</span>
        {trend && (
          <span className={`text-xs font-semibold tabular-nums ${trendColors}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

// ── 4. Label Component ────────────────────────────────────────────────────────

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  size?: 'l' | 'm' | 's';
  color?: TextColor;
  required?: boolean;
}

export function Label({
  size = 'm',
  color = 'secondary',
  required = false,
  className = '',
  children,
  ...props
}: LabelProps) {
  const sizeClass = {
    l: 'text-label-l font-medium',
    m: 'text-label-m font-medium',
    s: 'text-label-s font-medium',
  }[size];

  return (
    <label className={`block ${sizeClass} ${colorClassMap[color]} ${className}`} {...props}>
      {children}
      {required && <span className="ml-1 text-status-danger-fg">*</span>}
    </label>
  );
}

// ── 5. Caption Component ──────────────────────────────────────────────────────

export interface CaptionProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: TextColor;
  tabular?: boolean;
}

export function Caption({
  color = 'muted',
  tabular = false,
  className = '',
  children,
  ...props
}: CaptionProps) {
  return (
    <span
      className={`text-caption ${colorClassMap[color]} ${tabular ? 'tabular-nums' : ''} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

// ── 6. Code & Monospace Component ─────────────────────────────────────────────

export interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  block?: boolean;
}

export function Code({ block = false, className = '', children, ...props }: CodeProps) {
  if (block) {
    return (
      <pre className={`overflow-x-auto rounded-lg border border-border-default bg-sunken p-4 font-mono text-xs tabular-nums text-primary ${className}`} {...props}>
        <code>{children}</code>
      </pre>
    );
  }
  return (
    <code className={`rounded border border-border-subtle bg-sunken px-1.5 py-0.5 font-mono text-xs tabular-nums text-primary ${className}`} {...props}>
      {children}
    </code>
  );
}

// ── 7. Keyboard Shortcut (Kbd) Component ──────────────────────────────────────

export function Kbd({ className = '', children, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-border-strong bg-overlay px-1.5 font-mono text-[10px] font-medium text-secondary shadow-xs ${className}`}
      {...props}
    >
      {children}
    </kbd>
  );
}
