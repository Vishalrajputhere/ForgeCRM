/**
 * ForgeCRM — Analytics Zustand Store
 *
 * Client-side state management for selected reporting time range, owner filters,
 * active analytics tabs, and custom dashboard state.
 *
 * Documentation: docs/04_Frontend/404_STATE_MANAGEMENT.md
 */

import { create } from 'zustand';

export type AnalyticsTimeRange =
  | 'today'
  | '7d'
  | '30d'
  | '90d'
  | 'qtd'
  | 'ytd'
  | '1y'
  | 'custom';

export type AnalyticsTab =
  | 'overview'
  | 'sales'
  | 'pipeline'
  | 'leads'
  | 'activities'
  | 'automation'
  | 'ai'
  | 'accounts'
  | 'custom'
  | 'reports';

interface AnalyticsStore {
  timeRange: AnalyticsTimeRange;
  startDate: string | null;
  endDate: string | null;
  selectedOwnerId: string | null;
  selectedPipelineId: string | null;
  activeTab: AnalyticsTab;

  setTimeRange: (range: AnalyticsTimeRange) => void;
  setDateInterval: (start: string | null, end: string | null) => void;
  setSelectedOwnerId: (id: string | null) => void;
  setSelectedPipelineId: (id: string | null) => void;
  setActiveTab: (tab: AnalyticsTab) => void;
  resetFilters: () => void;
}

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  timeRange: '30d',
  startDate: null,
  endDate: null,
  selectedOwnerId: null,
  selectedPipelineId: null,
  activeTab: 'overview',

  setTimeRange: (timeRange) => set({ timeRange }),
  setDateInterval: (startDate, endDate) => set({ startDate, endDate, timeRange: 'custom' }),
  setSelectedOwnerId: (selectedOwnerId) => set({ selectedOwnerId }),
  setSelectedPipelineId: (selectedPipelineId) => set({ selectedPipelineId }),
  setActiveTab: (activeTab) => set({ activeTab }),
  resetFilters: () =>
    set({
      timeRange: '30d',
      startDate: null,
      endDate: null,
      selectedOwnerId: null,
      selectedPipelineId: null,
    }),
}));
