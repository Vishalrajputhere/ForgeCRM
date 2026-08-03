'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { TimelineWidget } from '@/components/crm/timeline-widget';
import { useToast } from '@/components/ui/toast';
import { useCRM } from '@/hooks/use-crm';
import { useFormatters } from '@/hooks/use-formatters';
import type { DealUpdate } from '@/types';

const inputCls = 'w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-forge-500 transition-colors';
const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

export default function DealDetailPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;
  const { toast } = useToast();
  const { formatCurrency, formatDate } = useFormatters();

  const {
    useDeal,
    updateDeal,
    deleteDeal,
    isUpdatingDeal,
    isDeletingDeal,
    moveDealStage,
    pipelines,
    companies,
    contacts,
  } = useCRM();

  const { data: deal, isLoading } = useDeal(dealId);

  const pipeline = pipelines.find((p) => p.id === deal?.pipeline_id);
  const currentStage = pipeline?.stages?.find((s) => s.id === deal?.stage_id);
  const company = companies.find((c) => c.id === deal?.company_id);
  const contact = contacts.find((c) => c.id === deal?.primary_contact_id);

  const [tab, setTab] = useState<'overview' | 'timeline'>('overview');

  // ── Edit ──────────────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<DealUpdate>>({});

  const openEdit = () => {
    if (!deal) return;
    const form: Partial<DealUpdate> = {
      name: deal.name,
      value: deal.value,
      expected_close_date: deal.expected_close_date ?? '',
      description: deal.description ?? '',
    };
    if (deal.probability != null) form.probability = deal.probability;
    setEditForm(form);
    setIsEditing(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDeal({ id: dealId, payload: editForm });
      setIsEditing(false);
      toast('success', 'Deal updated');
    } catch (err: unknown) {
      toast('error', 'Update failed', err instanceof Error ? err.message : '');
    }
  };

  // ── Stage Move ────────────────────────────────────────────────────────────
  const handleMoveStage = async (stageId: string) => {
    try {
      await moveDealStage({ dealId, payload: { stage_id: stageId } });
      toast('success', 'Stage updated');
    } catch (err: unknown) {
      toast('error', 'Stage move failed', err instanceof Error ? err.message : '');
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState(false);
  const handleDelete = async () => {
    try {
      await deleteDeal(dealId);
      toast('success', 'Deal cancelled');
      router.push('/deals');
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

  if (!deal) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-8 text-center text-rose-400">
          Deal not found.{' '}
          <Link href="/deals" className="underline hover:text-rose-300">Go back</Link>
        </div>
      </div>
    );
  }

  const weightedValue = deal.probability ? (deal.value * deal.probability) / 100 : deal.value;

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/deals" className="hover:text-white transition-colors">Deals</Link>
        <span>/</span>
        <span className="text-white">{deal.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{deal.name}</h1>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold border ${
              deal.status === 'Won' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
              deal.status === 'Lost' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
              deal.status === 'Cancelled' ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' :
              'bg-blue-500/20 text-blue-400 border-blue-500/30'
            }`}>{deal.status}</span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-sm text-slate-400 flex-wrap">
            {company && (
              <Link href={`/companies/${company.id}`} className="hover:text-forge-300 transition-colors">{company.name}</Link>
            )}
            {currentStage && (
              <>
                <span className="text-slate-600">·</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: currentStage.color || '#6366f1' }} />
                  {currentStage.name}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={openEdit} className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-all">
            Edit
          </button>
          <button onClick={() => setConfirmDelete(true)} className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/20 transition-all">
            Cancel Deal
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
          <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide mb-1">Deal Value</p>
          <p className="text-xl font-bold text-white">{formatCurrency(deal.value)}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
          <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide mb-1">Probability</p>
          <p className="text-xl font-bold text-forge-400">{deal.probability ?? 0}%</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
          <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide mb-1">Weighted Value</p>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(weightedValue)}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
          <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide mb-1">Close Date</p>
          <p className="text-xl font-bold text-white">
            {formatDate(deal.expected_close_date)}
          </p>
        </div>
      </div>

      {/* Stage Progress */}
      {pipeline && pipeline.stages.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Pipeline Stage</h3>
          <div className="flex items-center gap-1 overflow-x-auto">
            {pipeline.stages
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((stage, idx) => {
                const isCurrent = stage.id === deal.stage_id;
                const currentIdx = pipeline.stages.findIndex((s) => s.id === deal.stage_id);
                const isPast = idx < currentIdx;
                return (
                  <button
                    key={stage.id}
                    onClick={() => handleMoveStage(stage.id)}
                    className={`flex-1 min-w-[80px] rounded-lg px-3 py-2 text-xs font-medium transition-all text-center ${
                      isCurrent
                        ? 'bg-forge-500 text-white shadow font-bold'
                        : isPast
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {stage.name}
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800">
        <button
          onClick={() => setTab('overview')}
          className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
            tab === 'overview'
              ? 'border-forge-500 text-forge-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Overview & Details
        </button>
        <button
          onClick={() => setTab('timeline')}
          className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
            tab === 'timeline'
              ? 'border-forge-500 text-forge-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Activity Timeline
        </button>
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Deal Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-slate-500 block">Deal Name</span>
                  <span className="text-white font-medium">{deal.name}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Status</span>
                  <span className="text-white font-medium">{deal.status}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Value</span>
                  <span className="text-emerald-400 font-bold">{formatCurrency(deal.value)}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Expected Close</span>
                  <span className="text-white font-medium">{formatDate(deal.expected_close_date)}</span>
                </div>
              </div>
              {deal.description && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-500 block mb-1">Description</span>
                  <p className="text-slate-300 text-sm leading-relaxed">{deal.description}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Associated Company</h3>
              {company ? (
                <Link href={`/companies/${company.id}`} className="block rounded-lg border border-slate-800 bg-slate-800/40 p-3 hover:border-slate-700 transition-colors group">
                  <p className="text-sm font-bold text-white group-hover:text-forge-300 transition-colors">{company.name}</p>
                  {company.website && <p className="text-xs text-slate-500 truncate mt-0.5">{company.website}</p>}
                </Link>
              ) : (
                <p className="text-xs text-slate-500">No associated company</p>
              )}
            </div>

            {contact && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Primary Contact</h3>
                <Link href={`/contacts/${contact.id}`} className="block rounded-lg border border-slate-800 bg-slate-800/40 p-3 hover:border-slate-700 transition-colors group">
                  <p className="text-sm font-bold text-white group-hover:text-forge-300 transition-colors">{contact.first_name} {contact.last_name}</p>
                  {contact.email && <p className="text-xs text-slate-500 truncate mt-0.5">{contact.email}</p>}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline Tab */}
      {tab === 'timeline' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Deal Activity Log</h3>
          <TimelineWidget entityType="Deal" entityId={dealId} />
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Edit Deal</h3>
            <form onSubmit={handleEdit} className="space-y-3">
              <div>
                <label className={labelCls}>Deal Name</label>
                <input required type="text" value={editForm.name ?? ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Value ($)</label>
                  <input type="number" min={0} value={editForm.value ?? ''} onChange={(e) => setEditForm({ ...editForm, value: Number(e.target.value) })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Probability (%)</label>
                  <input type="number" min={0} max={100} value={editForm.probability ?? ''} onChange={(e) => setEditForm({ ...editForm, probability: Number(e.target.value) })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Expected Close Date</label>
                <input type="date" value={editForm.expected_close_date ?? ''} onChange={(e) => setEditForm({ ...editForm, expected_close_date: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea rows={3} value={editForm.description ?? ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className={inputCls} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsEditing(false)} className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={isUpdatingDeal} className="rounded-lg bg-forge-500 px-4 py-2 text-xs font-semibold text-white hover:bg-forge-400 disabled:opacity-40">
                  {isUpdatingDeal ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Cancel Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 text-center">
            <h3 className="text-lg font-bold text-white">Cancel Deal?</h3>
            <p className="text-xs text-slate-400">Are you sure you want to mark this deal as cancelled?</p>
            <div className="flex justify-center gap-3 pt-2">
              <button onClick={() => setConfirmDelete(false)} className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white">Back</button>
              <button onClick={handleDelete} disabled={isDeletingDeal} className="rounded-lg bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-400 disabled:opacity-40">
                {isDeletingDeal ? 'Cancelling…' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
