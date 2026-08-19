'use client';

/**
 * ForgeCRM — Enterprise Business Intelligence Suite
 *
 * Multi-domain analytics console consolidating executive KPIs, sales leaderboards,
 * pipeline stage funnels, lead conversion velocity, team productivity, automation telemetry,
 * AI token spend, customer intelligence, custom dashboards, and saved reports.
 *
 * Documentation: docs/04_Frontend/401_FRONTEND_OVERVIEW.md
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Bot,
  Building2,
  Layers,
  Sparkles,
  TrendingUp,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';

import { AnalyticsFilterBar } from '@/components/analytics/analytics-filter-bar';
import { DashboardBuilder } from '@/components/analytics/dashboard-builder';
import { DrilldownDrawer, DrilldownItem } from '@/components/analytics/drilldown-drawer';
import { ReportBuilder } from '@/components/analytics/report-builder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/feedback';
import { useAnalytics } from '@/hooks/use-analytics';
import { useCRM } from '@/hooks/use-crm';
import { useFormatters } from '@/hooks/use-formatters';
import { AnalyticsTab, useAnalyticsStore } from '@/stores/analytics-store';

export function AnalyticsDashboard(): React.JSX.Element {
  const {
    overview,
    isLoadingOverview,
    leadMetrics,
    isLoadingLeadMetrics,
    dealMetrics,
    isLoadingDealMetrics,
    pipelines,
    isLoadingPipelines,
    salesPerformance,
    isLoadingSales,
    activityAnalytics,
    isLoadingActivities,
    automationAnalytics,
    aiAnalytics,
    accountAnalytics,
    isLoadingAccounts,
  } = useAnalytics();

  const { deals, leads } = useCRM();
  const { formatCurrency, formatPercent } = useFormatters();
  const { activeTab, setActiveTab } = useAnalyticsStore();

  // Drilldown Drawer State
  const [drilldownState, setDrilldownState] = useState<{
    isOpen: boolean;
    title: string;
    description?: string | null | undefined;
    items: DrilldownItem[];
    entityRoute?: string | null | undefined;
  }>({
    isOpen: false,
    title: '',
    items: [],
  });

  const openDrilldown = (
    title: string,
    description: string,
    items: DrilldownItem[],
    entityRoute?: string
  ) => {
    setDrilldownState({
      isOpen: true,
      title,
      description,
      items,
      entityRoute: entityRoute ?? undefined,
    });
  };

  const closeDrilldown = () => {
    setDrilldownState((prev) => ({ ...prev, isOpen: false }));
  };

  const navTabs: { id: AnalyticsTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Executive Overview', icon: TrendingUp },
    { id: 'sales', label: 'Sales & Reps', icon: Users },
    { id: 'pipeline', label: 'Pipeline Velocity', icon: BarChart3 },
    { id: 'leads', label: 'Lead Funnel', icon: Layers },
    { id: 'activities', label: 'Productivity', icon: Activity },
    { id: 'automation', label: 'Automations', icon: Workflow },
    { id: 'ai', label: 'AI Subsystem', icon: Bot },
    { id: 'accounts', label: 'Accounts', icon: Building2 },
    { id: 'custom', label: 'Custom Dashboards', icon: Sparkles },
    { id: 'reports', label: 'Saved Reports', icon: Zap },
  ];

  return (
    <div className="space-y-6">
      {/* ── Global Filter Bar ────────────────────────────────────────── */}
      <AnalyticsFilterBar />

      {/* ── Sub-navigation Tabs ──────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border-default pb-2 scrollbar-none">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-accent text-accent-fg shadow-xs'
                  : 'text-muted hover:bg-hover hover:text-primary'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: Executive Overview ─────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Pipeline Total Value */}
            <Card
              className="cursor-pointer border-border-default bg-surface/70 backdrop-blur-md transition-all hover:border-accent/50 hover:shadow-md"
              onClick={() => {
                const openDeals = deals.filter((d) => d.status === 'Open');
                openDrilldown(
                  'Open Pipeline Deals',
                  'Live active opportunities in current pipeline stages.',
                  openDeals.map((d) => ({
                    id: d.id,
                    title: d.name,
                    subtitle: `Deal Stage: ${d.stage_id ? 'Active' : 'In Progress'}`,
                    value: d.value,
                    status: 'Open',
                    badgeColor: 'bg-accent/10 text-accent',
                    linkHref: `/deals/${d.id}`,
                  })),
                  '/deals'
                );
              }}
            >
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Pipeline Total Value
                </CardDescription>
                <CardTitle className="text-2xl font-extrabold text-primary">
                  {isLoadingOverview ? (
                    <Skeleton className="h-8 w-28" />
                  ) : (
                    formatCurrency(overview?.pipeline_total_value ?? 0)
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-muted flex items-center justify-between">
                <span>{overview?.open_deals_count ?? 0} active deals</span>
                <span className="text-accent flex items-center gap-0.5 font-medium">
                  Drill down <ArrowUpRight className="h-3 w-3" />
                </span>
              </CardContent>
            </Card>

            {/* Won Revenue */}
            <Card
              className="cursor-pointer border-border-default bg-surface/70 backdrop-blur-md transition-all hover:border-status-success-fg/50 hover:shadow-md"
              onClick={() => {
                const wonDeals = deals.filter((d) => d.status === 'Won');
                openDrilldown(
                  'Closed-Won Deals',
                  'Completed customer deals with realized revenue.',
                  wonDeals.map((d) => ({
                    id: d.id,
                    title: d.name,
                    subtitle: `Closed won deal`,
                    value: d.value,
                    status: 'Won',
                    badgeColor: 'bg-status-success-bg text-status-success-fg',
                    linkHref: `/deals/${d.id}`,
                  })),
                  '/deals'
                );
              }}
            >
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Realized Won Revenue
                </CardDescription>
                <CardTitle className="text-2xl font-extrabold text-status-success-fg">
                  {isLoadingDealMetrics ? (
                    <Skeleton className="h-8 w-28" />
                  ) : (
                    formatCurrency(dealMetrics?.total_won_revenue ?? 0)
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-muted flex items-center justify-between">
                <span>{dealMetrics?.won_deals ?? 0} won deals</span>
                <span className="text-status-success-fg flex items-center gap-0.5 font-medium">
                  Drill down <ArrowUpRight className="h-3 w-3" />
                </span>
              </CardContent>
            </Card>

            {/* Lead Conversion Rate */}
            <Card
              className="cursor-pointer border-border-default bg-surface/70 backdrop-blur-md transition-all hover:border-accent/50 hover:shadow-md"
              onClick={() => {
                openDrilldown(
                  'Lead Funnel Records',
                  'Converted vs open prospect leads.',
                  leads.map((l) => ({
                    id: l.id,
                    title: `${l.first_name} ${l.last_name || ''}`.trim(),
                    subtitle: l.company_name || l.email || undefined,
                    value: l.estimated_value,
                    status: l.converted_at ? 'Converted' : 'Open',
                    badgeColor: l.converted_at
                      ? 'bg-accent/10 text-accent'
                      : 'bg-sunken text-muted',
                    linkHref: `/leads`,
                  })),
                  '/leads'
                );
              }}
            >
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Lead Conversion Rate
                </CardDescription>
                <CardTitle className="text-2xl font-extrabold text-accent">
                  {isLoadingLeadMetrics ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    formatPercent(leadMetrics?.conversion_rate_percent ?? 0)
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-muted flex items-center justify-between">
                <span>
                  {leadMetrics?.converted_leads ?? 0} of {leadMetrics?.total_leads ?? 0} leads
                </span>
                <span className="text-accent flex items-center gap-0.5 font-medium">
                  Drill down <ArrowUpRight className="h-3 w-3" />
                </span>
              </CardContent>
            </Card>

            {/* Deal Win Rate */}
            <Card
              className="cursor-pointer border-border-default bg-surface/70 backdrop-blur-md transition-all hover:border-accent/50 hover:shadow-md"
              onClick={() => {
                const closedDeals = deals.filter((d) => d.status === 'Won' || d.status === 'Lost');
                openDrilldown(
                  'Closed Opportunity Outcome',
                  'Win vs loss ratio on closed opportunities.',
                  closedDeals.map((d) => ({
                    id: d.id,
                    title: d.name,
                    subtitle: `Status: ${d.status}`,
                    value: d.value,
                    status: d.status,
                    badgeColor:
                      d.status === 'Won'
                        ? 'bg-status-success-bg text-status-success-fg'
                        : 'bg-status-danger-bg text-status-danger-fg',
                    linkHref: `/deals/${d.id}`,
                  })),
                  '/deals'
                );
              }}
            >
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Deal Win Rate
                </CardDescription>
                <CardTitle className="text-2xl font-extrabold text-primary">
                  {isLoadingDealMetrics ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    formatPercent(dealMetrics?.win_rate_percent ?? 0)
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-muted flex items-center justify-between">
                <span>Avg Deal: {formatCurrency(dealMetrics?.avg_deal_size ?? 0)}</span>
                <span className="text-accent flex items-center gap-0.5 font-medium">
                  Drill down <ArrowUpRight className="h-3 w-3" />
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Telemetry Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Accounts Ranking */}
            <Card className="border-border-default bg-surface/70 backdrop-blur-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-primary">Top Customer Accounts</CardTitle>
                  <Link href="/companies" className="text-xs text-accent hover:underline flex items-center gap-0.5">
                    All Companies <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
                <CardDescription className="text-xs text-muted">
                  Ranked by cumulative won deal value
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoadingAccounts ? (
                  <Skeleton className="h-32 w-full" />
                ) : (!accountAnalytics?.top_accounts || accountAnalytics.top_accounts.length === 0) ? (
                  <p className="text-xs text-muted text-center py-6">No account data for period.</p>
                ) : (
                  accountAnalytics.top_accounts.slice(0, 5).map((acc) => (
                    <div key={acc.company_id} className="flex items-center justify-between text-xs border-b border-border-subtle pb-2">
                      <span className="font-semibold text-primary truncate max-w-[140px]">{acc.company_name}</span>
                      <div className="text-right">
                        <span className="font-bold text-status-success-fg">{formatCurrency(acc.total_revenue)}</span>
                        <span className="block text-[10px] text-muted">{acc.open_deals_count} open deals</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Task & Productivity Health */}
            <Card className="border-border-default bg-surface/70 backdrop-blur-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-primary">Task & Action Health</CardTitle>
                  <Link href="/tasks" className="text-xs text-accent hover:underline flex items-center gap-0.5">
                    Task Center <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
                <CardDescription className="text-xs text-muted">
                  Task completion & overdue tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-sunken p-3">
                  <div>
                    <span className="text-xs text-muted block">Pending Tasks</span>
                    <span className="text-lg font-bold text-primary">{overview?.pending_tasks ?? 0}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted block">Overdue Tasks</span>
                    <span className="text-lg font-bold text-status-danger-fg">{overview?.overdue_tasks ?? 0}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-sunken p-3">
                  <div>
                    <span className="text-xs text-muted block">Recent Activities</span>
                    <span className="text-lg font-bold text-primary">{overview?.recent_activities_count ?? 0}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted block">Active Contacts</span>
                    <span className="text-lg font-bold text-primary">{overview?.active_contacts ?? 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI & Automation Telemetry Preview */}
            <Card className="border-border-default bg-surface/70 backdrop-blur-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-primary">AI & Automation Spend</CardTitle>
                <CardDescription className="text-xs text-muted">
                  Subsystem usage and cost tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-border-default bg-surface/50 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">AI Token Spend:</span>
                    <span className="font-bold text-accent">
                      ${(aiAnalytics?.total_cost_usd ?? 0).toFixed(4)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted mt-1">
                    <span>Requests: {aiAnalytics?.total_requests ?? 0}</span>
                    <span>Tokens: {(aiAnalytics?.total_tokens_consumed ?? 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="rounded-lg border border-border-default bg-surface/50 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Workflow Runs:</span>
                    <span className="font-bold text-status-success-fg">
                      {automationAnalytics?.total_runs ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted mt-1">
                    <span>Active Rules: {automationAnalytics?.active_rules ?? 0}</span>
                    <span>
                      Success: {formatPercent(automationAnalytics?.success_rate_percent ?? 100)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── TAB 2: Sales Leaderboard & Reps ──────────────────────────── */}
      {activeTab === 'sales' && (
        <Card className="border-border-default bg-surface/70 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-primary">
                  Sales Representative Performance
                </CardTitle>
                <CardDescription className="text-xs text-muted mt-0.5">
                  Revenue attainment, win ratios, and sales velocity per team member.
                </CardDescription>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted block">Avg Sales Cycle</span>
                <span className="text-sm font-bold text-primary">
                  {salesPerformance?.avg_sales_cycle_days ?? 0} days
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingSales ? (
              <Skeleton className="h-48 w-full" />
            ) : (!salesPerformance?.leaderboard || salesPerformance.leaderboard.length === 0) ? (
              <p className="text-xs text-muted text-center py-12">No representative sales data recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border-subtle text-muted font-semibold">
                      <th className="pb-3 pl-2">Representative</th>
                      <th className="pb-3 text-right">Won Revenue</th>
                      <th className="pb-3 text-center">Deals Won</th>
                      <th className="pb-3 text-center">Open Deals</th>
                      <th className="pb-3 text-right">Win Rate</th>
                      <th className="pb-3 text-right pr-2">Activities</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {salesPerformance.leaderboard.map((rep, idx) => (
                      <tr key={rep.member_id} className="hover:bg-hover transition-colors">
                        <td className="py-3 pl-2 font-medium flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">
                            {idx + 1}
                          </span>
                          <span className="text-primary">{rep.rep_name}</span>
                        </td>
                        <td className="py-3 text-right font-bold text-status-success-fg">
                          {formatCurrency(rep.won_revenue)}
                        </td>
                        <td className="py-3 text-center font-medium text-primary">{rep.deals_won}</td>
                        <td className="py-3 text-center text-muted">{rep.deals_open}</td>
                        <td className="py-3 text-right font-semibold text-accent">
                          {formatPercent(rep.win_rate_percent)}
                        </td>
                        <td className="py-3 text-right pr-2 text-muted font-mono">
                          {rep.activities_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── TAB 3: Pipeline Velocity & Stage Funnel ───────────────────── */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          {isLoadingPipelines ? (
            <Skeleton className="h-64 w-full" />
          ) : pipelines.length === 0 ? (
            <p className="text-xs text-muted text-center py-12">No active pipeline configurations found.</p>
          ) : (
            pipelines.map((pipe) => (
              <Card key={pipe.pipeline_id} className="border-border-default bg-surface/70 backdrop-blur-md">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-primary">{pipe.pipeline_name}</CardTitle>
                      <CardDescription className="text-xs text-muted mt-0.5">
                        {pipe.total_deals} active deals in funnel ({formatCurrency(pipe.total_pipeline_value)})
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted block">Weighted Forecast</span>
                      <span className="text-sm font-extrabold text-accent">
                        {formatCurrency(pipe.total_weighted_forecast)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {pipe.stages.map((st) => (
                      <div key={st.stage_id} className="rounded-xl border border-border-default bg-sunken p-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-primary truncate">{st.stage_name}</span>
                          <span className="text-[10px] font-bold text-muted">{st.probability}%</span>
                        </div>
                        <div className="text-base font-extrabold text-primary">{formatCurrency(st.total_value)}</div>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-muted">
                          <span>{st.deal_count} deals</span>
                          <span className="text-accent font-medium">
                            {formatCurrency(st.weighted_value)} exp.
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ── TAB 4: Lead Funnel & Velocity ────────────────────────────── */}
      {activeTab === 'leads' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border-default bg-surface/70 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-primary">Lead Conversion Funnel</CardTitle>
              <CardDescription className="text-xs text-muted">
                Progressive conversion breakdown of captured leads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Total Ingested Leads</span>
                  <span className="font-bold text-primary">{leadMetrics?.total_leads ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Contacted / Assigned</span>
                  <span className="font-bold text-accent">{leadMetrics?.contacted_leads ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Qualified Leads</span>
                  <span className="font-bold text-status-success-fg">{leadMetrics?.qualified_leads ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Successfully Converted</span>
                  <span className="font-bold text-accent">{leadMetrics?.converted_leads ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Disqualified / Unqualified</span>
                  <span className="font-bold text-status-danger-fg">{leadMetrics?.unqualified_leads ?? 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border-default bg-surface/70 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-primary">Conversion Velocity</CardTitle>
              <CardDescription className="text-xs text-muted">
                Time required to convert prospects into active deals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border-default bg-sunken p-5 text-center">
                <span className="text-xs text-muted block">Average Conversion Velocity</span>
                <span className="text-3xl font-extrabold text-primary mt-1 block">
                  {leadMetrics?.avg_conversion_time_days ?? 0} <span className="text-base font-medium text-muted">days</span>
                </span>
                <p className="text-[11px] text-muted mt-2">
                  Calculated from created timestamp to final deal conversion.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB 5: Activity & Productivity ────────────────────────────── */}
      {activeTab === 'activities' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border-default bg-surface/70 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-primary">Activities by Type</CardTitle>
              <CardDescription className="text-xs text-muted">
                Engagement volume across calls, meetings, notes, and emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingActivities ? (
                <Skeleton className="h-32 w-full" />
              ) : (!activityAnalytics?.activities_by_type || activityAnalytics.activities_by_type.length === 0) ? (
                <p className="text-xs text-muted text-center py-6">No recorded activity for period.</p>
              ) : (
                activityAnalytics.activities_by_type.map((item) => (
                  <div key={item.activity_type} className="flex items-center justify-between text-xs border-b border-border-subtle pb-2">
                    <span className="font-medium text-primary">{item.activity_type}</span>
                    <span className="font-bold text-accent font-mono">{item.count}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border-default bg-surface/70 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-primary">Task Completion Rate</CardTitle>
              <CardDescription className="text-xs text-muted">
                Overall workspace task productivity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border-default bg-sunken p-5 text-center">
                <span className="text-xs text-muted block">Completion Rate</span>
                <span className="text-3xl font-extrabold text-status-success-fg mt-1 block">
                  {formatPercent(activityAnalytics?.task_completion_rate_percent ?? 0)}
                </span>
                <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted">
                  <span>Created: {activityAnalytics?.tasks_created ?? 0}</span>
                  <span>Completed: {activityAnalytics?.tasks_completed ?? 0}</span>
                  <span className="text-status-danger-fg">Overdue: {activityAnalytics?.tasks_overdue ?? 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB 6: Workflow Automation Telemetry ──────────────────────── */}
      {activeTab === 'automation' && (
        <Card className="border-border-default bg-surface/70 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-primary">
                  Workflow Automation Executions
                </CardTitle>
                <CardDescription className="text-xs text-muted mt-0.5">
                  Execution telemetry, reliability rates, and rule performance.
                </CardDescription>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted block">Success Rate</span>
                <span className="text-sm font-extrabold text-status-success-fg">
                  {formatPercent(automationAnalytics?.success_rate_percent ?? 100)}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-sunken p-3">
                <span className="text-[11px] text-muted block">Active Rules</span>
                <span className="text-base font-bold text-primary">{automationAnalytics?.active_rules ?? 0}</span>
              </div>
              <div className="rounded-lg bg-sunken p-3">
                <span className="text-[11px] text-muted block">Total Executions</span>
                <span className="text-base font-bold text-primary">{automationAnalytics?.total_runs ?? 0}</span>
              </div>
              <div className="rounded-lg bg-sunken p-3">
                <span className="text-[11px] text-muted block">Failed Runs</span>
                <span className="text-base font-bold text-status-danger-fg">{automationAnalytics?.failed_runs ?? 0}</span>
              </div>
              <div className="rounded-lg bg-sunken p-3">
                <span className="text-[11px] text-muted block">Avg Duration</span>
                <span className="text-base font-bold text-primary">{automationAnalytics?.avg_duration_ms ?? 0} ms</span>
              </div>
            </div>

            {automationAnalytics?.top_workflows && automationAnalytics.top_workflows.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  Top Active Workflows
                </h4>
                <div className="space-y-2">
                  {automationAnalytics.top_workflows.map((wf) => (
                    <div key={wf.rule_id} className="flex items-center justify-between text-xs border-b border-border-subtle pb-2">
                      <span className="font-semibold text-primary">{wf.rule_name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-muted">{wf.total_runs} runs</span>
                        <span className="font-bold text-status-success-fg">{formatPercent(wf.success_rate_percent)} success</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── TAB 7: AI Usage & Spend ───────────────────────────────────── */}
      {activeTab === 'ai' && (
        <Card className="border-border-default bg-surface/70 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-primary">AI Subsystem Spend & Consumption</CardTitle>
                <CardDescription className="text-xs text-muted mt-0.5">
                  Live token volume and estimated USD model expenses.
                </CardDescription>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted block">Total Cost</span>
                <span className="text-base font-extrabold text-accent">
                  ${(aiAnalytics?.total_cost_usd ?? 0).toFixed(4)}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg bg-sunken p-3">
                <span className="text-[11px] text-muted block">Total AI Invocations</span>
                <span className="text-base font-bold text-primary">{aiAnalytics?.total_requests ?? 0}</span>
              </div>
              <div className="rounded-lg bg-sunken p-3">
                <span className="text-[11px] text-muted block">Tokens Consumed</span>
                <span className="text-base font-bold text-primary">
                  {(aiAnalytics?.total_tokens_consumed ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="rounded-lg bg-sunken p-3">
                <span className="text-[11px] text-muted block">Configured Monthly Budget</span>
                <span className="text-base font-bold text-primary">
                  ${(aiAnalytics?.active_budget_usd ?? 0).toFixed(2)}
                </span>
              </div>
            </div>

            {aiAnalytics?.usage_by_model && aiAnalytics.usage_by_model.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  Spend by Provider & Model
                </h4>
                <div className="space-y-2">
                  {aiAnalytics.usage_by_model.map((m, i) => (
                    <div key={i} className="flex items-center justify-between text-xs border-b border-border-subtle pb-2">
                      <div>
                        <span className="font-semibold text-primary">{m.model}</span>
                        <span className="text-[10px] text-muted ml-2">({m.provider})</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted font-mono">{m.total_tokens.toLocaleString()} tokens</span>
                        <span className="font-bold text-accent">${m.total_cost_usd.toFixed(4)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── TAB 8: Accounts & Customers ───────────────────────────────── */}
      {activeTab === 'accounts' && (
        <Card className="border-border-default bg-surface/70 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-base font-bold text-primary">Customer Account Growth</CardTitle>
            <CardDescription className="text-xs text-muted mt-0.5">
              Account expansion and top customers ranked by realized deal volume.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg bg-sunken p-3">
                <span className="text-[11px] text-muted block">Active Companies</span>
                <span className="text-base font-bold text-primary">{accountAnalytics?.active_companies ?? 0}</span>
              </div>
              <div className="rounded-lg bg-sunken p-3">
                <span className="text-[11px] text-muted block">New in Period</span>
                <span className="text-base font-bold text-status-success-fg">{accountAnalytics?.new_companies_period ?? 0}</span>
              </div>
              <div className="rounded-lg bg-sunken p-3">
                <span className="text-[11px] text-muted block">Total Contacts</span>
                <span className="text-base font-bold text-primary">{accountAnalytics?.active_contacts ?? 0}</span>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              {accountAnalytics?.top_accounts?.map((acc) => (
                <div key={acc.company_id} className="flex items-center justify-between text-xs border-b border-border-subtle pb-2">
                  <span className="font-semibold text-primary">{acc.company_name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-muted">{acc.contacts_count} contacts</span>
                    <span className="font-bold text-status-success-fg">{formatCurrency(acc.total_revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── TAB 9: Custom Dashboards Builder ──────────────────────────── */}
      {activeTab === 'custom' && <DashboardBuilder />}

      {/* ── TAB 10: Saved Reports & Query Builder ─────────────────────── */}
      {activeTab === 'reports' && <ReportBuilder />}

      {/* ── Drilldown Slide-over Drawer ───────────────────────────────── */}
      <DrilldownDrawer
        isOpen={drilldownState.isOpen}
        onClose={closeDrilldown}
        title={drilldownState.title}
        description={drilldownState.description}
        items={drilldownState.items}
        entityRoute={drilldownState.entityRoute}
      />
    </div>
  );
}
