'use client';

/**
 * ForgeCRM — Saved Reports & BI Query Builder
 *
 * Query builder interface for configuring, saving, and executing business intelligence reports
 * with instant CSV data exports.
 */

import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Plus,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalytics } from '@/hooks/use-analytics';

const ENTITY_CONFIGS: Record<
  string,
  { label: string; metrics: string[]; dimensions: string[] }
> = {
  deals: {
    label: 'Deals & Revenue',
    metrics: ['total_revenue', 'deals_won_count', 'deals_open_count', 'avg_deal_size', 'win_rate'],
    dimensions: ['owner', 'stage', 'pipeline', 'created_month'],
  },
  leads: {
    label: 'Leads & Conversions',
    metrics: ['total_leads', 'conversion_rate', 'avg_conversion_days', 'disqualified_count'],
    dimensions: ['source', 'priority', 'owner', 'created_month'],
  },
  sales: {
    label: 'Sales Performance',
    metrics: ['won_revenue', 'deals_won', 'deals_open', 'win_rate', 'sales_cycle_days'],
    dimensions: ['representative', 'team'],
  },
  activities: {
    label: 'Activities & Tasks',
    metrics: ['total_activities', 'tasks_created', 'tasks_completed', 'completion_rate'],
    dimensions: ['activity_type', 'assignee', 'status'],
  },
  ai: {
    label: 'AI Usage & Costs',
    metrics: ['total_requests', 'total_tokens', 'estimated_cost_usd'],
    dimensions: ['provider', 'model', 'skill'],
  },
  accounts: {
    label: 'Accounts & Customers',
    metrics: ['total_revenue', 'open_deals_count', 'contacts_count'],
    dimensions: ['industry', 'company_size', 'created_month'],
  },
};

export function ReportBuilder() {
  const {
    savedReports,
    createReport,
    isCreatingReport,
    deleteReport,
    exportCsv,
  } = useAnalytics();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [reportName, setReportName] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('deals');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'total_revenue',
    'deals_won_count',
  ]);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>(['stage']);
  const [isExporting, setIsExporting] = useState(false);

  const activeConfig = ENTITY_CONFIGS[selectedEntity] ?? ENTITY_CONFIGS.deals ?? {
    label: 'Deals & Revenue',
    metrics: ['total_revenue'],
    dimensions: ['stage'],
  };

  const handleToggleMetric = (m: string) => {
    if (selectedMetrics.includes(m)) {
      setSelectedMetrics(selectedMetrics.filter((item) => item !== m));
    } else {
      setSelectedMetrics([...selectedMetrics, m]);
    }
  };

  const handleToggleDimension = (d: string) => {
    if (selectedDimensions.includes(d)) {
      setSelectedDimensions(selectedDimensions.filter((item) => item !== d));
    } else {
      setSelectedDimensions([...selectedDimensions, d]);
    }
  };

  const handleSaveReport = async () => {
    if (!reportName.trim()) return;

    await createReport({
      name: reportName.trim(),
      description: reportDesc.trim() || undefined,
      entity_type: selectedEntity,
      metrics_json: selectedMetrics,
      dimensions_json: selectedDimensions,
      filters_json: {},
    });

    setReportName('');
    setReportDesc('');
    setIsCreateModalOpen(false);
  };

  const handleExportSavedReport = async (reportType: string) => {
    try {
      setIsExporting(true);
      await exportCsv({ report_type: reportType, time_range: '30d' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-primary">Saved Business Intelligence Reports</h3>
          <p className="text-xs text-muted mt-0.5">
            Custom metric definitions, grouping dimensions, and automated CSV export queries.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          className="h-8 gap-1.5 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Saved Report</span>
        </Button>
      </div>

      {/* ── Saved Reports List ────────────────────────────────────────── */}
      {savedReports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedReports.map((rep) => (
            <Card key={rep.id} className="border-border-default bg-surface/70 backdrop-blur-md flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <CardTitle className="text-xs font-bold text-primary">{rep.name}</CardTitle>
                      <span className="text-[10px] uppercase font-semibold text-accent">
                        {rep.entity_type}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteReport(rep.id)}
                    className="text-muted hover:text-status-danger-fg transition-colors p-1"
                    title="Delete Saved Report"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {rep.description && (
                  <CardDescription className="text-xs text-muted mt-1">
                    {rep.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <div className="rounded-lg bg-sunken p-2 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-muted">
                    <span>Metrics:</span>
                    <span className="font-medium text-primary">
                      {rep.metrics_json.length > 0 ? rep.metrics_json.join(', ') : 'All'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted">
                    <span>Group By:</span>
                    <span className="font-medium text-primary">
                      {rep.dimensions_json.length > 0 ? rep.dimensions_json.join(', ') : 'None'}
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={isExporting}
                  onClick={() => handleExportSavedReport(rep.entity_type)}
                  className="w-full text-xs gap-1.5 h-8 border-border-default hover:bg-accent/10 hover:text-accent"
                >
                  <Download className="h-3 w-3" />
                  <span>Run & Download CSV</span>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border-default p-12 text-center bg-surface/30">
          <FileText className="mx-auto h-8 w-8 text-accent/60 mb-2" />
          <h3 className="text-sm font-semibold text-primary">No Custom Reports Saved</h3>
          <p className="text-xs text-muted max-w-sm mx-auto mt-1 mb-4">
            Build custom datasets for executive reviews, pipeline velocity tracking, or AI cost audits.
          </p>
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)} className="text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Build Your First Report
          </Button>
        </div>
      )}

      {/* ── Create Report Modal Dialog ────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-border-default bg-surface p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-primary">Build Saved Report</h3>
              <p className="text-xs text-muted mt-0.5">
                Define the domain entity, aggregate metrics, and grouping dimensions.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted">Report Name</label>
                <input
                  type="text"
                  placeholder="e.g., Won Deals by Pipeline Stage"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border-default bg-sunken px-3 py-1.5 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Brief description of this report"
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border-default bg-sunken px-3 py-1.5 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted">CRM Domain Entity</label>
                <select
                  value={selectedEntity}
                  onChange={(e) => {
                    const ent = e.target.value;
                    setSelectedEntity(ent);
                    setSelectedMetrics(ENTITY_CONFIGS[ent]?.metrics.slice(0, 2) || []);
                    setSelectedDimensions(ENTITY_CONFIGS[ent]?.dimensions.slice(0, 1) || []);
                  }}
                  className="mt-1 w-full rounded-md border border-border-default bg-sunken px-3 py-1.5 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {Object.entries(ENTITY_CONFIGS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Metrics Selection */}
              <div>
                <label className="text-xs font-medium text-muted">Select Metrics</label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {activeConfig.metrics.map((m) => {
                    const isSelected = selectedMetrics.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleToggleMetric(m)}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-accent text-accent-fg'
                            : 'bg-sunken text-muted hover:text-primary'
                        }`}
                      >
                        {m.replace(/_/g, ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dimensions Selection */}
              <div>
                <label className="text-xs font-medium text-muted">Grouping Dimensions</label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {activeConfig.dimensions.map((d) => {
                    const isSelected = selectedDimensions.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleToggleDimension(d)}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-accent text-accent-fg'
                            : 'bg-sunken text-muted hover:text-primary'
                        }`}
                      >
                        {d.replace(/_/g, ' ')}
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
                onClick={() => setIsCreateModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveReport}
                disabled={!reportName.trim() || selectedMetrics.length === 0 || isCreatingReport}
                className="text-xs"
              >
                {isCreatingReport ? 'Saving...' : 'Save Report'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
