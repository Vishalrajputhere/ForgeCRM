'use client';

/**
 * ForgeCRM — Custom Dashboard Builder
 *
 * Visual dashboard creator and layout engine allowing users to compose and persist
 * custom business intelligence layouts backed by real PostgreSQL data.
 */

import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  Bot,
  Building2,
  CheckCircle2,
  DollarSign,
  Layers,
  Plus,
  Sparkles,
  Trash2,
  Users,
  Workflow,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalytics } from '@/hooks/use-analytics';
import { useFormatters } from '@/hooks/use-formatters';
import type { DashboardWidget } from '@/types';

const AVAILABLE_WIDGET_TYPES = [
  { id: 'won_revenue_kpi', title: 'Won Revenue KPI', icon: DollarSign, description: 'Closed won deal revenue and target attainment' },
  { id: 'sales_leaderboard', title: 'Sales Leaderboard', icon: Users, description: 'Representative performance and win rate rankings' },
  { id: 'pipeline_funnel', title: 'Pipeline Stage Funnel', icon: BarChart3, description: 'Stage distribution and weighted forecast values' },
  { id: 'lead_conversion', title: 'Lead Funnel Velocity', icon: Layers, description: 'Conversion rate and qualification distribution' },
  { id: 'activity_metrics', title: 'Activity Productivity', icon: Activity, description: 'Team task completion and engagement volume' },
  { id: 'automation_telemetry', title: 'Automation Telemetry', icon: Workflow, description: 'Workflow execution count, success rate, and duration' },
  { id: 'ai_spend_card', title: 'AI Subsystem & Spend', icon: Bot, description: 'Token consumption and estimated USD model spend' },
  { id: 'top_accounts', title: 'Top Customer Accounts', icon: Building2, description: 'High-value accounts ranked by won revenue' },
];

