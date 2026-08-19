'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Zap,
  Shield,
  ArrowRight,
  BarChart3,
  Sparkles,
  Package,
  Cpu,
  Server,
  CheckCircle2,
  Check,
  Bot,
  HardDrive,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';

export default function HomePage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'kanban' | 'ai' | 'products' | 'analytics' | 'automation'>('kanban');
  const [activeCopilotMessage, setActiveCopilotMessage] = useState(0);

  const copilotPrompts = [
    {
      query: "Analyze risk and win probability for CyberGuard Systems deal ($159,300)",
      response: "CyberGuard Systems is in 'Proposal Sent' stage with 82% calculated win probability. Key decision maker CTO David Miller is highly engaged. Recommended action: Send revised single-tenant security architecture deck before Thursday's procurement review.",
      metrics: { confidence: "88% High", stage: "Proposal Sent", daysInStage: "4 days" }
    },
    {
      query: "Score incoming lead Elena Rostova (VP InfoSec @ CyberGuard)",
      response: "Lead qualification complete. BANT Score: 94/100 (Budget verified, VP authority, immediate 30-day timeline). ICP Match: Tier-1 Enterprise Security. Recommended: Trigger 1-click atomic conversion to Company + Opportunity.",
      metrics: { fitScore: "94/100", bantFit: "Strong", priority: "Urgent" }
    },
    {
      query: "Forecast Q3 closed revenue across active pipelines",
      response: "Expected revenue forecast for Q3 2026: $1,420,000 against $1.2M target quota (118% quota attainment). Worst-case committed floor: $980,000. Upside best-case: $1,890,000.",
      metrics: { expected: "$1.42M", attainment: "118%", committedFloor: "$980K" }
    }
  ];

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200 font-sans antialiased overflow-x-hidden">
      
      {/* ── Ambient 3D Glow Grid Canvas ────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top radial gradient light */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent blur-[140px] rounded-full" />
        {/* Center cyan cyber glow */}
        <div className="absolute top-[35%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/10 blur-[160px] rounded-full" />
        {/* Amber warm accent */}
        <div className="absolute bottom-[20%] left-[-10%] w-[600px] h-[600px] bg-amber-500/5 blur-[180px] rounded-full" />
        {/* Subtle perspective grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
            backgroundSize: '48px 48px'
          }}
        />
      </div>

      {/* ── Sticky Glass Navigation Header ───────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#090a0f]/80 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          
          {/* Logo & Version Badge */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
              <svg className="h-5 w-5 text-white" viewBox="0 0 14 14" fill="currentColor">
                <path d="M7 1L1 7h4v6l8-8H9V1H7z" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">Forge<span className="text-indigo-400">CRM</span></span>
              <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 tracking-wide uppercase">
                v2.4 Enterprise
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-medium text-slate-300">
            <a href="#capabilities" className="hover:text-white transition-colors">Core Capabilities</a>
            <a href="#preview" className="hover:text-white transition-colors">Interactive Console</a>
            <a href="#ai-engine" className="hover:text-white transition-colors">AI Sales Copilot</a>
            <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="relative inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 hover:from-indigo-400 hover:to-purple-500 hover:shadow-indigo-500/40 transition-all group"
            >
              <span>Get Started</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Hero Section with 3D Depth ──────────────────────────────────── */}
      <section className="relative z-10 pt-20 pb-28 md:pt-28 md:pb-36 px-6">
        <div className="mx-auto max-w-5xl text-center">
          
          {/* Real-time Status Badge */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-indigo-500/30 bg-indigo-950/40 backdrop-blur-md px-4 py-1.5 shadow-inner shadow-indigo-500/20 mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-medium text-indigo-200">
              Multi-Tenant Architecture · Celery & Redis Queue · Database-Authoritative RBAC
            </span>
          </div>

          {/* Hero Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
            The High-Performance <br />
            <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              Revenue Operations Engine
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-normal">
            ForgeCRM unifies account management, visual kanban deal pipelines, complex SKU commercial line items with immutable price snapshotting, and 18 context-grounded AI sales copilot skills into one ultra-fast workspace.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 px-7 py-4 text-sm font-semibold text-white shadow-xl shadow-indigo-500/30 ring-1 ring-white/20 hover:from-indigo-400 hover:to-purple-500 hover:shadow-indigo-500/50 transition-all hover:scale-[1.02]"
            >
              <span>Launch Free Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md px-6 py-4 text-sm font-medium text-slate-200 hover:bg-white/[0.08] hover:border-white/20 hover:text-white transition-all"
            >
              <span>Access Live Demo Workspace</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </Link>
          </div>

          {/* Key Metric Highlights */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-white/[0.06]">
            <div className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.02]">
              <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">100%</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Tenant Data Isolation</p>
            </div>
            <div className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.02]">
              <p className="text-2xl sm:text-3xl font-bold text-indigo-400 tracking-tight">18 Skills</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Enterprise AI Copilot</p>
            </div>
            <div className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.02]">
              <p className="text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight">153/153</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Automated Tests Passed</p>
            </div>
            <div className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.02]">
              <p className="text-2xl sm:text-3xl font-bold text-purple-400 tracking-tight">&lt; 100ms</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Live SSE RBAC Push</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3D Interactive Console Preview Showcase ──────────────────────────── */}
      <section id="preview" className="relative z-10 py-12 px-6">
        <div className="mx-auto max-w-6xl">
          
          {/* Section Header */}
          <div className="text-center mb-10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Live Platform Console</h2>
            <p className="text-2xl sm:text-4xl font-bold text-white mt-2">
              Engineered for Speed, Precision, and Real Data
            </p>
            <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
              Explore the real modules powering modern high-velocity revenue teams.
            </p>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
            {[
              { id: 'kanban', label: 'Visual Deal Kanban', icon: TrendingUp },
              { id: 'ai', label: 'AI Sales Copilot', icon: Sparkles },
              { id: 'products', label: 'Commercial Line Items', icon: Package },
              { id: 'analytics', label: 'Executive BI Analytics', icon: BarChart3 },
              { id: 'automation', label: 'Workflow Automations', icon: Cpu },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/20'
                      : 'border border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* 3D Glass Frame Container */}
          <div className="relative rounded-2xl border border-white/10 bg-[#0f111a]/90 backdrop-blur-2xl shadow-2xl overflow-hidden ring-1 ring-white/5 transition-all">
            
            {/* Window Top Chrome */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5 bg-black/40">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-[11px] font-mono text-slate-500">app.forgecrm.io/{activeTab}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Tenant: Acme Enterprise
                </span>
              </div>
            </div>

            {/* Content Area Based on Active Tab */}
            <div className="p-6 md:p-8 min-h-[440px] flex flex-col justify-center">

              {/* ── TAB 1: KANBAN BOARD ── */}
              {activeTab === 'kanban' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/[0.06] pb-4">
                    <div>
                      <h3 className="text-base font-bold text-white">Default Enterprise Sales Pipeline</h3>
                      <p className="text-xs text-slate-400">4 Active Stages · $578,700 Total Pipeline · 74% Win Probability</p>
                    </div>
                    <span className="rounded-lg bg-indigo-500/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-semibold text-indigo-300">
                      Weighted Forecast: $428,238
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Stage 1 */}
                    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-300">1. Discovery</span>
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 font-mono">25%</span>
                      </div>
                      <div className="rounded-lg border border-white/[0.08] bg-slate-900/80 p-3 shadow-md hover:border-indigo-500/40 transition-colors">
                        <p className="text-xs font-bold text-white">NovaTech — Cloud Migration</p>
                        <p className="text-[11px] text-slate-400 mt-1">NovaTech Solutions Inc.</p>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.04]">
                          <span className="text-xs font-bold text-emerald-400">$180,000</span>
                          <span className="text-[10px] font-medium text-slate-500">2d ago</span>
                        </div>
                      </div>
                    </div>

                    {/* Stage 2 */}
                    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-300">2. Proposal Sent</span>
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 font-mono">60%</span>
                      </div>
                      <div className="rounded-lg border border-indigo-500/40 bg-indigo-950/20 p-3 shadow-md">
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-indigo-400 mb-1">
                          <Sparkles className="h-3 w-3" />
                          <span>AI Deal Coach Monitored</span>
                        </div>
                        <p className="text-xs font-bold text-white">CyberGuard — SecOps Seats</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">CyberGuard Systems</p>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.04]">
                          <span className="text-xs font-bold text-emerald-400">$159,300</span>
                          <span className="rounded bg-indigo-500/20 text-indigo-300 text-[10px] px-1.5 py-0.5 font-medium">82% Win</span>
                        </div>
                      </div>
                    </div>

                    {/* Stage 3 */}
                    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-300">3. Negotiation</span>
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 font-mono">80%</span>
                      </div>
                      <div className="rounded-lg border border-white/[0.08] bg-slate-900/80 p-3 shadow-md">
                        <p className="text-xs font-bold text-white">Starlight — Enterprise Core</p>
                        <p className="text-[11px] text-slate-400 mt-1">Starlight Tech Inc.</p>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.04]">
                          <span className="text-xs font-bold text-emerald-400">$125,000</span>
                          <span className="text-[10px] font-medium text-slate-500">Legal Review</span>
                        </div>
                      </div>
                    </div>

                    {/* Stage 4 */}
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-300">4. Closed Won</span>
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-400 font-mono">100%</span>
                      </div>
                      <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-3 shadow-md">
                        <p className="text-xs font-bold text-white">Meridian — Annual Expansion</p>
                        <p className="text-[11px] text-slate-400 mt-1">Meridian Global Corp</p>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-emerald-500/20">
                          <span className="text-xs font-bold text-emerald-400">$114,400</span>
                          <span className="text-[10px] font-semibold text-emerald-300">Won Today</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 2: AI SALES COPILOT ── */}
              {activeTab === 'ai' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-indigo-400" />
                      <span className="text-sm font-bold text-white">Sales Intelligence Copilot</span>
                      <span className="rounded-full bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 text-[10px] text-indigo-300 font-mono">
                        Model: Google Gemini 1.5 Flash
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">Live Grounding: CRM DB + RAG Chunks</span>
                  </div>

                  {/* Sample Query Selectors */}
                  <div className="flex gap-2 flex-wrap">
                    {copilotPrompts.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveCopilotMessage(idx)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                          activeCopilotMessage === idx
                            ? 'border-indigo-500 bg-indigo-500/20 text-white font-medium'
                            : 'border-white/[0.08] bg-black/20 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Prompt {idx + 1}
                      </button>
                    ))}
                  </div>

                  {/* Live Chat Bubble */}
                  <div className="rounded-xl border border-white/[0.08] bg-black/40 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                        U
                      </div>
                      <p className="text-xs font-semibold text-slate-200 pt-1">
                        "{copilotPrompts[activeCopilotMessage]?.query ?? ''}"
                      </p>
                    </div>

                    <div className="flex items-start gap-3 pt-2 border-t border-white/[0.04]">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-md">
                        <Sparkles className="h-3.5 w-3.5" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {copilotPrompts[activeCopilotMessage]?.response ?? ''}
                        </p>
                        <div className="flex gap-2 pt-1">
                          {Object.entries(copilotPrompts[activeCopilotMessage]?.metrics ?? {}).map(([k, v]) => (
                            <span key={k} className="rounded-md bg-white/[0.04] border border-white/[0.06] px-2 py-1 text-[10px] text-indigo-300 font-mono">
                              {k}: <strong className="text-white">{v}</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 3: PRODUCT CATALOG & LINE ITEMS ── */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">Commercial Line Items & Historical Price Snapshotting</h3>
                      <p className="text-xs text-slate-400">Deal: CyberGuard Systems Contract ($159,300.00)</p>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                      Grand Total: $159,300.00
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/[0.08] text-slate-400">
                          <th className="pb-2 font-medium">SKU / Offering</th>
                          <th className="pb-2 font-medium">Qty</th>
                          <th className="pb-2 font-medium">Unit Price</th>
                          <th className="pb-2 font-medium">Discount</th>
                          <th className="pb-2 font-medium">Tax Rate</th>
                          <th className="pb-2 font-medium text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04] text-slate-300">
                        <tr>
                          <td className="py-2.5 font-medium text-white">
                            <div>Enterprise Platform License</div>
                            <span className="text-[10px] font-mono text-slate-500">SKU-ENT-PLAT-001</span>
                          </td>
                          <td className="py-2.5">10</td>
                          <td className="py-2.5 font-mono">$15,000.00</td>
                          <td className="py-2.5 font-mono text-amber-400">10.00% (-$15k)</td>
                          <td className="py-2.5 font-mono">18.00%</td>
                          <td className="py-2.5 font-mono font-bold text-white text-right">$159,300.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-lg border border-white/[0.06] bg-black/20 p-3 flex items-center justify-between text-xs text-slate-400">
                    <span>* Immutable Snapshot Guarantee: Updating SKU catalog base prices does not alter historical closed deal revenue.</span>
                    <span className="text-emerald-400 font-semibold">100% Deterministic Math</span>
                  </div>
                </div>
              )}

              {/* ── TAB 4: EXECUTIVE BI ANALYTICS ── */}
              {activeTab === 'analytics' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <h3 className="text-sm font-bold text-white">Executive Revenue & Velocity Telemetry</h3>
                    <span className="text-xs font-mono text-slate-400">Filter: Trailing 30 Days</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4">
                      <p className="text-xs text-slate-400 font-medium">Closed Won Revenue</p>
                      <p className="text-2xl font-bold text-white mt-1">$482,900</p>
                      <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3" /> +28.4% vs last period
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4">
                      <p className="text-xs text-slate-400 font-medium">Lead Conversion Rate</p>
                      <p className="text-2xl font-bold text-indigo-300 mt-1">34.2%</p>
                      <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3" /> +4.1% funnel velocity
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4">
                      <p className="text-xs text-slate-400 font-medium">Average Deal Cycle</p>
                      <p className="text-2xl font-bold text-purple-300 mt-1">18.4 Days</p>
                      <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3" /> -3.2 days faster close
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 5: WORKFLOW AUTOMATIONS ── */}
              {activeTab === 'automation' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <h3 className="text-sm font-bold text-white">Event-Driven Automation Engine</h3>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold">
                      Rule Active · 142 Runs
                    </span>
                  </div>

                  <div className="rounded-xl border border-white/[0.08] bg-black/40 p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="rounded bg-amber-500/20 border border-amber-500/30 px-2 py-1 text-xs font-bold text-amber-400">
                        TRIGGER
                      </span>
                      <span className="text-xs font-semibold text-white">DEAL_STAGE_CHANGED → Target Stage = "Closed Won"</span>
                    </div>

                    <div className="flex items-center gap-3 pl-4 border-l-2 border-indigo-500/40">
                      <span className="rounded bg-indigo-500/20 border border-indigo-500/30 px-2 py-1 text-xs font-bold text-indigo-300">
                        CONDITION
                      </span>
                      <span className="text-xs text-slate-300 font-mono">deal_value &gt;= $100,000 AND account_tier == "Enterprise"</span>
                    </div>

                    <div className="flex items-center gap-3 pl-4 border-l-2 border-emerald-500/40">
                      <span className="rounded bg-emerald-500/20 border border-emerald-500/30 px-2 py-1 text-xs font-bold text-emerald-400">
                        ACTIONS (2)
                      </span>
                      <div className="text-xs text-slate-300 space-y-1">
                        <div>1. Auto-create onboarding task assigned to Solutions Architect</div>
                        <div>2. Dispatch Celery background welcome payload to client executive</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* ── 6 Core Enterprise Pillars ────────────────────────────────────────── */}
      <section id="capabilities" className="relative z-10 py-24 px-6 border-t border-white/[0.06] bg-gradient-to-b from-transparent via-white/[0.01] to-transparent">
        <div className="mx-auto max-w-7xl">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Core Platform Architecture</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
              Built for Serious Revenue Operations
            </p>
            <p className="text-sm text-slate-400 mt-3">
              Every capability is backed by database-authoritative integrity, background Celery workers, and real-time state synchronization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 hover:border-indigo-500/40 hover:bg-white/[0.04] transition-all group">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 group-hover:scale-110 transition-transform">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Atomic Lead Conversion</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Ingest high-priority leads and convert them in one transactional operation into linked Company, Primary Contact, and Opportunity records without orphaned entities.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 hover:border-purple-500/40 hover:bg-white/[0.04] transition-all group">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-110 transition-transform">
                <Package className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Product Catalog & Decimal Math</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Manage commercial product SKUs, tax rates, and volume discounts. Line items preserve historical unit price snapshots ensuring closed revenue records never drift.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 hover:border-emerald-500/40 hover:bg-white/[0.04] transition-all group">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Dynamic RBAC & SSE Push</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Database-authoritative permissions with instant Server-Sent Events (SSE) synchronization. Changing a role updates client UI guards and navigation without logout.
              </p>
            </div>

            {/* Card 4 */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 hover:border-cyan-500/40 hover:bg-white/[0.04] transition-all group">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-110 transition-transform">
                <Server className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Celery & Redis Worker Engine</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Asynchronous distributed queues for email dispatch, CSV imports/exports, and scheduled automations with 7-day TTL persistence and exponential backoff.
              </p>
            </div>

            {/* Card 5 */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 hover:border-pink-500/40 hover:bg-white/[0.04] transition-all group">
              <div className="h-10 w-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-5 group-hover:scale-110 transition-transform">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">18 Enterprise AI Copilot Skills</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Context-grounded AI intelligence for deal risk coaching, BANT lead qualification, quarterly revenue forecasting, outreach drafting, and executive briefing memos.
              </p>
            </div>

            {/* Card 6 */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 hover:border-amber-500/40 hover:bg-white/[0.04] transition-all group">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform">
                <HardDrive className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">MinIO S3 Document Storage</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Presigned direct S3 drag-and-drop file uploads linked directly to CRM deals, contacts, and companies with timeline activity auditing and download management.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Technical Architecture & Benchmark Section ──────────────────────── */}
      <section id="architecture" className="relative z-10 py-20 px-6 border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl">
          
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent p-8 md:p-12 relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Enterprise Architecture</span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                  Built for Speed, Reliability, and Zero Data Drift
                </h3>
                <p className="text-sm text-slate-400 mt-4 leading-relaxed">
                  Unlike legacy monoliths that rely on brittle plugins and delayed syncing, ForgeCRM runs on a modern asynchronous Python 3.13 backend and Next.js 15 App Router architecture.
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    "Strict multi-tenant tenant isolation on every SQL query",
                    "Alembic database migrations with foreign key cascade guarantees",
                    "Real-time Server-Sent Events (SSE) for permission invalidation",
                    "Presigned S3 MinIO storage for secure zero-proxy file transfers",
                    "Automated Pytest and Vitest regression suites (100% pass rate)",
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Architecture Tech Stack Pill Board */}
              <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-6 space-y-4">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Platform Tech Stack</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <span className="text-[10px] font-mono text-indigo-400">FRONTEND</span>
                    <p className="text-xs font-bold text-white mt-0.5">Next.js 15 + React 19</p>
                  </div>
                  <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <span className="text-[10px] font-mono text-purple-400">BACKEND API</span>
                    <p className="text-xs font-bold text-white mt-0.5">FastAPI + Async SQLAlchemy</p>
                  </div>
                  <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <span className="text-[10px] font-mono text-cyan-400">ASYNC QUEUE</span>
                    <p className="text-xs font-bold text-white mt-0.5">Celery 5.4 + Redis 7</p>
                  </div>
                  <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <span className="text-[10px] font-mono text-emerald-400">DATABASE</span>
                    <p className="text-xs font-bold text-white mt-0.5">PostgreSQL 16 Engine</p>
                  </div>
                  <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <span className="text-[10px] font-mono text-amber-400">OBJECT STORE</span>
                    <p className="text-xs font-bold text-white mt-0.5">MinIO S3 Bucket</p>
                  </div>
                  <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <span className="text-[10px] font-mono text-pink-400">AI GATEWAY</span>
                    <p className="text-xs font-bold text-white mt-0.5">Gemini 1.5 + RAG</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── Transparent Enterprise Pricing ──────────────────────────────────── */}
      <section id="pricing" className="relative z-10 py-24 px-6 border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Transparent Pricing</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
              Simple, Predictable Plans for Scaling Teams
            </p>
            <p className="text-sm text-slate-400 mt-2">
              No hidden add-ons. Full access to CRM, Product Catalog, Automations, and AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Starter Plan */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 flex flex-col justify-between hover:border-white/20 transition-all">
              <div>
                <h3 className="text-lg font-bold text-white">Starter</h3>
                <p className="text-xs text-slate-400 mt-1">For early-stage teams and startups.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">$29</span>
                  <span className="text-xs text-slate-400">/ seat / month</span>
                </div>

                <div className="mt-8 space-y-3">
                  {[
                    "Up to 5 team members",
                    "Unlimited companies & contacts",
                    "Visual Kanban deal pipeline",
                    "Product catalog & line items",
                    "Core AI Copilot skills",
                    "MinIO S3 storage (5GB)",
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href="/register"
                className="mt-8 block text-center rounded-xl border border-white/10 bg-white/[0.04] py-3 text-xs font-semibold text-white hover:bg-white/10 transition-all"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Growth Plan (Highlighted) */}
            <div className="rounded-2xl border-2 border-indigo-500 bg-gradient-to-b from-indigo-950/40 via-black/40 to-black/60 p-8 flex flex-col justify-between relative shadow-2xl shadow-indigo-500/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-3.5 py-1 text-[10px] font-bold text-white tracking-wide uppercase shadow-md">
                Most Popular
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">Growth</h3>
                <p className="text-xs text-slate-400 mt-1">For scaling revenue and sales operations.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">$79</span>
                  <span className="text-xs text-slate-400">/ seat / month</span>
                </div>

                <div className="mt-8 space-y-3">
                  {[
                    "Up to 25 team members",
                    "Multiple isolated pipelines",
                    "Full 18 Enterprise AI Copilot skills",
                    "Automated Workflow Engine & runs",
                    "Celery distributed async queue",
                    "Executive BI analytics suite",
                    "MinIO S3 storage (50GB)",
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-200">
                      <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href="/register"
                className="mt-8 block text-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-purple-500 transition-all"
              >
                Launch Growth Workspace
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 flex flex-col justify-between hover:border-white/20 transition-all">
              <div>
                <h3 className="text-lg font-bold text-white">Enterprise Dedicated</h3>
                <p className="text-xs text-slate-400 mt-1">For large sales forces and regulated enterprises.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">Custom</span>
                </div>

                <div className="mt-8 space-y-3">
                  {[
                    "Unlimited users & workspaces",
                    "Dedicated PostgreSQL & Redis VPC",
                    "Custom AI model routing & fine-tuning",
                    "SSO SAML & SCIM directory sync",
                    "Full immutable compliance audit trail",
                    "Dedicated SLA & Solutions Architect",
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href="/register"
                className="mt-8 block text-center rounded-xl border border-white/10 bg-white/[0.04] py-3 text-xs font-semibold text-white hover:bg-white/10 transition-all"
              >
                Contact Enterprise Sales
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── Technical Frequently Asked Questions ─────────────────────────────── */}
      <section id="faq" className="relative z-10 py-20 px-6 border-t border-white/[0.06]">
        <div className="mx-auto max-w-4xl">
          
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Frequently Asked Questions</h2>
            <p className="text-3xl font-extrabold text-white mt-2">Everything You Need to Know</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "How does ForgeCRM guarantee multi-tenant data isolation?",
                a: "Every single SQL query across all 15 backend domains enforces a WHERE workspace_id = :workspace_id filter. Tenant context is validated cryptographically via the X-Workspace-ID header and user membership records."
              },
              {
                q: "How does historical price snapshotting work in deal line items?",
                a: "When a catalog SKU is attached to a deal, its unit price, SKU code, and tax rates are immutably copied into the deal_line_items table. Modifying or archiving the catalog product later will never alter previously closed deal values or analytics."
              },
              {
                q: "What AI models are supported by the Sales Copilot?",
                a: "ForgeCRM natively integrates with Google Gemini 1.5 Flash / Pro, OpenAI GPT-4o, and Anthropic Claude 3.5 Sonnet through a unified LLM router with automatic PII sanitization and token spend metering."
              },
              {
                q: "Can we self-host ForgeCRM on our own Kubernetes / Docker infrastructure?",
                a: "Yes. ForgeCRM is packaged with complete Docker Compose and production Dockerfiles for the FastAPI backend, Next.js frontend, PostgreSQL 16 database, Redis queue, and MinIO storage cluster."
              }
            ].map((item, idx) => (
              <div key={idx} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
                <h4 className="text-sm font-bold text-white">{item.q}</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Final Call to Action ─────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-6 border-t border-white/[0.06] bg-gradient-to-b from-indigo-950/20 to-transparent">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ready to Upgrade Your Revenue Operations?
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-4 max-w-xl mx-auto">
            Experience the speed, precision, and AI intelligence of ForgeCRM Enterprise today.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-indigo-500/25 ring-1 ring-white/20 hover:from-indigo-400 hover:to-purple-500 transition-all hover:scale-[1.02]"
            >
              <span>Get Started in 60 Seconds</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all"
            >
              Sign In to Existing Workspace
            </Link>
          </div>
        </div>
      </section>

      {/* ── Enterprise Footer ────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/[0.06] py-12 px-6 bg-black/40 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
              F
            </div>
            <span className="font-semibold text-slate-300">ForgeCRM Enterprise</span>
            <span>·</span>
            <span>© 2026 ForgeCRM Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              All Systems Operational
            </span>
            <Link href="/login" className="hover:text-slate-300 transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-slate-300 transition-colors">Register</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
