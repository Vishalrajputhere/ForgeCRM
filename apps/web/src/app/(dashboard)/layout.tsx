'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/navigation/sidebar';
import { Topbar } from '@/components/navigation/topbar';
import { MobileBottomNav } from '@/components/navigation/mobile-nav';
import { NotificationCenter } from '@/components/navigation/notifications';
import { CommandPaletteV2 } from '@/components/navigation/command-palette-v2';
import { PageTransition } from '@/components/ui/motion';
import { useNavigationStore } from '@/stores/navigation-store';
import { useWorkspace } from '@/hooks/use-workspace';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { Spinner } from '@/components/ui/feedback';

function LoadingScreen({ label }: { label?: string }) {
  return (
    <div className="flex h-screen items-center justify-center bg-canvas">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="h-6 w-6 text-accent" />
        {label && <p className="text-xs text-muted font-mono">{label}</p>}
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { readonly children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { currentWorkspace } = useWorkspace();
  const isStoreHydrated = useWorkspaceStore((s) => s._hydrated);

  const { notificationOpen, setNotificationOpen } = useNavigationStore();
  const [cmdOpen, setCmdOpen] = useState(false);

  // Global Keyboard Shortcuts (Cmd+K, Slash, and G-Chord sequence navigation)
  useEffect(() => {
    let pendingGChord = false;
    let chordTimer: NodeJS.Timeout | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger shortcuts when typing inside form input fields
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const key = e.key.toLowerCase();

      // Cmd+K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && key === 'k') {
        e.preventDefault();
        setCmdOpen((open) => !open);
        return;
      }

      // Slash '/' to open Cmd+K search
      if (key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setCmdOpen(true);
        return;
      }

      // G-chord sequence navigation
      if (pendingGChord) {
        pendingGChord = false;
        if (chordTimer) clearTimeout(chordTimer);

        if (key === 'd') { e.preventDefault(); router.push('/dashboard'); }
        else if (key === 'c') { e.preventDefault(); router.push('/companies'); }
        else if (key === 'l') { e.preventDefault(); router.push('/leads'); }
        else if (key === 'e') { e.preventDefault(); router.push('/deals'); }
        else if (key === 't') { e.preventDefault(); router.push('/tasks'); }
        else if (key === 's') { e.preventDefault(); router.push('/storage'); }
        else if (key === 'w') { e.preventDefault(); router.push('/workspace'); }
        return;
      }

      if (key === 'g' && !e.metaKey && !e.ctrlKey) {
        pendingGChord = true;
        chordTimer = setTimeout(() => {
          pendingGChord = false;
        }, 1000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (chordTimer) clearTimeout(chordTimer);
    };
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return <LoadingScreen />;
  if (!isStoreHydrated) return <LoadingScreen label="Restoring session…" />;
  if (!currentWorkspace) return <LoadingScreen label="Loading workspace…" />;

  return (
    <div className="flex h-screen overflow-hidden bg-canvas text-primary">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Sticky Topbar */}
        <Topbar onOpenCmdK={() => setCmdOpen(true)} />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-6">
          <PageTransition key={usePathname()}>
            {children}
          </PageTransition>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Notifications Drawer */}
      <NotificationCenter open={notificationOpen} onClose={() => setNotificationOpen(false)} />

      {/* Command Palette V2 Overlay */}
      <CommandPaletteV2 open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}
