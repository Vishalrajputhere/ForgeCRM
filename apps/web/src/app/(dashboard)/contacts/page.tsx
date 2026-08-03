'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Users, Plus, Search, X } from 'lucide-react';

import { useToast } from '@/components/ui/toast';
import { useCRM } from '@/hooks/use-crm';
import { Button, Input, Select, Skeleton, Badge, FormField } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import type { ContactResponse } from '@/types';

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

// ── Contact Row ───────────────────────────────────────────────────────────────

function ContactRow({ contact, companies }: { contact: ContactResponse; companies: { id: string; name: string }[] }) {
  const company = companies.find((c) => c.id === contact.company_id);
  return (
    <tr className="group border-b transition-colors duration-100 hover:bg-[rgba(255,255,255,0.02)]"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      <td className="px-4 py-3">
        <Link href={`/contacts/${contact.id}`} className="flex items-center gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-micro font-semibold text-indigo-400 ring-1 ring-indigo-500/20">
            {contact.first_name[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-label text-text-primary truncate group-hover:text-forge-400 transition-colors duration-100">
              {contact.first_name} {contact.last_name}
            </p>
            {contact.is_primary && (
              <span className="text-caption text-forge-400">Primary</span>
            )}
          </div>
        </Link>
      </td>
      <td className="px-4 py-3">
        <p className="text-label text-text-secondary">{contact.job_title ?? '—'}</p>
        {company && (
          <Link href={`/companies/${contact.company_id}`} className="text-caption text-text-tertiary hover:text-forge-400 transition-colors duration-100">
            {company.name}
          </Link>
        )}
      </td>
      <td className="px-4 py-3 text-caption text-text-tertiary">{contact.email ?? '—'}</td>
      <td className="px-4 py-3 text-caption text-text-tertiary">{contact.phone ?? '—'}</td>
      <td className="px-4 py-3">
        <Badge variant={contact.status === 'Active' ? 'success' : 'neutral'}>
          {contact.status}
        </Badge>
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/contacts/${contact.id}`}
          className="text-caption text-text-tertiary hover:text-forge-400 transition-colors duration-100"
        >
          View →
        </Link>
      </td>
    </tr>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ContactsPage(): React.JSX.Element {
  const { contacts, isLoadingContacts, companies, createContact, isCreatingContact } = useCRM();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const filtered = contacts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.first_name.toLowerCase().includes(q) ||
      c.last_name.toLowerCase().includes(q) ||
      (c.email?.toLowerCase().includes(q) ?? false) ||
      (c.job_title?.toLowerCase().includes(q) ?? false)
    );
  });

  // ── Create Modal ──────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    job_title: '', department: '', company_id: '', is_primary: false,
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
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create contact.');
    }
  };

  const companiesList = companies.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-5 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-h1 text-text-primary">Contacts</h1>
          <p className="text-label text-text-tertiary mt-0.5">
            {isLoadingContacts ? 'Loading…' : `${contacts.length} contacts across ${companies.length} companies`}
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} size="md">
          <Plus className="h-4 w-4" strokeWidth={2} />
          Add Contact
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" strokeWidth={1.5} />
        <input
          type="text"
          placeholder="Search contacts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border bg-surface-sunken py-2 pl-9 pr-3 text-label text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-forge-500 transition-colors duration-100"
          style={{ borderColor: 'var(--border-default)' }}
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border-default)' }}>
        {isLoadingContacts ? (
          <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="h-7 w-7 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-2.5 w-28" />
                </div>
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Users className="h-10 w-10 text-text-tertiary mb-3" strokeWidth={1} />
            <p className="text-label text-text-secondary">
              {search ? `No contacts match "${search}"` : 'No contacts yet'}
            </p>
            <p className="text-caption text-text-tertiary mt-1">Add contacts linked to companies</p>
            {!search && (
              <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(true)} className="mt-4">
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                Add Contact
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full text-left">
            <thead style={{ backgroundColor: 'var(--surface-overlay)' }}>
              <tr className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                {['Name', 'Title / Company', 'Email', 'Phone', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-micro font-medium text-text-tertiary">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((contact) => (
                <ContactRow key={contact.id} contact={contact} companies={companiesList} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <Modal title="New Contact" onClose={() => setIsModalOpen(false)}>
          {formError && (
            <div className="mb-4 rounded-md border border-red-500/20 bg-red-500/8 px-3 py-2.5 text-label text-red-400">
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="First name" htmlFor="cf_first" required>
                <Input id="cf_first" required value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} />
              </FormField>
              <FormField label="Last name" htmlFor="cf_last" required>
                <Input id="cf_last" required value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
              </FormField>
            </div>
            <FormField label="Company" htmlFor="cf_company" required>
              {companies.length === 0 ? (
                <p className="text-label text-amber-400 py-1">You must create a Company first.</p>
              ) : (
                <Select id="cf_company" required value={formData.company_id} onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}>
                  <option value="">Select company…</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              )}
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Job title" htmlFor="cf_job">
                <Input id="cf_job" value={formData.job_title} onChange={(e) => setFormData({ ...formData, job_title: e.target.value })} />
              </FormField>
              <FormField label="Department" htmlFor="cf_dept">
                <Input id="cf_dept" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
              </FormField>
              <FormField label="Email" htmlFor="cf_email">
                <Input id="cf_email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </FormField>
              <FormField label="Phone" htmlFor="cf_phone">
                <Input id="cf_phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </FormField>
            </div>
            <label className={cn(
              'flex items-center gap-3 rounded-md border px-3 py-2.5 cursor-pointer transition-colors hover:bg-[rgba(255,255,255,0.03)]',
            )}
              style={{ borderColor: 'var(--border-default)' }}
            >
              <input
                type="checkbox"
                checked={formData.is_primary}
                onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                className="h-4 w-4 rounded accent-forge-500"
              />
              <span className="text-label text-text-primary">Primary contact for this company</span>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="md" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" size="md" loading={isCreatingContact} disabled={!isFormValid}>Save Contact</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
