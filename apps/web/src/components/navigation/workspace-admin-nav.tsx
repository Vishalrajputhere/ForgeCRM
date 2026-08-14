'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2, Sliders, Users, FolderTree, Shield, ShieldAlert,
  Puzzle, FileText, BarChart3
} from 'lucide-react';

const ADMIN_NAV_ITEMS = [
  { name: 'Overview', href: '/workspace/admin', icon: Building2 },
  { name: 'General Settings', href: '/workspace/settings', icon: Sliders },
  { name: 'Members & Invites', href: '/workspace/members', icon: Users },
  { name: 'Teams & Hierarchy', href: '/workspace/teams', icon: FolderTree },
  { name: 'Roles & Permissions', href: '/workspace/roles', icon: Shield },
  { name: 'Integrations', href: '/workspace/integrations', icon: Puzzle },
  { name: 'Security & Sessions', href: '/workspace/security', icon: ShieldAlert },
  { name: 'Audit Logs', href: '/workspace/audit', icon: FileText },
  { name: 'Usage & Limits', href: '/workspace/usage', icon: BarChart3 },
];

export function WorkspaceAdminNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border-default bg-surface/50 backdrop-blur-sm -mx-4 px-4 md:-mx-6 md:px-6 mb-6 overflow-x-auto no-scrollbar">
      <nav className="flex items-center gap-1 min-w-max py-2">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href === '/workspace/admin' && pathname === '/workspace');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-accent/10 text-accent border border-accent/30 shadow-xs'
                  : 'text-muted hover:text-primary hover:bg-surface-hover'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
