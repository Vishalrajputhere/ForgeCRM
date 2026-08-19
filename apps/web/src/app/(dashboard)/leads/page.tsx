'use client';

import { PagePermissionGuard } from '@/components/auth/permission-guard';

import { useState } from 'react';
import { Zap, Plus, Search, X, Check } from 'lucide-react';

import { Heading, Text } from '@/components/ui/typography';
import { Container, Stack, PageHeader, PageActions } from '@/components/ui/layout-primitives';
import { useToast } from '@/components/ui/toast';
import { useCRM } from '@/hooks/use-crm';
import { useFormatters } from '@/hooks/use-formatters';
import { CURRENCY_SYMBOLS } from '@/lib/formatters';
import { Button, Input, Select, Skeleton, Badge, FormField, Textarea } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import type { LeadResponse, LeadUpdate } from '@/types';

// ── Constants ─────────────────────────────────────────────────────────────────

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'] as const;

const PRIORITY_BADGE: Record<string, 'neutral' | 'warning' | 'danger' | 'default'> = {
  Low:    'neutral',
  Medium: 'warning',
  High:   'danger',
  Urgent: 'danger',
};

// ── Modal Shell ───────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg overflow-y-auto rounded-xl border border-border-strong bg-overlay shadow-xl max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <Heading level="h3">{title}</Heading>
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

// ── Lead Row ──────────────────────────────────────────────────────────────────

