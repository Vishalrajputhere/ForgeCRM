'use client';

/**
 * ForgeCRM — Main Executive Dashboard & Business Intelligence Console
 *
 * Consolidated executive command center featuring real-time CRM KPIs,
 * sales leaderboards, pipeline funnel analytics, and quick access to AI sales intelligence.
 */

import React from 'react';
import Link from 'next/link';
import { Bot, ShieldAlert, Sparkles } from 'lucide-react';

import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';
import { Container } from '@/components/ui/layout-primitives';
import { Heading, Text } from '@/components/ui/typography';

export default function DashboardPage(): React.JSX.Element {
  return (
    <Container size="xl" className="py-6 space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Heading level="h1">Executive Intelligence</Heading>
          <Text variant="body-m" color="secondary" className="mt-0.5">
            Real-time business telemetry, sales velocity, pipeline forecasting, and AI productivity.
          </Text>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/ai/copilot"
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg shadow-xs hover:bg-accent/90 transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Copilot</span>
          </Link>
          <Link
            href="/ai/deal-coach"
            className="flex items-center gap-1.5 rounded-lg border border-border-default bg-surface px-3 py-1.5 text-xs font-medium text-primary hover:bg-hover transition-all"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-status-danger-fg" />
            <span>Deal Coach</span>
          </Link>
          <Link
            href="/ai/executive"
            className="flex items-center gap-1.5 rounded-lg border border-border-default bg-surface px-3 py-1.5 text-xs font-medium text-primary hover:bg-hover transition-all"
          >
            <Bot className="h-3.5 w-3.5 text-accent" />
            <span>Executive Copilot</span>
          </Link>
        </div>
      </div>

      {/* ── Enterprise Analytics BI Suite ────────────────────────────────────── */}
      <AnalyticsDashboard />
    </Container>
  );
}
