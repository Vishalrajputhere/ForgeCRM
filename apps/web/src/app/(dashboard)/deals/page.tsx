'use client';

import { useState } from 'react';

import { KanbanBoard } from '@/components/crm/kanban-board';
import { useToast } from '@/components/ui/toast';
import { useCRM } from '@/hooks/use-crm';
import { useFormatters } from '@/hooks/use-formatters';

export default function DealsPage(): React.JSX.Element {
  const { pipelines, deals, isLoadingDeals, companies, contacts, createDeal, isCreatingDeal } = useCRM();
  const { toast } = useToast();
  const { formatCurrency } = useFormatters();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    company_id: '',
    primary_contact_id: '',
    expected_close_date: '',
    probability: '',
    description: '',
  });
  const [error, setError] = useState<string | null>(null);

  const activePipeline = pipelines[0];
  const defaultStageId = activePipeline?.stages?.[0]?.id;
  const isFormValid = formData.name.trim().length > 0 && formData.company_id.trim().length > 0;

  // Company contacts for selected company
  const companyContacts = contacts.filter((c) => c.company_id === formData.company_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    if (!activePipeline || !defaultStageId) {
      setError('No active pipeline available. Please configure a pipeline first.');
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create deal.');
    }
  };

  const inputCls = 'w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-forge-500 transition-colors';
  const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

  // Stats
  const openDeals = deals.filter((d) => d.status === 'Open');
  const wonDeals = deals.filter((d) => d.status === 'Won');
  const totalPipeline = openDeals.reduce((s, d) => s + d.value, 0);
  const totalWon = wonDeals.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Sales Pipeline</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage deals, track progress, and close revenue</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-forge-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-forge-500/20 hover:bg-forge-400 transition-all flex items-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Deal
        </button>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Open Deals', value: openDeals.length, color: 'text-white' },
          { label: 'Pipeline Value', value: formatCurrency(totalPipeline), color: 'text-forge-400' },
          { label: 'Won This Period', value: wonDeals.length, color: 'text-emerald-400' },
          { label: 'Revenue Won', value: formatCurrency(totalWon), color: 'text-emerald-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      {isLoadingDeals ? (
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-72 shrink-0 rounded-xl border border-slate-800 bg-slate-900/60 p-3 animate-pulse space-y-2">
              <div className="h-5 bg-slate-800 rounded w-24" />
              {[1, 2].map((j) => (
                <div key={j} className="h-20 bg-slate-800/60 rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      ) : activePipeline ? (
        <KanbanBoard
          pipeline={activePipeline}
          deals={deals}
          companies={companies}
        />
      ) : (
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-800 text-slate-500 text-sm">
          No pipeline configured. Contact your workspace admin.
        </div>
      )}

      {/* ── Create Deal Modal ─────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">Create New Deal</h3>
            {error && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className={labelCls}>Deal Name <span className="text-rose-400">*</span></label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputCls} placeholder="e.g. Acme Corp — Enterprise License" />
              </div>
              <div>
                <label className={labelCls}>Company <span className="text-rose-400">*</span></label>
                {companies.length === 0 ? (
                  <p className="text-xs text-amber-400 py-2">You must create a Company before adding a Deal.</p>
                ) : (
                  <select required value={formData.company_id} onChange={(e) => setFormData({ ...formData, company_id: e.target.value, primary_contact_id: '' })} className={inputCls}>
                    <option value="">Select Company…</option>
                    {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>
              {formData.company_id && companyContacts.length > 0 && (
                <div>
                  <label className={labelCls}>Primary Contact</label>
                  <select value={formData.primary_contact_id} onChange={(e) => setFormData({ ...formData, primary_contact_id: e.target.value })} className={inputCls}>
                    <option value="">None</option>
                    {companyContacts.map((c) => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Deal Value ($)</label>
                  <input type="number" min={0} value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} className={inputCls} placeholder="0" />
                </div>
                <div>
                  <label className={labelCls}>Probability (%)</label>
                  <input type="number" min={0} max={100} value={formData.probability} onChange={(e) => setFormData({ ...formData, probability: e.target.value })} className={inputCls} placeholder="50" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Expected Close Date</label>
                <input type="date" value={formData.expected_close_date} onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Description / Notes</label>
                <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={inputCls} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={!isFormValid || isCreatingDeal} className="rounded-lg bg-forge-500 px-4 py-2 text-xs font-semibold text-white hover:bg-forge-400 disabled:opacity-40 disabled:cursor-not-allowed">
                  {isCreatingDeal ? 'Creating…' : 'Create Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
