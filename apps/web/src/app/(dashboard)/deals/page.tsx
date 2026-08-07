'use client';

import { useState } from 'react';
import { TrendingUp, Plus, X, GitBranch } from 'lucide-react';

import { Heading, Text, Metric, Caption } from '@/components/ui/typography';
import { Container, Stack, PageHeader, PageActions, Grid } from '@/components/ui/layout-primitives';
import { KanbanBoard } from '@/components/crm/kanban-board';
import { useToast } from '@/components/ui/toast';
import { useCRM } from '@/hooks/use-crm';
import { useFormatters } from '@/hooks/use-formatters';
import { Button, Input, Select, Skeleton, FormField, Textarea } from '@/components/ui/primitives';

// ── Modal Shell ───────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg overflow-y-auto rounded-xl border border-border-strong bg-overlay shadow-xl max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <Heading level="h3">{title}</Heading>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-text-tertiary hover:text-text-primary hover:bg-[rgba(255,255,255,0.06)] transition-colors">
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DealsPage(): React.JSX.Element {
  const { pipelines, deals, isLoadingDeals, companies, contacts, createDeal, isCreatingDeal } = useCRM();
  const { toast } = useToast();
  const { formatCurrency } = useFormatters();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', value: '', company_id: '', primary_contact_id: '',
    expected_close_date: '', probability: '', description: '',
  });
  const [error, setError] = useState<string | null>(null);

  const activePipeline = pipelines[0];
  const defaultStageId = activePipeline?.stages?.[0]?.id;
  const isFormValid = formData.name.trim().length > 0 && formData.company_id.trim().length > 0;
  const companyContacts = contacts.filter((c) => c.company_id === formData.company_id);

  const openDeals = deals.filter((d) => d.status === 'Open');
  const wonDeals = deals.filter((d) => d.status === 'Won');
  const totalPipeline = openDeals.reduce((s, d) => s + d.value, 0);
  const totalWon = wonDeals.reduce((s, d) => s + d.value, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    if (!activePipeline || !defaultStageId) {
      setError('No active pipeline. Please configure a pipeline first.');
      return;
    }
    setError(null);
    try {
      await createDeal({
        name: formData.name,
        company_id: formData.company_id,
        pipeline_id: activePipeline.id,
        stage_id: defaultStageId,
        value: Number(formData.value) || 0,
        ...(formData.primary_contact_id ? { primary_contact_id: formData.primary_contact_id } : {}),
        ...(formData.expected_close_date ? { expected_close_date: formData.expected_close_date } : {}),
        ...(formData.probability ? { probability: Number(formData.probability) } : {}),
        ...(formData.description ? { description: formData.description } : {}),
      });
      setIsModalOpen(false);
      setFormData({ name: '', value: '', company_id: '', primary_contact_id: '', expected_close_date: '', probability: '', description: '' });
      toast('success', 'Deal created', `"${formData.name}" added to the pipeline.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deal.');
    }
  };

  return (
    <Container size="xl" className="py-6">
      <Stack gap={5}>
        {/* Header */}
        <PageHeader>
          <div>
            <Heading level="h1">Deals</Heading>
            <Text variant="body-m" color="secondary" className="mt-0.5">Manage your sales pipeline and close revenue</Text>
          </div>
          <PageActions>
            <a
              href="/workspace"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-default bg-surface px-3 py-2 text-xs font-medium text-secondary hover:text-primary hover:border-border-strong transition-colors"
            >
              <GitBranch className="h-3.5 w-3.5 text-accent" /> Configure Pipelines
            </a>
            <Button onClick={() => setIsModalOpen(true)} size="md">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Add Deal
            </Button>
          </PageActions>
        </PageHeader>

        {/* KPI Bar */}
        <Grid cols={{ mobile: 2, desktop: 4 }} gap={3}>
          {[
            { label: 'Open deals',     value: String(openDeals.length) },
            { label: 'Pipeline value', value: formatCurrency(totalPipeline) },
            { label: 'Won this period',value: String(wonDeals.length) },
            { label: 'Revenue won',    value: formatCurrency(totalWon) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-border-default bg-surface p-4 shadow-xs">
              <Caption color="muted">{label}</Caption>
              <Metric value={value} size="md" className="mt-1" />
            </div>
          ))}
        </Grid>

      {/* Kanban */}
      {isLoadingDeals ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-64 shrink-0 rounded-lg border p-3 space-y-2"
              style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-raised)' }}
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      ) : activePipeline ? (
        <KanbanBoard pipeline={activePipeline} deals={deals} companies={companies} />
      ) : (
        <div className="flex flex-col items-center py-16 text-center rounded-lg border border-dashed"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <TrendingUp className="h-10 w-10 text-text-tertiary mb-3" strokeWidth={1} />
          <p className="text-label text-text-secondary">No pipeline configured</p>
          <p className="text-caption text-text-tertiary mt-1">Contact your workspace admin to set up a pipeline</p>
        </div>
      )}

      {/* Create Deal Modal */}
      {isModalOpen && (
        <Modal title="New Deal" onClose={() => setIsModalOpen(false)}>
          {error && (
            <div className="mb-4 rounded-md border border-red-500/20 bg-red-500/8 px-3 py-2.5 text-label text-red-400">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Deal name" htmlFor="d_name" required>
              <Input id="d_name" required placeholder="e.g. Acme Corp — Enterprise License" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </FormField>
            <FormField label="Company" htmlFor="d_company" required>
              {companies.length === 0 ? (
                <p className="text-label text-amber-400 py-1">You must create a Company before adding a Deal.</p>
              ) : (
                <Select id="d_company" required value={formData.company_id} onChange={(e) => setFormData({ ...formData, company_id: e.target.value, primary_contact_id: '' })}>
                  <option value="">Select company…</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              )}
            </FormField>
            {formData.company_id && companyContacts.length > 0 && (
              <FormField label="Primary contact" htmlFor="d_contact">
                <Select id="d_contact" value={formData.primary_contact_id} onChange={(e) => setFormData({ ...formData, primary_contact_id: e.target.value })}>
                  <option value="">None</option>
                  {companyContacts.map((c) => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                </Select>
              </FormField>
            )}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Deal value ($)" htmlFor="d_value">
                <Input id="d_value" type="number" min={0} placeholder="0" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} />
              </FormField>
              <FormField label="Probability (%)" htmlFor="d_prob">
                <Input id="d_prob" type="number" min={0} max={100} placeholder="50" value={formData.probability} onChange={(e) => setFormData({ ...formData, probability: e.target.value })} />
              </FormField>
            </div>
            <FormField label="Expected close date" htmlFor="d_date">
              <Input id="d_date" type="date" value={formData.expected_close_date} onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })} />
            </FormField>
            <FormField label="Description" htmlFor="d_desc">
              <Textarea id="d_desc" rows={2} placeholder="Additional context…" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="md" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" size="md" loading={isCreatingDeal} disabled={!isFormValid}>Create Deal</Button>
            </div>
          </form>
        </Modal>
      )}
      </Stack>
    </Container>
  );
}
