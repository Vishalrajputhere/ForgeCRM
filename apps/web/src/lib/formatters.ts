/**
 * ForgeCRM — Centralized Locale, Formatting & Currency Utility
 *
 * Provides centralized currency formatting, date/time formatting with IANA timezones,
 * and regional options for the application.
 */

// ── Currency Options & Symbols ────────────────────────────────────────────────

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
  AED: 'AED ',
  SGD: 'S$',
  AUD: 'A$',
  CAD: 'C$',
  JPY: '¥',
  CHF: 'CHF ',
};

export const CURRENCY_OPTIONS = [
  { code: 'USD', label: 'US Dollar (USD)', symbol: '$' },
  { code: 'INR', label: 'Indian Rupee (INR)', symbol: '₹' },
  { code: 'EUR', label: 'Euro (EUR)', symbol: '€' },
  { code: 'GBP', label: 'British Pound (GBP)', symbol: '£' },
  { code: 'AED', label: 'UAE Dirham (AED)', symbol: 'AED ' },
  { code: 'SGD', label: 'Singapore Dollar (SGD)', symbol: 'S$' },
  { code: 'AUD', label: 'Australian Dollar (AUD)', symbol: 'A$' },
  { code: 'CAD', label: 'Canadian Dollar (CAD)', symbol: 'C$' },
  { code: 'JPY', label: 'Japanese Yen (JPY)', symbol: '¥' },
  { code: 'CHF', label: 'Swiss Franc (CHF)', symbol: 'CHF ' },
];

export const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)', offset: '+00:00' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST — Asia/Kolkata)', offset: '+05:30' },
  { value: 'America/New_York', label: 'Eastern Time (ET — America/New_York)', offset: '-05:00' },
  { value: 'America/Chicago', label: 'Central Time (CT — America/Chicago)', offset: '-06:00' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT — America/Los_Angeles)', offset: '-08:00' },
  { value: 'Europe/London', label: 'London / GMT (Europe/London)', offset: '+00:00' },
  { value: 'Europe/Paris', label: 'Central European Time (Europe/Paris)', offset: '+01:00' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (Asia/Dubai)', offset: '+04:00' },
  { value: 'Asia/Singapore', label: 'Singapore Standard Time (Asia/Singapore)', offset: '+08:00' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (Asia/Tokyo)', offset: '+09:00' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (Australia/Sydney)', offset: '+10:00' },
];

export const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English (US)' },
  { code: 'es', label: 'Spanish (Español)' },
  { code: 'fr', label: 'French (Français)' },
  { code: 'de', label: 'German (Deutsch)' },
  { code: 'hi', label: 'Hindi (हिंदी)' },
  { code: 'ja', label: 'Japanese (日本語)' },
];

export const DATE_FORMAT_OPTIONS = [
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2026-08-03)', example: '2026-08-03' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (03/08/2026)', example: '03/08/2026' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (08/03/2026)', example: '08/03/2026' },
  { value: 'DD MMM YYYY', label: 'DD MMM YYYY (03 Aug 2026)', example: '03 Aug 2026' },
];

export const WEEK_START_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 6, label: 'Saturday' },
];

/**
 * Format monetary currency values using workspace currency or override.
 * e.g. 45000 -> "$45,000" or "₹45,000"
 */
export function formatCurrency(
  amount: number | null | undefined,
  currencyCode = 'USD',
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    const symbol = CURRENCY_SYMBOLS[currencyCode.toUpperCase()] ?? '$';
    return `${symbol}0`;
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode.toUpperCase(),
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    const symbol = CURRENCY_SYMBOLS[currencyCode.toUpperCase()] ?? '$';
    return `${symbol}${amount.toLocaleString()}`;
  }
}

/**
 * Format dates considering workspace timezone and date format.
 */
export function formatDate(
  dateVal: string | Date | null | undefined,
  timezone = 'UTC',
  dateFormat = 'YYYY-MM-DD',
): string {
  if (!dateVal) return '—';
  const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
  if (isNaN(d.getTime())) return '—';

  try {
    if (dateFormat === 'DD MMM YYYY') {
      return new Intl.DateTimeFormat('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: timezone,
      }).format(d);
    }

    if (dateFormat === 'DD/MM/YYYY') {
      const parts = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: timezone,
      }).formatToParts(d);
      const day = parts.find((p) => p.type === 'day')?.value ?? '';
      const month = parts.find((p) => p.type === 'month')?.value ?? '';
      const year = parts.find((p) => p.type === 'year')?.value ?? '';
      return `${day}/${month}/${year}`;
    }

    if (dateFormat === 'MM/DD/YYYY') {
      const parts = new Intl.DateTimeFormat('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: timezone,
      }).formatToParts(d);
      const day = parts.find((p) => p.type === 'day')?.value ?? '';
      const month = parts.find((p) => p.type === 'month')?.value ?? '';
      const year = parts.find((p) => p.type === 'year')?.value ?? '';
      return `${month}/${day}/${year}`;
    }

    // Default YYYY-MM-DD
    const parts = new Intl.DateTimeFormat('en-CA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: timezone,
    }).formatToParts(d);
    const day = parts.find((p) => p.type === 'day')?.value ?? '';
    const month = parts.find((p) => p.type === 'month')?.value ?? '';
    const year = parts.find((p) => p.type === 'year')?.value ?? '';
    return `${year}-${month}-${day}`;
  } catch {
    return d.toLocaleDateString('en-US');
  }
}

/**
 * Format full date and time considering workspace timezone.
 */
export function formatDateTime(
  dateVal: string | Date | null | undefined,
  timezone = 'UTC',
): string {
  if (!dateVal) return '—';
  const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
  if (isNaN(d.getTime())) return '—';

  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone,
    }).format(d);
  } catch {
    return d.toLocaleString('en-US');
  }
}

export function formatTime(
  dateVal: string | Date | null | undefined,
  timezone = 'UTC',
): string {
  if (!dateVal) return '—';
  const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
  if (isNaN(d.getTime())) return '—';

  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone,
    }).format(d);
  } catch {
    return d.toLocaleTimeString('en-US');
  }
}

/**
 * Format percentages (e.g. 0.75 -> 75% or 75.2 -> 75.2%).
 */
export function formatPercent(
  val: number | null | undefined,
  decimals = 1,
): string {
  if (val === null || val === undefined || isNaN(val)) return '0%';
  return `${val.toFixed(decimals).replace(/\.0$/, '')}%`;
}


