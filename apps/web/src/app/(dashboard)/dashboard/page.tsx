'use client';

import Link from 'next/link';

import { useAnalytics } from '@/hooks/use-analytics';
import { useCRM } from '@/hooks/use-crm';
import { useFormatters } from '@/hooks/use-formatters';
import type { DealResponse, StageResponse, TaskResponse } from '@/types';

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color = 'forge',
  trend,
  href,
}: {
  label: string;
  value: string | number;
  icon: string;
  color?: 'forge' | 'emerald' | 'blue' | 'amber' | 'rose' | 'violet';
  trend?: { value: number; positive: boolean } | null;
  href?: string;
}) {
  const colorMap = {
    forge: 'from-forge-600/30 to-indigo-600/30 border-forge-500/20 text-forge-400',
    emerald: 'from-emerald-600/30 to-teal-600/30 border-emerald-500/20 text-emerald-400',
    blue: 'from-blue-600/30 to-cyan-600/30 border-blue-500/20 text-blue-400',
    amber: 'from-amber-600/30 to-orange-600/30 border-amber-500/20 text-amber-400',
    rose: 'from-rose-600/30 to-pink-600/30 border-rose-500/20 text-rose-400',
    violet: 'from-violet-600/30 to-purple-600/30 border-violet-500/20 text-violet-400',
  };

  const card = (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl transition-all ${href ? 'hover:border-slate-700 cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-white">{value}</p>
          {trend && (
            <p className={`text-xs mt-1.5 font-medium ${trend.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% from last period
            </p>
          )}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br border ${colorMap[color]}`}>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
          </svg>
        </div>
      </div>
    </div>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}

// ── Task Item ─────────────────────────────────────────────────────────────────

function TaskItem({ task }: { task: TaskResponse }) {
  const { formatDate } = useFormatters();
  const isOverdue = task.status === 'Open' && task.due_date && new Date(task.due_date) < new Date();
  const PRIORITY_COLOR: Record<string, string> = {
    Low: 'bg-slate-500/20 text-slate-400',
    Medium: 'bg-amber-500/20 text-amber-300',
    High: 'bg-orange-500/20 text-orange-400',
    Urgent: 'bg-rose-500/20 text-rose-400',
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-800/40 p-3 hover:border-slate-700 transition-colors">
      <div className={`h-2 w-2 rounded-full shrink-0 ${isOverdue ? 'bg-rose-400 animate-pulse' : 'bg-forge-400'}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isOverdue ? 'text-rose-300' : 'text-white'}`}>{task.title}</p>
        {task.due_date && (
          <p className={`text-xs mt-0.5 ${isOverdue ? 'text-rose-500' : 'text-slate-500'}`}>
            Due {formatDate(task.due_date)}
          </p>
        )}
      </div>
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLOR[task.priority] ?? PRIORITY_COLOR.Medium}`}>
        {task.priority}
      </span>
    </div>
  );
}

// ── Deal Item ─────────────────────────────────────────────────────────────────

function DealItem({ deal, companyName }: { deal: DealResponse; companyName?: string }) {
  const { formatCurrency } = useFormatters();
  return (
    <Link href={`/deals/${deal.id}`} className="flex items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-800/40 p-3 hover:border-forge-500/30 hover:bg-slate-800 transition-all group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white group-hover:text-forge-300 transition-colors truncate">{deal.name}</p>
        {companyName && <p className="text-xs text-slate-500 mt-0.5 truncate">{companyName}</p>}
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-emerald-400">{formatCurrency(deal.value)}</p>
        <p className="text-xs text-slate-500 mt-0.5">{deal.status}</p>
      </div>
    </Link>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function DashboardPage(): React.JSX.Element {
  const {
    companies,
    contacts,
    leads,
    deals,
    tasks,
    pipelines,
    isLoadingCompanies,
    isLoadingDeals,
    isLoadingTasks,
  } = useCRM();
  const { dealMetrics } = useAnalytics();
  const { formatCurrency, formatDate } = useFormatters();

  // Computed stats
  const openDeals = deals.filter((d) => d.status === 'Open');
  const wonDeals = deals.filter((d) => d.status === 'Won');
  const openTasks = tasks.filter((t) => t.status === 'Open');
  const overdueTasks = openTasks.filter(
    (t) => t.due_date && new Date(t.due_date) < new Date()
  );
  const activeLeads = leads.filter((l) => !l.converted_at && l.priority !== 'Disqualified');
  const recentDeals = [...openDeals]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
  const urgentTasks = [...openTasks]
    .filter((t) => t.priority === 'Urgent' || t.priority === 'High' || (t.due_date && new Date(t.due_date) < new Date()))
    .slice(0, 5);
  const pipelineValue = openDeals.reduce((s, d) => s + d.value, 0);
  const winRate = dealMetrics?.win_rate_percent ?? 0;
  const wonRevenue = dealMetrics?.total_won_revenue ?? wonDeals.reduce((s, d) => s + d.value, 0);

  const isLoading = isLoadingCompanies || isLoadingDeals || isLoadingTasks;

  return (
    <div className="space-y-6 p-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Your CRM at a glance — {formatDate(new Date(), 'DD MMM YYYY')}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/leads" className="rounded-lg bg-forge-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-forge-500/20 hover:bg-forge-400 transition-all">
            + Add Lead
          </Link>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Open Deals"
            value={openDeals.length}
            icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            color="forge"
            href="/deals"
          />
          <StatCard
            label="Pipeline Value"
            value={formatCurrency(pipelineValue)}
            icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            color="emerald"
            href="/deals"
          />
          <StatCard
            label="Won Revenue"
            value={formatCurrency(wonRevenue)}
            icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            color="blue"
            href="/deals"
          />
          <StatCard
            label="Win Rate"
            value={`${winRate}%`}
            icon="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            color="violet"
            href="/deals"
          />
        </div>
      )}

      {/* ── Secondary Stats Row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Companies"
          value={companies.filter((c) => c.status === 'Active').length}
          icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"
          color="amber"
          href="/companies"
        />
        <StatCard
          label="Contacts"
          value={contacts.filter((c) => c.status === 'Active').length}
          icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          color="blue"
          href="/contacts"
        />
        <StatCard
          label="Active Leads"
          value={activeLeads.length}
          icon="M13 10V3L4 14h7v7l9-11h-7z"
          color="rose"
          href="/leads"
        />
        <StatCard
          label="Open Tasks"
          value={openTasks.length}
          icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          color={overdueTasks.length > 0 ? 'rose' : 'forge'}
          trend={overdueTasks.length > 0 ? { value: overdueTasks.length, positive: false } : null}
          href="/tasks"
        />
      </div>

      {/* ── Pipeline Stage Breakdown ─────────────────────────────────── */}
      {pipelines && pipelines[0]?.stages && pipelines[0].stages.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Pipeline by Stage</h3>
            <Link href="/deals" className="text-xs text-forge-400 hover:text-forge-300 transition-colors">View All →</Link>
          </div>
          <div className="space-y-3">
            {pipelines[0].stages
              .slice()
              .sort((a: StageResponse, b: StageResponse) => a.sort_order - b.sort_order)
              .map((stage: StageResponse) => {
                const stageDeals = deals.filter((d) => d.stage_id === stage.id && d.status !== 'Cancelled');
                const stageValue = stageDeals.reduce((s, d) => s + d.value, 0);
                const pct = pipelineValue > 0 ? (stageValue / pipelineValue) * 100 : 0;
                return (
                  <div key={stage.id} className="flex items-center gap-3">
                    <div className="w-28 shrink-0 text-xs font-medium text-slate-400 truncate">{stage.name}</div>
                    <div className="flex-1 relative h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-forge-600 to-indigo-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-24 text-right text-xs font-semibold text-white">{formatCurrency(stageValue)}</div>
                    <div className="w-10 text-right text-xs text-slate-500">{stageDeals.length}</div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── Two-Column Bottom ──────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Deals */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Recent Deals</h3>
            <Link href="/deals" className="text-xs text-forge-400 hover:text-forge-300 transition-colors">View All →</Link>
          </div>
          {recentDeals.length === 0 ? (
            <div className="py-8 text-center text-slate-600 text-sm">No open deals yet.</div>
          ) : (
            <div className="space-y-2">
              {recentDeals.map((deal) => {
                const company = companies.find((c) => c.id === deal.company_id);
                return <DealItem key={deal.id} deal={deal} {...(company ? { companyName: company.name } : {})} />;
              })}
            </div>
          )}
        </div>

        {/* Urgent / Overdue Tasks */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              Priority Tasks
              {overdueTasks.length > 0 && (
                <span className="ml-2 rounded-full bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-xs text-rose-400">
                  {overdueTasks.length} overdue
                </span>
              )}
            </h3>
            <Link href="/tasks" className="text-xs text-forge-400 hover:text-forge-300 transition-colors">View All →</Link>
          </div>
          {urgentTasks.length === 0 ? (
            <div className="py-8 text-center text-slate-600 text-sm">No urgent tasks. You&apos;re all caught up! 🎉</div>
          ) : (
            <div className="space-y-2">
              {urgentTasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Add Shortcuts ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'New Company', href: '/companies', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16', color: 'from-amber-600/20 to-amber-600/10 border-amber-500/20 hover:border-amber-500/40 text-amber-400' },
          { label: 'New Contact', href: '/contacts', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', color: 'from-blue-600/20 to-blue-600/10 border-blue-500/20 hover:border-blue-500/40 text-blue-400' },
          { label: 'New Lead', href: '/leads', icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'from-rose-600/20 to-rose-600/10 border-rose-500/20 hover:border-rose-500/40 text-rose-400' },
          { label: 'New Task', href: '/tasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', color: 'from-forge-600/20 to-forge-600/10 border-forge-500/20 hover:border-forge-500/40 text-forge-400' },
        ].map(({ label, href, icon, color }) => (
          <Link
            key={label}
            href={href}
            className={`flex items-center gap-3 rounded-xl border bg-gradient-to-br p-4 transition-all group ${color}`}
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
            </svg>
            <span className="text-sm font-medium text-white group-hover:text-opacity-90">{label}</span>
            <svg className="h-4 w-4 ml-auto opacity-40 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
