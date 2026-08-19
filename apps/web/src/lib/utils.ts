/**
 * ForgeCRM — Utility Functions
 *
 * Shared utilities used across the application.
 * Provides className merging with tailwind-merge + clsx.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS class names with conflict resolution.
 *
 * Combines clsx (conditional classes) with tailwind-merge
 * (de-duplicates conflicting Tailwind classes).
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-primary', 'px-6')
 * // → 'py-2 bg-primary px-6' (px-4 overridden by px-6)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a date value to a human-readable string.
 */
export function formatDate(
  date: Date | string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (date === null || date === undefined) return '—';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '—';

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

/**
 * Format a number as currency.
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency = 'USD',
): string {
  if (amount === null || amount === undefined) return '—';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Truncate a string to a maximum length with an ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 1)}…`;
}

/**
 * Generate initials from a full name (e.g. "John Doe" → "JD").
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Debounce a function call.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
