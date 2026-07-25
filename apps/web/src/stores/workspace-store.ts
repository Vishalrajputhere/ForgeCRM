/**
 * ForgeCRM — Workspace Zustand Store
 *
 * Client-side active workspace state management.
 * Tracks active workspace ID and user workspace list.
 *
 * Documentation: docs/04_Frontend/404_STATE_MANAGEMENT.md
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { WorkspaceResponse } from '@/types';

interface WorkspaceStore {
  currentWorkspace: WorkspaceResponse | null;
  userWorkspaces: WorkspaceResponse[];

  setCurrentWorkspace: (workspace: WorkspaceResponse | null) => void;
  setUserWorkspaces: (workspaces: WorkspaceResponse[]) => void;
  clearWorkspaceState: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      currentWorkspace: null,
      userWorkspaces: [],

      setCurrentWorkspace: (workspace) =>
        set({
          currentWorkspace: workspace,
        }),

      setUserWorkspaces: (workspaces) =>
        set((state) => ({
          userWorkspaces: workspaces,
          // Set first workspace as current if none selected or current is invalid
          currentWorkspace:
            state.currentWorkspace !== null &&
            workspaces.some((w) => w.id === state.currentWorkspace?.id)
              ? state.currentWorkspace
              : workspaces[0] ?? null,
        })),

      clearWorkspaceState: () =>
        set({
          currentWorkspace: null,
          userWorkspaces: [],
        }),
    }),
    {
      name: 'forge_workspace_storage',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : ({} as Storage),
      ),
    },
  ),
);
