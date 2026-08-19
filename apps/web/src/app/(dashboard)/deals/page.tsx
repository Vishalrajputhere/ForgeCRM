'use client';

import { PagePermissionGuard } from '@/components/auth/permission-guard';

import { useState } from 'react';
import { TrendingUp, Plus, X, GitBranch } from 'lucide-react';

import { Heading, Text, Metric, Caption } from '@/components/ui/typography';
import { Container, Stack, PageHeader, PageActions, Grid } from '@/components/ui/layout-primitives';
import { KanbanBoard } from '@/components/crm/kanban-board';
import { useToast } from '@/components/ui/toast';
import { useCRM } from '@/hooks/use-crm';
import { useProducts } from '@/hooks/use-products';
import { useFormatters } from '@/hooks/use-formatters';
import { CURRENCY_SYMBOLS } from '@/lib/formatters';
import { Button, Input, Select, Skeleton, FormField, Textarea } from '@/components/ui/primitives';

// ── Modal Shell ───────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl overflow-y-auto rounded-xl border border-border-strong bg-overlay shadow-xl max-h-[90vh]">
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

interface LineItemDraft {
  product_id?: string | undefined;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_rate: number;
}

export default function DealsPage(): React.JSX.Element {
  const { pipelines, deals, isLoadingDeals, companies, contacts, createDeal, isCreatingDeal } = useCRM();
  const { products } = useProducts({ is_active: true });
  const { toast } = useToast();
  const { currency, formatCurrency } = useFormatters();
  const currencySymbol = CURRENCY_SYMBOLS[currency.toUpperCase()] ?? '$';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', value: '', company_id: '', primary_contact_id: '',
    expected_close_date: '', probability: '', description: '',
  });
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([]);
  const [error, setError] = useState<string | null>(null);

  const activePipeline = pipelines[0];
  const defaultStageId = activePipeline?.stages?.[0]?.id;
  const isFormValid = formData.name.trim().length > 0 && formData.company_id.trim().length > 0;
  const companyContacts = contacts.filter((c) => c.company_id === formData.company_id);

  const openDeals = deals.filter((d) => d.status === 'Open');
  const wonDeals = deals.filter((d) => d.status === 'Won');
  const totalPipeline = openDeals.reduce((s, d) => s + (d.value ?? 0), 0);
  const totalWon = wonDeals.reduce((s, d) => s + (d.value ?? 0), 0);

  const lineItemTotals = lineItems.map((item) => {
    const sub = item.quantity * item.unit_price;
    const disc = sub * (item.discount_percent / 100);
    const taxable = Math.max(0, sub - disc);
    const tax = taxable * (item.tax_rate / 100);
    return {
      subtotal: sub,
      discount: disc,
      tax: tax,
      total: taxable + tax,
    };
  });

  const computedGrandTotal = lineItemTotals.reduce((acc, curr) => acc + curr.total, 0);

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        product_name: '',
        quantity: 1,
        unit_price: 0,
        discount_percent: 0,
        tax_rate: 0,
      },
    ]);
  };

  const handleSelectProduct = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    const current = lineItems[index];
    if (!current) return;
    const updated = [...lineItems];
    if (prod) {
      updated[index] = {
        ...current,
        product_id: prod.id,
        product_name: prod.name,
        unit_price: Number(prod.unit_price) || 0,
        tax_rate: Number(prod.tax_rate) || 0,
      };
    } else {
      updated[index] = {
        ...current,
        product_id: undefined,
      };
    }
    setLineItems(updated);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    if (!activePipeline || !defaultStageId) {
      setError('No active pipeline. Please configure a pipeline first.');
      return;
    }
    setError(null);
    try {
      const finalValue = lineItems.length > 0 ? computedGrandTotal : (Number(formData.value) || 0);

      await createDeal({
        name: formData.name,
        company_id: formData.company_id,
        pipeline_id: activePipeline.id,
        stage_id: defaultStageId,
        value: finalValue,
        ...(formData.primary_contact_id ? { primary_contact_id: formData.primary_contact_id } : {}),
        ...(formData.expected_close_date ? { expected_close_date: formData.expected_close_date } : {}),
        ...(formData.probability ? { probability: Number(formData.probability) } : {}),
        ...(formData.description ? { description: formData.description } : {}),
        ...(lineItems.length > 0
          ? {
              line_items: lineItems.map((i) => ({
                product_id: i.product_id || null,
                product_name: i.product_name,
                quantity: i.quantity,
                unit_price: i.unit_price,
                discount_percent: i.discount_percent,
                tax_rate: i.tax_rate,
              })),
            }
          : {}),
      });
      setIsModalOpen(false);
      setFormData({ name: '', value: '', company_id: '', primary_contact_id: '', expected_close_date: '', probability: '', description: '' });
      setLineItems([]);
      toast('success', 'Deal created', `"${formData.name}" added to the pipeline.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deal.');
    }
  };

  return (
    <PagePermissionGuard permission="deals.read">
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-subtle px-3 py-1.5 text-body-s font-medium text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
            >
              <GitBranch className="h-4 w-4" />
              Pipeline Settings
            </a>
            <Button size="md" onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" strokeWidth={2} />
              New Deal
            </Button>
          </PageActions>
        </PageHeader>

        {/* Pipeline summary metrics */}
        <Grid cols={{ mobile: 2, desktop: 4 }} gap={4}>
          <div className="rounded-xl border border-border-subtle bg-surface-subtle p-4">
            <Caption className="text-text-muted uppercase tracking-wider">Open Pipeline</Caption>
            <Metric value={formatCurrency(totalPipeline)} className="mt-1 text-text-primary" />
            <Text variant="caption" color="secondary" className="mt-0.5">{openDeals.length} active deal{openDeals.length !== 1 ? 's' : ''}</Text>
          </div>
          <div className="rounded-xl border border-border-subtle bg-surface-subtle p-4">
            <Caption className="text-text-muted uppercase tracking-wider">Won Revenue</Caption>
            <Metric value={formatCurrency(totalWon)} className="mt-1 text-text-primary" />
            <Text variant="caption" color="secondary" className="mt-0.5">{wonDeals.length} won deal{wonDeals.length !== 1 ? 's' : ''}</Text>
          </div>
          <div className="rounded-xl border border-border-subtle bg-surface-subtle p-4">
            <Caption className="text-text-muted uppercase tracking-wider">Win Rate</Caption>
            <Metric
              value={deals.length > 0 ? `${Math.round((wonDeals.length / deals.length) * 100)}%` : '0%'}
              className="mt-1 text-text-primary"
            />
            <Text variant="caption" color="secondary" className="mt-0.5">of {deals.length} total deal{deals.length !== 1 ? 's' : ''}</Text>
          </div>
          <div className="rounded-xl border border-border-subtle bg-surface-subtle p-4">
            <Caption className="text-text-muted uppercase tracking-wider">Active Pipeline</Caption>
            <Text variant="body-m" className="mt-1 font-semibold text-text-primary truncate">{activePipeline?.name ?? 'Default'}</Text>
            <Text variant="caption" color="secondary" className="mt-0.5">{activePipeline?.stages?.length ?? 0} stages</Text>
          </div>
        </Grid>

        {/* Board */}
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

            {/* Line Items Section */}
            <div className="rounded-lg border border-border-subtle bg-surface-subtle/50 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                  Products & Line Items ({lineItems.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="text-xs text-primary-base hover:text-primary-strong font-medium flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Item
                </button>
              </div>

              {lineItems.length === 0 ? (
                <p className="text-xs text-text-muted italic">
                  No line items added yet. You can manually enter deal value below, or attach catalog products above.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="rounded-md border border-border-strong bg-surface-base p-2.5 space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <select
                          value={item.product_id || ''}
                          onChange={(e) => handleSelectProduct(idx, e.target.value)}
                          className="flex-1 py-1 px-2 bg-surface-subtle border border-border-subtle rounded text-xs"
                        >
                          <option value="">-- Custom Line Item --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku || 'No SKU'}) — ${p.unit_price}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(idx)}
                          className="text-text-muted hover:text-danger-base p-1"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="text-[10px] text-text-muted block">Name</label>
                          <input
                            type="text"
                            value={item.product_name}
                            placeholder="Item name"
                            onChange={(e) => {
                              const updated = [...lineItems];
                              const cur = updated[idx];
                              if (cur) {
                                cur.product_name = e.target.value;
                                setLineItems(updated);
                              }
                            }}
                            className="w-full py-1 px-1.5 bg-surface-subtle border border-border-subtle rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-text-muted block">Qty</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const updated = [...lineItems];
                              const cur = updated[idx];
                              if (cur) {
                                cur.quantity = Math.max(1, parseFloat(e.target.value) || 1);
                                setLineItems(updated);
                              }
                            }}
                            className="w-full py-1 px-1.5 bg-surface-subtle border border-border-subtle rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-text-muted block">Price ($)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => {
                              const updated = [...lineItems];
                              const cur = updated[idx];
                              if (cur) {
                                cur.unit_price = parseFloat(e.target.value) || 0;
                                setLineItems(updated);
                              }
                            }}
                            className="w-full py-1 px-1.5 bg-surface-subtle border border-border-subtle rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-text-muted block">Disc %</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount_percent}
                            onChange={(e) => {
                              const updated = [...lineItems];
                              const cur = updated[idx];
                              if (cur) {
                                cur.discount_percent = parseFloat(e.target.value) || 0;
                                setLineItems(updated);
                              }
                            }}
                            className="w-full py-1 px-1.5 bg-surface-subtle border border-border-subtle rounded text-xs"
                          />
                        </div>
                      </div>

                      <div className="text-right text-[11px] text-text-muted font-mono pt-1">
                        Item Total: <span className="font-semibold text-text-primary">${(lineItemTotals[idx]?.total ?? 0).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}

                  <div className="pt-2 border-t border-border-subtle flex justify-between items-center text-xs font-semibold">
                    <span className="text-text-muted">Calculated Deal Total:</span>
                    <span className="text-primary-base font-mono text-sm">${computedGrandTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {lineItems.length === 0 && (
              <div className="grid grid-cols-2 gap-3">
                <FormField label={`Deal value (${currencySymbol})`} htmlFor="d_value">
                  <Input id="d_value" type="number" min={0} placeholder="0" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} />
                </FormField>
                <FormField label="Probability (%)" htmlFor="d_prob">
                  <Input id="d_prob" type="number" min={0} max={100} placeholder="50" value={formData.probability} onChange={(e) => setFormData({ ...formData, probability: e.target.value })} />
                </FormField>
              </div>
            )}

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
    </PagePermissionGuard>
  );
}
