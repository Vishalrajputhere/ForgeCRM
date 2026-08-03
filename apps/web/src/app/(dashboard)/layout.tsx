'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { GlobalSearchBar } from '@/components/common/global-search-bar';
import { WorkspaceSwitcher } from '@/components/workspace/workspace-switcher';
import { useAuth } from '@/hooks/use-auth';
import { useWorkspace } from '@/hooks/use-workspace';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaceStore } from '@/stores/workspace-store';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'Leads', href: '/leads', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { name: 'Companies', href: '/companies', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { name: 'Contacts', href: '/contacts', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { name: 'Deals', href: '/deals', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { name: 'Tasks', href: '/tasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { name: 'Workspace', href: '/workspace', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

// ── Shared loading spinner ────────────────────────────────────────────────────
function LoadingScreen({ label }: { label?: string }) {
  return (
    <div className="flex h-screen items-center justify-center bg-[#0a0f1e]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-forge-500" />
        {label && <p className="text-xs text-slate-400">{label}</p>}
      </div>
    </div>
  );
}

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

  // ── Workspace initialization ───────────────────────────────────────────────
  // useWorkspace() fires the React Query to load workspaces AND updates the
  // Zustand store. We use the returned currentWorkspace to gate rendering.
  const { currentWorkspace } = useWorkspace();

  // _hydrated is true once Zustand has completed reading from localStorage.
  // Before this, currentWorkspace may be null even if localStorage has data.
  const isStoreHydrated = useWorkspaceStore((s) => s._hydrated);

  // ── Auth Guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  // 1. Not authenticated → redirect (show spinner during redirect)
  if (!isAuthenticated) {
    return <LoadingScreen />;
  }

  // 2. Store hasn't hydrated from localStorage yet → wait
  //    This is the brief window after page load where Zustand reads localStorage.
  //    We must not render CRM pages here or mutations will have no workspaceId.
  if (!isStoreHydrated) {
    return <LoadingScreen label="Restoring workspace..." />;
  }

  // 3. Guarantee active workspace before rendering any CRM page
  //    Dashboard layout MUST NOT render children until currentWorkspace is non-null.
  if (!currentWorkspace) {
    return <LoadingScreen label="Initializing workspace..." />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0f1e] text-slate-100">
      {/* Sidebar Navigation */}
      <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between p-4">
        <div className="space-y-6">
          {/* Brand Logo & Workspace Switcher */}
          <div className="space-y-4">
            <Link href="/dashboard" className="flex items-center gap-2 px-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-forge-600 to-indigo-500 font-bold text-white shadow-md">
                F
              </div>
              <span className="text-lg font-bold tracking-tight text-white">ForgeCRM</span>
            </Link>
            <WorkspaceSwitcher />
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-forge-600/20 text-forge-400 font-semibold border border-forge-500/30'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <svg
                    className={`h-5 w-5 ${isActive ? 'text-forge-400' : 'text-slate-400'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="relative border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex w-full items-center justify-between gap-3 rounded-lg p-2 text-left transition-colors hover:bg-slate-800/80"
          >
            <div className="flex items-center gap-2.5 truncate">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forge-500 text-xs font-bold text-white">
                {user?.first_name?.[0] || 'U'}
              </div>
              <div className="truncate">
                <div className="text-sm font-medium text-white truncate">
                  {user ? `${user.first_name} ${user.last_name}` : 'User Account'}
                </div>
                <div className="text-xs text-slate-400 truncate">{user?.email}</div>
              </div>
            </div>
          </button>

          {userMenuOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-full rounded-lg border border-slate-800 bg-slate-900 p-1 shadow-xl backdrop-blur-xl">
              <button
                type="button"
                onClick={() => logout()}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-rose-400 hover:bg-slate-800"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/40 px-6 backdrop-blur-xl">
          <GlobalSearchBar />
          <div className="flex items-center gap-4">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Production Live</span>
          </div>
        </header>

        {/* Dynamic Page View — only rendered after workspace is confirmed ready */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
