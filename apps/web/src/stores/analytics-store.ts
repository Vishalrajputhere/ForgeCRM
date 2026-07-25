/**
 * ForgeCRM — Analytics Zustand Store
 *
 * Client-side state management for selected reporting time range and active metrics filters.
 *
 * Documentation: docs/04_Frontend/404_STATE_MANAGEMENT.md
 */

import { create } from 'zustand';

interface AnalyticsStore {
  dateRange: '7d' | '30d' | '90d' | '1y';
  selectedPipelineId: string | null;

  setDateRange: (range: '7d' | '30d' | '90d' | '1y') => void;
  setSelectedPipelineId: (id: string | null) => void;
}

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  dateRange: '30d',
  selectedPipelineId: null,

  setDateRange: (dateRange) => set({ dateRange }),
  setSelectedPipelineId: (selectedPipelineId) => set({ selectedPipelineId }),
}));
