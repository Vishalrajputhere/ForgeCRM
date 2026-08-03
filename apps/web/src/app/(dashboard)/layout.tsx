'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Zap,
  Building2,
  Users,
  TrendingUp,
  CheckSquare2,
  Settings2,
  Search,
  LogOut,
  ChevronDown,
  CircleUser,
} from 'lucide-react';

import { CommandPalette, useCommandPalette } from '@/components/ui/command-palette';
import { WorkspaceSwitcher } from '@/components/workspace/workspace-switcher';
import { useAuth } from '@/hooks/use-auth';
import { useWorkspace } from '@/hooks/use-workspace';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { cn } from '@/lib/cn';

// ── Navigation Config ─────────────────────────────────────────────────────────

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads',     href: '/leads',     icon: Zap },
  { name: 'Companies', href: '/companies', icon: Building2 },
  { name: 'Contacts',  href: '/contacts',  icon: Users },
  { name: 'Deals',     href: '/deals',     icon: TrendingUp },
  { name: 'Tasks',     href: '/tasks',     icon: CheckSquare2 },
] as const;

// ── Loading Screen ────────────────────────────────────────────────────────────

function LoadingScreen({ label }: { label?: string }) {
  return (
    <div className="flex h-screen items-center justify-center bg-surface-base">
      <div className="flex flex-col items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[rgba(255,255,255,0.08)] border-t-forge-500" />
        {label && (
          <p className="text-caption text-text-tertiary">{label}</p>
        )}
      </div>
    </div>
  );
}

// ── Main Layout ───────────────────────────────────────────────────────────────

export default function DashboardLayout({
  children,
}: {
  readonly children: React.ReactNode;
}): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { open: cmdOpen, onClose: cmdClose, setOpen: setCmdOpen } = useCommandPalette();

  const { currentWorkspace } = useWorkspace();
  const isStoreHydrated = useWorkspaceStore((s) => s._hydrated);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return <LoadingScreen />;
  if (!isStoreHydrated) return <LoadingScreen label="Restoring session..." />;
  if (!currentWorkspace) return <LoadingScreen label="Loading workspace..." />;

  const initials = user?.first_name
    ? `${user.first_name[0]}${user.last_name?.[0] ?? ''}`.toUpperCase()
    : 'U';

  return (
    <>
      <CommandPalette open={cmdOpen} onClose={cmdClose} />

      <div className="flex h-screen overflow-hidden bg-surface-base">
        {/* ── Sidebar ────────────────────────────────────────────────────────── */}
        <aside
          className="flex w-sidebar shrink-0 flex-col border-r bg-surface-overlay"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          {/* Brand + Workspace */}
          <div className="flex flex-col gap-3 p-4 pb-3">
            {/* Logo */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 rounded-md px-1 py-0.5 transition-colors hover:bg-[rgba(255,255,255,0.04)]"
            >
              {/* Wordmark icon — geometric forge anvil shape */}
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-forge-500">
                <svg className="h-3.5 w-3.5 text-[#0e0e10]" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
                  <path d="M7 1L1 7h4v6l8-8H9V1H7z"/>
                </svg>
              </div>
              <span className="text-h3 text-text-primary tracking-[-0.02em]">ForgeCRM</span>
            </Link>

            {/* Workspace Switcher */}
            <WorkspaceSwitcher />
          </div>

          {/* Divider */}
          <div className="mx-4 h-px bg-[rgba(255,255,255,0.04)]" />

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3">
            <div className="space-y-0.5">
              {navigation.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'group flex h-8 items-center gap-2.5 rounded-md px-2.5 text-label transition-colors duration-100',
                      isActive
                        ? 'bg-[rgba(251,191,36,0.1)] text-forge-400'
                        : 'text-text-tertiary hover:bg-[rgba(255,255,255,0.04)] hover:text-text-primary',
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors duration-100',
                        isActive ? 'text-forge-400' : 'text-text-tertiary group-hover:text-text-secondary',
                      )}
                      strokeWidth={isActive ? 2 : 1.5}
                    />
                    <span>{item.name}</span>
                    {isActive && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-forge-500" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Settings separator */}
            <div className="mt-3 space-y-0.5 border-t border-[rgba(255,255,255,0.04)] pt-3">
              <Link
                href="/workspace"
                className={cn(
                  'group flex h-8 items-center gap-2.5 rounded-md px-2.5 text-label transition-colors duration-100',
                  pathname.startsWith('/workspace')
                    ? 'bg-[rgba(251,191,36,0.1)] text-forge-400'
                    : 'text-text-tertiary hover:bg-[rgba(255,255,255,0.04)] hover:text-text-primary',
                )}
              >
                <Settings2
                  className={cn(
                    'h-4 w-4 shrink-0',
                    pathname.startsWith('/workspace') ? 'text-forge-400' : 'text-text-tertiary group-hover:text-text-secondary',
                  )}
                  strokeWidth={1.5}
                />
                <span>Workspace</span>
              </Link>
            </div>
          </nav>

          {/* User footer */}
          <div className="p-3 pt-0">
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors duration-100 hover:bg-[rgba(255,255,255,0.04)]"
              >
                {/* Avatar */}
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forge-500/20 text-micro font-semibold text-forge-400 ring-1 ring-forge-500/30">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-label text-text-primary truncate">
                    {user ? `${user.first_name} ${user.last_name ?? ''}`.trim() : 'User'}
                  </p>
                  <p className="text-caption text-text-tertiary truncate">{user?.email}</p>
                </div>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 shrink-0 text-text-tertiary transition-transform duration-150',
                    userMenuOpen && 'rotate-180',
                  )}
                  strokeWidth={1.5}
                />
              </button>

              {/* User dropdown */}
              {userMenuOpen && (
                <div className="absolute bottom-full left-0 mb-1.5 w-full animate-slide-down overflow-hidden rounded-lg border bg-surface-overlay shadow-lg"
                  style={{ borderColor: 'var(--border-default)' }}
                >
                  <div className="p-1">
                    <button
                      type="button"
                      onClick={() => { setUserMenuOpen(false); void logout(); }}
                      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-label text-text-secondary transition-colors hover:bg-[rgba(239,68,68,0.08)] hover:text-red-400"
                    >
                      <LogOut className="h-4 w-4" strokeWidth={1.5} />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ── Main area ──────────────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header
            className="flex h-header shrink-0 items-center justify-between border-b px-5"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--surface-base)' }}
          >
            {/* Search trigger */}
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2.5 rounded-md border bg-surface-sunken px-3 py-1.5 text-label text-text-tertiary transition-all hover:border-[rgba(255,255,255,0.14)] hover:text-text-secondary"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <Search className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>Search or jump to...</span>
              <div className="ml-6 flex items-center gap-1">
                <kbd className="kbd">⌘</kbd>
                <kbd className="kbd">K</kbd>
              </div>
            </button>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-caption text-text-tertiary">
                <CircleUser className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>{currentWorkspace.name}</span>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
