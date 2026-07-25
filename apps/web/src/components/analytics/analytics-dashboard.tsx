'use client';

import { useAnalytics } from '@/hooks/use-analytics';
import { useAnalyticsStore } from '@/stores/analytics-store';

export function AnalyticsDashboard(): React.JSX.Element {
  const { overview, leadMetrics, dealMetrics, pipelines, isLoadingOverview } = useAnalytics();
  const { dateRange, setDateRange } = useAnalyticsStore();

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
            ${dealMetrics?.total_won_revenue.toLocaleString() ?? '0'}
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
            ${overview?.pipeline_forecast_value.toLocaleString() ?? '0'}
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
      {pipelines.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">Pipeline Stage Breakdown</h2>
          <p className="mb-4 text-xs text-slate-400">
            Deal counts and probability-weighted value by stage
          </p>
          <div className="space-y-4">
            {pipelines[0]?.stages.map((st) => (
              <div key={st.stage_id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-200">{st.stage_name}</span>
                  <span className="text-xs text-slate-400">
                    {st.deal_count} deals · ${st.total_value.toLocaleString()} (${st.weighted_value.toLocaleString()} weighted)
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-forge-600 to-indigo-500 transition-all"
                    style={{ width: `${Math.min(100, Math.max(8, (st.deal_count / (pipelines[0]?.total_deals || 1)) * 100))}%` }}
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
