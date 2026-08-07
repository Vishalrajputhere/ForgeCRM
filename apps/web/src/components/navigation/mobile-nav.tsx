'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Zap, Building2, TrendingUp, Menu } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigation-store';
import { cn } from '@/lib/cn';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { toggleSidebar } = useNavigationStore();

  const mobileItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Leads', href: '/leads', icon: Zap },
    { label: 'Companies', href: '/companies', icon: Building2 },
    { label: 'Deals', href: '/deals', icon: TrendingUp },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-14 items-center justify-around border-t border-border-default bg-surface/90 backdrop-blur-md md:hidden">
      {mobileItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 text-[10px] font-medium transition-colors',
              isActive ? 'text-accent font-bold' : 'text-muted hover:text-primary'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
      <button
        onClick={toggleSidebar}
        className="flex flex-col items-center gap-1 text-[10px] font-medium text-muted hover:text-primary"
      >
        <Menu className="h-4 w-4" />
        <span>Menu</span>
      </button>
    </nav>
  );
}
