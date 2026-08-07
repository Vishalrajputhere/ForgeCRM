'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  leads: 'Leads',
  companies: 'Companies',
  contacts: 'Contacts',
  deals: 'Deals',
  tasks: 'Tasks',
  storage: 'Storage Manager',
  automations: 'Workflow Automations',
  workspace: 'Workspace Settings',
  'design-system': 'Design System',
};

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-secondary">
        <Home className="h-3.5 w-3.5 text-accent" />
        <span className="font-medium">Dashboard</span>
      </div>
    );
  }

  const breadcrumbItems = segments.map((segment, idx) => {
    const href = '/' + segments.slice(0, idx + 1).join('/');
    const label = ROUTE_LABELS[segment] || (segment.length > 16 ? `${segment.slice(0, 8)}…` : segment);
    const isLast = idx === segments.length - 1;

    return { href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
      <Link href="/dashboard" className="flex items-center gap-1 text-muted hover:text-primary transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {breadcrumbItems.map((item) => (
        <React.Fragment key={item.href}>
          <ChevronRight className="h-3 w-3 text-muted shrink-0" />
          {item.isLast ? (
            <span className="font-semibold text-primary">{item.label}</span>
          ) : (
            <Link href={item.href} className="text-muted hover:text-primary transition-colors">
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
