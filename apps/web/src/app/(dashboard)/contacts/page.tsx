'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Users, Plus, Building2, Mail, Phone } from 'lucide-react';

import { useToast } from '@/components/ui/toast';
import { useCRM } from '@/hooks/use-crm';
import { Button, Input, Select, Badge, FormField, Modal, EnterpriseDataTable } from '@/components/ui/primitives';
import { Container, Stack, PageHeader, PageActions } from '@/components/ui/layout-primitives';
import { Heading, Text, Caption } from '@/components/ui/typography';
import type { ContactResponse } from '@/types';
import type { Column } from '@/components/ui/data-table';

export default function ContactsPage(): React.JSX.Element {
  const { contacts, companies, isLoadingContacts, createContact } = useCRM();
  const { toast } = useToast();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name) {
      setFormError('First and last name are required.');
      return;
    }
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

  const columns: Column<ContactResponse>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (contact) => (
        <Link href={`/contacts/${contact.id}`} className="flex items-center gap-3 group">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent ring-1 ring-accent/20">
            {contact.first_name[0]?.toUpperCase()}
          </div>
          <div>
            <Text variant="body-s" className="font-semibold group-hover:text-accent transition-colors">
              {contact.first_name} {contact.last_name}
            </Text>
            {contact.job_title && <Caption color="muted" className="block">{contact.job_title}</Caption>}
          </div>
        </Link>
      ),
    },
    {
      key: 'company',
      header: 'Company',
      sortable: true,
      render: (contact) => {
        const company = companies.find((c) => c.id === contact.company_id);
        return company ? (
          <Link href={`/companies/${company.id}`} className="inline-flex items-center gap-1.5 text-secondary hover:text-primary transition-colors">
            <Building2 className="h-3.5 w-3.5 text-muted" />
            <Text variant="body-s">{company.name}</Text>
          </Link>
        ) : (
          <Caption color="muted">—</Caption>
        );
      },
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (contact) => contact.email ? (
        <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1.5 text-secondary hover:text-accent transition-colors">
          <Mail className="h-3.5 w-3.5 text-muted" />
          <Caption>{contact.email}</Caption>
        </a>
      ) : <Caption color="muted">—</Caption>,
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (contact) => contact.phone ? (
        <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-1.5 text-secondary hover:text-primary transition-colors">
          <Phone className="h-3.5 w-3.5 text-muted" />
          <Caption tabular>{contact.phone}</Caption>
        </a>
      ) : <Caption color="muted">—</Caption>,
    },
    {
      key: 'is_primary',
      header: 'Role Tag',
      render: (contact) => contact.is_primary ? (
        <Badge variant="success" dot>Primary Contact</Badge>
      ) : (
        <Badge variant="neutral">Contact</Badge>
      ),
    },
  ];

  return (
    <Container size="xl" className="py-6">
      <Stack gap={5}>
        {/* Header */}
        <PageHeader>
          <div>
            <Heading level="h1" className="flex items-center gap-2.5">
              <Users className="h-6 w-6 text-accent" /> Contacts
            </Heading>
            <Text variant="body-m" color="secondary" tabular className="mt-0.5">
              {isLoadingContacts ? 'Loading…' : `${contacts.length} contacts across ${companies.length} companies`}
            </Text>
          </div>
          <PageActions>
            <Button onClick={() => setIsModalOpen(true)} size="md">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Add Contact
            </Button>
          </PageActions>
        </PageHeader>

        {/* Flagship Enterprise Data Table */}
        <EnterpriseDataTable
          data={contacts}
          columns={columns}
          keyExtractor={(c) => c.id}
          searchable
          searchPlaceholder="Search contacts by name, email, company…"
          loading={isLoadingContacts}
          emptyTitle="No contacts found"
          emptyDescription="Click 'Add Contact' to add key decision makers."
          pageSize={12}
        />

        {/* Create Modal */}
        <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Contact" size="md">
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && <div className="rounded border border-status-danger/30 bg-status-danger-bg p-3 text-xs text-status-danger-fg">{formError}</div>}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="First name" htmlFor="first_name" required>
                <Input id="first_name" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required />
              </FormField>
              <FormField label="Last name" htmlFor="last_name" required>
                <Input id="last_name" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required />
              </FormField>
            </div>
            <FormField label="Company" htmlFor="company_id">
              <Select id="company_id" value={formData.company_id} onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}>
                <option value="">No company selected</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Email address" htmlFor="email">
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </FormField>
              <FormField label="Phone number" htmlFor="phone">
                <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Job title" htmlFor="job_title">
                <Input id="job_title" value={formData.job_title} onChange={(e) => setFormData({ ...formData, job_title: e.target.value })} />
              </FormField>
              <FormField label="Department" htmlFor="department">
                <Input id="department" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
              </FormField>
            </div>
            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input type="checkbox" checked={formData.is_primary} onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })} className="h-4 w-4 rounded accent-accent" />
              <Text variant="body-s">Primary Contact for company</Text>
            </label>
            <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Create Contact</Button>
            </div>
          </form>
        </Modal>
      </Stack>
    </Container>
  );
}
