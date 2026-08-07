import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      // ── Semantic Color System Tokens ─────────────────────────────────────────
      colors: {
        // Core Surfaces (bg-canvas, bg-surface, etc.)
        canvas:   'var(--bg-canvas)',
        surface:  'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        overlay:  'var(--bg-overlay)',
        sunken:   'var(--bg-sunken)',
        subtle:   'var(--bg-subtle)',

        // Interactive States
        hover:    'var(--bg-hover)',
        active:   'var(--bg-active)',

        // Typography Tokens (text-primary, text-secondary, etc.)
        'primary':   'var(--text-primary)',
        'secondary': 'var(--text-secondary)',
        'muted':     'var(--text-muted)',
        'inverse':   'var(--text-inverse)',

        // Clean Aliases for backwards compatibility
        'txt-primary':   'var(--text-primary)',
        'txt-secondary': 'var(--text-secondary)',
        'txt-muted':     'var(--text-muted)',
        'txt-inverse':   'var(--text-inverse)',

        // Borders (border-default, border-muted, border-strong, border-subtle)
        'border-subtle':  'var(--border-subtle)',
        'border-default': 'var(--border-default)',
        'border-muted':   'var(--border-muted)',
        'border-strong':  'var(--border-strong)',

        // Clean Aliases for backwards compatibility
        'bdr-subtle':  'var(--border-subtle)',
        'bdr-default': 'var(--border-default)',
        'bdr-muted':   'var(--border-muted)',
        'bdr-strong':  'var(--border-strong)',

        // Accent / Primary Brand Token (bg-accent, text-accent, border-accent)
        accent: {
          DEFAULT:    'var(--accent-primary)',
          hover:      'var(--accent-hover)',
          active:     'var(--accent-active)',
          subtle:     'var(--accent-subtle)',
          foreground: 'var(--accent-foreground)',
        },

        // Legacy Forge Amber Token Map
        forge: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: 'var(--forge-400)',
          500: 'var(--forge-500)',
          600: 'var(--forge-600)',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },

        // Status Indicators
        status: {
          success:    'var(--status-success)',
          'success-bg': 'var(--status-success-bg)',
          'success-fg': 'var(--status-success-fg)',
          warning:    'var(--status-warning)',
          'warning-bg': 'var(--status-warning-bg)',
          'warning-fg': 'var(--status-warning-fg)',
          danger:     'var(--status-danger)',
          'danger-bg':  'var(--status-danger-bg)',
          'danger-fg':  'var(--status-danger-fg)',
          info:       'var(--status-info)',
          'info-bg':    'var(--status-info-bg)',
          'info-fg':    'var(--status-info-fg)',
        },

        // Shadcn/Radix Variable Maps
        border: 'var(--border-default)',
        input: 'var(--bg-sunken)',
        ring: 'var(--accent-primary)',
        background: 'var(--bg-canvas)',
        foreground: 'var(--text-primary)',
        destructive: {
          DEFAULT: 'var(--status-danger)',
          foreground: '#ffffff',
        },
      },

      // ── 15-Tier Typography Scale System ─────────────────────────────────────
      fontSize: {
        'display-xl': ['3.5rem',   { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '700' }],
        'display-l':  ['3rem',     { lineHeight: '1.1',  letterSpacing: '-0.025em',fontWeight: '700' }],
        'display-m':  ['2.5rem',   { lineHeight: '1.15', letterSpacing: '-0.025em',fontWeight: '600' }],
        'heading-xl': ['2rem',     { lineHeight: '1.2',  letterSpacing: '-0.02em', fontWeight: '600' }],
        'heading-l':  ['1.5rem',   { lineHeight: '1.25', letterSpacing: '-0.015em',fontWeight: '600' }],
        'heading-m':  ['1.25rem',  { lineHeight: '1.3',  letterSpacing: '-0.01em', fontWeight: '600' }],
        'heading-s':  ['1.125rem', { lineHeight: '1.35', letterSpacing: '-0.005em',fontWeight: '500' }],
        'title-l':    ['1rem',     { lineHeight: '1.4',  letterSpacing: '0',       fontWeight: '600' }],
        'title-m':    ['0.9375rem',{ lineHeight: '1.45', letterSpacing: '0',       fontWeight: '500' }],
        'title-s':    ['0.875rem', { lineHeight: '1.45', letterSpacing: '0',       fontWeight: '500' }],
        'body-l':     ['1rem',     { lineHeight: '1.5',  letterSpacing: '0',       fontWeight: '400' }],
        'body-m':     ['0.875rem', { lineHeight: '1.5',  letterSpacing: '0',       fontWeight: '400' }],
        'body-s':     ['0.8125rem',{ lineHeight: '1.45', letterSpacing: '0',       fontWeight: '400' }],
        'label-l':    ['0.875rem', { lineHeight: '1.4',  letterSpacing: '0',       fontWeight: '500' }],
        'label-m':    ['0.8125rem',{ lineHeight: '1.4',  letterSpacing: '0.01em',  fontWeight: '500' }],
        'label-s':    ['0.75rem',  { lineHeight: '1.35', letterSpacing: '0.015em', fontWeight: '500' }],
        'caption':    ['0.75rem',  { lineHeight: '1.4',  letterSpacing: '0.01em',  fontWeight: '400' }],
        'overline':   ['0.6875rem',{ lineHeight: '1.3',  letterSpacing: '0.05em',  fontWeight: '600' }],
      },

      // ── Border Radius Tokens ──────────────────────────────────────────────────
      borderRadius: {
        none: 'var(--radius-none)',
        xs:   'var(--radius-xs)',
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },

      // ── Typography Scale ──────────────────────────────────────────────────────
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'JetBrains Mono', 'monospace'],
      },

      // ── Shadows & Elevation ───────────────────────────────────────────────────
      boxShadow: {
        xs:  'var(--shadow-xs)',
        sm:  'var(--shadow-sm)',
        md:  'var(--shadow-md)',
        lg:  'var(--shadow-lg)',
        xl:  'var(--shadow-xl)',
        inner: 'var(--shadow-inner)',
      },

      // ── Z-Index Hierarchy ─────────────────────────────────────────────────────
      zIndex: {
        dropdown: '1000',
        sticky:   '1100',
        fixed:    '1200',
        modalBg:  '1300',
        modal:    '1400',
        popover:  '1500',
        toast:    '1600',
        tooltip:  '1700',
      },

      // ── Animations & Motion ───────────────────────────────────────────────────
      transitionTimingFunction: {
        standard: 'var(--ease-standard)',
        in:       'var(--ease-in)',
        out:      'var(--ease-out)',
      },
      transitionDuration: {
        fast:   'var(--duration-fast)',
        normal: 'var(--duration-normal)',
        slow:   'var(--duration-slow)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(3px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(12px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200px 0' },
          to:   { backgroundPosition: 'calc(200px + 100%) 0' },
        },
      },
      animation: {
        'fade-in':        'fade-in var(--duration-fast) var(--ease-standard)',
        'fade-up':        'fade-up var(--duration-normal) var(--ease-standard)',
        'scale-in':       'scale-in var(--duration-fast) var(--ease-standard)',
        'slide-in-right': 'slide-in-right var(--duration-normal) var(--ease-standard)',
        'slide-down':     'slide-down var(--duration-fast) var(--ease-standard)',
        'shimmer':        'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
