'use client';

import Link from 'next/link';
import {
  TrendingUp,
  Users,
  Zap,
  Building2,
  CheckSquare2,
  ArrowUpRight,
  Clock,
} from 'lucide-react';

import { useAnalytics } from '@/hooks/use-analytics';
import { useCRM } from '@/hooks/use-crm';
import { useFormatters } from '@/hooks/use-formatters';
import { Skeleton } from '@/components/ui/primitives';
import type { DealResponse, TaskResponse } from '@/types';

// =============================================================================
// Stat Card
// =============================================================================

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  href,
  loading,
}: {
  label: string;
  value: string | number;
  sub?: string | undefined;
  icon: React.ElementType;
  href?: string | undefined;
  loading?: boolean | undefined;
}) {
  const inner = (
    <div className="group flex flex-col gap-3 rounded-lg border p-4 transition-colors duration-150 hover:border-[rgba(255,255,255,0.14)]"
      style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-raised)' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-caption text-text-tertiary">{label}</p>
        <Icon className="h-4 w-4 text-text-tertiary" strokeWidth={1.5} />
      </div>
      {loading ? (
        <Skeleton className="h-7 w-20" />
      ) : (
        <p className="text-h1 tabular text-text-primary">{value}</p>
      )}
      {sub && !loading && (
        <p className="text-caption text-text-tertiary">{sub}</p>
      )}
      {href && (
        <ArrowUpRight className="absolute right-4 top-4 h-3.5 w-3.5 text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={1.5} />
      )}
    </div>
  );

  return href ? <Link href={href} className="relative block">{inner}</Link> : <div className="relative">{inner}</div>;
}

// =============================================================================
// Task Item
// =============================================================================

