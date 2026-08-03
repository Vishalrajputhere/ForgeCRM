'use client';

import Link from 'next/link';
import { useState } from 'react';

import { useToast } from '@/components/ui/toast';
import { useCRM } from '@/hooks/use-crm';
import type { CompanyResponse } from '@/types';

export default function CompaniesPage(): React.JSX.Element {
  const { companies, isLoadingCompanies, createCompany, isCreatingCompany } = useCRM();
  const { toast } = useToast();

  // ── Search ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');

  const filtered = companies.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.website?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Create modal ──────────────────────────────────────────────────────────
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    website: '',
    email: '',
    phone: '',
    description: '',
    annual_revenue: '',
    employee_count: '',
  });
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    try {
      await createCompany({
        name: createForm.name,
        ...(createForm.website ? { website: createForm.website } : {}),
        ...(createForm.email ? { email: createForm.email } : {}),
        ...(createForm.phone ? { phone: createForm.phone } : {}),
        ...(createForm.description ? { description: createForm.description } : {}),
        ...(createForm.annual_revenue ? { annual_revenue: Number(createForm.annual_revenue) } : {}),
        ...(createForm.employee_count ? { employee_count: Number(createForm.employee_count) } : {}),
      });
      setIsCreateOpen(false);
      setCreateForm({ name: '', website: '', email: '', phone: '', description: '', annual_revenue: '', employee_count: '' });
      toast('success', 'Company created', `"${createForm.name}" has been registered.`);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create company.');
    }
  };

  const inputCls =
    'w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-forge-500 transition-colors';
  const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Companies</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {isLoadingCompanies ? 'Loading…' : `${companies.length} company accounts in this workspace`}
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-lg bg-forge-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-forge-500/20 hover:bg-forge-400 transition-all flex items-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Company
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search companies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-forge-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'Active', 'Inactive'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                statusFilter === s
                  ? 'bg-forge-500/20 text-forge-400 border border-forge-500/40'
                  : 'border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
              }`}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Companies Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-xl overflow-hidden">
        {isLoadingCompanies ? (
          <div className="space-y-0">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-800 animate-pulse">
                <div className="h-8 w-8 rounded-lg bg-slate-800" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-800 rounded w-40" />
                  <div className="h-2.5 bg-slate-800/60 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="h-12 w-12 mx-auto text-slate-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
            </svg>
            <p className="text-slate-500 text-sm">
              {search ? `No companies match "${search}"` : 'No companies yet. Click "Add Company" to get started.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Company</th>
                <th className="px-6 py-3.5">Website</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((company) => (
                <CompanyRow key={company.id} company={company} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Create Company Modal ─────────────────────────────────────────────── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">Register New Company</h3>
            {createError && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400">
                {createError}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className={labelCls}>Company Name <span className="text-rose-400">*</span></label>
                <input required type="text" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className={inputCls} placeholder="Acme Corporation" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Website</label>
                  <input type="text" placeholder="https://acme.com" value={createForm.website} onChange={(e) => setCreateForm({ ...createForm, website: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input type="text" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Employees</label>
                  <input type="number" min={0} value={createForm.employee_count} onChange={(e) => setCreateForm({ ...createForm, employee_count: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Annual Revenue ($)</label>
                <input type="number" min={0} value={createForm.annual_revenue} onChange={(e) => setCreateForm({ ...createForm, annual_revenue: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea rows={2} value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} className={inputCls} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={isCreatingCompany} className="rounded-lg bg-forge-500 px-4 py-2 text-xs font-semibold text-white hover:bg-forge-400 disabled:opacity-50">
                  {isCreatingCompany ? 'Saving…' : 'Save Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CompanyRow({ company }: { company: CompanyResponse }) {
  return (
    <tr className="hover:bg-slate-800/40 transition-colors group">
      <td className="px-6 py-4">
        <Link href={`/companies/${company.id}`} className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-forge-600/30 to-indigo-600/30 border border-forge-500/20 text-xs font-bold text-forge-300">
            {company.name[0]?.toUpperCase()}
          </div>
          <span className="font-medium text-white group-hover:text-forge-300 transition-colors">{company.name}</span>
        </Link>
      </td>
      <td className="px-6 py-4 text-slate-400">
        {company.website ? (
          <a
            href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-forge-300 transition-colors text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            {company.website.replace(/^https?:\/\//, '')}
          </a>
        ) : (
          <span className="text-slate-600 text-xs">—</span>
        )}
      </td>
      <td className="px-6 py-4 text-slate-400 text-xs">{company.email || <span className="text-slate-600">—</span>}</td>
      <td className="px-6 py-4">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold border ${
          company.status === 'Active'
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
        }`}>
          {company.status}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <Link
          href={`/companies/${company.id}`}
          className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
        >
          View →
        </Link>
      </td>
    </tr>
  );
}
