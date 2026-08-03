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
      // ── Colors ──────────────────────────────────────────────────────────────
      colors: {
        // Design system tokens (CSS variables)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },

        // ── ForgeCRM Brand — Forge Amber ──────────────────────────────────────
        // Warm, crafted, unique in the CRM category.
        forge: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',  // Primary interactive
          500: '#f59e0b',  // Brand primary
          600: '#d97706',  // Pressed / hover
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },

        // ── Surface System ────────────────────────────────────────────────────
        surface: {
          base:    '#0e0e10',  // Page base
          raised:  '#141416',  // Cards, panels
          overlay: '#1a1a1d',  // Sidebar, dropdowns, modals
          sunken:  '#0a0a0c',  // Input backgrounds
        },

        // ── Semantic ──────────────────────────────────────────────────────────
        success:  '#10b981',
        warning:  '#f59e0b',
        danger:   '#ef4444',
        info:     '#6366f1',
      },

      // ── Border Radius ────────────────────────────────────────────────────────
      borderRadius: {
        sm:  '4px',   // Tags, badges
        md:  '6px',   // Buttons, inputs
        lg:  '8px',   // Cards, dropdowns
        xl:  '12px',  // Modals
        '2xl': '16px',
      },

      // ── Typography ───────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display': ['2.5rem',   { lineHeight: '1.1',  letterSpacing: '-0.03em', fontWeight: '600' }],
        'h1':      ['1.75rem',  { lineHeight: '1.2',  letterSpacing: '-0.02em', fontWeight: '600' }],
        'h2':      ['1.25rem',  { lineHeight: '1.3',  letterSpacing: '-0.015em', fontWeight: '600' }],
        'h3':      ['1rem',     { lineHeight: '1.4',  letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-lg': ['0.9375rem',{ lineHeight: '1.6',  letterSpacing: '-0.005em' }],
        'body':    ['0.875rem', { lineHeight: '1.5' }],
        'label':   ['0.8125rem',{ lineHeight: '1.4',  fontWeight: '500' }],
        'caption': ['0.75rem',  { lineHeight: '1.4' }],
        'micro':   ['0.6875rem',{ lineHeight: '1.3',  letterSpacing: '0.02em', fontWeight: '500' }],
      },

      // ── Spacing ──────────────────────────────────────────────────────────────
      // 4px base unit
      spacing: {
        '0.5': '2px',
        '1':   '4px',
        '1.5': '6px',
        '2':   '8px',
        '2.5': '10px',
        '3':   '12px',
        '3.5': '14px',
        '4':   '16px',
        '5':   '20px',
        '6':   '24px',
        '7':   '28px',
        '8':   '32px',
        '9':   '36px',
        '10':  '40px',
        '11':  '44px',
        '12':  '48px',
        '14':  '56px',
        '16':  '64px',
        '20':  '80px',
        '24':  '96px',
        '32':  '128px',
      },

      // ── Shadows ───────────────────────────────────────────────────────────────
      boxShadow: {
        'xs':  '0 1px 2px rgba(0,0,0,0.4)',
        'sm':  '0 2px 6px rgba(0,0,0,0.5)',
        'md':  '0 4px 16px rgba(0,0,0,0.6)',
        'lg':  '0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)',
        'xl':  '0 20px 60px rgba(0,0,0,0.8)',
        'brand': '0 0 0 3px rgba(251,191,36,0.3)',
        'none': 'none',
      },

      // ── Animations ────────────────────────────────────────────────────────────
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
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
      },
      animation: {
        'fade-in':        'fade-in 0.15s cubic-bezier(0.16,1,0.3,1)',
        'fade-up':        'fade-up 0.2s cubic-bezier(0.16,1,0.3,1)',
        'scale-in':       'scale-in 0.15s cubic-bezier(0.16,1,0.3,1)',
        'slide-in-right': 'slide-in-right 0.2s cubic-bezier(0.16,1,0.3,1)',
        'slide-down':     'slide-down 0.15s cubic-bezier(0.16,1,0.3,1)',
        'shimmer':        'shimmer 1.6s linear infinite',
        'pulse-soft':     'pulse-soft 2s ease-in-out infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
      },

      // ── Height ────────────────────────────────────────────────────────────────
      height: {
        'header': '52px',
        'sidebar-item': '32px',
      },

      // ── Width ─────────────────────────────────────────────────────────────────
      width: {
        'sidebar': '224px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
