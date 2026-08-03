import type { Metadata } from 'next';
import Link from 'next/link';
import {
  TrendingUp,
  Users,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  BarChart3,
} from 'lucide-react';


export const metadata: Metadata = {
  title: 'ForgeCRM — CRM built for modern sales teams',
  description: 'Manage contacts, leads, deals, and pipelines with precision. Multi-tenant, enterprise-grade.',
  robots: { index: true, follow: true },
};

// ── Data ──────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: TrendingUp,
    title: 'Pipeline Intelligence',
    description: 'Visual kanban boards with drag-and-drop deal management. Real-time pipeline value and weighted forecasts.',
    color: 'text-forge-400',
    bg: 'bg-forge-500/10',
  },
  {
    icon: Users,
    title: 'Contact & Company Graph',
    description: 'Rich contact profiles with relationship mapping. Link contacts, companies, deals and activities together.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
  },
  {
    icon: Zap,
    title: 'Lead Conversion Workflows',
    description: 'Capture leads, qualify them, and convert to deals with one click. Full conversion audit trail.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: BarChart3,
    title: 'Executive Analytics',
    description: 'Win rates, revenue forecasts, lead conversion rates, and sales velocity metrics in real-time.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Globe,
    title: 'Multi-Workspace',
    description: 'Manage multiple organizations with strict tenant isolation. Regional settings per workspace.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Role-based access control, JWT token rotation, immutable audit timeline, and full data isolation.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
];

const testimonials = [
  {
    quote: "ForgeCRM replaced three separate tools for us. The pipeline view alone has cut our deal review meetings in half.",
    author: "Sarah Chen",
    role: "VP Sales, Meridian Group",
    initials: "SC",
  },
  {
    quote: "The multi-workspace setup is exactly what we needed for our agency model. Client data is completely isolated.",
    author: "Marcus Webb",
    role: "CTO, Foundry Digital",
    initials: "MW",
  },
  {
    quote: "Finally a CRM that doesn't feel like it was built in 2008. Clean, fast, and the analytics are genuinely useful.",
    author: "Priya Nair",
    role: "Head of Revenue, Arclight SaaS",
    initials: "PN",
  },
];

const pricing = [
  {
    name: 'Starter',
    price: '$29',
    description: 'Perfect for small sales teams.',
    features: ['5 users', '3 workspaces', 'Core CRM features', 'Email support'],
    cta: 'Start free trial',
    highlight: false,
  },
  {
    name: 'Growth',
    price: '$89',
    description: 'For scaling revenue teams.',
    features: ['25 users', 'Unlimited workspaces', 'Analytics & reports', 'Priority support', 'API access'],
    cta: 'Start free trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations.',
    features: ['Unlimited users', 'Custom integrations', 'SSO / SAML', 'Dedicated success manager', 'SLA guarantee'],
    cta: 'Contact sales',
    highlight: false,
  },
];

