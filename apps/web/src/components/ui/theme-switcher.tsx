'use client';

/**
 * ForgeCRM V2 — Reusable Theme Switcher Component
 * Supports Light, Dark, and System modes with instant local storage persistence.
 */

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop } from 'lucide-react';

interface ThemeSwitcherProps {
  variant?: 'segmented' | 'dropdown' | 'compact';
  className?: string;
}

export function ThemeSwitcher({ variant = 'segmented', className = '' }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid SSR hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`h-8 w-24 rounded-lg bg-surface border border-border-default skeleton ${className}`} />
    );
  }

  if (variant === 'compact') {
    const isDark = theme === 'dark';
    return (
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        aria-label="Toggle theme"
        className={`flex h-8 w-8 items-center justify-center rounded-lg border border-border-default bg-surface text-secondary transition-all hover:bg-hover hover:text-primary ${className}`}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-1 rounded-lg border border-border-default bg-surface p-1 shadow-xs ${className}`}>
      {[
        { id: 'light', label: 'Light', icon: <Sun className="h-3.5 w-3.5" /> },
        { id: 'dark', label: 'Dark', icon: <Moon className="h-3.5 w-3.5" /> },
        { id: 'system', label: 'System', icon: <Laptop className="h-3.5 w-3.5" /> },
      ].map(item => (
        <button
          key={item.id}
          onClick={() => setTheme(item.id)}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
            theme === item.id
              ? 'bg-accent text-accent-foreground shadow-xs'
              : 'text-secondary hover:bg-hover hover:text-primary'
          }`}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