function LeadRow({
  lead,
  onConvert,
  onEdit,
  onDisqualify,
  isDeletingLead,
}: {
  lead: LeadResponse;
  onConvert: (lead: LeadResponse) => void;
  onEdit: (lead: LeadResponse) => void;
  onDisqualify: (id: string) => void;
  isDeletingLead: boolean;
}) {
  const { formatCurrency } = useFormatters();
  const isConverted = Boolean(lead.converted_at);
  const isDisqualified = lead.priority === 'Disqualified';

  return (
    <tr className={cn(
      'group border-b transition-colors duration-100 hover:bg-[rgba(255,255,255,0.02)]',
      (isConverted || isDisqualified) && 'opacity-50',
    )}
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      {/* Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forge-500/15 text-micro font-semibold text-forge-400 ring-1 ring-forge-500/20">
            {lead.first_name[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-label text-text-primary truncate">
              {lead.first_name} {lead.last_name}
            </p>
            {lead.job_title && (
              <p className="text-caption text-text-tertiary truncate">{lead.job_title}</p>
            )}
          </div>
        </div>
      </td>

      {/* Company */}
      <td className="px-4 py-3 text-label text-text-secondary">
        {lead.company_name ?? '—'}
      </td>

      {/* Email */}
      <td className="px-4 py-3 text-caption text-text-tertiary">
        {lead.email ?? '—'}
      </td>

      {/* Value */}
      <td className="px-4 py-3 text-label tabular font-medium text-text-primary">
        {lead.estimated_value ? formatCurrency(lead.estimated_value) : '—'}
      </td>

      {/* Priority */}
      <td className="px-4 py-3">
        <Badge variant={PRIORITY_BADGE[lead.priority] ?? 'neutral'}>
          {lead.priority}
        </Badge>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1.5">
          {isConverted && (
            <span className="flex items-center gap-1 text-caption text-emerald-400">
              <Check className="h-3 w-3" strokeWidth={2} /> Converted
            </span>
          )}
          {isDisqualified && (
            <span className="text-caption text-text-tertiary">Disqualified</span>
          )}
          {!isConverted && !isDisqualified && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(lead)}
              >
                Edit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onConvert(lead)}
                className="text-forge-400 border-forge-500/20 hover:bg-forge-500/10"
              >
                Convert
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={isDeletingLead}
                onClick={() => onDisqualify(lead.id)}
                className="text-text-tertiary hover:text-red-400"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.5} />
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LeadsPage(): React.JSX.Element {
  const {
    leads, isLoadingLeads,
    createLead, isCreatingLead,
    updateLead, isUpdatingLead,
    deleteLead, isDeletingLead,
    convertLead, isConvertingLead,
    pipelines,
  } = useCRM();
  const { toast } = useToast();
  const { currency, formatCurrency } = useFormatters();
  const currencySymbol = CURRENCY_SYMBOLS[currency.toUpperCase()] ?? '$';

  // ── Filters ───────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showAll, setShowAll] = useState(false);

  const filtered = leads.filter((l) => {
    if (!showAll && (l.converted_at || l.priority === 'Disqualified')) return false;
    if (priorityFilter !== 'all' && l.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.first_name.toLowerCase().includes(q) ||
        (l.last_name?.toLowerCase().includes(q) ?? false) ||
        (l.email?.toLowerCase().includes(q) ?? false) ||
        (l.company_name?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  const activeLeads = leads.filter((l) => !l.converted_at && l.priority !== 'Disqualified');
  const totalValue = activeLeads.reduce((s, l) => s + (l.estimated_value ?? 0), 0);
  const convertedCount = leads.filter((l) => l.converted_at).length;

  // ── Create Modal ──────────────────────────────────────────────────────────
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', company_name: '',
    job_title: '', estimated_value: '', priority: 'Medium', description: '',
  });
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    try {
      await createLead({
        first_name: createForm.first_name,
        ...(createForm.last_name ? { last_name: createForm.last_name } : {}),
        ...(createForm.email ? { email: createForm.email } : {}),
        ...(createForm.phone ? { phone: createForm.phone } : {}),
        ...(createForm.company_name ? { company_name: createForm.company_name } : {}),
        ...(createForm.job_title ? { job_title: createForm.job_title } : {}),
        ...(createForm.estimated_value ? { estimated_value: Number(createForm.estimated_value) } : {}),
        priority: createForm.priority,
        ...(createForm.description ? { description: createForm.description } : {}),
      });
      setIsCreateOpen(false);
      setCreateForm({ first_name: '', last_name: '', email: '', phone: '', company_name: '', job_title: '', estimated_value: '', priority: 'Medium', description: '' });
      toast('success', 'Lead created', `${createForm.first_name} added to your pipeline.`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create lead.');
    }
  };

  // ── Edit Modal ────────────────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<LeadResponse | null>(null);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '', company_name: '', job_title: '', estimated_value: '', priority: 'Medium', description: '' });

  const openEdit = (lead: LeadResponse) => {
    setEditTarget(lead);
    setEditForm({
      first_name: lead.first_name, last_name: lead.last_name ?? '', email: lead.email ?? '',
      company_name: lead.company_name ?? '', job_title: lead.job_title ?? '',
      estimated_value: lead.estimated_value?.toString() ?? '', priority: lead.priority,
      description: lead.description ?? '',
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    try {
      const payload: Record<string, unknown> = { priority: editForm.priority };
      if (editForm.first_name) payload.first_name = editForm.first_name;
      if (editForm.last_name) payload.last_name = editForm.last_name;
      if (editForm.email) payload.email = editForm.email;
      if (editForm.company_name) payload.company_name = editForm.company_name;
      if (editForm.job_title) payload.job_title = editForm.job_title;
      if (editForm.estimated_value) payload.estimated_value = Number(editForm.estimated_value);
      if (editForm.description) payload.description = editForm.description;
      await updateLead({ id: editTarget.id, payload: payload as LeadUpdate });
      setEditTarget(null);
      toast('success', 'Lead updated');
    } catch (err) {
      toast('error', 'Update failed', err instanceof Error ? err.message : '');
    }
  };

  // ── Disqualify ────────────────────────────────────────────────────────────
  const handleDisqualify = async (leadId: string) => {
    try {
      await deleteLead(leadId);
      toast('success', 'Lead disqualified');
    } catch (err) {
      toast('error', 'Failed to disqualify', err instanceof Error ? err.message : '');
    }
  };

  // ── Convert Modal ─────────────────────────────────────────────────────────
  const [convertTarget, setConvertTarget] = useState<LeadResponse | null>(null);
  const [convertForm, setConvertForm] = useState({ create_deal: true, deal_name: '', deal_value: 0, pipeline_id: '' });
  const [convertError, setConvertError] = useState<string | null>(null);
  const [convertSuccess, setConvertSuccess] = useState<string | null>(null);

  const openConvert = (lead: LeadResponse) => {
    setConvertTarget(lead);
    const defaultPipeline = pipelines[0];
    setConvertForm({
      create_deal: true,
      deal_name: `${lead.first_name}${lead.last_name ? ' ' + lead.last_name : ''} Deal`,
      deal_value: lead.estimated_value ?? 0,
      pipeline_id: defaultPipeline?.id ?? '',
    });
    setConvertError(null);
    setConvertSuccess(null);
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertTarget) return;
    setConvertError(null);
    try {
      const activePipeline = pipelines[0];
      const defaultStageId = activePipeline?.stages?.[0]?.id;
      const resolvedPipelineId = convertForm.pipeline_id || activePipeline?.id;
      await convertLead({
        leadId: convertTarget.id,
        payload: {
          create_deal: convertForm.create_deal,
          ...(convertForm.create_deal ? {
            ...(convertForm.deal_name ? { deal_name: convertForm.deal_name } : {}),
            ...(convertForm.deal_value ? { deal_value: Number(convertForm.deal_value) } : {}),
            ...(resolvedPipelineId ? { pipeline_id: resolvedPipelineId } : {}),
            ...(defaultStageId ? { stage_id: defaultStageId } : {}),
          } : {}),
        },
      });
      setConvertSuccess('Lead converted! Company and Contact have been created.');
      toast('success', 'Lead converted!');
    } catch (err) {
      setConvertError(err instanceof Error ? err.message : 'Failed to convert lead.');
    }
  };

  return (
    <PagePermissionGuard permission="leads.read">
      <Container size="xl" className="py-6">
      <Stack gap={5}>
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <PageHeader>
          <div>
            <Heading level="h1">Leads</Heading>
            <Text variant="body-m" color="secondary" tabular className="mt-0.5">
              {activeLeads.length} active · {totalValue > 0 ? `${formatCurrency(totalValue)} pipeline · ` : ''}{convertedCount} converted
            </Text>
          </div>
          <PageActions>
            <Button onClick={() => setIsCreateOpen(true)} size="md">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Add Lead
            </Button>
          </PageActions>
        </PageHeader>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search leads…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border bg-surface-sunken py-2 pl-9 pr-3 text-label text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-forge-500 transition-colors duration-100"
            style={{ borderColor: 'var(--border-default)' }}
          />
        </div>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-md border bg-surface-sunken px-2.5 py-2 text-label text-text-secondary focus:outline-none focus:ring-2 focus:ring-forge-500"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <option value="all">All priorities</option>
          {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button
          onClick={() => setShowAll(!showAll)}
          className={cn(
            'rounded-md border px-3 py-2 text-label transition-colors duration-100',
            showAll
              ? 'border-forge-500/30 bg-forge-500/10 text-forge-400'
              : 'text-text-tertiary hover:text-text-primary',
          )}
          style={showAll ? {} : { borderColor: 'var(--border-default)' }}
        >
          {showAll ? '✓ Showing all' : 'Show all'}
        </button>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border-default)' }}>
        {isLoadingLeads ? (
          <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="h-7 w-7 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-36" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Zap className="h-10 w-10 text-text-tertiary mb-3" strokeWidth={1} />
            <p className="text-label text-text-secondary">
              {search ? `No leads match "${search}"` : 'No active leads'}
            </p>
            <p className="text-caption text-text-tertiary mt-1">
              {!search && 'Add your first lead to start building your pipeline'}
            </p>
            {!search && (
              <Button variant="secondary" size="sm" onClick={() => setIsCreateOpen(true)} className="mt-4">
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                Add Lead
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full text-left">
            <thead style={{ backgroundColor: 'var(--surface-overlay)' }}>
              <tr className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                {['Name', 'Company', 'Email', 'Est. Value', 'Priority', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-micro font-medium text-text-tertiary">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  onConvert={openConvert}
                  onEdit={openEdit}
                  onDisqualify={handleDisqualify}
                  isDeletingLead={isDeletingLead}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Create Lead Modal ──────────────────────────────────────────────── */}
      {isCreateOpen && (
        <Modal title="New Lead" onClose={() => setIsCreateOpen(false)}>
          {createError && (
            <div className="mb-4 rounded-md border border-red-500/20 bg-red-500/8 px-3 py-2.5 text-label text-red-400">
              {createError}
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="First name" htmlFor="c_first_name" required>
                <Input id="c_first_name" type="text" placeholder="Jane" required value={createForm.first_name} onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })} />
              </FormField>
              <FormField label="Last name" htmlFor="c_last_name">
                <Input id="c_last_name" type="text" placeholder="Doe" value={createForm.last_name} onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })} />
              </FormField>
              <FormField label="Email" htmlFor="c_email">
                <Input id="c_email" type="email" placeholder="jane@company.com" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
              </FormField>
              <FormField label="Phone" htmlFor="c_phone">
                <Input id="c_phone" type="text" placeholder="+1 (555) 000-0000" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
              </FormField>
              <FormField label="Company" htmlFor="c_company">
                <Input id="c_company" type="text" placeholder="Acme Corp" value={createForm.company_name} onChange={(e) => setCreateForm({ ...createForm, company_name: e.target.value })} />
              </FormField>
              <FormField label="Job title" htmlFor="c_job_title">
                <Input id="c_job_title" type="text" placeholder="VP Sales" value={createForm.job_title} onChange={(e) => setCreateForm({ ...createForm, job_title: e.target.value })} />
              </FormField>
              <FormField label={`Est. value (${currencySymbol})`} htmlFor="c_value">
                <Input id="c_value" type="number" min={0} placeholder="0" value={createForm.estimated_value} onChange={(e) => setCreateForm({ ...createForm, estimated_value: e.target.value })} />
              </FormField>
              <FormField label="Priority" htmlFor="c_priority">
                <Select id="c_priority" value={createForm.priority} onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}>
                  {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </Select>
              </FormField>
            </div>
            <FormField label="Description" htmlFor="c_desc">
              <Textarea id="c_desc" rows={2} placeholder="Additional context…" value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="md" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" size="md" loading={isCreatingLead}>Save Lead</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Edit Lead Modal ────────────────────────────────────────────────── */}
      {editTarget && (
        <Modal title="Edit Lead" onClose={() => setEditTarget(null)}>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="First name" htmlFor="e_first_name" required>
                <Input id="e_first_name" required value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} />
              </FormField>
              <FormField label="Last name" htmlFor="e_last_name">
                <Input id="e_last_name" value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} />
              </FormField>
              <FormField label="Email" htmlFor="e_email">
                <Input id="e_email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </FormField>
              <FormField label="Company" htmlFor="e_company">
                <Input id="e_company" value={editForm.company_name} onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })} />
              </FormField>
              <FormField label={`Est. value (${currencySymbol})`} htmlFor="e_value">
                <Input id="e_value" type="number" min={0} value={editForm.estimated_value} onChange={(e) => setEditForm({ ...editForm, estimated_value: e.target.value })} />
              </FormField>
              <FormField label="Priority" htmlFor="e_priority">
                <Select id="e_priority" value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}>
                  {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </Select>
              </FormField>
            </div>
            <FormField label="Description" htmlFor="e_desc">
              <Textarea id="e_desc" rows={2} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="md" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button type="submit" size="md" loading={isUpdatingLead}>Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Convert Lead Modal ─────────────────────────────────────────────── */}
      {convertTarget && (
        <Modal title="Convert Lead" onClose={() => setConvertTarget(null)}>
          <p className="mb-4 text-label text-text-secondary">
            Converting <span className="text-text-primary font-medium">{convertTarget.first_name} {convertTarget.last_name}</span> will create a Company and Contact.
          </p>
          {convertError && (
            <div className="mb-4 rounded-md border border-red-500/20 bg-red-500/8 px-3 py-2.5 text-label text-red-400">
              {convertError}
            </div>
          )}
          {convertSuccess ? (
            <div className="space-y-4">
              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/8 px-3 py-3 text-label text-emerald-400">
                {convertSuccess}
              </div>
              <div className="flex justify-end">
                <Button size="md" onClick={() => setConvertTarget(null)}>Done</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleConvert} className="space-y-4">
              <label className="flex items-center gap-3 rounded-md border px-3 py-2.5 cursor-pointer hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                style={{ borderColor: 'var(--border-default)' }}
              >
                <input
                  type="checkbox"
                  checked={convertForm.create_deal}
                  onChange={(e) => setConvertForm({ ...convertForm, create_deal: e.target.checked })}
                  className="h-4 w-4 rounded accent-forge-500"
                />
                <span className="text-label text-text-primary">Also create a Deal</span>
              </label>
              {convertForm.create_deal && (
                <div className="space-y-3">
                  <FormField label="Deal name" htmlFor="conv_deal_name">
                    <Input id="conv_deal_name" value={convertForm.deal_name} onChange={(e) => setConvertForm({ ...convertForm, deal_name: e.target.value })} />
                  </FormField>
                  <FormField label={`Deal value (${currencySymbol})`} htmlFor="conv_deal_value">
                    <Input id="conv_deal_value" type="number" min={0} value={convertForm.deal_value} onChange={(e) => setConvertForm({ ...convertForm, deal_value: Number(e.target.value) })} />
                  </FormField>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="md" onClick={() => setConvertTarget(null)}>Cancel</Button>
                <Button type="submit" size="md" loading={isConvertingLead} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  Convert Lead
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
      </Stack>
      </Container>
    </PagePermissionGuard>
  );
}
