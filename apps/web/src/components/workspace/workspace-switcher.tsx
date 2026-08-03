'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';

import { CreateWorkspaceModal } from '@/components/workspace/create-workspace-modal';
import { useWorkspace } from '@/hooks/use-workspace';
import { cn } from '@/lib/cn';

export function WorkspaceSwitcher(): React.JSX.Element {
  const { currentWorkspace, userWorkspaces, switchWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  if (!currentWorkspace) {
    return (
      <div className="flex h-8 items-center gap-2 rounded-md border px-2.5 text-caption text-text-tertiary"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="h-3.5 w-3.5 animate-spin rounded-full border border-[rgba(255,255,255,0.08)] border-t-forge-500" />
        Loading...
      </div>
    );
  }

  // Workspace initial letter badge color
  const letter = currentWorkspace.name[0]?.toUpperCase() ?? 'W';

  return (
    <>
      <div className="relative">
        {/* Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex h-8 w-full items-center gap-2 rounded-md border px-2.5 text-label text-text-primary',
            'transition-all duration-100',
            'hover:border-[rgba(255,255,255,0.14)] hover:bg-[rgba(255,255,255,0.04)]',
            'focus:outline-none focus:ring-2 focus:ring-forge-500 focus:ring-offset-0',
            isOpen ? 'border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)]' : 'border-[rgba(255,255,255,0.08)]',
          )}
        >
          {/* Avatar */}
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-forge-500/20 text-micro font-semibold text-forge-400">
            {letter}
          </div>
          <span className="flex-1 truncate text-left">{currentWorkspace.name}</span>
          <ChevronsUpDown
            className={cn(
              'h-3.5 w-3.5 shrink-0 text-text-tertiary transition-transform duration-150',
              isOpen && 'rotate-180',
            )}
            strokeWidth={1.5}
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

            <div className="absolute left-0 top-full z-20 mt-1.5 w-full overflow-hidden rounded-lg border bg-surface-overlay shadow-md animate-scale-in"
              style={{ borderColor: 'var(--border-strong)' }}
            >
              {/* List */}
              <div className="max-h-52 overflow-y-auto p-1">
                {userWorkspaces.map((ws) => {
                  const isActive = ws.id === currentWorkspace.id;
                  return (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => {
                        if (!isActive) switchWorkspace(ws);
                        setIsOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-label transition-colors duration-100',
                        isActive
                          ? 'bg-forge-500/10 text-text-primary'
                          : 'text-text-secondary hover:bg-[rgba(255,255,255,0.04)] hover:text-text-primary',
                      )}
                    >
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-surface-base text-micro font-semibold text-text-secondary border"
                        style={{ borderColor: 'var(--border-default)' }}
                      >
                        {ws.name[0]?.toUpperCase()}
                      </div>
                      <span className="flex-1 truncate">{ws.name}</span>
                      {isActive && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-forge-400" strokeWidth={2} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Create action */}
              <div className="border-t p-1" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsCreateModalOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-label text-text-tertiary hover:bg-[rgba(255,255,255,0.04)] hover:text-text-primary transition-colors duration-100"
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-text-tertiary"
                    style={{ borderColor: 'var(--border-default)' }}
                  >
                    <Plus className="h-3 w-3" strokeWidth={2} />
                  </div>
                  <span>New workspace</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
