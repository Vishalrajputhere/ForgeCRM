import React from 'react';

/**
 * ForgeCRM V2 — Enterprise Layout & Spacing System Primitives
 * Inspired by Linear, Attio, Vercel Dashboard, and Stripe Dashboard.
 */

// ── 1. Container Component ───────────────────────────────────────────────────

export type ContainerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

const containerSizeMap: Record<ContainerSize, string> = {
  xs:   'max-w-md',     // 448px
  sm:   'max-w-xl',     // 576px
  md:   'max-w-3xl',    // 768px
  lg:   'max-w-5xl',    // 1024px
  xl:   'max-w-7xl',    // 1280px
  '2xl':'max-w-[1536px]',
  full: 'max-w-full',
};

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize;
  padded?: boolean;
}

export function Container({
  size = 'xl',
  padded = true,
  className = '',
  children,
  ...props
}: ContainerProps) {
  return (
    <div
      className={`mx-auto w-full ${containerSizeMap[size]} ${padded ? 'px-4 md:px-6' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// ── 2. Section Component ─────────────────────────────────────────────────────

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'section' | 'div' | 'article' | 'aside';
  padded?: boolean;
}

export function Section({
  as: Component = 'section',
  padded = true,
  className = '',
  children,
  ...props
}: SectionProps) {
  return (
    <Component className={`${padded ? 'py-4 md:py-6' : ''} ${className}`} {...props}>
      {children}
    </Component>
  );
}

// ── 3. Stack Component (Vertical Layout & Spacing Rhythm) ────────────────────

export type SpacingGap = 0 | 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 5 | 6 | 8 | 10 | 12 | 16;

const gapMap: Record<SpacingGap, string> = {
  0:   'gap-0',
  0.5: 'gap-0.5',
  1:   'gap-1',
  1.5: 'gap-1.5',
  2:   'gap-2',
  2.5: 'gap-2.5',
  3:   'gap-3',
  3.5: 'gap-3.5',
  4:   'gap-4',
  5:   'gap-5',
  6:   'gap-6',
  8:   'gap-8',
  10:  'gap-10',
  12:  'gap-12',
  16:  'gap-16',
};

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: SpacingGap;
  align?: 'start' | 'center' | 'end' | 'stretch';
}

export function Stack({
  gap = 4,
  align = 'stretch',
  className = '',
  children,
  ...props
}: StackProps) {
  const alignClass = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  }[align];

  return (
    <div className={`flex flex-col ${gapMap[gap]} ${alignClass} ${className}`} {...props}>
      {children}
    </div>
  );
}

// ── 4. Inline / Flex Component (Horizontal Alignment) ─────────────────────────

export interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: SpacingGap;
  align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: boolean;
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
}

export function Flex({
  gap = 3,
  align = 'center',
  justify = 'start',
  wrap = false,
  direction = 'row',
  className = '',
  children,
  ...props
}: FlexProps) {
  const alignClass = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    baseline: 'items-baseline',
    stretch: 'items-stretch',
  }[align];

  const justifyClass = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  }[justify];

  const dirClass = {
    row: 'flex-row',
    col: 'flex-col',
    'row-reverse': 'flex-row-reverse',
    'col-reverse': 'flex-col-reverse',
  }[direction];

  return (
    <div
      className={`flex ${dirClass} ${gapMap[gap]} ${alignClass} ${justifyClass} ${
        wrap ? 'flex-wrap' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// Alias for Inline horizontal layout
export function Inline(props: FlexProps) {
  return <Flex direction="row" wrap {...props} />;
}

// ── 5. Grid Component (Responsive Grid System) ────────────────────────────────

export interface ResponsiveGridCols {
  mobile?: 1 | 2 | 3 | 4;
  tablet?: 1 | 2 | 3 | 4 | 6;
  desktop?: 1 | 2 | 3 | 4 | 6 | 12;
}

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: number | ResponsiveGridCols;
  gap?: SpacingGap;
}

export function Grid({
  cols = { mobile: 1, tablet: 2, desktop: 4 },
  gap = 4,
  className = '',
  children,
  ...props
}: GridProps) {
  let colsClass = 'grid-cols-1';

  if (typeof cols === 'number') {
    colsClass = `grid-cols-${cols}`;
  } else {
    const mobile = cols.mobile ? `grid-cols-${cols.mobile}` : 'grid-cols-1';
    const tablet = cols.tablet ? `sm:grid-cols-${cols.tablet}` : '';
    const desktop = cols.desktop ? `lg:grid-cols-${cols.desktop}` : '';
    colsClass = `${mobile} ${tablet} ${desktop}`;
  }

  return (
    <div className={`grid ${colsClass} ${gapMap[gap]} ${className}`} {...props}>
      {children}
    </div>
  );
}

// ── 6. Divider Component ──────────────────────────────────────────────────────

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'horizontal' | 'vertical';
  spacing?: SpacingGap;
}

export function Divider({
  direction = 'horizontal',
  spacing = 0,
  className = '',
  ...props
}: DividerProps) {
  if (direction === 'vertical') {
    return (
      <div
        className={`w-px bg-border-default self-stretch ${gapMap[spacing]} ${className}`}
        {...props}
      />
    );
  }

  return (
    <div
      className={`h-px w-full bg-border-default ${gapMap[spacing]} ${className}`}
      {...props}
    />
  );
}

// ── 7. Spacer Component ───────────────────────────────────────────────────────

export function Spacer({ size = 4 }: { size?: SpacingGap }) {
  const sizeMap: Record<SpacingGap, string> = {
    0:   'h-0 w-0',
    0.5: 'h-0.5 w-0.5',
    1:   'h-1 w-1',
    1.5: 'h-1.5 w-1.5',
    2:   'h-2 w-2',
    2.5: 'h-2.5 w-2.5',
    3:   'h-3 w-3',
    3.5: 'h-3.5 w-3.5',
    4:   'h-4 w-4',
    5:   'h-5 w-5',
    6:   'h-6 w-6',
    8:   'h-8 w-8',
    10:  'h-10 w-10',
    12:  'h-12 w-12',
    16:  'h-16 w-16',
  };
  return <div className={sizeMap[size]} aria-hidden="true" />;
}

// ── 8. Surface & CardSection Components ──────────────────────────────────────

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'elevated' | 'overlay' | 'sunken' | 'canvas';
  bordered?: boolean;
}

export function Surface({
  variant = 'surface',
  bordered = true,
  className = '',
  children,
  ...props
}: SurfaceProps) {
  const variantMap = {
    canvas:   'bg-canvas',
    surface:  'bg-surface',
    elevated: 'bg-elevated',
    overlay:  'bg-overlay',
    sunken:   'bg-sunken',
  }[variant];

  return (
    <div
      className={`rounded-xl ${variantMap} ${
        bordered ? 'border border-border-default shadow-xs' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardSection({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

// ── 9. Standardized Page Structure Primitives ─────────────────────────────────

export function PageHeader({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function PageActions({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`} {...props}>
      {children}
    </div>
  );
}

export function PageContent({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`w-full ${className}`} {...props}>
      {children}
    </div>
  );
}

export function PageFooter({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`pt-6 mt-6 border-t border-border-subtle ${className}`} {...props}>
      {children}
    </div>
  );
}
