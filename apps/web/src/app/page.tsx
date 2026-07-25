import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'ForgeCRM — Welcome',
  description: 'Enterprise-grade CRM for modern businesses.',
};

export default function HomePage(): React.JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-forge-950 via-slate-900 to-forge-900">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-forge-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-forge-400/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-forge-600/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-6 text-center">
        {/* Logo / Brand */}
        <div className="mb-8 inline-flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-forge-500 shadow-lg shadow-forge-500/30">
            <svg
              className="h-7 w-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            ForgeCRM
          </span>
        </div>

        {/* Headline */}
        <h1 className="mb-4 text-5xl font-bold tracking-tight text-white">
          Enterprise CRM
          <br />
          <span className="bg-gradient-to-r from-forge-300 to-forge-100 bg-clip-text text-transparent">
            Built for Scale
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mb-10 text-lg text-slate-400">
          Manage contacts, leads, deals, and pipelines with AI-assisted
          productivity. Built for modern businesses.
        </p>

        {/* CTA */}
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-forge-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-forge-500/30 transition-all hover:bg-forge-400 hover:shadow-forge-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-400"
          >
            Get Started
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
          <Link
            href="/api/docs"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10"
          >
            API Docs
          </Link>
        </div>

        {/* Status badges */}
        <div className="mt-16 flex items-center justify-center gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
            <span>Milestone 01 — Foundation</span>
          </div>
          <div className="h-1 w-1 rounded-full bg-slate-600" aria-hidden="true" />
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-forge-400" aria-hidden="true" />
            <span>Architecture Frozen</span>
          </div>
        </div>
      </div>
    </main>
  );
}
