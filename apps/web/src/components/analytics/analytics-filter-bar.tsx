'use client';

/**
 * ForgeCRM — Analytics Filter Bar
 *
 * High-performance global filter bar providing time-range presets (Today, 7D, 30D, 90D, QTD, YTD, 1Y, Custom),
 * representative/owner filters, pipeline selectors, and CSV export triggers.
 */

import React, { useState } from 'react';
import {
  Calendar,
  ChevronDown,
  Download,
  Filter,
  RefreshCw,
  RotateCcw,
  User as UserIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAnalytics } from '@/hooks/use-analytics';
import { useCRM } from '@/hooks/use-crm';
import { useWorkspace } from '@/hooks/use-workspace';
import {
  AnalyticsTimeRange,
  useAnalyticsStore,
} from '@/stores/analytics-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import type { PipelineResponse } from '@/types';

const TIME_RANGES: { id: AnalyticsTimeRange; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: '90d', label: '90 Days' },
  { id: 'qtd', label: 'This Quarter' },
  { id: 'ytd', label: 'This Year' },
  { id: '1y', label: '1 Year' },
  { id: 'custom', label: 'Custom' },
];

export function AnalyticsFilterBar() {
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const { useWorkspaceMembers } = useWorkspace();
  const { data: members = [] } = useWorkspaceMembers(currentWorkspace?.id);
  const { pipelines } = useCRM();
  const { refetchOverview, exportCsv } = useAnalytics();

  const {
    timeRange,
    startDate,
    endDate,
    selectedOwnerId,
    selectedPipelineId,
    setTimeRange,
    setDateInterval,
    setSelectedOwnerId,
    setSelectedPipelineId,
    resetFilters,
  } = useAnalyticsStore();

  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [customStart, setCustomStart] = useState(startDate || '');
  const [customEnd, setCustomEnd] = useState(endDate || '');
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const handleApplyCustomDates = () => {
    if (customStart && customEnd) {
      setDateInterval(new Date(customStart).toISOString(), new Date(customEnd).toISOString());
      setIsCustomDateOpen(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchOverview();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const handleExport = async (type: string) => {
    try {
      setIsExporting(true);
      setIsExportMenuOpen(false);
      await exportCsv({
        report_type: type,
        time_range: timeRange !== 'custom' ? timeRange : undefined,
        start_date: timeRange === 'custom' && startDate ? startDate : undefined,
        end_date: timeRange === 'custom' && endDate ? endDate : undefined,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-default bg-surface/70 p-3 backdrop-blur-md">
      {/* ── Time Range Presets ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1">
        <span className="mr-1 hidden items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted sm:flex">
          <Calendar className="h-3.5 w-3.5" />
          Period:
        </span>
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-sunken p-1">
          {TIME_RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                if (r.id === 'custom') {
                  setIsCustomDateOpen(true);
                } else {
                  setTimeRange(r.id);
                }
              }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                timeRange === r.id
                  ? 'bg-accent text-accent-fg shadow-xs'
                  : 'text-muted hover:bg-hover hover:text-primary'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filters & Action Buttons ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Owner / Rep Filter Select */}
        <div className="relative flex items-center">
          <UserIcon className="absolute left-2.5 h-3.5 w-3.5 text-muted pointer-events-none" />
          <select
            value={selectedOwnerId || ''}
            onChange={(e) => setSelectedOwnerId(e.target.value || null)}
            className="h-8 rounded-lg border border-border-default bg-surface pl-8 pr-7 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">All Team Members</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.user?.first_name} {m.user?.last_name || ''}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 h-3.5 w-3.5 text-muted pointer-events-none" />
        </div>

        {/* Pipeline Filter Select */}
        {pipelines.length > 0 && (
          <div className="relative flex items-center">
            <Filter className="absolute left-2.5 h-3.5 w-3.5 text-muted pointer-events-none" />
            <select
              value={selectedPipelineId || ''}
              onChange={(e) => setSelectedPipelineId(e.target.value || null)}
              className="h-8 rounded-lg border border-border-default bg-surface pl-8 pr-7 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">All Pipelines</option>
              {pipelines.map((p: PipelineResponse) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 h-3.5 w-3.5 text-muted pointer-events-none" />
          </div>
        )}

        {/* Export CSV Menu */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            disabled={isExporting}
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            className="h-8 gap-1.5 text-xs"
          >
            <Download className={`h-3.5 w-3.5 ${isExporting ? 'animate-bounce' : ''}`} />
            <span>Export</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>

          {isExportMenuOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border-default bg-overlay p-1 shadow-lg">
              <div className="px-2 py-1 text-[11px] font-semibold text-muted">
                Download CSV Dataset
              </div>
              <div className="border-t border-border-subtle my-1" />
              <button
                type="button"
                onClick={() => handleExport('overview')}
                className="w-full text-left px-2 py-1.5 text-xs text-secondary hover:text-primary hover:bg-hover rounded-md transition-colors"
              >
                Executive Overview
              </button>
              <button
                type="button"
                onClick={() => handleExport('sales')}
                className="w-full text-left px-2 py-1.5 text-xs text-secondary hover:text-primary hover:bg-hover rounded-md transition-colors"
              >
                Sales Leaderboard
              </button>
              <button
                type="button"
                onClick={() => handleExport('deals')}
                className="w-full text-left px-2 py-1.5 text-xs text-secondary hover:text-primary hover:bg-hover rounded-md transition-colors"
              >
                Deals Dataset
              </button>
              <button
                type="button"
                onClick={() => handleExport('leads')}
                className="w-full text-left px-2 py-1.5 text-xs text-secondary hover:text-primary hover:bg-hover rounded-md transition-colors"
              >
                Leads Dataset
              </button>
              <button
                type="button"
                onClick={() => handleExport('accounts')}
                className="w-full text-left px-2 py-1.5 text-xs text-secondary hover:text-primary hover:bg-hover rounded-md transition-colors"
              >
                Accounts & Customers
              </button>
              <button
                type="button"
                onClick={() => handleExport('ai')}
                className="w-full text-left px-2 py-1.5 text-xs text-secondary hover:text-primary hover:bg-hover rounded-md transition-colors"
              >
                AI Subsystem Usage
              </button>
            </div>
          )}
        </div>

        {/* Reset Filters */}
        {(selectedOwnerId || selectedPipelineId || timeRange !== '30d') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-8 px-2 text-xs text-muted hover:text-primary"
            title="Reset Filters"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}

        {/* Refresh Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="h-8 px-2 text-muted hover:text-primary"
          title="Refresh Metrics"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* ── Custom Date Range Modal Dialog ────────────────────────────── */}
      {isCustomDateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border-default bg-surface p-5 shadow-2xl">
            <h3 className="text-sm font-semibold text-primary">Select Custom Date Range</h3>
            <p className="mt-1 text-xs text-muted">
              Filter CRM intelligence and metrics within custom start and end boundaries.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-muted">Start Date</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border-default bg-sunken px-3 py-1.5 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted">End Date</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border-default bg-sunken px-3 py-1.5 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCustomDateOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApplyCustomDates}
                disabled={!customStart || !customEnd}
                className="text-xs"
              >
                Apply Range
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
