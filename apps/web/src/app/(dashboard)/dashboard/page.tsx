'use client';

import Link from 'next/link';
import {
  TrendingUp,
  Users,
  Zap,
  ArrowUpRight,
  CheckSquare2,
  Sparkles,
  ShieldAlert,
  Target,
} from 'lucide-react';

import { useAnalytics } from '@/hooks/use-analytics';
import { useCRM } from '@/hooks/use-crm';
import { useFormatters } from '@/hooks/use-formatters';
import { KPICard } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/feedback';
import { Heading, Text, Caption } from '@/components/ui/typography';
import { Container, Stack, Grid, Surface, PageHeader } from '@/components/ui/layout-primitives';
import type { DealResponse, TaskResponse } from '@/types';

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
  if (loading) {
    return (
      <div className="rounded-xl border border-border-default bg-surface p-4 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-20" />
      </div>
    );
  }
  return <KPICard label={label} value={value} {...(sub ? { sub } : {})} icon={<Icon className="h-4 w-4 text-muted" strokeWidth={1.5} />} {...(href ? { href } : {})} />;
}

// =============================================================================
// Task Item
// =============================================================================

function TaskItem({ task }: { task: TaskResponse }) {
  const { formatDate } = useFormatters();
  const isOverdue = task.status === 'Open' && task.due_date && new Date(task.due_date) < new Date();

  const priorityColor: Record<string, string> = {
    Low:    'bg-sunken text-muted',
    Medium: 'bg-status-warning-bg text-status-warning-fg',
    High:   'bg-status-danger-bg text-status-danger-fg',
    Urgent: 'bg-status-danger-bg text-status-danger-fg border border-status-danger/30',
  };

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border-subtle last:border-0">
      <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${isOverdue ? 'bg-status-danger-fg' : 'bg-accent'}`} />
      <div className="min-w-0 flex-1">
        <Text variant="body-s" color={isOverdue ? 'danger' : 'primary'} className="truncate font-medium">
          {task.title}
        </Text>
        {task.due_date && (
          <Caption color={isOverdue ? 'danger' : 'muted'} tabular className="mt-0.5 block">
            Due {formatDate(task.due_date)}
          </Caption>
        )}
      </div>
      <span className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[11px] font-medium ${priorityColor[task.priority] ?? priorityColor.Medium}`}>
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
      className="flex items-center gap-3 py-2.5 border-b border-border-subtle last:border-0 group hover:opacity-80 transition-opacity duration-100"
    >
      <div className="min-w-0 flex-1">
        <Text variant="body-s" className="truncate font-medium group-hover:text-accent transition-colors duration-100">
          {deal.name}
        </Text>
        {company && <Caption color="muted" className="mt-0.5 truncate block">{company.name}</Caption>}
      </div>
      <Text variant="body-s" tabular className="shrink-0 font-semibold text-primary">
        {formatCurrency(deal.value ?? 0)}
      </Text>
    </Link>
  );
}

// =============================================================================
// Dashboard Page
// =============================================================================

export default function DashboardPage(): React.JSX.Element {
  const { deals, tasks, companies, isLoadingDeals, isLoadingTasks } = useCRM();
  const { overview, leadMetrics, isLoadingOverview } = useAnalytics();
  const { formatCurrency } = useFormatters();

  const openTasks = tasks.filter((t) => t.status === 'Open').slice(0, 6);
  const recentDeals = deals.filter((d) => d.status === 'Open').slice(0, 6);

  const totalPipelineValue = deals
    .filter((d) => d.status === 'Open')
    .reduce((sum, d) => sum + (d.value ?? 0), 0);

  const companiesList = companies.map((c) => ({ id: c.id, name: c.name }));

  return (
    <Container size="xl" className="py-6">
      <Stack gap={6}>
        {/* ── Page Header ──────────────────────────────────────────────────────── */}
        <PageHeader>
          <div>
            <Heading level="h1">Dashboard</Heading>
            <Text variant="body-m" color="secondary" className="mt-0.5">Your sales overview at a glance</Text>
          </div>
        </PageHeader>

        {/* ── KPI Row ──────────────────────────────────────────────────────────── */}
        <Grid cols={{ mobile: 2, desktop: 4 }} gap={3}>
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
            label="Open Tasks"
            value={overview?.pending_tasks ?? openTasks.length}
            icon={CheckSquare2}
            href="/tasks"
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
        </Grid>

        {/* ── AI Enterprise Intelligence & Quick Actions ───────────────────────── */}
        <Surface variant="elevated" className="rounded-xl border border-accent/20 bg-gradient-to-r from-accent/10 via-elevated to-surface p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-primary flex items-center gap-2">
                  <span>ForgeCRM Enterprise Sales Copilot</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent text-accent-fg">Active</span>
                </h2>
                <p className="text-xs text-muted">Generate account summaries, run win probability predictions, score new leads, or compose AI sales emails.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <Link href="/ai/copilot" className="px-3 py-1.5 rounded-lg bg-accent text-accent-fg text-xs font-bold hover:bg-accent/90 transition-all flex items-center gap-1.5 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Sales Copilot</span>
              </Link>
              <Link href="/ai/deal-coach" className="px-3 py-1.5 rounded-lg bg-surface border border-border-default hover:border-accent/40 text-xs font-semibold text-primary transition-all flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                <span>Deal Coach</span>
              </Link>
              <Link href="/ai/lead-qualification" className="px-3 py-1.5 rounded-lg bg-surface border border-border-default hover:border-accent/40 text-xs font-semibold text-primary transition-all flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-emerald-400" />
                <span>Lead Qual</span>
              </Link>
            </div>
          </div>
        </Surface>

        {/* ── Main Grid ────────────────────────────────────────────────────────── */}
        <Grid cols={{ mobile: 1, desktop: 2 }} gap={4}>
          {/* Active Deals */}
          <Surface variant="surface">
            <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
              <Heading level="h3">Active Deals</Heading>
              <Link href="/deals" className="flex items-center gap-1 text-xs text-muted hover:text-accent transition-colors duration-100">
                View all
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
              </Link>
            </div>
            <div className="p-4">
              {isLoadingDeals ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : recentDeals.length === 0 ? (
                <Caption color="muted">No open deals found.</Caption>
              ) : (
                recentDeals.map((d) => <DealItem key={d.id} deal={d} companies={companiesList} />)
              )}
            </div>
          </Surface>

          {/* Tasks */}
          <Surface variant="surface">
            <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
              <Heading level="h3">Tasks Due Soon</Heading>
              <Link href="/tasks" className="flex items-center gap-1 text-xs text-muted hover:text-accent transition-colors duration-100">
                View all
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
              </Link>
            </div>
            <div className="p-4">
              {isLoadingTasks ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : openTasks.length === 0 ? (
                <Caption color="muted">No open tasks.</Caption>
              ) : (
                openTasks.map((t) => <TaskItem key={t.id} task={t} />)
              )}
            </div>
          </Surface>
        </Grid>
      </Stack>
    </Container>
  );
}
