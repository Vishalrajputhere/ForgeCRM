'use client';

import { useAnalytics } from '@/hooks/use-analytics';
import { useFormatters } from '@/hooks/use-formatters';
import { useAnalyticsStore } from '@/stores/analytics-store';

export function AnalyticsDashboard(): React.JSX.Element {
  const { overview, leadMetrics, dealMetrics, pipelines, isLoadingOverview } = useAnalytics();
  const { dateRange, setDateRange } = useAnalyticsStore();
  const { formatCurrency } = useFormatters();

  if (isLoadingOverview) {
    return (
      <div className="flex h-64 items-center justify-center p-8 text-slate-400">
        Loading analytics dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header & Date Range Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Executive Analytics</h1>
          <p className="text-sm text-slate-400">
            Real-time pipeline win rates, revenue forecasts, and sales velocity metrics.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/80 p-1">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                dateRange === range
                  ? 'bg-forge-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Won Revenue */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Won Revenue
          </div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-400">
            {formatCurrency(dealMetrics?.total_won_revenue ?? 0)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {dealMetrics?.won_deals ?? 0} Closed-Won Deals
          </div>
        </div>

        {/* Pipeline Forecast */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Weighted Forecast
          </div>
          <div className="mt-2 text-3xl font-extrabold text-forge-400">
            {formatCurrency(overview?.pipeline_forecast_value ?? 0)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Probability Weighted Forecast
          </div>
        </div>

        {/* Win Rate */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Win Rate
          </div>
          <div className="mt-2 text-3xl font-extrabold text-blue-400">
            {dealMetrics?.win_rate_percent ?? 0}%
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Closed-Won Ratio
          </div>
        </div>

        {/* Lead Conversion Rate */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Lead Conversion
          </div>
          <div className="mt-2 text-3xl font-extrabold text-purple-400">
            {leadMetrics?.conversion_rate_percent ?? 0}%
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {leadMetrics?.converted_leads ?? 0} of {leadMetrics?.total_leads ?? 0} Leads Converted
          </div>
        </div>
      </div>

      {/* Pipeline Stage Distribution */}
      {pipelines && pipelines.length > 0 && pipelines[0]?.stages && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
            Pipeline Velocity & Stage Distribution
          </h2>
          <div className="space-y-4">
            {pipelines[0].stages.map((stage) => (
              <div key={stage.stage_id} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-200">{stage.stage_name}</span>
                  <span className="font-semibold text-slate-400">
                    {formatCurrency(stage.total_value)} ({stage.deal_count} deals)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-forge-600 to-indigo-500 transition-all"
                    style={{
                      width: `${
                        overview?.pipeline_total_value
                          ? Math.min(100, (stage.total_value / overview.pipeline_total_value) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
