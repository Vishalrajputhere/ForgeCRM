/**
 * ForgeCRM — CRM Core Zustand Store
 *
 * Client-side state management for active CRM views, filters,
 * selected sales pipelines, and entity caches.
 *
 * Documentation: docs/04_Frontend/404_STATE_MANAGEMENT.md
 */

import { create } from 'zustand';

import type {
  CompanyResponse,
  ContactResponse,
  DealResponse,
  LeadResponse,
  PipelineResponse,
  TaskResponse,
} from '@/types';

interface CRMStore {
  selectedPipelineId: string | null;
  companies: CompanyResponse[];
  contacts: ContactResponse[];
  leads: LeadResponse[];
  deals: DealResponse[];
  tasks: TaskResponse[];
  pipelines: PipelineResponse[];

  setSelectedPipelineId: (id: string | null) => void;
  setCompanies: (companies: CompanyResponse[]) => void;
  setContacts: (contacts: ContactResponse[]) => void;
  setLeads: (leads: LeadResponse[]) => void;
  setDeals: (deals: DealResponse[]) => void;
  setTasks: (tasks: TaskResponse[]) => void;
  setPipelines: (pipelines: PipelineResponse[]) => void;
}

export const useCRMStore = create<CRMStore>((set) => ({
  selectedPipelineId: null,
  companies: [],
  contacts: [],
  leads: [],
  deals: [],
  tasks: [],
  pipelines: [],

  setSelectedPipelineId: (id) => set({ selectedPipelineId: id }),
  setCompanies: (companies) => set({ companies }),
  setContacts: (contacts) => set({ contacts }),
  setLeads: (leads) => set({ leads }),
  setDeals: (deals) => set({ deals }),
  setTasks: (tasks) => set({ tasks }),
  setPipelines: (pipelines) => set({ pipelines }),
}));
