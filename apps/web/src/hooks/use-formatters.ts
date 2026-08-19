'use client';

/**
 * ForgeCRM — useFormatters Hook
 *
 * Custom React hook providing reactive currency, date, time, and timezone formatters
 * that dynamically adjust to the active workspace settings.
 */

import { useWorkspace } from '@/hooks/use-workspace';
import {
  formatCurrency as fmtCurrency,
  formatDate as fmtDate,
  formatDateTime as fmtDateTime,
  formatPercent as fmtPercent,
  formatTime as fmtTime,
} from '@/lib/formatters';

export function useFormatters() {
  const { currentWorkspace, useWorkspaceSettings } = useWorkspace();
  const settingsQuery = useWorkspaceSettings(currentWorkspace?.id);
  const settings = settingsQuery.data;

  const currency = settings?.currency ?? 'USD';
  const timezone = settings?.timezone ?? 'UTC';
  const dateFormat = settings?.date_format ?? 'YYYY-MM-DD';

  return {
    currency,
    timezone,
    dateFormat,
    formatCurrency: (amount: number | null | undefined, currencyOverride?: string) =>
      fmtCurrency(amount, currencyOverride ?? currency),
    formatDate: (dateVal: string | Date | null | undefined, dateFormatOverride?: string) =>
      fmtDate(dateVal, timezone, dateFormatOverride ?? dateFormat),
    formatDateTime: (dateVal: string | Date | null | undefined) =>
      fmtDateTime(dateVal, timezone),
    formatTime: (dateVal: string | Date | null | undefined) =>
      fmtTime(dateVal, timezone),
    formatPercent: (val: number | null | undefined, decimals = 1) =>
      fmtPercent(val, decimals),
  };
}
