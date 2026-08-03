/**
 * ForgeCRM — Workspace Zustand Store
 *
 * Client-side active workspace state management.
 * Tracks active workspace ID and user workspace list.
 *
 * IMPORTANT — Hydration:
 * Zustand persist with localStorage is ASYNCHRONOUS in Next.js App Router.
 * The store initializes with default values (currentWorkspace = null) on the
 * first render, then reads localStorage in a useEffect (onRehydrateStorage).
 *
 * Components that need to gate rendering on workspace availability MUST check
 * `isHydrated` before reading `currentWorkspace`.
 *
 * Documentation: docs/04_Frontend/404_STATE_MANAGEMENT.md
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { WorkspaceResponse } from '@/types';

interface WorkspaceStore {
  currentWorkspace: WorkspaceResponse | null;
  userWorkspaces: WorkspaceResponse[];
  /** True once Zustand has finished reading from localStorage. */
  _hydrated: boolean;

  setCurrentWorkspace: (workspace: WorkspaceResponse | null) => void;
  setUserWorkspaces: (workspaces: WorkspaceResponse[]) => void;
  clearWorkspaceState: () => void;
  _setHydrated: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      currentWorkspace: null,
      userWorkspaces: [],
      _hydrated: false,

      setCurrentWorkspace: (workspace) =>
        set({
          currentWorkspace: workspace,
        }),

      setUserWorkspaces: (workspaces) =>
        set((state) => ({
          userWorkspaces: workspaces,
          // Keep existing workspace if it exists in the list, otherwise use the first
          currentWorkspace:
            state.currentWorkspace !== null &&
            workspaces.some((w) => w.id === state.currentWorkspace?.id)
              ? state.currentWorkspace
              : (workspaces[0] ?? null),
        })),

      clearWorkspaceState: () =>
        set({
          currentWorkspace: null,
          userWorkspaces: [],
        }),

      _setHydrated: () => set({ _hydrated: true }),
    }),
    {
      name: 'forge_workspace_storage',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : ({} as Storage),
      ),
      // Only persist workspace data fields, not the hydration flag
      partialize: (state) => ({
        currentWorkspace: state.currentWorkspace,
        userWorkspaces: state.userWorkspaces,
      }),
      onRehydrateStorage: () => (state) => {
        // Called after localStorage has been read and state has been merged.
        // Set the hydration flag so components know the store is ready.
        state?._setHydrated();
      },
    },
  ),
);

/**
 * Reads the workspace ID from the persisted store in a way that works
 * even before Zustand has completed its async rehydration.
 *
 * Priority order:
 * 1. Zustand in-memory state (fastest, post-hydration)
 * 2. localStorage direct read (handles pre-hydration window)
 * 3. undefined (workspace genuinely not available)
 */
export function getWorkspaceIdSync(): string | undefined {
  // 1. Try in-memory Zustand state first
  const storeState = useWorkspaceStore.getState();
  const wsId =
    storeState.currentWorkspace?.id ?? storeState.userWorkspaces[0]?.id;

  if (wsId) return wsId;

  // 2. Direct localStorage fallback (handles Zustand hydration window)
  // NOTE: Zustand persist stores data as { state: { ... }, version: 0 }
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('forge_workspace_storage');
      if (raw) {
        const parsed = JSON.parse(raw) as {
          state?: {
            currentWorkspace?: { id?: string };
            userWorkspaces?: { id?: string }[];
          };
        };
        return (
          parsed.state?.currentWorkspace?.id ??
          parsed.state?.userWorkspaces?.[0]?.id ??
          undefined
        );
      }
    } catch {
      // Ignore parse errors
    }
  }

  return undefined;
}
