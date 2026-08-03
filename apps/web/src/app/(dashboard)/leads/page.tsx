'use client';

import { useState } from 'react';

import { useToast } from '@/components/ui/toast';
import { useCRM } from '@/hooks/use-crm';
import { useFormatters } from '@/hooks/use-formatters';
import type { LeadResponse, LeadUpdate } from '@/types';

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];

const PRIORITY_COLORS: Record<string, string> = {
  Low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  Medium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  High: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Urgent: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  Disqualified: 'bg-slate-600/20 text-slate-500 border-slate-600/30',
};

export default function LeadsPage(): React.JSX.Element {
  const {
    leads,
    isLoadingLeads,
    createLead,
    isCreatingLead,
    updateLead,
    isUpdatingLead,
    deleteLead,
    isDeletingLead,
    convertLead,
    isConvertingLead,
    pipelines,
  } = useCRM();
  const { toast } = useToast();

  // ── Filters ───────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showConverted, setShowConverted] = useState(false);

  const filtered = leads.filter((l) => {
    if (!showConverted && (l.converted_at || l.priority === 'Disqualified')) return false;
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

  // ── Create Modal ──────────────────────────────────────────────────────────
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    job_title: '',
    estimated_value: '',
    priority: 'Medium',
    description: '',
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
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create lead.');
    }
  };

  // ── Edit Modal ────────────────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<LeadResponse | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    company_name: '',
    job_title: '',
    estimated_value: '',
    priority: 'Medium',
    description: '',
  });

  const openEdit = (lead: LeadResponse) => {
    setEditTarget(lead);
    setEditForm({
      first_name: lead.first_name,
      last_name: lead.last_name ?? '',
      email: lead.email ?? '',
      company_name: lead.company_name ?? '',
      job_title: lead.job_title ?? '',
      estimated_value: lead.estimated_value?.toString() ?? '',
      priority: lead.priority,
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
    } catch (err: unknown) {
      toast('error', 'Update failed', err instanceof Error ? err.message : '');
    }
  };

  // ── Disqualify ────────────────────────────────────────────────────────────
  const handleDisqualify = async (leadId: string) => {
    try {
      await deleteLead(leadId);
      toast('success', 'Lead disqualified');
    } catch (err: unknown) {
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
      setConvertSuccess('Lead successfully converted! Company and Contact have been created.');
      toast('success', 'Lead converted!');
    } catch (err: unknown) {
      setConvertError(err instanceof Error ? err.message : 'Failed to convert lead.');
    }
  };

  const inputCls = 'w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-forge-500 transition-colors';
  const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

  const totalValue = leads.filter((l) => !l.converted_at && l.priority !== 'Disqualified').reduce((s, l) => s + (l.estimated_value || 0), 0);
  const convertedCount = leads.filter((l) => l.converted_at).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Leads</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {leads.filter((l) => !l.converted_at && l.priority !== 'Disqualified').length} active · ${totalValue.toLocaleString()} pipeline · {convertedCount} converted
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-lg bg-forge-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-forge-500/20 hover:bg-forge-400 transition-all flex items-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search leads…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-forge-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-400 focus:outline-none focus:ring-1 focus:ring-forge-500"
          >
            <option value="all">All Priorities</option>
            {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <button
            onClick={() => setShowConverted(!showConverted)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${
              showConverted
                ? 'border-forge-500/40 bg-forge-500/20 text-forge-400'
                : 'border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {showConverted ? '✓ ' : ''}Show All
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-xl overflow-hidden">
        {isLoadingLeads ? (
          <div className="space-y-0">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-800 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-slate-800" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-800 rounded w-36" />
                  <div className="h-2.5 bg-slate-800/60 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="h-12 w-12 mx-auto text-slate-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-slate-500 text-sm">
              {search ? `No leads match "${search}"` : 'No active leads. Add your first lead above.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Name</th>
                <th className="px-6 py-3.5">Company</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Est. Value</th>
                <th className="px-6 py-3.5">Priority</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">Create New Lead</h3>
            {createError && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400">{createError}</div>
            )}
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>First Name <span className="text-rose-400">*</span></label>
                  <input required type="text" value={createForm.first_name} onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Last Name</label>
                  <input type="text" value={createForm.last_name} onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input type="text" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Company</label>
                  <input type="text" value={createForm.company_name} onChange={(e) => setCreateForm({ ...createForm, company_name: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Job Title</label>
                  <input type="text" value={createForm.job_title} onChange={(e) => setCreateForm({ ...createForm, job_title: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Est. Value ($)</label>
                  <input type="number" min={0} value={createForm.estimated_value} onChange={(e) => setCreateForm({ ...createForm, estimated_value: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Priority</label>
                  <select value={createForm.priority} onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })} className={inputCls}>
                    {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea rows={2} value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} className={inputCls} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={isCreatingLead} className="rounded-lg bg-forge-500 px-4 py-2 text-xs font-semibold text-white hover:bg-forge-400 disabled:opacity-50">
                  {isCreatingLead ? 'Saving…' : 'Save Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Lead Modal ────────────────────────────────────────────────── */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">Edit Lead</h3>
            <form onSubmit={handleEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>First Name <span className="text-rose-400">*</span></label>
                  <input required type="text" value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Last Name</label>
                  <input type="text" value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Company</label>
                  <input type="text" value={editForm.company_name} onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Est. Value ($)</label>
                  <input type="number" min={0} value={editForm.estimated_value} onChange={(e) => setEditForm({ ...editForm, estimated_value: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Priority</label>
                  <select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })} className={inputCls}>
                    {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea rows={2} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className={inputCls} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditTarget(null)} className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={isUpdatingLead} className="rounded-lg bg-forge-500 px-4 py-2 text-xs font-semibold text-white hover:bg-forge-400 disabled:opacity-50">
                  {isUpdatingLead ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Convert Lead Modal ─────────────────────────────────────────────── */}
      {convertTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">Convert Lead</h3>
              <p className="text-sm text-slate-400 mt-1">
                Converting <span className="text-white font-medium">{convertTarget.first_name} {convertTarget.last_name}</span> will create a Company and Contact.
              </p>
            </div>
            {convertError && <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400">{convertError}</div>}
            {convertSuccess ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm text-emerald-400">{convertSuccess}</div>
                <div className="flex justify-end">
                  <button onClick={() => setConvertTarget(null)} className="rounded-lg bg-forge-500 px-4 py-2 text-xs font-semibold text-white hover:bg-forge-400">Done</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConvert} className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/60 p-3">
                  <input id="create-deal-toggle" type="checkbox" checked={convertForm.create_deal} onChange={(e) => setConvertForm({ ...convertForm, create_deal: e.target.checked })} className="h-4 w-4 rounded border-slate-600 accent-forge-500" />
                  <label htmlFor="create-deal-toggle" className="text-sm font-medium text-white cursor-pointer">Also create a Deal</label>
                </div>
                {convertForm.create_deal && (
                  <div className="space-y-3 pl-1">
                    <div>
                      <label className={labelCls}>Deal Name</label>
                      <input type="text" value={convertForm.deal_name} onChange={(e) => setConvertForm({ ...convertForm, deal_name: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Deal Value ($)</label>
                      <input type="number" min={0} value={convertForm.deal_value} onChange={(e) => setConvertForm({ ...convertForm, deal_value: Number(e.target.value) })} className={inputCls} />
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setConvertTarget(null)} className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white">Cancel</button>
                  <button type="submit" disabled={isConvertingLead} className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
                    {isConvertingLead ? 'Converting…' : 'Convert Lead'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
    <tr className={`hover:bg-slate-800/40 transition-colors ${isConverted || isDisqualified ? 'opacity-60' : ''}`}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 shrink-0">
            {lead.first_name[0]}
          </div>
          <div>
            <p className="font-medium text-white">{lead.first_name} {lead.last_name}</p>
            {lead.job_title && <p className="text-xs text-slate-500">{lead.job_title}</p>}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-slate-400 text-sm">{lead.company_name || '—'}</td>
      <td className="px-6 py-4 text-slate-400 text-xs">{lead.email || '—'}</td>
      <td className="px-6 py-4 font-semibold text-emerald-400 text-sm">
        {lead.estimated_value ? `$${lead.estimated_value.toLocaleString()}` : '—'}
      </td>
      <td className="px-6 py-4">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold border ${PRIORITY_COLORS[lead.priority] ?? PRIORITY_COLORS.Medium}`}>
          {lead.priority}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {isConverted && (
            <span className="text-xs text-emerald-400 font-semibold">✓ Converted</span>
          )}
          {!isConverted && !isDisqualified && (
            <>
              <button
                onClick={() => onEdit(lead)}
                className="rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => onConvert(lead)}
                className="rounded-md bg-forge-500/20 px-2.5 py-1 text-xs font-medium text-forge-300 hover:bg-forge-500/30 border border-forge-500/30 transition-colors"
              >
                Convert
              </button>
              <button
                onClick={() => onDisqualify(lead.id)}
                disabled={isDeletingLead}
                className="rounded-md px-2 py-1 text-xs text-slate-600 hover:text-rose-400 transition-colors disabled:opacity-50"
              >
                ✕
              </button>
            </>
          )}
          {isDisqualified && <span className="text-xs text-slate-500">Disqualified</span>}
        </div>
      </td>
    </tr>
  );
}
