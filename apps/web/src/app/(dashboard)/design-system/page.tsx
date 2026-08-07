'use client';

/**
 * ForgeCRM V2 — Living Design System & Storybook-Style Playground Page
 * Route: /design-system
 * Serves as the interactive component library reference, token documentation, and accessibility guide.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Palette,
  Maximize2,
  Layout,
  Plus,
  Trash2,
  Search,
  Info,
  Sliders,
} from 'lucide-react';

import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { Heading, Text, Label, Caption, Code } from '@/components/ui/typography';
import {
  Container,
  Stack,
  Grid,
  Surface,
  CardSection,
  PageHeader,
} from '@/components/ui/layout-primitives';
import { Button, IconButton, SplitButton } from '@/components/ui/button';
import { Input, PasswordInput, Textarea, CurrencyInput } from '@/components/ui/input';
import { FormField } from '@/components/ui/form';
import { Select, Combobox } from '@/components/ui/select';
import { KPICard } from '@/components/ui/card';
import { Badge, Avatar } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/navigation';
import { Callout, EmptyState } from '@/components/ui/feedback';
import { Modal } from '@/components/ui/overlay';
import { EnterpriseDataTable, Column } from '@/components/ui/data-table';

interface SampleRecord {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Lead' | 'Customer';
  value: string;
}

const SAMPLE_TABLE_DATA: SampleRecord[] = [
  { id: 'REC-101', name: 'Acme Corporation', email: 'contact@acme.com', status: 'Customer', value: '$120,000' },
  { id: 'REC-102', name: 'Stripe Payments', email: 'partners@stripe.com', status: 'Active', value: '$450,000' },
  { id: 'REC-103', name: 'Linear Systems', email: 'dev@linear.app', status: 'Lead', value: '$85,000' },
  { id: 'REC-104', name: 'Vercel Platform', email: 'enterprise@vercel.com', status: 'Customer', value: '$290,000' },
];

export default function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [btnDisabled, setBtnDisabled] = useState(false);
  const [activeTab, setActiveTab] = useState('segmented');
  const [comboboxValue, setComboboxValue] = useState('customer');

  const sampleColumns: Column<SampleRecord>[] = [
    { key: 'id', header: 'ID', sortable: true, render: (r) => <Code>{r.id}</Code> },
    { key: 'name', header: 'Company Name', sortable: true, render: (r) => <Text variant="body-s" className="font-semibold">{r.name}</Text> },
    { key: 'email', header: 'Contact Email', render: (r) => <Caption color="muted">{r.email}</Caption> },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (r) => (
        <Badge variant={r.status === 'Customer' ? 'success' : r.status === 'Active' ? 'default' : 'warning'} dot>
          {r.status}
        </Badge>
      ),
    },
    { key: 'value', header: 'Value', align: 'right', sortable: true, render: (r) => <Text variant="body-s" tabular className="font-semibold">{r.value}</Text> },
  ];

  return (
    <Container size="xl" className="py-8">
      <Stack gap={8}>
        {/* Header Bar */}
        <PageHeader className="border-b border-border-default pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
              <Sparkles className="h-4 w-4 text-accent" />
              ForgeCRM V2 Architecture
            </div>
            <Heading level="display-m" className="mt-1">
              Enterprise Component Library & Storybook
            </Heading>
            <Text variant="body-m" color="secondary" className="mt-1">
              Interactive design system playground, token reference, keyboard navigation specs, and component catalog.
            </Text>
          </div>

          <div className="flex flex-col gap-1">
            <Label size="s" color="muted">Theme Preference:</Label>
            <ThemeSwitcher variant="segmented" />
          </div>
        </PageHeader>

        {/* Live Controls Toolbar */}
        <Surface variant="surface" className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Sliders className="h-4 w-4 text-accent" />
            <Text variant="body-s" className="font-semibold">Interactive Playground Controls:</Text>
            <label className="flex items-center gap-2 text-xs text-secondary cursor-pointer">
              <input type="checkbox" checked={btnLoading} onChange={(e) => setBtnLoading(e.target.checked)} className="h-3.5 w-3.5 accent-accent rounded" />
              Loading State
            </label>
            <label className="flex items-center gap-2 text-xs text-secondary cursor-pointer">
              <input type="checkbox" checked={btnDisabled} onChange={(e) => setBtnDisabled(e.target.checked)} className="h-3.5 w-3.5 accent-accent rounded" />
              Disabled State
            </label>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(true)}>
            Open Sample Modal
          </Button>
        </Surface>

        {/* ── 1. Buttons System Playground ─────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <Heading level="h2" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            1. Button System (&lt;Button&gt;, &lt;IconButton&gt;, &lt;SplitButton&gt;)
          </Heading>
          <Surface variant="surface">
            <CardSection className="flex flex-col gap-5">
              <Caption color="muted" className="uppercase font-semibold tracking-wider block">
                Variants &amp; Sizing Scale
              </Caption>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" loading={btnLoading} disabled={btnDisabled} icon={<Plus className="h-4 w-4" />}>
                  Primary Button
                </Button>
                <Button variant="secondary" loading={btnLoading} disabled={btnDisabled}>
                  Secondary
                </Button>
                <Button variant="ghost" loading={btnLoading} disabled={btnDisabled}>
                  Ghost
                </Button>
                <Button variant="outline" loading={btnLoading} disabled={btnDisabled}>
                  Outline
                </Button>
                <Button variant="danger" loading={btnLoading} disabled={btnDisabled} icon={<Trash2 className="h-4 w-4" />}>
                  Danger Action
                </Button>
                <Button variant="success" loading={btnLoading} disabled={btnDisabled}>
                  Success Action
                </Button>
              </div>

              <div className="h-px w-full bg-border-default" />

              <Caption color="muted" className="uppercase font-semibold tracking-wider block">
                Icon Buttons &amp; Split Buttons
              </Caption>
              <div className="flex flex-wrap items-center gap-4">
                <IconButton icon={<Search className="h-4 w-4" />} variant="secondary" aria-label="Search records" />
                <IconButton icon={<Trash2 className="h-4 w-4" />} variant="danger" aria-label="Delete item" />
                <SplitButton
                  primaryAction={{ label: 'Save Deal', onClick: () => alert('Saved!') }}
                  dropdownActions={[
                    { label: 'Save & Close', onClick: () => {} },
                    { label: 'Save & Create Lead', onClick: () => {} },
                  ]}
                />
              </div>
            </CardSection>
          </Surface>
        </section>

        {/* ── 2. Form System Playground ────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <Heading level="h2" className="flex items-center gap-2">
            <Layout className="h-5 w-5 text-accent" />
            2. Form Control Primitives (&lt;FormField&gt;, &lt;Input&gt;, &lt;PasswordInput&gt;, &lt;Select&gt;)
          </Heading>
          <Surface variant="surface">
            <CardSection>
              <Grid cols={{ mobile: 1, tablet: 2, desktop: 3 }} gap={4}>
                <FormField label="Full Name" htmlFor="demo_name" required hint="Legal entity or contact name">
                  <Input id="demo_name" placeholder="Acme Inc." />
                </FormField>
                <FormField label="Security Key" htmlFor="demo_pass" required>
                  <PasswordInput id="demo_pass" placeholder="••••••••" />
                </FormField>
                <FormField label="Deal Revenue ($)" htmlFor="demo_rev" hint="Total contract value in USD">
                  <CurrencyInput id="demo_rev" placeholder="50,000" />
                </FormField>
                <FormField label="Account Stage" htmlFor="demo_stage">
                  <Select id="demo_stage" options={[
                    { value: 'lead', label: 'Lead Qualification' },
                    { value: 'active', label: 'Active Pipeline' },
                    { value: 'closed', label: 'Closed Won' },
                  ]} />
                </FormField>
                <FormField label="Search Combobox" htmlFor="demo_combo">
                  <Combobox
                    options={[
                      { value: 'lead', label: 'Lead' },
                      { value: 'customer', label: 'Customer' },
                      { value: 'partner', label: 'Partner' },
                    ]}
                    value={comboboxValue}
                    onChange={setComboboxValue}
                  />
                </FormField>
                <FormField label="Notes & Description" htmlFor="demo_desc">
                  <Textarea id="demo_desc" rows={2} placeholder="Add workspace internal notes…" />
                </FormField>
              </Grid>
            </CardSection>
          </Surface>
        </section>

        {/* ── 3. Cards & KPI Metrics Playground ───────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <Heading level="h2" className="flex items-center gap-2">
            <Maximize2 className="h-5 w-5 text-accent" />
            3. Card Surfaces &amp; KPI Metric Cards (&lt;KPICard&gt;, &lt;Card&gt;)
          </Heading>
          <Grid cols={{ mobile: 1, tablet: 3 }} gap={4}>
            <KPICard label="Annual Recurring Revenue" value="$4,850,200" trend="+14.2%" trendDirection="up" href="/deals" />
            <KPICard label="Active Workspaces" value="1,240" sub="across 18 regions" trendDirection="neutral" />
            <KPICard label="Disqualified Leads" value="12" trend="-4.5%" trendDirection="down" />
          </Grid>
        </section>

        {/* ── 4. Data Display & Badges ─────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <Heading level="h2" className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-accent" />
            4. Badges, Status Dots &amp; Avatars (&lt;Badge&gt;, &lt;Avatar&gt;)
          </Heading>
          <Surface variant="surface">
            <CardSection className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="default" dot>Default Active</Badge>
                <Badge variant="success" dot>Success Customer</Badge>
                <Badge variant="warning" dot>Warning Pending</Badge>
                <Badge variant="danger" dot>Danger Disqualified</Badge>
                <Badge variant="info" dot>Info Processing</Badge>
                <Badge variant="neutral">Neutral System</Badge>
              </div>

              <div className="h-px w-full bg-border-default" />

              <div className="flex items-center gap-4">
                <Avatar name="Vishal Singh" size="lg" />
                <Avatar name="Acme Corp" size="md" />
                <Avatar name="Linear App" size="sm" />
              </div>
            </CardSection>
          </Surface>
        </section>

        {/* ── 5. Navigation & Tabs Playground ─────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <Heading level="h2" className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-accent" />
            5. Navigation &amp; Segmented Controls (&lt;Tabs&gt;)
          </Heading>
          <Surface variant="surface">
            <CardSection className="flex flex-col gap-4">
              <Tabs
                variant="segmented"
                activeId={activeTab}
                onChange={setActiveTab}
                items={[
                  { id: 'segmented', label: 'Segmented View', count: 12 },
                  { id: 'pipelines', label: 'Pipelines Tab', count: 4 },
                  { id: 'settings', label: 'Settings Tab' },
                ]}
              />
              <Caption color="muted">Active Tab ID: <Code>{activeTab}</Code></Caption>
            </CardSection>
          </Surface>
        </section>

        {/* ── 6. Flagship Enterprise Data Table ───────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <Heading level="h2" className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-accent" />
            6. Flagship Enterprise Data Table (&lt;EnterpriseDataTable&gt;)
          </Heading>
          <EnterpriseDataTable
            data={SAMPLE_TABLE_DATA}
            columns={sampleColumns}
            keyExtractor={(r) => r.id}
            searchable
            selectable
            pageSize={3}
            bulkActions={<Button variant="danger" size="sm">Delete Selected</Button>}
          />
        </section>

        {/* ── 7. Feedback & Overlay System ─────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <Heading level="h2" className="flex items-center gap-2">
            <Info className="h-5 w-5 text-accent" />
            7. Feedback &amp; Overlays (&lt;Callout&gt;, &lt;EmptyState&gt;, &lt;Modal&gt;)
          </Heading>
          <Grid cols={{ mobile: 1, tablet: 2 }} gap={4}>
            <Surface variant="surface">
              <CardSection className="flex flex-col gap-3">
                <Callout variant="info" title="Informational Note">
                  This system enforces WCAG contrast standards and Geist typography scales natively.
                </Callout>
                <Callout variant="warning" title="Deprecation Notice">
                  Legacy raw Tailwind utility strings should not be used in future modules.
                </Callout>
                <Callout variant="success" title="Phase 4 Production Ready">
                  Enterprise Component Library architecture is fully verified.
                </Callout>
              </CardSection>
            </Surface>
            <Surface variant="surface">
              <EmptyState title="No Active Subscriptions" description="Click below to add a new enterprise plan." action={<Button size="sm">Add Subscription</Button>} />
            </Surface>
          </Grid>
        </section>

        {/* Sample Modal Render */}
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Sample Modal Shell" size="md">
          <Stack gap={4}>
            <Text variant="body-m">
              This modal component features backdrop blur, automatic keyboard Escape key closing, focus rings, and standardized padding.
            </Text>
            <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setModalOpen(false)}>Save Changes</Button>
            </div>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  );
}
