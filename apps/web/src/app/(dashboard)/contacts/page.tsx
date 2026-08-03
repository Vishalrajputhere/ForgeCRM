'use client';

import Link from 'next/link';
import { useState } from 'react';

import { useToast } from '@/components/ui/toast';
import { useCRM } from '@/hooks/use-crm';
import type { ContactResponse } from '@/types';

export default function ContactsPage(): React.JSX.Element {
  const { contacts, isLoadingContacts, companies, createContact, isCreatingContact } = useCRM();
  const { toast } = useToast();

  // ── Search ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');

  const filtered = contacts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.first_name.toLowerCase().includes(q) ||
      c.last_name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.job_title?.toLowerCase().includes(q)
    );
  });

  // ── Create Modal ──────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    job_title: '',
    department: '',
    company_id: '',
    is_primary: false,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const isFormValid = formData.company_id.trim().length > 0 && formData.first_name.trim().length > 0 && formData.last_name.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setFormError(null);
    try {
      await createContact({
        first_name: formData.first_name,
        last_name: formData.last_name,
        company_id: formData.company_id,
        ...(formData.email ? { email: formData.email } : {}),
        ...(formData.phone ? { phone: formData.phone } : {}),
        ...(formData.job_title ? { job_title: formData.job_title } : {}),
        ...(formData.department ? { department: formData.department } : {}),
        is_primary: formData.is_primary,
      });
      setIsModalOpen(false);
      setFormData({ first_name: '', last_name: '', email: '', phone: '', job_title: '', department: '', company_id: '', is_primary: false });
      toast('success', 'Contact created', `${formData.first_name} ${formData.last_name} has been added.`);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create contact.');
    }
  };

  const inputCls = 'w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-forge-500 transition-colors';
  const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Contacts</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {isLoadingContacts ? 'Loading…' : `${contacts.length} contacts across ${companies.length} companies`}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-forge-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-forge-500/20 hover:bg-forge-400 transition-all flex items-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Contact
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search contacts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-forge-500"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-xl overflow-hidden">
        {isLoadingContacts ? (
          <div className="space-y-0">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-800 animate-pulse">
                <div className="h-9 w-9 rounded-full bg-slate-800" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-800 rounded w-40" />
                  <div className="h-2.5 bg-slate-800/60 rounded w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="h-12 w-12 mx-auto text-slate-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-slate-500 text-sm">
              {search ? `No contacts match "${search}"` : 'No contacts yet. Add the first contact.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Name</th>
                <th className="px-6 py-3.5">Title / Company</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Phone</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((contact) => (
                <ContactRow key={contact.id} contact={contact} companies={companies} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Create Contact Modal ─────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">Create New Contact</h3>
            {formError && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400">
                {formError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>First Name <span className="text-rose-400">*</span></label>
                  <input required type="text" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Last Name <span className="text-rose-400">*</span></label>
                  <input required type="text" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Company <span className="text-rose-400">*</span></label>
                {companies.length === 0 ? (
                  <p className="text-xs text-amber-400 py-2">You must create a Company first.</p>
                ) : (
                  <select required value={formData.company_id} onChange={(e) => setFormData({ ...formData, company_id: e.target.value })} className={inputCls}>
                    <option value="">Select Company…</option>
                    {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Job Title</label>
                  <input type="text" value={formData.job_title} onChange={(e) => setFormData({ ...formData, job_title: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Department</label>
                  <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5">
                <input
                  id="is-primary"
                  type="checkbox"
                  checked={formData.is_primary}
                  onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-600 accent-forge-500"
                />
                <label htmlFor="is-primary" className="text-sm text-slate-300 cursor-pointer">Primary contact for this company</label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={!isFormValid || isCreatingContact} className="rounded-lg bg-forge-500 px-4 py-2 text-xs font-semibold text-white hover:bg-forge-400 disabled:opacity-40 disabled:cursor-not-allowed">
                  {isCreatingContact ? 'Saving…' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ContactRow({ contact, companies }: { contact: ContactResponse; companies: { id: string; name: string }[] }) {
  const company = companies.find((c) => c.id === contact.company_id);
  return (
    <tr className="hover:bg-slate-800/40 transition-colors group">
      <td className="px-6 py-4">
        <Link href={`/contacts/${contact.id}`} className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forge-500/20 border border-forge-500/30 text-xs font-bold text-forge-300">
            {contact.first_name[0]}
          </div>
          <div>
            <p className="font-medium text-white group-hover:text-forge-300 transition-colors">
              {contact.first_name} {contact.last_name}
            </p>
            {contact.is_primary && (
              <span className="text-xs text-forge-400">Primary</span>
            )}
          </div>
        </Link>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm text-slate-300">{contact.job_title || '—'}</p>
        {company && (
          <Link href={`/companies/${contact.company_id}`} className="text-xs text-slate-500 hover:text-forge-300 transition-colors">
            {company.name}
          </Link>
        )}
      </td>
      <td className="px-6 py-4 text-slate-400 text-xs">{contact.email || '—'}</td>
      <td className="px-6 py-4 text-slate-400 text-xs">{contact.phone || '—'}</td>
      <td className="px-6 py-4">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold border ${
          contact.status === 'Active'
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
        }`}>
          {contact.status}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <Link
          href={`/contacts/${contact.id}`}
          className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
        >
          View →
        </Link>
      </td>
    </tr>
  );
}
