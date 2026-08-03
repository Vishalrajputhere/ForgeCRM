import type { Metadata } from 'next';
import Link from 'next/link';
import {
  TrendingUp,
  Users,
  CheckSquare2,
  Zap,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your ForgeCRM workspace',
};

interface AuthLayoutProps {
  readonly children: React.ReactNode;
}

// ── Fake product preview data ─────────────────────────────────────────────────

const previewDeals = [
  { name: 'Acme Corp — Enterprise Plan', value: '$48,000', stage: 'Proposal', progress: 70 },
  { name: 'Globex Media Renewal', value: '$22,500', stage: 'Negotiation', progress: 85 },
  { name: 'Initech SaaS Upgrade', value: '$15,200', stage: 'Discovery', progress: 30 },
];

const stats = [
  { label: 'Pipeline', value: '$284K', icon: TrendingUp, color: 'text-forge-400' },
  { label: 'Contacts', value: '1,842', icon: Users, color: 'text-indigo-400' },
  { label: 'Open Tasks', value: '47', icon: CheckSquare2, color: 'text-emerald-400' },
  { label: 'Leads',  value: '138', icon: Zap, color: 'text-amber-400' },
];

export default function AuthLayout({ children }: AuthLayoutProps): React.JSX.Element {
  return (
    <div className="flex min-h-screen bg-surface-base">
      {/* ── Left — Product Preview ──────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-between bg-surface-raised border-r p-10"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 w-fit">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-forge-500">
            <svg className="h-4 w-4 text-[#0e0e10]" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
              <path d="M7 1L1 7h4v6l8-8H9V1H7z"/>
            </svg>
          </div>
          <span className="text-h3 text-text-primary tracking-[-0.02em]">ForgeCRM</span>
        </Link>

        {/* Preview card */}
        <div className="space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-lg border bg-surface-overlay p-3"
                  style={{ borderColor: 'var(--border-default)' }}
                >
                  <Icon className={`h-4 w-4 mb-2 ${stat.color}`} strokeWidth={1.5} />
                  <p className="text-h3 tabular">{stat.value}</p>
                  <p className="text-caption text-text-tertiary mt-0.5">{stat.label}</p>
                </div>
              );
            })}
          </div>

          {/* Pipeline preview */}
          <div className="rounded-lg border bg-surface-overlay overflow-hidden"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <p className="text-label text-text-primary">Active Pipeline</p>
              <span className="text-micro px-1.5 py-0.5 rounded-sm bg-forge-500/15 text-forge-400">3 deals</span>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {previewDeals.map((deal) => (
                <div key={deal.name} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-label text-text-primary">{deal.name}</p>
                    <span className="text-label font-semibold tabular text-forge-400">{deal.value}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-forge-500"
                        style={{ width: `${deal.progress}%` }}
                      />
                    </div>
                    <span className="text-caption text-text-tertiary shrink-0">{deal.stage}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Social proof */}
        <div className="space-y-2">
          <div className="flex -space-x-2">
            {['A', 'B', 'C', 'D'].map((l) => (
              <div key={l}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface-raised bg-surface-overlay text-micro font-semibold text-text-secondary"
              >
                {l}
              </div>
            ))}
          </div>
          <p className="text-caption text-text-secondary">
            Trusted by <span className="text-text-primary font-medium">1,200+ sales teams</span> worldwide.
          </p>
        </div>
      </div>

      {/* ── Right — Auth Form ───────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Mobile brand */}
        <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-forge-500">
            <svg className="h-4 w-4 text-[#0e0e10]" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
              <path d="M7 1L1 7h4v6l8-8H9V1H7z"/>
            </svg>
          </div>
          <span className="text-h3 text-text-primary tracking-[-0.02em]">ForgeCRM</span>
        </Link>

        <div className="w-full max-w-sm">
          {children}
        </div>

        {/* Footer */}
        <p className="mt-10 text-caption text-text-tertiary">
          © {new Date().getFullYear()} ForgeCRM. All rights reserved.
        </p>
      </div>
    </div>
  );
}
