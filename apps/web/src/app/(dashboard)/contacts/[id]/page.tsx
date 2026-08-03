'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { TimelineWidget } from '@/components/crm/timeline-widget';
import { useToast } from '@/components/ui/toast';
import { useCRM } from '@/hooks/use-crm';
import type { ContactUpdate } from '@/types';

const inputCls = 'w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-forge-500 transition-colors';
const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

export default function ContactDetailPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;
  const { toast } = useToast();

  const {
    useContact,
    updateContact,
    deleteContact,
    isUpdatingContact,
    isDeletingContact,
    companies,
    deals,
  } = useCRM();

  const { data: contact, isLoading } = useContact(contactId);
  const company = companies.find((c) => c.id === contact?.company_id);
  const contactDeals = deals.filter(
    (d) => d.primary_contact_id === contactId && d.status !== 'Cancelled'
  );

  // ── Tab State ─────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<'overview' | 'deals' | 'timeline'>('overview');

  // ── Edit ──────────────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    job_title: '',
    department: '',
    email: '',
    phone: '',
    mobile: '',
    linkedin_url: '',
  });

  const openEdit = () => {
    if (!contact) return;
    setEditForm({
      first_name: contact.first_name,
      last_name: contact.last_name,
      job_title: contact.job_title ?? '',
      department: contact.department ?? '',
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      mobile: contact.mobile ?? '',
      linkedin_url: contact.linkedin_url ?? '',
    });
    setIsEditing(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Record<string, unknown> = {};
      if (editForm.first_name) payload.first_name = editForm.first_name;
      if (editForm.last_name) payload.last_name = editForm.last_name;
      if (editForm.job_title) payload.job_title = editForm.job_title;
      if (editForm.department) payload.department = editForm.department;
      if (editForm.email) payload.email = editForm.email;
      if (editForm.phone) payload.phone = editForm.phone;
      if (editForm.mobile) payload.mobile = editForm.mobile;
      if (editForm.linkedin_url) payload.linkedin_url = editForm.linkedin_url;
      await updateContact({ id: contactId, payload: payload as ContactUpdate });
      setIsEditing(false);
      toast('success', 'Contact updated');
    } catch (err: unknown) {
      toast('error', 'Update failed', err instanceof Error ? err.message : '');
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState(false);
  const handleDelete = async () => {
    try {
      await deleteContact(contactId);
      toast('success', 'Contact deactivated');
      router.push('/contacts');
    } catch (err: unknown) {
      toast('error', 'Delete failed', err instanceof Error ? err.message : '');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-52 bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-24 bg-slate-800/60 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-8 text-center text-rose-400">
          Contact not found.{' '}
          <Link href="/contacts" className="underline hover:text-rose-300">Go back</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/contacts" className="hover:text-white transition-colors">Contacts</Link>
        <span>/</span>
        <span className="text-white">{contact.first_name} {contact.last_name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/40 to-forge-600/40 border border-violet-500/30 text-2xl font-bold text-violet-300">
            {contact.first_name[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{contact.first_name} {contact.last_name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {contact.job_title && <span className="text-sm text-slate-400">{contact.job_title}</span>}
              {contact.job_title && company && <span className="text-slate-600">·</span>}
              {company && (
                <Link href={`/companies/${company.id}`} className="text-sm text-forge-400 hover:text-forge-300 transition-colors">
                  {company.name}
                </Link>
              )}
              {contact.is_primary && (
                <span className="rounded-full bg-forge-500/20 px-2 py-0.5 text-xs text-forge-400 border border-forge-500/30">Primary</span>
              )}
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold border ${
                contact.status === 'Active'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
              }`}>{contact.status}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openEdit} className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-all">
            Edit
          </button>
          <button onClick={() => setConfirmDelete(true)} className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/20 transition-all">
            Deactivate
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        {contact.email && (
          <a href={`mailto:${contact.email}`} className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-all">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email
          </a>
        )}
        {contact.phone && (
          <a href={`tel:${contact.phone}`} className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-all">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Call
          </a>
        )}
        {contact.linkedin_url && (
          <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-all">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            LinkedIn
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-800 gap-0">
        {(['overview', 'deals', 'timeline'] as const).map((t) => (
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

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Contact Details</h3>
            <dl className="space-y-3">
              {[
                { label: 'Email', value: contact.email },
                { label: 'Phone', value: contact.phone },
                { label: 'Mobile', value: contact.mobile },
                { label: 'Department', value: contact.department },
                { label: 'Company', value: company?.name },
                { label: 'Birthday', value: contact.birthday ? new Date(contact.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null },
              ].map(({ label, value }) => value ? (
                <div key={label} className="flex gap-4">
                  <dt className="w-28 shrink-0 text-xs font-medium text-slate-500 uppercase tracking-wide pt-0.5">{label}</dt>
                  <dd className="text-sm text-slate-300">{value}</dd>
                </div>
              ) : null)}
            </dl>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Recent Activity</h3>
            <TimelineWidget entityType="Contact" entityId={contactId} />
          </div>
        </div>
      )}

      {/* Deals */}
      {tab === 'deals' && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">{contactDeals.length} Associated Deal{contactDeals.length !== 1 ? 's' : ''}</h3>
          {contactDeals.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-500 text-sm">
              No deals associated with this contact.
            </div>
          ) : (
            contactDeals.map((deal) => (
              <div key={deal.id} className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm">{deal.name}</p>
                  <p className="text-xs text-slate-400">{deal.status}</p>
                </div>
                <span className="text-sm font-bold text-emerald-400">${deal.value.toLocaleString()}</span>
                <Link href={`/deals/${deal.id}`} className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-700">View</Link>
              </div>
            ))
          )}
        </div>
      )}

      {/* Timeline */}
      {tab === 'timeline' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Activity Timeline</h3>
          <TimelineWidget entityType="Contact" entityId={contactId} />
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">Edit Contact</h3>
            <form onSubmit={handleEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>First Name <span className="text-rose-400">*</span></label>
                  <input required type="text" value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Last Name <span className="text-rose-400">*</span></label>
                  <input required type="text" value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Job Title</label>
                  <input type="text" value={editForm.job_title} onChange={(e) => setEditForm({ ...editForm, job_title: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Department</label>
                  <input type="text" value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} className={inputCls} />
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
                  <label className={labelCls}>Mobile</label>
                  <input type="text" value={editForm.mobile} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>LinkedIn URL</label>
                  <input type="url" value={editForm.linkedin_url} onChange={(e) => setEditForm({ ...editForm, linkedin_url: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsEditing(false)} className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={isUpdatingContact} className="rounded-lg bg-forge-500 px-4 py-2 text-xs font-semibold text-white hover:bg-forge-400 disabled:opacity-50">
                  {isUpdatingContact ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Deactivate Contact?</h3>
            <p className="text-sm text-slate-400">This will mark {contact.first_name} {contact.last_name} as inactive.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300">Cancel</button>
              <button onClick={handleDelete} disabled={isDeletingContact} className="flex-1 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50">
                {isDeletingContact ? 'Deactivating…' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
