'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Zap,
  Building2,
  Users,
  TrendingUp,
  HardDrive,
  Cpu,
  Settings2,
  ChevronLeft,
  ChevronRight,
  Star,
  Sparkles,
  ShieldAlert,
  Target,
  Mail,
  Crown,
  Terminal,
  Shield,
  Bot,
  Radio,
  Brain,
  Server,
  FolderTree,
  Puzzle,
  FileText,
  BarChart3,
  Package,
} from 'lucide-react';

import { useNavigationStore } from '@/stores/navigation-store';
import { usePermissions } from '@/hooks/use-permissions';
import { useCRM } from '@/hooks/use-crm';
import { useProducts } from '@/hooks/use-products';
import { WorkspaceSwitcher } from '@/components/workspace/workspace-switcher';
import { Caption } from '@/components/ui/typography';
import { cn } from '@/lib/cn';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  count?: number;
  permission?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'CRM Directory',
    items: [
      { name: 'Leads', href: '/leads', icon: Zap, permission: 'leads.read' },
      { name: 'Companies', href: '/companies', icon: Building2, permission: 'companies.read' },
      { name: 'Contacts', href: '/contacts', icon: Users, permission: 'contacts.read' },
      { name: 'Deals', href: '/deals', icon: TrendingUp, permission: 'deals.read' },
      { name: 'Products', href: '/products', icon: Package, permission: 'products.read' },
    ],
  },
  {
    label: 'AI Subsystem',
    items: [
      { name: 'Sales Copilot', href: '/ai', icon: Sparkles, permission: 'ai.use' },
      { name: 'Deal Coach', href: '/ai/deal-coach', icon: ShieldAlert, permission: 'ai.use' },
      { name: 'Lead Qualification', href: '/ai/lead-qualification', icon: Target, permission: 'ai.use' },
      { name: 'Forecast AI', href: '/ai/forecast', icon: TrendingUp, permission: 'ai.use' },
      { name: 'Email Assistant', href: '/ai/email', icon: Mail, permission: 'ai.use' },
      { name: 'Executive Copilot', href: '/ai/executive', icon: Crown, permission: 'ai.use' },
      { name: 'Autonomous Agents', href: '/ai/agents', icon: Bot, permission: 'ai.agents.run' },
      { name: 'AI Event Center', href: '/ai/events', icon: Radio, permission: 'ai.use' },
      { name: 'AI Memory Manager', href: '/ai/memory', icon: Brain, permission: 'ai.memory.manage' },
      { name: 'AI Debug Console', href: '/ai/debug', icon: Terminal, permission: 'ai.admin.view' },
      { name: 'AI Governance Admin', href: '/ai/admin', icon: Shield, permission: 'ai.admin.manage' },
    ],
  },
  {
    label: 'Enterprise Administration',
    items: [
      { name: 'Workspace Console', href: '/workspace/admin', icon: Building2, permission: 'workspace.read' },
      { name: 'Members & Invites', href: '/workspace/members', icon: Users, permission: 'users.read' },
      { name: 'Teams & Hierarchy', href: '/workspace/teams', icon: FolderTree, permission: 'teams.read' },
      { name: 'Roles & Permissions', href: '/workspace/roles', icon: Shield, permission: 'roles.read' },
      { name: 'Integrations', href: '/workspace/integrations', icon: Puzzle, permission: 'integrations.read' },
      { name: 'Security Controls', href: '/workspace/security', icon: ShieldAlert, permission: 'security.read' },
      { name: 'Audit Logs', href: '/workspace/audit', icon: FileText, permission: 'audit.read' },
      { name: 'Usage & Limits', href: '/workspace/usage', icon: BarChart3, permission: 'usage.read' },
      { name: 'Background Jobs', href: '/admin/jobs', icon: Server, permission: 'jobs.read' },
      { name: 'Storage', href: '/storage', icon: HardDrive, permission: 'storage.read' },
      { name: 'Automations', href: '/automations', icon: Cpu, permission: 'automations.read' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, favorites } = useNavigationStore();
  const { can } = usePermissions();
  const { leads = [], companies = [], contacts = [], deals = [] } = useCRM();
  const { total: productsTotal, products = [] } = useProducts();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isCollapsed = mounted ? sidebarCollapsed : false;

  const dynamicCounts: Record<string, number | undefined> = {
    '/leads': leads.length,
    '/companies': companies.length,
    '/contacts': contacts.length,
    '/deals': deals.length,
    '/products': productsTotal ?? products.length,
  };

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-surface transition-all duration-200 shrink-0 select-none z-30',
        isCollapsed ? 'w-16' : 'w-60'
      )}
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      {/* Brand & Workspace Switcher */}
      <div className="flex flex-col p-3 gap-3 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 px-1 py-0.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground font-bold text-xs shadow-xs">
              ⚡
            </div>
            {!isCollapsed && <span className="font-bold text-sm tracking-tight text-primary">ForgeCRM</span>}
          </Link>
          <button
            onClick={toggleSidebar}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted hover:text-primary hover:bg-hover transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        {!isCollapsed && <WorkspaceSwitcher />}
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Favorites */}
        {!isCollapsed && favorites.length > 0 && (
          <div className="space-y-1">
            <Caption color="muted" className="px-2 font-semibold uppercase tracking-wider text-[10px]">
              Favorites
            </Caption>
            {favorites.map((fav) => (
              <Link
                key={fav.id}
                href={fav.href}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-secondary hover:text-primary hover:bg-hover transition-colors"
              >
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                <span className="truncate">{fav.title}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Groups */}
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.permission || can(item.permission)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} className="space-y-1">
              {!isCollapsed && (
                <Caption color="muted" className="px-2 font-semibold uppercase tracking-wider text-[10px]">
                  {group.label}
                </Caption>
              )}
              {visibleItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                const count = dynamicCounts[item.href] !== undefined ? dynamicCounts[item.href] : item.count;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'group flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-xs font-medium transition-all duration-150',
                      isActive
                        ? 'bg-accent/15 text-accent font-semibold'
                        : 'text-secondary hover:text-primary hover:bg-hover'
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-accent' : 'text-muted group-hover:text-primary')} />
                    {!isCollapsed && <span className="truncate flex-1">{item.name}</span>}
                    {!isCollapsed && count !== undefined && (
                      <span className={cn('rounded px-1.5 py-0.2 font-mono text-[10px]', isActive ? 'bg-accent/20 text-accent font-bold' : 'bg-subtle text-muted')}>
                        {count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer Settings */}
      <div className="p-2 border-t border-border-subtle">
        <Link
          href="/workspace"
          className={cn(
            'flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-xs font-medium transition-colors',
            pathname.startsWith('/workspace') ? 'bg-accent/15 text-accent' : 'text-secondary hover:text-primary hover:bg-hover'
          )}
        >
          <Settings2 className="h-4 w-4 text-muted" />
          {!isCollapsed && <span>Workspace Settings</span>}
        </Link>
      </div>
    </aside>
  );
}
