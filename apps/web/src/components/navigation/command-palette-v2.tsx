'use client';

import * as React from 'react';
import { Command } from 'cmdk';
import {
  LayoutDashboard,
  Zap,
  Building2,
  TrendingUp,
  Plus,
  Search,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNavigationStore } from '@/stores/navigation-store';

export function CommandPaletteV2({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [search, setSearch] = React.useState('');
  const { addRecent } = useNavigationStore();

  React.useEffect(() => {
    if (open) setSearch('');
  }, [open]);

  const navigate = (href: string, title: string, type: 'page' | 'company' | 'deal' = 'page') => {
    addRecent({ id: href, title, href, type });
    router.push(href);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed left-1/2 top-[15vh] z-50 w-full max-w-xl -translate-x-1/2 p-2">
        <Command
          className="overflow-hidden rounded-xl border border-border-strong bg-overlay shadow-2xl"
          shouldFilter={true}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
          }}
        >
          <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
            <Search className="h-4 w-4 text-muted shrink-0" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search companies, deals, contacts, routes, or press ESC…"
              className="w-full bg-transparent text-xs text-primary placeholder:text-muted focus:outline-none"
            />
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="px-4 py-6 text-center text-xs text-muted">
              No matching commands or database records found.
            </Command.Empty>

            <Command.Group heading="Navigation Routes" className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
              <Command.Item
                onSelect={() => navigate('/dashboard', 'Dashboard')}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-secondary hover:text-primary hover:bg-hover cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4 text-accent" />
                  <span>Dashboard</span>
                </div>
                <kbd className="rounded border border-border-subtle bg-sunken px-1.5 font-mono text-[10px] text-muted">G D</kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => navigate('/leads', 'Leads Directory')}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-secondary hover:text-primary hover:bg-hover cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <span>Leads Directory</span>
                </div>
                <kbd className="rounded border border-border-subtle bg-sunken px-1.5 font-mono text-[10px] text-muted">G L</kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => navigate('/companies', 'Company Directory')}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-secondary hover:text-primary hover:bg-hover cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-sky-400" />
                  <span>Company Directory</span>
                </div>
                <kbd className="rounded border border-border-subtle bg-sunken px-1.5 font-mono text-[10px] text-muted">G C</kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => navigate('/deals', 'Sales Kanban & Deals')}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-secondary hover:text-primary hover:bg-hover cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-400" />
                  <span>Sales Kanban & Deals</span>
                </div>
                <kbd className="rounded border border-border-subtle bg-sunken px-1.5 font-mono text-[10px] text-muted">G E</kbd>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Quick Actions" className="mt-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
              <Command.Item
                onSelect={() => navigate('/leads', 'Create Lead')}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-secondary hover:text-primary hover:bg-hover cursor-pointer"
              >
                <Plus className="h-4 w-4 text-accent" />
                <span>Create New Lead Account</span>
              </Command.Item>
              <Command.Item
                onSelect={() => navigate('/deals', 'Create Deal')}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-secondary hover:text-primary hover:bg-hover cursor-pointer"
              >
                <Plus className="h-4 w-4 text-accent" />
                <span>Create New Sales Deal</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </>
  );
}
