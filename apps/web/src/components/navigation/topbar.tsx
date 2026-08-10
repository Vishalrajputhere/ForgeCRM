'use client';

import React, { useState } from 'react';
import { Search, Bell, LogOut, Settings, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Breadcrumb } from '@/components/navigation/breadcrumb';
import { QuickCreateMenu } from '@/components/navigation/quick-create';
import { useNavigationStore } from '@/stores/navigation-store';
import { useAuth } from '@/hooks/use-auth';
import { IconButton } from '@/components/ui/button';
import { Avatar } from '@/components/ui/badge';
import { Caption, Text } from '@/components/ui/typography';

export function Topbar({ onOpenCmdK }: { onOpenCmdK: () => void }) {
  const { user, logout } = useAuth();
  const { notificationOpen, setNotificationOpen } = useNavigationStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-border-default bg-surface/80 backdrop-blur-md px-4 md:px-6">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Breadcrumb />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Global Search Trigger */}
        <button
          onClick={onOpenCmdK}
          className="hidden sm:flex items-center gap-2 rounded-lg border border-border-default bg-sunken px-3 py-1.5 text-xs text-muted hover:text-primary hover:border-border-strong transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search or jump to…</span>
          <kbd className="ml-2 rounded border border-border-strong bg-overlay px-1.5 font-mono text-[10px]">Cmd+K</kbd>
        </button>

        {/* AI Quick Copilot Action */}
        <Link
          href="/ai/copilot"
          className="hidden md:flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1.5 text-xs font-semibold text-accent hover:bg-accent/20 transition-all shadow-xs"
          title="Open AI Sales Copilot"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>AI Copilot</span>
        </Link>

        {/* Quick Create Menu */}
        <QuickCreateMenu />

        {/* Notifications */}
        <div className="relative">
          <IconButton
            icon={<Bell className="h-4 w-4" />}
            variant="ghost"
            size="sm"
            aria-label="Open notifications"
            onClick={() => setNotificationOpen(!notificationOpen)}
          />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent animate-pulse" />
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-full p-0.5 hover:ring-2 hover:ring-accent transition-all cursor-pointer"
          >
            <Avatar name={user ? `${user.first_name} ${user.last_name ?? ''}` : 'User'} size="sm" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border-default bg-overlay p-1.5 shadow-xl animate-in fade-in duration-100">
              <div className="px-3 py-2 border-b border-border-subtle mb-1">
                <Text variant="body-s" className="font-semibold text-primary">
                  {user ? `${user.first_name} ${user.last_name ?? ''}` : 'User'}
                </Text>
                <Caption color="muted" className="block truncate">{user?.email}</Caption>
              </div>
              <a href="/workspace" className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-secondary hover:text-primary hover:bg-hover transition-colors">
                <Settings className="h-3.5 w-3.5 text-muted" /> Settings
              </a>
              <button
                onClick={() => { void logout(); }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-status-danger-fg hover:bg-status-danger-bg transition-colors mt-1"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
