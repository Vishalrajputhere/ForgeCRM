'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { TimelineWidget } from '@/components/crm/timeline-widget';
import { useToast } from '@/components/ui/toast';
import { useCRM } from '@/hooks/use-crm';
import { useFormatters } from '@/hooks/use-formatters';
import type { ContactCreate, DealCreate, CompanyUpdate } from '@/types';

// ── Shared UI Styles ──────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-forge-500 transition-colors';
const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex items-center gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forge-500/10 border border-forge-500/20">
        <svg className="h-5 w-5 text-forge-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
        </svg>
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-lg font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CompanyDetailPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;
  const { toast } = useToast();
  const { formatCurrency } = useFormatters();

  const {
    useCompany,
    updateCompany,
    deleteCompany,
    isDeletingCompany,
    useContactsByCompany,
    createContact,
    isCreatingContact,
    pipelines,
    deals,
    createDeal,
    isCreatingDeal,
    isUpdatingCompany,
  } = useCRM();

  const { data: company, isLoading } = useCompany(companyId);
  const { data: contacts = [] } = useContactsByCompany(companyId);
  const companyDeals = deals.filter((d) => d.company_id === companyId && d.status !== 'Cancelled');

  // ── Edit State ────────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    website: '',
    email: '',
    phone: '',
    description: '',
    annual_revenue: '',
    employee_count: '',
  });

  const openEdit = () => {
    if (!company) return;
    setEditForm({
      name: company.name,
      website: company.website ?? '',
      email: company.email ?? '',
      phone: company.phone ?? '',
      description: company.description ?? '',
      annual_revenue: company.annual_revenue?.toString() ?? '',
      employee_count: company.employee_count?.toString() ?? '',
    });
    setIsEditing(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatePayload: Record<string, unknown> = {};
      if (editForm.name) updatePayload.name = editForm.name;
      if (editForm.website) updatePayload.website = editForm.website;
      if (editForm.email) updatePayload.email = editForm.email;
      if (editForm.phone) updatePayload.phone = editForm.phone;
      if (editForm.description) updatePayload.description = editForm.description;
      if (editForm.annual_revenue) updatePayload.annual_revenue = Number(editForm.annual_revenue);
      if (editForm.employee_count) updatePayload.employee_count = Number(editForm.employee_count);
      await updateCompany({ id: companyId, payload: updatePayload as CompanyUpdate });
      setIsEditing(false);
      toast('success', 'Company updated', 'Changes saved successfully.');
    } catch (err: unknown) {
      toast('error', 'Update failed', err instanceof Error ? err.message : 'Failed to update company.');
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState(false);
  const handleDelete = async () => {
    try {
      await deleteCompany(companyId);
      toast('success', 'Company deactivated', 'The company has been removed.');
      router.push('/companies');
    } catch (err: unknown) {
      toast('error', 'Delete failed', err instanceof Error ? err.message : 'Failed to delete company.');
    }
  };

  // ── Create Contact ────────────────────────────────────────────────────────
  const [isAddContact, setIsAddContact] = useState(false);
  const [contactForm, setContactForm] = useState<ContactCreate>({
    company_id: companyId,
    first_name: '',
    last_name: '',
    email: '',
    job_title: '',
    phone: '',
  });

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createContact({ ...contactForm, company_id: companyId });
      setIsAddContact(false);
      setContactForm({ company_id: companyId, first_name: '', last_name: '', email: '', job_title: '', phone: '' });
      toast('success', 'Contact added');
    } catch (err: unknown) {
      toast('error', 'Failed to add contact', err instanceof Error ? err.message : '');
    }
  };

  // ── Create Deal ───────────────────────────────────────────────────────────
  const [isAddDeal, setIsAddDeal] = useState(false);
  const [dealForm, setDealForm] = useState<Partial<DealCreate>>({
    company_id: companyId,
    name: '',
    value: 0,
  });

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealForm.name) return;
    try {
      const defaultPipeline = pipelines[0];
      const createPayload: Record<string, unknown> = {
        name: dealForm.name,
        company_id: companyId,
        value: dealForm.value ?? 0,
      };
      if (defaultPipeline?.id) createPayload.pipeline_id = defaultPipeline.id;
      if (defaultPipeline?.stages?.[0]?.id) createPayload.stage_id = defaultPipeline.stages[0].id;
      await createDeal(createPayload as unknown as DealCreate);
      setIsAddDeal(false);
      setDealForm({ company_id: companyId, name: '', value: 0 });
      toast('success', 'Deal created');
    } catch (err: unknown) {
      toast('error', 'Failed to create deal', err instanceof Error ? err.message : '');
    }
  };

  // ── Tab State ─────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<'overview' | 'contacts' | 'deals' | 'timeline'>('overview');

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-64 bg-slate-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-8 text-center text-rose-400">
          Company not found.{' '}
          <Link href="/companies" className="underline hover:text-rose-300">Go back</Link>
        </div>
      </div>
    );
  }

  const totalDealValue = companyDeals.reduce((s, d) => s + (d.value || 0), 0);

  return (
    <div className="space-y-6 p-6">
      {/* ── Breadcrumb ────────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/companies" className="hover:text-white transition-colors">Companies</Link>
        <span>/</span>
        <span className="text-white">{company.name}</span>
      </nav>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-forge-600/40 to-indigo-600/40 border border-forge-500/30 text-2xl font-bold text-forge-300">
            {company.name[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{company.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold border ${
                company.status === 'Active'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
              }`}>{company.status}</span>
              {company.website && (
                <a
                  href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-400 hover:text-forge-300 flex items-center gap-1 transition-colors"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {company.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={openEdit}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
          >
            Edit
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/20 transition-all"
          >
            Deactivate
          </button>
        </div>
      </div>

      {/* ── Stat Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Contacts"
          value={contacts.length}
          icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <StatCard
          label="Open Deals"
          value={companyDeals.filter((d) => d.status === 'Open').length}
          icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
        <StatCard
          label="Pipeline Value"
          value={formatCurrency(totalDealValue)}
          icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
        <StatCard
          label="Employees"
          value={company.employee_count?.toLocaleString() ?? '—'}
          icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center border-b border-slate-800 gap-0">
        {(['overview', 'contacts', 'deals', 'timeline'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-medium capitalize border-b-2 transition-all ${
              tab === t
                ? 'border-forge-500 text-forge-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Tab Content ───────────────────────────────────────────────────── */}

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Details Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Company Details</h3>
            <dl className="space-y-3">
              {[
                { label: 'Email', value: company.email },
                { label: 'Phone', value: company.phone },
                { label: 'Website', value: company.website },
                { label: 'Legal Name', value: company.legal_name },
                { label: 'Annual Revenue', value: company.annual_revenue ? `$${company.annual_revenue.toLocaleString()}` : null },
                { label: 'Employees', value: company.employee_count?.toLocaleString() },
              ].map(({ label, value }) => value ? (
                <div key={label} className="flex gap-4">
                  <dt className="w-32 shrink-0 text-xs font-medium text-slate-500 uppercase tracking-wide pt-0.5">{label}</dt>
                  <dd className="text-sm text-slate-300 break-all">{value}</dd>
                </div>
              ) : null)}
            </dl>
            {company.description && (
              <div className="rounded-lg bg-slate-800/60 p-3 mt-2">
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1.5">Description</p>
                <p className="text-sm text-slate-300 leading-relaxed">{company.description}</p>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Recent Activity</h3>
            <TimelineWidget entityType="Company" entityId={companyId} />
          </div>
        </div>
      )}

      {/* Contacts */}
      {tab === 'contacts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300">{contacts.length} Contact{contacts.length !== 1 ? 's' : ''}</h3>
            <button
              onClick={() => setIsAddContact(true)}
              className="rounded-lg bg-forge-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-forge-400 transition-all"
            >
              + Add Contact
            </button>
          </div>
          {contacts.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-500 text-sm">
              No contacts yet. Add the first contact for this company.
            </div>
          ) : (
            <div className="grid gap-3">
              {contacts.map((contact) => (
                <div key={contact.id} className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition-colors">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forge-500/20 border border-forge-500/30 text-sm font-bold text-forge-300 shrink-0">
                    {contact.first_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm">{contact.first_name} {contact.last_name}</p>
                    <p className="text-xs text-slate-400">{contact.job_title || contact.email || '—'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {contact.is_primary && (
                      <span className="rounded-full bg-forge-500/20 px-2 py-0.5 text-xs text-forge-400 border border-forge-500/30">Primary</span>
                    )}
                    <Link
                      href={`/contacts/${contact.id}`}
                      className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Deals */}
      {tab === 'deals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300">{companyDeals.length} Deal{companyDeals.length !== 1 ? 's' : ''}</h3>
            <button
              onClick={() => setIsAddDeal(true)}
              className="rounded-lg bg-forge-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-forge-400 transition-all"
            >
              + Add Deal
            </button>
          </div>
          {companyDeals.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-500 text-sm">
              No deals for this company yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {companyDeals.map((deal) => (
                <div key={deal.id} className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm">{deal.name}</p>
                    <p className="text-xs text-slate-400">
                      {deal.expected_close_date ? `Close: ${new Date(deal.expected_close_date).toLocaleDateString()}` : 'No close date'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold text-emerald-400">${deal.value.toLocaleString()}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium border ${
                      deal.status === 'Won' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                      deal.status === 'Lost' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                      'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    }`}>{deal.status}</span>
                    <Link
                      href={`/deals/${deal.id}`}
                      className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      {tab === 'timeline' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Activity Timeline</h3>
          <TimelineWidget entityType="Company" entityId={companyId} />
        </div>
      )}

      {/* ── Edit Company Modal ─────────────────────────────────────────────── */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">Edit Company</h3>
            <form onSubmit={handleEdit} className="space-y-3">
              <div>
                <label className={labelCls}>Company Name <span className="text-rose-400">*</span></label>
                <input required type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Website</label>
                  <input type="text" value={editForm.website} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input type="text" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Employee Count</label>
                  <input type="number" min={0} value={editForm.employee_count} onChange={(e) => setEditForm({ ...editForm, employee_count: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Annual Revenue ($)</label>
                <input type="number" min={0} value={editForm.annual_revenue} onChange={(e) => setEditForm({ ...editForm, annual_revenue: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea rows={3} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className={inputCls} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsEditing(false)} className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={isUpdatingCompany} className="rounded-lg bg-forge-500 px-4 py-2 text-xs font-semibold text-white hover:bg-forge-400 disabled:opacity-50">
                  {isUpdatingCompany ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ───────────────────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 border border-rose-500/30">
                <svg className="h-5 w-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Deactivate Company</h3>
                <p className="text-xs text-slate-400 mt-0.5">This will mark the company as inactive.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700">Cancel</button>
              <button onClick={handleDelete} disabled={isDeletingCompany} className="flex-1 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50">
                {isDeletingCompany ? 'Deactivating...' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Contact Modal ──────────────────────────────────────────────── */}
      {isAddContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Add Contact</h3>
            <form onSubmit={handleAddContact} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>First Name <span className="text-rose-400">*</span></label>
                  <input required type="text" value={contactForm.first_name} onChange={(e) => setContactForm({ ...contactForm, first_name: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Last Name <span className="text-rose-400">*</span></label>
                  <input required type="text" value={contactForm.last_name} onChange={(e) => setContactForm({ ...contactForm, last_name: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Job Title</label>
                <input type="text" value={contactForm.job_title ?? ''} onChange={(e) => setContactForm({ ...contactForm, job_title: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={contactForm.email ?? ''} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input type="text" value={contactForm.phone ?? ''} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} className={inputCls} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddContact(false)} className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={isCreatingContact} className="rounded-lg bg-forge-500 px-4 py-2 text-xs font-semibold text-white hover:bg-forge-400 disabled:opacity-50">
                  {isCreatingContact ? 'Adding...' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Deal Modal ─────────────────────────────────────────────────── */}
      {isAddDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Create Deal</h3>
            <form onSubmit={handleAddDeal} className="space-y-3">
              <div>
                <label className={labelCls}>Deal Name <span className="text-rose-400">*</span></label>
                <input required type="text" value={dealForm.name ?? ''} onChange={(e) => setDealForm({ ...dealForm, name: e.target.value })} placeholder={`Deal with ${company.name}`} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Deal Value ($)</label>
                <input type="number" min={0} value={dealForm.value ?? 0} onChange={(e) => setDealForm({ ...dealForm, value: Number(e.target.value) })} className={inputCls} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddDeal(false)} className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={isCreatingDeal} className="rounded-lg bg-forge-500 px-4 py-2 text-xs font-semibold text-white hover:bg-forge-400 disabled:opacity-50">
                  {isCreatingDeal ? 'Creating...' : 'Create Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
