'use client';

import * as React from 'react';
import { Command } from 'cmdk';
import {
  LayoutDashboard,
  Zap,
  Building2,
  Users,
  TrendingUp,
  CheckSquare2,
  Settings2,
  Plus,
  Search,
  HardDrive,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CommandItem {
  id: string;
  label: string;
  group: 'navigation' | 'actions' | 'recent';
  icon: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
}

// ── Command Palette ────────────────────────────────────────────────────────────

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [search, setSearch] = React.useState('');

  // Reset search on open
  React.useEffect(() => {
    if (open) setSearch('');
  }, [open]);

  // Close on outside click / Escape is handled by cmdk
  const navigate = (href: string) => {
    router.push(href);
    onClose();
  };

  const navItems: CommandItem[] = [
    { id: 'dashboard', label: 'Dashboard', group: 'navigation', icon: <LayoutDashboard className="h-4 w-4" strokeWidth={1.5} />, shortcut: 'G D', onSelect: () => navigate('/dashboard') },
    { id: 'leads',     label: 'Leads',     group: 'navigation', icon: <Zap className="h-4 w-4" strokeWidth={1.5} />,             shortcut: 'G L', onSelect: () => navigate('/leads') },
    { id: 'companies', label: 'Companies', group: 'navigation', icon: <Building2 className="h-4 w-4" strokeWidth={1.5} />,       shortcut: 'G C', onSelect: () => navigate('/companies') },
    { id: 'contacts',  label: 'Contacts',  group: 'navigation', icon: <Users className="h-4 w-4" strokeWidth={1.5} />,           shortcut: 'G O', onSelect: () => navigate('/contacts') },
    { id: 'deals',     label: 'Deals',     group: 'navigation', icon: <TrendingUp className="h-4 w-4" strokeWidth={1.5} />,      shortcut: 'G E', onSelect: () => navigate('/deals') },
    { id: 'tasks',     label: 'Tasks',     group: 'navigation', icon: <CheckSquare2 className="h-4 w-4" strokeWidth={1.5} />,    shortcut: 'G T', onSelect: () => navigate('/tasks') },
    { id: 'storage',   label: 'Storage Manager', group: 'navigation', icon: <HardDrive className="h-4 w-4" strokeWidth={1.5} />, shortcut: 'G S', onSelect: () => navigate('/storage') },
    { id: 'workspace', label: 'Workspace Settings', group: 'navigation', icon: <Settings2 className="h-4 w-4" strokeWidth={1.5} />, onSelect: () => navigate('/workspace') },
  ];

  const actionItems: CommandItem[] = [
    { id: 'new-lead',    label: 'New Lead',    group: 'actions', icon: <Plus className="h-4 w-4" strokeWidth={1.5} />, onSelect: () => { navigate('/leads'); onClose(); } },
    { id: 'new-contact', label: 'New Contact', group: 'actions', icon: <Plus className="h-4 w-4" strokeWidth={1.5} />, onSelect: () => { navigate('/contacts'); onClose(); } },
    { id: 'new-deal',    label: 'New Deal',    group: 'actions', icon: <Plus className="h-4 w-4" strokeWidth={1.5} />, onSelect: () => { navigate('/deals'); onClose(); } },
  ];

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette */}
      <div className="fixed left-1/2 top-[20vh] z-50 w-full max-w-lg -translate-x-1/2 animate-scale-in">
        <Command
          className="overflow-hidden rounded-xl border border-[rgba(255,255,255,0.1)] bg-surface-overlay shadow-xl"
          shouldFilter={true}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              onClose();
            }
          }}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)] px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-text-tertiary" strokeWidth={1.5} />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search or jump to..."
              className="flex-1 bg-transparent text-body text-text-primary placeholder:text-text-tertiary focus:outline-none"
            />
            <kbd className="kbd">Esc</kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="px-4 py-8 text-center text-caption text-text-tertiary">
              No results for &ldquo;{search}&rdquo;
            </Command.Empty>

            {/* Navigation group */}
            <Command.Group
              heading="Navigation"
              className="mb-1"
            >
              <CommandGroupLabel>Navigation</CommandGroupLabel>
              {navItems.map((item) => (
                <CommandListItem key={item.id} item={item} />
              ))}
            </Command.Group>

            {/* Actions group */}
            <Command.Group heading="Actions">
              <CommandGroupLabel>Create</CommandGroupLabel>
              {actionItems.map((item) => (
                <CommandListItem key={item.id} item={item} />
              ))}
            </Command.Group>
          </Command.List>

          {/* Footer */}
          <div className="flex items-center gap-4 border-t border-[rgba(255,255,255,0.06)] px-4 py-2.5">
            <span className="flex items-center gap-1.5 text-caption text-text-tertiary">
              <kbd className="kbd">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1.5 text-caption text-text-tertiary">
              <kbd className="kbd">↵</kbd> Open
            </span>
          </div>
        </Command>
      </div>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CommandGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 pb-1 pt-1.5 text-micro font-medium text-text-tertiary uppercase tracking-wider">
      {children}
    </div>
  );
}

function CommandListItem({ item }: { item: CommandItem }) {
  return (
    <Command.Item
      value={item.label}
      onSelect={item.onSelect}
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-body text-text-secondary',
        'transition-colors duration-100',
        'aria-selected:bg-[rgba(251,191,36,0.08)] aria-selected:text-text-primary',
        'hover:bg-[rgba(255,255,255,0.04)]',
      )}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[rgba(255,255,255,0.08)] bg-surface-base text-text-tertiary">
        {item.icon}
      </span>
      <span className="flex-1">{item.label}</span>
      {item.shortcut && (
        <span className="flex items-center gap-1">
          {item.shortcut.split(' ').map((k, i) => (
            <kbd key={i} className="kbd">{k}</kbd>
          ))}
        </span>
      )}
    </Command.Item>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCommandPalette() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return { open, setOpen, onClose: () => setOpen(false) };
}