function TaskItem({ task }: { task: TaskResponse }) {
  const { formatDate } = useFormatters();
  const isOverdue = task.status === 'Open' && task.due_date && new Date(task.due_date) < new Date();

  const priorityColor: Record<string, string> = {
    Low:    'bg-[rgba(255,255,255,0.06)] text-text-tertiary',
    Medium: 'bg-amber-500/12 text-amber-400',
    High:   'bg-orange-500/12 text-orange-400',
    Urgent: 'bg-red-500/12 text-red-400',
  };

  return (
    <div className="flex items-start gap-3 py-2.5 border-b last:border-0"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${isOverdue ? 'bg-red-400' : 'bg-forge-500'}`} />
      <div className="min-w-0 flex-1">
        <p className={`text-label truncate ${isOverdue ? 'text-red-300' : 'text-text-primary'}`}>
          {task.title}
        </p>
        {task.due_date && (
          <p className={`text-caption mt-0.5 ${isOverdue ? 'text-red-500' : 'text-text-tertiary'}`}>
            Due {formatDate(task.due_date)}
          </p>
        )}
      </div>
      <span className={`shrink-0 rounded-sm px-1.5 py-0.5 text-micro ${priorityColor[task.priority] ?? priorityColor.Medium}`}>
        {task.priority}
      </span>
    </div>
  );
}

// =============================================================================
// Deal Item
// =============================================================================

function DealItem({ deal, companies }: { deal: DealResponse; companies: { id: string; name: string }[] }) {
  const { formatCurrency } = useFormatters();
  const company = companies.find((c) => c.id === deal.company_id);

  return (
    <Link
      href={`/deals/${deal.id}`}
      className="flex items-center gap-3 py-2.5 border-b last:border-0 group hover:opacity-80 transition-opacity duration-100"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      <div className="min-w-0 flex-1">
        <p className="text-label text-text-primary truncate group-hover:text-forge-400 transition-colors duration-100">
          {deal.name}
        </p>
        {company && <p className="text-caption text-text-tertiary mt-0.5 truncate">{company.name}</p>}
      </div>
      <p className="shrink-0 text-label tabular font-semibold text-text-primary">
        {formatCurrency(deal.value ?? 0)}
      </p>
    </Link>
  );
}

// =============================================================================
// Dashboard Page
// =============================================================================

export default function DashboardPage(): React.JSX.Element {
  const { deals, tasks, companies, isLoadingDeals, isLoadingTasks } = useCRM();
  const { overview, dealMetrics, leadMetrics, isLoadingOverview } = useAnalytics();
  const { formatCurrency } = useFormatters();

  const openTasks = tasks.filter((t) => t.status === 'Open').slice(0, 6);
  const recentDeals = deals.filter((d) => d.status === 'Open').slice(0, 6);

  const totalPipelineValue = deals
    .filter((d) => d.status === 'Open')
    .reduce((sum, d) => sum + (d.value ?? 0), 0);

  const companiesList = companies.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-h1 text-text-primary">Dashboard</h1>
        <p className="text-label text-text-tertiary mt-0.5">Your sales overview at a glance</p>
      </div>

      {/* ── KPI Row ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Pipeline Value"
          value={formatCurrency(overview?.pipeline_total_value ?? totalPipelineValue)}
          sub={`${deals.filter((d) => d.status === 'Open').length} open deals`}
          icon={TrendingUp}
          href="/deals"
          loading={isLoadingOverview}
        />
        <StatCard
          label="Contacts"
          value={overview?.active_contacts ?? '—'}
          icon={Users}
          href="/contacts"
          loading={isLoadingOverview}
        />
        <StatCard
          label="Lead Conversion"
          value={leadMetrics ? `${leadMetrics.conversion_rate_percent}%` : '—'}
          sub={leadMetrics ? `${leadMetrics.converted_leads} of ${leadMetrics.total_leads} leads` : undefined}
          icon={Zap}
          href="/leads"
          loading={isLoadingOverview}
        />
        <StatCard
          label="Won Revenue"
          value={dealMetrics ? formatCurrency(dealMetrics.total_won_revenue) : '—'}
          sub={dealMetrics ? `${dealMetrics.win_rate_percent}% win rate` : undefined}
          icon={Building2}
          loading={isLoadingOverview}
        />
      </div>

      {/* ── Main Grid ────────────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Open Deals */}
        <section className="rounded-lg border" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-raised)' }}>
          <div className="flex items-center justify-between border-b px-4 py-3"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <h2 className="text-h3 text-text-primary">Active Deals</h2>
            <Link href="/deals" className="flex items-center gap-1 text-caption text-text-tertiary hover:text-forge-400 transition-colors duration-100">
              View all
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
          </div>
          <div className="px-4">
            {isLoadingDeals ? (
              <div className="space-y-3 py-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-2.5 w-20" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            ) : recentDeals.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <TrendingUp className="h-8 w-8 text-text-tertiary mb-2.5" strokeWidth={1} />
                <p className="text-label text-text-secondary">No open deals</p>
                <p className="text-caption text-text-tertiary mt-1">Create your first deal to get started</p>
                <Link href="/deals" className="mt-3 text-caption text-forge-400 hover:text-forge-300 transition-colors">
                  Go to Deals →
                </Link>
              </div>
            ) : (
              recentDeals.map((deal) => (
                <DealItem key={deal.id} deal={deal} companies={companiesList} />
              ))
            )}
          </div>
        </section>

        {/* Open Tasks */}
        <section className="rounded-lg border" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-raised)' }}>
          <div className="flex items-center justify-between border-b px-4 py-3"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <h2 className="text-h3 text-text-primary">Open Tasks</h2>
            <Link href="/tasks" className="flex items-center gap-1 text-caption text-text-tertiary hover:text-forge-400 transition-colors duration-100">
              View all
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
          </div>
          <div className="px-4">
            {isLoadingTasks ? (
              <div className="space-y-3 py-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-40" />
                      <Skeleton className="h-2.5 w-24" />
                    </div>
                    <Skeleton className="h-4 w-12 rounded-sm" />
                  </div>
                ))}
              </div>
            ) : openTasks.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <CheckSquare2 className="h-8 w-8 text-text-tertiary mb-2.5" strokeWidth={1} />
                <p className="text-label text-text-secondary">All caught up</p>
                <p className="text-caption text-text-tertiary mt-1">No open tasks right now</p>
                <Link href="/tasks" className="mt-3 text-caption text-forge-400 hover:text-forge-300 transition-colors">
                  Go to Tasks →
                </Link>
              </div>
            ) : (
              openTasks.map((task) => <TaskItem key={task.id} task={task} />)
            )}
          </div>
        </section>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-h3 text-text-secondary mb-3">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'New Lead', href: '/leads', icon: Zap },
            { label: 'New Contact', href: '/contacts', icon: Users },
            { label: 'New Deal', href: '/deals', icon: TrendingUp },
            { label: 'New Task', href: '/tasks', icon: CheckSquare2 },
            { label: 'Add Company', href: '/companies', icon: Building2 },
          ].map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-label text-text-secondary hover:border-[rgba(255,255,255,0.14)] hover:text-text-primary transition-all duration-100"
              style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-raised)' }}
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} />
              {label}
            </Link>
          ))}
        </div>
      </section>

      {/* ── Recent activity label ─────────────────────────────────────────────── */}
      <section className="rounded-lg border px-4 py-3"
        style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-raised)' }}
      >
        <div className="flex items-center gap-2 text-caption text-text-tertiary">
          <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>Activity timeline is available on individual company and contact pages.</span>
        </div>
      </section>
    </div>
  );
}
