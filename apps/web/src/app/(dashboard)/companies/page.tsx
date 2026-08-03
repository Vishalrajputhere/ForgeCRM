'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Building2, Plus, Search, X, ExternalLink } from 'lucide-react';

import { useToast } from '@/components/ui/toast';
import { useCRM } from '@/hooks/use-crm';
import { Button, Input, Skeleton, Badge, FormField, Textarea } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import type { CompanyResponse } from '@/types';

// ── Modal Shell ───────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg overflow-y-auto rounded-xl border bg-surface-overlay shadow-xl max-h-[90vh]"
        style={{ borderColor: 'var(--border-strong)' }}
      >
        <div className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <h2 className="text-h3 text-text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-text-tertiary hover:text-text-primary hover:bg-[rgba(255,255,255,0.06)] transition-colors"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Company Row ───────────────────────────────────────────────────────────────

function CompanyRow({ company }: { company: CompanyResponse }) {
  return (
    <tr className="group border-b transition-colors duration-100 hover:bg-[rgba(255,255,255,0.02)]"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      <td className="px-4 py-3">
        <Link href={`/companies/${company.id}`} className="flex items-center gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-forge-500/15 text-micro font-semibold text-forge-400 ring-1 ring-forge-500/20">
            {company.name[0]?.toUpperCase()}
          </div>
          <span className="text-label text-text-primary group-hover:text-forge-400 transition-colors duration-100 font-medium">
            {company.name}
          </span>
        </Link>
      </td>
      <td className="px-4 py-3 text-caption text-text-secondary">
        {company.website ? (
          <a
            href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-forge-400 transition-colors duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            {company.website.replace(/^https?:\/\//, '')}
            <ExternalLink className="h-3 w-3 opacity-60" strokeWidth={1.5} />
          </a>
        ) : (
          <span className="text-text-tertiary">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-caption text-text-tertiary">{company.email ?? '—'}</td>
      <td className="px-4 py-3">
        <Badge variant={company.status === 'Active' ? 'success' : 'neutral'}>
          {company.status}
        </Badge>
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/companies/${company.id}`}
          className="text-caption text-text-tertiary hover:text-forge-400 transition-colors duration-100"
        >
          View →
        </Link>
      </td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CompaniesPage(): React.JSX.Element {
  const { companies, isLoadingCompanies, createCompany, isCreatingCompany } = useCRM();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');

  const filtered = companies.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (c.website?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '', website: '', email: '', phone: '', description: '',
    annual_revenue: '', employee_count: '',
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
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create company.');
    }
  };

  return (
    <div className="space-y-5 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-h1 text-text-primary">Companies</h1>
          <p className="text-label text-text-tertiary mt-0.5">
            {isLoadingCompanies ? 'Loading…' : `${companies.length} company accounts in this workspace`}
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size="md">
          <Plus className="h-4 w-4" strokeWidth={2} />
          Add Company
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search companies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border bg-surface-sunken py-2 pl-9 pr-3 text-label text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-forge-500 transition-colors duration-100"
            style={{ borderColor: 'var(--border-default)' }}
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'Active', 'Inactive'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'rounded-md border px-3 py-1.5 text-label transition-colors duration-100',
                statusFilter === s
                  ? 'border-forge-500/30 bg-forge-500/10 text-forge-400'
                  : 'text-text-tertiary hover:text-text-primary',
              )}
              style={statusFilter === s ? {} : { borderColor: 'var(--border-default)' }}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border-default)' }}>
        {isLoadingCompanies ? (
          <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="h-7 w-7 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Building2 className="h-10 w-10 text-text-tertiary mb-3" strokeWidth={1} />
            <p className="text-label text-text-secondary">
              {search ? `No companies match "${search}"` : 'No companies yet'}
            </p>
            <p className="text-caption text-text-tertiary mt-1">Register companies to link contacts and deals</p>
            {!search && (
              <Button variant="secondary" size="sm" onClick={() => setIsCreateOpen(true)} className="mt-4">
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                Add Company
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full text-left">
            <thead style={{ backgroundColor: 'var(--surface-overlay)' }}>
              <tr className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                {['Company', 'Website', 'Email', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-micro font-medium text-text-tertiary">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((company) => (
                <CompanyRow key={company.id} company={company} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <Modal title="New Company" onClose={() => setIsCreateOpen(false)}>
          {createError && (
            <div className="mb-4 rounded-md border border-red-500/20 bg-red-500/8 px-3 py-2.5 text-label text-red-400">
              {createError}
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-4">
            <FormField label="Company name" htmlFor="co_name" required>
              <Input id="co_name" required placeholder="Acme Corporation" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Website" htmlFor="co_web">
                <Input id="co_web" placeholder="https://acme.com" value={createForm.website} onChange={(e) => setCreateForm({ ...createForm, website: e.target.value })} />
              </FormField>
              <FormField label="Email" htmlFor="co_email">
                <Input id="co_email" type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
              </FormField>
              <FormField label="Phone" htmlFor="co_phone">
                <Input id="co_phone" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
              </FormField>
              <FormField label="Employee count" htmlFor="co_emp">
                <Input id="co_emp" type="number" min={0} value={createForm.employee_count} onChange={(e) => setCreateForm({ ...createForm, employee_count: e.target.value })} />
              </FormField>
            </div>
            <FormField label="Annual revenue ($)" htmlFor="co_rev">
              <Input id="co_rev" type="number" min={0} value={createForm.annual_revenue} onChange={(e) => setCreateForm({ ...createForm, annual_revenue: e.target.value })} />
            </FormField>
            <FormField label="Description" htmlFor="co_desc">
              <Textarea id="co_desc" rows={2} value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="md" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" size="md" loading={isCreatingCompany}>Save Company</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
