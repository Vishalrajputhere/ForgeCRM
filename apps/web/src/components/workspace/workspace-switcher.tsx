'use client';

import { useState } from 'react';

import { CreateWorkspaceModal } from '@/components/workspace/create-workspace-modal';
import { useWorkspace } from '@/hooks/use-workspace';

export function WorkspaceSwitcher(): React.JSX.Element {
  const { currentWorkspace, userWorkspaces, switchWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  if (currentWorkspace === null) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-800/40 px-3.5 py-2 text-xs text-slate-400">
        <div className="h-4 w-4 animate-spin rounded-full border border-slate-600 border-t-forge-500" />
        <span>Loading workspace...</span>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        {/* Switcher Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm font-medium text-white transition-all hover:bg-slate-700/80 focus:outline-none focus:ring-1 focus:ring-forge-500 shadow-sm"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-tr from-forge-600 to-indigo-500 text-xs font-bold text-white shadow-sm">
              {currentWorkspace.name[0]?.toUpperCase()}
            </div>
            <span className="truncate">{currentWorkspace.name}</span>
          </div>
          <svg
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-0 top-full z-50 mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-2xl backdrop-blur-xl space-y-1">
            <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Workspaces ({userWorkspaces.length})
            </div>
            <div className="max-h-56 overflow-y-auto space-y-0.5">
              {userWorkspaces.map((workspace) => {
                const isSelected = workspace.id === currentWorkspace.id;
                return (
                  <button
                    key={workspace.id}
                    type="button"
                    onClick={() => {
                      if (!isSelected) {
                        switchWorkspace(workspace);
                      }
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors ${
                      isSelected
                        ? 'bg-forge-500/20 text-forge-300 font-semibold border border-forge-500/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-800 text-xs font-medium border border-slate-700">
                        {workspace.name[0]?.toUpperCase()}
                      </div>
                      <span className="truncate">{workspace.name}</span>
                    </div>
                    {isSelected && (
                      <svg
                        className="h-4 w-4 shrink-0 text-forge-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Create Workspace Action */}
            <div className="pt-1.5 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsCreateModalOpen(true);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-forge-400 hover:bg-forge-500/10 hover:text-forge-300 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create New Workspace</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