export function DashboardBuilder() {
  const {
    dashboards,
    isLoadingDashboards,
    createDashboard,
    isCreatingDashboard,
    deleteDashboard,
    overview,
    salesPerformance,
    pipelines,
    leadMetrics,
    activityAnalytics,
    automationAnalytics,
    aiAnalytics,
    accountAnalytics,
  } = useAnalytics();

  const { formatCurrency, formatPercent } = useFormatters();

  const [isCreatingModal, setIsCreatingModal] = useState(false);
  const [newDashName, setNewDashName] = useState('');
  const [newDashDesc, setNewDashDesc] = useState('');
  const [selectedWidgetTypes, setSelectedWidgetTypes] = useState<string[]>([
    'won_revenue_kpi',
    'sales_leaderboard',
    'pipeline_funnel',
    'ai_spend_card',
  ]);
  const [activeDashboardId, setActiveDashboardId] = useState<string | null>(null);

  const activeDashboard = dashboards.find((d) => d.id === activeDashboardId) || dashboards[0];

  const handleToggleWidget = (typeId: string) => {
    if (selectedWidgetTypes.includes(typeId)) {
      setSelectedWidgetTypes(selectedWidgetTypes.filter((t) => t !== typeId));
    } else {
      setSelectedWidgetTypes([...selectedWidgetTypes, typeId]);
    }
  };

  const handleSaveDashboard = async () => {
    if (!newDashName.trim()) return;

    const widgets: DashboardWidget[] = selectedWidgetTypes.map((typeId, idx) => {
      const widgetMeta = AVAILABLE_WIDGET_TYPES.find((w) => w.id === typeId);
      return {
        widget_type: typeId,
        title: widgetMeta?.title || 'Custom Widget',
        position_x: idx % 2,
        position_y: Math.floor(idx / 2),
        width: 1,
        height: 1,
        config_json: { widgetType: typeId },
      };
    });

    const res = await createDashboard({
      name: newDashName.trim(),
      description: newDashDesc.trim() || undefined,
      is_default: dashboards.length === 0,
      layout_json: { columns: 2 },
      widgets,
    });

    setActiveDashboardId(res.id);
    setNewDashName('');
    setNewDashDesc('');
    setIsCreatingModal(false);
  };

  const renderWidgetContent = (widget: DashboardWidget) => {
    switch (widget.widget_type) {
      case 'won_revenue_kpi':
        return (
          <div className="space-y-2">
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(salesPerformance?.total_won_revenue ?? overview?.pipeline_forecast_value ?? 0)}
            </div>
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Deals Won: {salesPerformance?.total_deals_won ?? 0}</span>
              <span className="font-semibold text-status-success-fg">
                Win Rate: {formatPercent(salesPerformance?.win_rate_percent ?? overview?.deal_win_rate_percent ?? 0)}
              </span>
            </div>
          </div>
        );

      case 'sales_leaderboard':
        return (
          <div className="space-y-2">
            {(!salesPerformance?.leaderboard || salesPerformance.leaderboard.length === 0) ? (
              <p className="text-xs text-muted py-4 text-center">No sales activity recorded for period.</p>
            ) : (
              salesPerformance.leaderboard.slice(0, 3).map((rep) => (
                <div key={rep.member_id} className="flex items-center justify-between text-xs border-b border-border-subtle pb-1.5">
                  <span className="font-medium truncate max-w-[120px] text-primary">{rep.rep_name}</span>
                  <span className="font-bold text-status-success-fg">{formatCurrency(rep.won_revenue)}</span>
                </div>
              ))
            )}
          </div>
        );

      case 'pipeline_funnel':
        const primaryPipe = pipelines[0];
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">{primaryPipe?.pipeline_name || 'Active Pipeline'}</span>
              <span className="font-bold text-accent">{formatCurrency(primaryPipe?.total_pipeline_value ?? 0)}</span>
            </div>
            <div className="space-y-1">
              {(primaryPipe?.stages ?? []).slice(0, 3).map((st) => (
                <div key={st.stage_id} className="flex items-center justify-between text-[11px] text-muted">
                  <span>{st.stage_name}</span>
                  <span>{st.deal_count} deals ({formatCurrency(st.total_value)})</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'lead_conversion':
        return (
          <div className="space-y-2">
            <div className="text-2xl font-bold text-primary">{leadMetrics?.total_leads ?? 0}</div>
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Converted: {leadMetrics?.converted_leads ?? 0}</span>
              <span className="font-semibold text-accent">
                Rate: {formatPercent(leadMetrics?.conversion_rate_percent ?? 0)}
              </span>
            </div>
          </div>
        );

      case 'activity_metrics':
        return (
          <div className="space-y-2">
            <div className="text-2xl font-bold text-primary">{activityAnalytics?.total_activities ?? 0}</div>
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Completed Tasks: {activityAnalytics?.tasks_completed ?? 0}</span>
              <span className="font-semibold text-status-success-fg">
                {formatPercent(activityAnalytics?.task_completion_rate_percent ?? 0)} completed
              </span>
            </div>
          </div>
        );

      case 'automation_telemetry':
        return (
          <div className="space-y-2">
            <div className="text-2xl font-bold text-primary">{automationAnalytics?.total_runs ?? 0} runs</div>
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Rules: {automationAnalytics?.active_rules ?? 0} active</span>
              <span className="font-semibold text-status-success-fg">
                {formatPercent(automationAnalytics?.success_rate_percent ?? 100)} success
              </span>
            </div>
          </div>
        );

      case 'ai_spend_card':
        return (
          <div className="space-y-2">
            <div className="text-2xl font-bold text-primary">
              ${(aiAnalytics?.total_cost_usd ?? 0).toFixed(4)}
            </div>
            <div className="flex items-center justify-between text-xs text-muted">
              <span>{aiAnalytics?.total_requests ?? 0} requests</span>
              <span>{(aiAnalytics?.total_tokens_consumed ?? 0).toLocaleString()} tokens</span>
            </div>
          </div>
        );

      case 'top_accounts':
        return (
          <div className="space-y-2">
            {(!accountAnalytics?.top_accounts || accountAnalytics.top_accounts.length === 0) ? (
              <p className="text-xs text-muted py-4 text-center">No account revenue records found.</p>
            ) : (
              accountAnalytics.top_accounts.slice(0, 3).map((acc) => (
                <div key={acc.company_id} className="flex items-center justify-between text-xs border-b border-border-subtle pb-1.5">
                  <span className="font-medium truncate max-w-[120px] text-primary">{acc.company_name}</span>
                  <span className="font-bold text-status-success-fg">{formatCurrency(acc.total_revenue)}</span>
                </div>
              ))
            )}
          </div>
        );

      default:
        return <p className="text-xs text-muted">Custom metric widget</p>;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Bar: Dashboard Selector & Create Action ───────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {dashboards.map((dash) => (
            <button
              key={dash.id}
              onClick={() => setActiveDashboardId(dash.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeDashboard?.id === dash.id
                  ? 'bg-accent text-accent-fg shadow-xs'
                  : 'bg-surface border border-border-default text-muted hover:text-primary'
              }`}
            >
              {dash.name}
            </button>
          ))}
          {dashboards.length === 0 && !isLoadingDashboards && (
            <span className="text-xs text-muted italic">No custom dashboards configured.</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeDashboard && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => deleteDashboard(activeDashboard.id)}
              className="h-8 gap-1.5 text-xs text-status-danger-fg border-status-danger-fg/30 hover:bg-status-danger-bg"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Dashboard</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => setIsCreatingModal(true)}
            className="h-8 gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Custom Dashboard</span>
          </Button>
        </div>
      </div>

      {/* ── Active Dashboard Widgets Grid ─────────────────────────────── */}
      {activeDashboard ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeDashboard.widgets.map((widget, i) => (
            <Card key={widget.id || i} className="border-border-default bg-surface/70 backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted uppercase tracking-wider">
                  {widget.title}
                </CardTitle>
              </CardHeader>
              <CardContent>{renderWidgetContent(widget)}</CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border-default p-12 text-center bg-surface/30">
          <Sparkles className="mx-auto h-8 w-8 text-accent/60 mb-2" />
          <h3 className="text-sm font-semibold text-primary">Build Custom Executive Dashboards</h3>
          <p className="text-xs text-muted max-w-sm mx-auto mt-1 mb-4">
            Combine live revenue cards, conversion funnels, AI subsystem telemetry, and sales rankings into tailored views.
          </p>
          <Button size="sm" onClick={() => setIsCreatingModal(true)} className="text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Create Your First Dashboard
          </Button>
        </div>
      )}

      {/* ── Create Dashboard Modal Dialog ─────────────────────────────── */}
      {isCreatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-border-default bg-surface p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-primary">Create Custom Analytics Dashboard</h3>
              <p className="text-xs text-muted mt-0.5">
                Configure your personalized real-time monitoring canvas.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted">Dashboard Name</label>
                <input
                  type="text"
                  placeholder="e.g., Executive Q3 Revenue & AI Review"
                  value={newDashName}
                  onChange={(e) => setNewDashName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border-default bg-sunken px-3 py-1.5 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Brief summary of this layout"
                  value={newDashDesc}
                  onChange={(e) => setNewDashDesc(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border-default bg-sunken px-3 py-1.5 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted">Select Analytics Widgets</label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {AVAILABLE_WIDGET_TYPES.map((w) => {
                    const Icon = w.icon;
                    const isSelected = selectedWidgetTypes.includes(w.id);
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => handleToggleWidget(w.id)}
                        className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-all ${
                          isSelected
                            ? 'border-accent bg-accent/10 text-primary'
                            : 'border-border-default bg-surface/50 text-muted hover:border-border-strong'
                        }`}
                      >
                        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${isSelected ? 'text-accent' : ''}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-primary">{w.title}</p>
                            {isSelected && <CheckCircle2 className="h-3 w-3 text-accent" />}
                          </div>
                          <p className="text-[10px] text-muted leading-tight mt-0.5">
                            {w.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreatingModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveDashboard}
                disabled={!newDashName.trim() || selectedWidgetTypes.length === 0 || isCreatingDashboard}
                className="text-xs"
              >
                {isCreatingDashboard ? 'Creating...' : 'Save Dashboard'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