const faqs = [
  {
    q: 'Is there a free trial?',
    a: 'Yes — all plans include a 14-day free trial. No credit card required.',
  },
  {
    q: 'How does multi-workspace work?',
    a: 'Each workspace is a fully isolated tenant with its own data, settings, users, and regional preferences. Switch between workspaces instantly.',
  },
  {
    q: 'Can I import data from another CRM?',
    a: 'Yes — we support CSV import for contacts, companies, leads, and deals. Migration support is available on Growth and Enterprise plans.',
  },
  {
    q: 'Is my data secure?',
    a: 'ForgeCRM uses strict row-level tenant isolation, encrypted at rest, JWT authentication with token rotation, and a full immutable audit trail.',
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-surface-base text-text-primary">

      {/* ── Navigation ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b bg-surface-base/90 backdrop-blur-md"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-forge-500">
              <svg className="h-4 w-4 text-[#0e0e10]" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
                <path d="M7 1L1 7h4v6l8-8H9V1H7z"/>
              </svg>
            </div>
            <span className="font-semibold tracking-[-0.02em] text-text-primary">ForgeCRM</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {['Features', 'Pricing', 'FAQ'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-label text-text-secondary hover:text-text-primary transition-colors duration-100"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-label text-text-secondary hover:text-text-primary transition-colors duration-100"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-1.5 rounded-md bg-forge-500 px-3.5 py-2 text-label font-semibold text-[#0e0e10] hover:bg-forge-400 transition-colors duration-100"
            >
              Get started
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 md:py-32">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-forge-500/5 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          {/* Eyebrow */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-surface-raised px-3.5 py-1.5"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <div className="h-1.5 w-1.5 rounded-full bg-forge-400" />
            <span className="text-micro text-text-secondary">Multi-tenant · Enterprise-grade · Open architecture</span>
          </div>

          <h1 className="text-display tracking-[-0.03em] text-text-primary">
            CRM built for
            <br />
            <span className="text-forge-gradient">serious sales teams</span>
          </h1>

          <p className="mt-5 text-body-lg text-text-secondary max-w-2xl mx-auto">
            Manage your entire revenue process — contacts, leads, deals, tasks, and analytics — in one focused workspace. Built to scale with your team.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-lg bg-forge-500 px-5 py-3 text-body font-semibold text-[#0e0e10] hover:bg-forge-400 transition-colors duration-100 shadow-brand"
            >
              Start free — no card needed
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-lg border px-5 py-3 text-body text-text-secondary hover:text-text-primary hover:border-[rgba(255,255,255,0.14)] transition-all duration-100"
              style={{ borderColor: 'var(--border-default)' }}
            >
              Sign in to existing workspace
            </Link>
          </div>

          {/* Stat row */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-8">
            {[
              { label: 'Teams using ForgeCRM', value: '1,200+' },
              { label: 'Deals managed', value: '$2.4B' },
              { label: 'Uptime', value: '99.9%' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-h2 tabular text-text-primary">{s.value}</p>
                <p className="text-caption text-text-tertiary mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product Preview ──────────────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-xl border bg-surface-raised shadow-xl"
            style={{ borderColor: 'var(--border-default)' }}
          >
            {/* Mock app chrome */}
            <div className="flex items-center gap-2 border-b px-4 py-3"
              style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--surface-overlay)' }}
            >
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/60" />
                <div className="h-3 w-3 rounded-full bg-amber-500/60" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/60" />
              </div>
              <div className="mx-auto flex items-center gap-2 rounded-md border bg-surface-sunken px-3 py-1"
                style={{ borderColor: 'var(--border-default)' }}
              >
                <div className="h-2 w-2 rounded-full bg-forge-400" />
                <span className="text-caption text-text-tertiary font-mono">app.forgecrm.com/dashboard</span>
              </div>
            </div>

            {/* Mock dashboard */}
            <div className="flex" style={{ minHeight: '360px' }}>
              {/* Sidebar preview */}
              <div className="hidden w-40 shrink-0 border-r p-3 sm:block"
                style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--surface-overlay)' }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-5 w-5 rounded bg-forge-500 flex items-center justify-center">
                    <svg className="h-3 w-3 text-[#0e0e10]" viewBox="0 0 14 14" fill="currentColor"><path d="M7 1L1 7h4v6l8-8H9V1H7z"/></svg>
                  </div>
                  <div className="h-2.5 w-16 rounded-sm bg-[rgba(255,255,255,0.1)]" />
                </div>
                {['Dashboard', 'Leads', 'Companies', 'Deals', 'Tasks'].map((n, i) => (
                  <div key={n}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 mb-0.5 ${i === 3 ? 'bg-forge-500/10' : ''}`}
                  >
                    <div className={`h-3 w-3 rounded-sm ${i === 3 ? 'bg-forge-400/40' : 'bg-[rgba(255,255,255,0.08)]'}`} />
                    <div className={`h-2 rounded-sm ${i === 3 ? 'bg-forge-400/60 w-10' : 'bg-[rgba(255,255,255,0.08)] w-14'}`} />
                  </div>
                ))}
              </div>

              {/* Content preview */}
              <div className="flex-1 p-5">
                <div className="mb-4 h-5 w-24 rounded-md bg-[rgba(255,255,255,0.08)]" />
                <div className="grid grid-cols-4 gap-3 mb-5">
                  {[
                    { color: 'bg-forge-500/20', w: '60%' },
                    { color: 'bg-indigo-500/20', w: '45%' },
                    { color: 'bg-emerald-500/20', w: '75%' },
                    { color: 'bg-amber-500/20', w: '30%' },
                  ].map((c, i) => (
                    <div key={i} className="rounded-lg border p-3"
                      style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-raised)' }}
                    >
                      <div className={`h-1.5 rounded-full mb-2 ${c.color}`} style={{ width: c.w }} />
                      <div className="h-5 w-12 rounded-sm bg-[rgba(255,255,255,0.12)] mb-1" />
                      <div className="h-2 w-16 rounded-sm bg-[rgba(255,255,255,0.06)]" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="rounded-lg border p-2.5 space-y-2"
                      style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--surface-raised)' }}
                    >
                      <div className="h-2.5 w-full rounded-sm bg-[rgba(255,255,255,0.08)]" />
                      <div className="h-12 rounded bg-forge-500/5 border border-forge-500/10 p-2">
                        <div className="h-1.5 w-3/4 rounded-sm bg-[rgba(255,255,255,0.1)] mb-1.5" />
                        <div className="h-1.5 w-1/2 rounded-sm bg-forge-500/30" />
                      </div>
                      {i < 2 && (
                        <div className="h-10 rounded bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] p-2">
                          <div className="h-1.5 w-2/3 rounded-sm bg-[rgba(255,255,255,0.08)] mb-1.5" />
                          <div className="h-1.5 w-1/2 rounded-sm bg-emerald-500/25" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-h1 text-text-primary">Everything your pipeline needs</h2>
            <p className="mt-3 text-body-lg text-text-secondary">Built on a foundation of precision, isolation, and speed.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title}
                  className="group rounded-lg border p-5 transition-all duration-200 hover:border-[rgba(255,255,255,0.14)]"
                  style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-raised)' }}
                >
                  <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${f.bg}`}>
                    <Icon className={`h-4.5 w-4.5 ${f.color}`} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-h3 text-text-primary mb-1.5">{f.title}</h3>
                  <p className="text-label text-text-secondary leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-h1 text-text-primary">Trusted by revenue teams</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.author}
                className="rounded-lg border p-5"
                style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-raised)' }}
              >
                <p className="text-body text-text-secondary leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forge-500/15 text-micro font-semibold text-forge-400">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-label text-text-primary">{t.author}</p>
                    <p className="text-caption text-text-tertiary">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-h1 text-text-primary">Simple, transparent pricing</h2>
            <p className="mt-3 text-body-lg text-text-secondary">14-day free trial on all plans. No credit card required.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {pricing.map((plan) => (
              <div key={plan.name}
                className={`rounded-lg border p-6 relative ${plan.highlight ? 'border-forge-500/40 bg-forge-500/5' : ''}`}
                style={plan.highlight ? {} : { borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-raised)' }}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-forge-500 px-3 py-0.5 text-micro font-semibold text-[#0e0e10]">
                      Most popular
                    </span>
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-h3 text-text-primary">{plan.name}</h3>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-h1 tabular text-text-primary">{plan.price}</span>
                    {plan.price !== 'Custom' && <span className="text-caption text-text-tertiary">/month</span>}
                  </div>
                  <p className="mt-1 text-caption text-text-tertiary">{plan.description}</p>
                </div>
                <ul className="mb-6 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-label text-text-secondary">
                      <div className="h-1.5 w-1.5 rounded-full bg-forge-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.price === 'Custom' ? '/contact' : '/register'}
                  className={`flex w-full items-center justify-center rounded-md py-2.5 text-label font-semibold transition-colors duration-100 ${
                    plan.highlight
                      ? 'bg-forge-500 text-[#0e0e10] hover:bg-forge-400'
                      : 'border text-text-primary hover:border-[rgba(255,255,255,0.18)] hover:bg-[rgba(255,255,255,0.04)]'
                  }`}
                  style={plan.highlight ? {} : { borderColor: 'var(--border-strong)' }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-6 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="mx-auto max-w-2xl">
          <h2 className="text-h1 text-text-primary mb-10 text-center">Common questions</h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="border-b pb-6 last:border-0 last:pb-0" style={{ borderColor: 'var(--border-subtle)' }}>
                <h3 className="text-h3 text-text-primary mb-2">{faq.q}</h3>
                <p className="text-body text-text-secondary">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-h1 text-text-primary">Ready to close more deals?</h2>
          <p className="mt-3 text-body-lg text-text-secondary">Start your free trial today. No setup, no credit card.</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-lg bg-forge-500 px-6 py-3 text-body font-semibold text-[#0e0e10] hover:bg-forge-400 transition-colors duration-100"
            >
              Get started free
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="border-t py-10 px-6" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-forge-500">
              <svg className="h-3 w-3 text-[#0e0e10]" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
                <path d="M7 1L1 7h4v6l8-8H9V1H7z"/>
              </svg>
            </div>
            <span className="text-label font-semibold text-text-secondary">ForgeCRM</span>
          </div>
          <p className="text-caption text-text-tertiary">
            © {new Date().getFullYear()} ForgeCRM. All rights reserved.
          </p>
          <div className="flex gap-5">
            {['Privacy', 'Terms', 'Docs'].map((l) => (
              <a key={l} href="#" className="text-caption text-text-tertiary hover:text-text-secondary transition-colors duration-100">
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
