'use client';

import { useState, useEffect } from 'react';
import {
  GitBranch, Plus, Copy, Trash2, ArrowUp, ArrowDown, Edit3,
  ShieldAlert, Sparkles, LayoutGrid, Eye, GripVertical, Star
} from 'lucide-react';

import { useToast } from '@/components/ui/toast';
import { useCRM } from '@/hooks/use-crm';
import { useFormatters } from '@/hooks/use-formatters';
import { Button, Input, Select, Badge, Skeleton, FormField, Textarea } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import type { PipelineResponse, StageResponse } from '@/types';

// ── Color Swatches ────────────────────────────────────────────────────────────

const COLOR_PALETTE = [
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Indigo', hex: '#6366F1' },
  { name: 'Slate', hex: '#64748B' },
];

export function PipelineBuilder(): React.JSX.Element {
  const { toast } = useToast();
  const { formatCurrency } = useFormatters();

  const {
    pipelines, isLoadingPipelines, createPipeline, updatePipeline,
    deletePipeline, duplicatePipeline, createStage, updateStage,
    deleteStage, reorderStages,
  } = useCRM();

  // Active pipeline state
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);

  const activePipeline: PipelineResponse | undefined =
    pipelines.find((p) => p.id === selectedPipelineId) ?? pipelines[0];

  // Pipeline Modals & Forms
  const [isCreatePipelineOpen, setIsCreatePipelineOpen] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState('');
  const [newPipelineDesc, setNewPipelineDesc] = useState('');

  const [isEditPipelineOpen, setIsEditPipelineOpen] = useState(false);
  const [editPipelineName, setEditPipelineName] = useState('');
  const [editPipelineDesc, setEditPipelineDesc] = useState('');
  const [editPipelineIsDefault, setEditPipelineIsDefault] = useState(false);

  // Stage Modals & In-place forms
  const [isAddStageOpen, setIsAddStageOpen] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageProb, setNewStageProb] = useState(20);
  const [newStageColor, setNewStageColor] = useState('#3B82F6');
  const [newStageIsWon, setNewStageIsWon] = useState(false);
  const [newStageIsLost, setNewStageIsLost] = useState(false);

  // Archive / Delete targets
  const [archiveTargetPipeline, setArchiveTargetPipeline] = useState<PipelineResponse | null>(null);
  const [deleteTargetStage, setDeleteTargetStage] = useState<StageResponse | null>(null);

  // Local draft stage names and probabilities for instant live reactivity
  const [draftStages, setDraftStages] = useState<StageResponse[]>([]);

  // Sync draft stages whenever active pipeline changes
  useEffect(() => {
    if (activePipeline?.stages) {
      setDraftStages(activePipeline.stages);
    }
  }, [activePipeline]);

  // Keyboard shortcut ESC listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCreatePipelineOpen(false);
        setIsEditPipelineOpen(false);
        setIsAddStageOpen(false);
        setArchiveTargetPipeline(null);
        setDeleteTargetStage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Open Edit Pipeline Modal
  const openEditPipelineModal = () => {
    if (!activePipeline) return;
    setEditPipelineName(activePipeline.name);
    setEditPipelineDesc(activePipeline.description || '');
    setEditPipelineIsDefault(activePipeline.is_default);
    setIsEditPipelineOpen(true);
  };

  // Create Pipeline Handler
  const handleCreatePipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPipelineName.trim()) return;

    try {
      const created = await createPipeline({
        name: newPipelineName.trim(),
        description: newPipelineDesc.trim() || undefined,
        is_default: false,
      });
      toast('success', 'Pipeline Created', `"${created.name}" is now ready for stage configuration.`);
      setSelectedPipelineId(created.id);
      setIsCreatePipelineOpen(false);
      setNewPipelineName('');
      setNewPipelineDesc('');
    } catch {
      toast('error', 'Creation Failed', 'Could not create sales pipeline.');
    }
  };

  // Update Pipeline Handler
  const handleUpdatePipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePipeline || !editPipelineName.trim()) return;

    try {
      await updatePipeline({
        id: activePipeline.id,
        payload: {
          name: editPipelineName.trim(),
          description: editPipelineDesc.trim() || undefined,
          is_default: editPipelineIsDefault,
        },
      });
      toast('success', 'Pipeline Details Updated', `Saved changes for "${editPipelineName.trim()}".`);
      setIsEditPipelineOpen(false);
    } catch {
      toast('error', 'Update Failed', 'Could not update pipeline settings.');
    }
  };

  // Duplicate Pipeline Handler
  const handleDuplicatePipeline = async () => {
    if (!activePipeline) return;
    try {
      const dup = await duplicatePipeline(activePipeline.id);
      toast('success', 'Pipeline Duplicated', `Created "${dup.name}" with all stage configurations.`);
      setSelectedPipelineId(dup.id);
    } catch {
      toast('error', 'Duplication Failed', 'Could not duplicate pipeline.');
    }
  };

  // Set Default Pipeline Handler
  const handleSetDefaultPipeline = async () => {
    if (!activePipeline || activePipeline.is_default) return;
    try {
      await updatePipeline({
        id: activePipeline.id,
        payload: { is_default: true },
      });
      toast('success', 'Default Pipeline Set', `"${activePipeline.name}" is now your workspace default sales pipeline.`);
    } catch {
      toast('error', 'Update Failed', 'Could not update default pipeline.');
    }
  };

  // Archive Pipeline Handler
  const handleArchivePipeline = async () => {
    if (!archiveTargetPipeline) return;
    try {
      await deletePipeline(archiveTargetPipeline.id);
      toast('success', 'Pipeline Archived', `"${archiveTargetPipeline.name}" was successfully archived.`);
      setArchiveTargetPipeline(null);
      setSelectedPipelineId(pipelines[0]?.id ?? null);
    } catch (err) {
      toast('error', 'Cannot Archive Pipeline', err instanceof Error ? err.message : 'Active deals exist in this pipeline.');
    }
  };

  // Reorder Stages Handler (Move Up/Down)
  const handleMoveStage = async (stageId: string, direction: 'up' | 'down') => {
    if (!activePipeline) return;
    const index = draftStages.findIndex((s) => s.id === stageId);
    if (index < 0) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === draftStages.length - 1) return;

    const updated = [...draftStages];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const [moved] = updated.splice(index, 1);
    if (moved) updated.splice(targetIdx, 0, moved);

    // Re-index sort order
    const stageOrders = updated.map((s, idx) => ({ id: s.id, sort_order: idx }));
    setDraftStages(updated.map((s, idx) => ({ ...s, sort_order: idx })));

    try {
      await reorderStages({
        pipelineId: activePipeline.id,
        payload: { stages: stageOrders },
      });
      toast('success', 'Stage Order Saved', 'Live Kanban preview updated.');
    } catch {
      toast('error', 'Reorder Failed', 'Could not reorder pipeline stages.');
    }
  };

  // Add Stage Handler
  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePipeline || !newStageName.trim()) return;

    if (draftStages.some((s) => s.name.toLowerCase() === newStageName.trim().toLowerCase())) {
      toast('error', 'Duplicate Stage Name', 'A stage with this name already exists in this pipeline.');
      return;
    }

    try {
      await createStage({
        pipelineId: activePipeline.id,
        payload: {
          name: newStageName.trim(),
          sort_order: draftStages.length,
          probability: newStageProb,
          color: newStageColor,
          is_closed: newStageIsWon || newStageIsLost || newStageProb === 100 || newStageProb === 0,
          is_won: newStageIsWon || newStageProb === 100,
          is_lost: newStageIsLost,
        },
      });
      toast('success', 'Stage Added', `Added "${newStageName.trim()}" to the pipeline.`);
      setIsAddStageOpen(false);
      setNewStageName('');
      setNewStageProb(20);
      setNewStageIsWon(false);
      setNewStageIsLost(false);
    } catch {
      toast('error', 'Failed to Add Stage', 'Could not create stage.');
    }
  };

  // Delete Stage Handler
  const handleDeleteStage = async () => {
    if (!activePipeline || !deleteTargetStage) return;
    try {
      await deleteStage({ pipelineId: activePipeline.id, stageId: deleteTargetStage.id });
      toast('success', 'Stage Deleted', `"${deleteTargetStage.name}" was removed.`);
      setDeleteTargetStage(null);
    } catch (err) {
      toast('error', 'Cannot Delete Stage', err instanceof Error ? err.message : 'Active deals exist in this stage.');
    }
  };

  // Quick In-Place Stage Field Updater
  const handleInplaceStageUpdate = async (stageId: string, updates: { name?: string; probability?: number; color?: string }) => {
    if (!activePipeline) return;

    // Optimistically update local draft stage state
    setDraftStages((prev) =>
      prev.map((s) => (s.id === stageId ? { ...s, ...updates } : s))
    );

    try {
      await updateStage({
        pipelineId: activePipeline.id,
        stageId,
        payload: updates,
      });
    } catch {
      toast('error', 'Save Failed', 'Could not save stage update.');
    }
  };

  if (isLoadingPipelines) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-64 rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Skeleton className="h-96 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Top Header Controls & Pipeline Switcher Bar ──────────────────────── */}
      <div className="rounded-xl border p-4 shadow-sm backdrop-blur-md"
        style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-raised)' }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-forge-500/10 text-forge-400 border border-forge-500/20 shadow-xs shrink-0">
              <GitBranch className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Select
                  value={activePipeline?.id ?? ''}
                  onChange={(e) => setSelectedPipelineId(e.target.value)}
                  className="text-h3 font-semibold bg-transparent border-none p-0 focus:ring-0 cursor-pointer text-text-primary"
                >
                  {pipelines.map((p) => (
                    <option key={p.id} value={p.id} className="bg-surface-overlay text-text-primary">
                      {p.name} {p.is_default ? '(Default Pipeline)' : ''}
                    </option>
                  ))}
                </Select>

                {activePipeline?.is_default ? (
                  <Badge variant="warning" className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Default
                  </Badge>
                ) : (
                  <Button size="sm" variant="ghost" onClick={handleSetDefaultPipeline} title="Set as default workspace pipeline">
                    Make Default
                  </Button>
                )}
              </div>
              <p className="text-caption text-text-tertiary mt-0.5">
                {activePipeline?.description || 'Configure custom sales stages, win probabilities, colors, and sort orders.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Button size="sm" variant="secondary" onClick={openEditPipelineModal} title="Edit pipeline details">
              <Edit3 className="h-3.5 w-3.5" /> Edit Details
            </Button>
            <Button size="sm" variant="secondary" onClick={handleDuplicatePipeline} title="Duplicate current pipeline">
              <Copy className="h-3.5 w-3.5" /> Duplicate
            </Button>
            {activePipeline && !activePipeline.is_default && (
              <Button size="sm" variant="ghost" onClick={() => setArchiveTargetPipeline(activePipeline)} className="text-red-400 hover:text-red-300">
                <Trash2 className="h-3.5 w-3.5" /> Archive Pipeline
              </Button>
            )}
            <Button size="sm" onClick={() => setIsCreatePipelineOpen(true)} className="bg-forge-500 hover:bg-forge-400 text-white font-medium">
              <Plus className="h-3.5 w-3.5" /> New Pipeline
            </Button>
          </div>
        </div>
      </div>

      {/* ── Interactive Stage Builder & Live Kanban Canvas ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Interactive Stage Configuration Canvas (Left 6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-h3 text-text-primary flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-forge-400" /> Interactive Stage Builder ({draftStages.length})
              </h3>
              <p className="text-micro text-text-tertiary">Edit stage names, drag/reorder positions, and adjust win probabilities in-place.</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setIsAddStageOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Stage
            </Button>
          </div>

          <div className="space-y-3">
            {draftStages.map((stg, idx) => (
              <div
                key={stg.id}
                className="group rounded-xl border p-4 space-y-3.5 transition-all duration-150 shadow-xs hover:border-forge-500/40"
                style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-raised)' }}
              >
                {/* Stage Header & Actions */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="cursor-grab text-text-tertiary hover:text-text-primary p-1" title="Drag / Reorder stage">
                      <GripVertical className="h-4 w-4" strokeWidth={1.5} />
                    </span>
                    <span className="text-micro font-bold text-forge-400 bg-forge-500/10 px-1.5 py-0.5 rounded border border-forge-500/20 shrink-0">
                      #{idx + 1}
                    </span>
                    <span
                      className="h-3.5 w-3.5 rounded-full shrink-0 shadow-xs cursor-pointer ring-2 ring-transparent hover:ring-forge-500/50"
                      style={{ backgroundColor: stg.color || '#3B82F6' }}
                      title="Stage indicator color"
                    />
                    
                    {/* In-place Editable Stage Name */}
                    <input
                      type="text"
                      key={`name-${stg.id}-${stg.name}`}
                      defaultValue={stg.name}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val && val !== stg.name) {
                          handleInplaceStageUpdate(stg.id, { name: val });
                        }
                      }}
                      className="bg-transparent text-label font-semibold text-text-primary border-b border-transparent hover:border-border-default focus:border-forge-500 focus:outline-none transition-colors px-1 py-0.5 w-full rounded"
                      placeholder="Stage Name"
                    />
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveStage(stg.id, 'up')}
                      className="rounded-lg p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-overlay disabled:opacity-20 transition-colors"
                      title="Move Stage Up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === draftStages.length - 1}
                      onClick={() => handleMoveStage(stg.id, 'down')}
                      className="rounded-lg p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-overlay disabled:opacity-20 transition-colors"
                      title="Move Stage Down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetStage(stg)}
                      className="rounded-lg p-1.5 text-text-tertiary hover:text-red-400 hover:bg-surface-overlay transition-colors"
                      title="Delete Stage"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Probability & Color Swatch Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div>
                    <div className="flex justify-between text-micro text-text-tertiary mb-1.5">
                      <span>Win Probability</span>
                      <span className="font-bold text-text-primary">{stg.probability}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        key={`range-${stg.id}-${stg.probability}`}
                        defaultValue={stg.probability}
                        onChange={(e) => handleInplaceStageUpdate(stg.id, { probability: parseInt(e.target.value, 10) })}
                        className="w-full accent-forge-500 cursor-pointer h-1.5 bg-surface-sunken rounded-lg"
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        key={`num-${stg.id}-${stg.probability}`}
                        defaultValue={stg.probability}
                        onBlur={(e) => {
                          const val = Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0));
                          handleInplaceStageUpdate(stg.id, { probability: val });
                        }}
                        className="w-12 text-center text-micro font-semibold rounded border border-border-default bg-surface-sunken py-0.5 text-text-primary focus:outline-none focus:border-forge-500"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-micro text-text-tertiary block mb-1.5">Stage Color Tag</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {COLOR_PALETTE.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => handleInplaceStageUpdate(stg.id, { color: c.hex })}
                          className={cn(
                            'h-4 w-4 rounded-full transition-all hover:scale-125',
                            stg.color === c.hex ? 'ring-2 ring-forge-500 ring-offset-1 ring-offset-surface-raised scale-125' : 'opacity-70 hover:opacity-100',
                          )}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setIsAddStageOpen(true)}
              className="w-full rounded-xl border border-dashed p-3.5 text-center text-label text-text-tertiary hover:text-forge-400 hover:border-forge-500/50 hover:bg-forge-500/5 transition-all flex items-center justify-center gap-2 font-medium"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <Plus className="h-4 w-4" /> Add Stage to Pipeline
            </button>
          </div>
        </div>

        {/* Live Kanban Preview Panel (Right 6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-h3 text-text-primary flex items-center gap-2">
                <Eye className="h-4 w-4 text-emerald-400" /> Live Kanban Preview
              </h3>
              <p className="text-micro text-text-tertiary">Real-time rendering of stage columns and sales deal cards.</p>
            </div>
            <Badge variant="success" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Live Sync
            </Badge>
          </div>

          <div
            className="rounded-xl border p-4 min-h-[460px] overflow-x-auto space-y-3"
            style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-sunken)' }}
          >
            <div className="flex gap-3 pb-2 overflow-x-auto min-w-max">
              {draftStages.map((stg) => (
                <div
                  key={stg.id}
                  className="w-60 shrink-0 rounded-lg border p-3.5 space-y-3 flex flex-col justify-between shadow-xs transition-all"
                  style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--surface-base)' }}
                >
                  <div>
                    {/* Stage Header Card */}
                    <div className="border-b pb-2.5 mb-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: stg.color || '#3B82F6' }} />
                          <span className="text-label font-bold text-text-primary truncate">{stg.name}</span>
                        </div>
                        <Badge variant={stg.is_won ? 'success' : stg.is_lost ? 'danger' : 'warning'} className="tabular font-semibold">
                          {stg.probability}%
                        </Badge>
                      </div>
                      <div className="flex justify-between text-micro text-text-tertiary mt-1.5">
                        <span>Total Pipeline</span>
                        <span className="font-semibold text-text-secondary">{formatCurrency(stg.probability * 1250)}</span>
                      </div>
                    </div>

                    {/* Mock Deal Card 1 */}
                    <div className="rounded-lg border p-3 space-y-1.5 mb-2 shadow-xs transition-transform hover:scale-[1.02]"
                      style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--surface-raised)' }}
                    >
                      <p className="text-caption font-semibold text-text-primary">Enterprise CRM Renewal</p>
                      <div className="flex justify-between text-micro text-text-tertiary">
                        <span>Acme Corp</span>
                        <span className="font-bold text-text-secondary">{formatCurrency(85000)}</span>
                      </div>
                    </div>

                    {/* Mock Deal Card 2 */}
                    <div className="rounded-lg border p-3 space-y-1.5 shadow-xs transition-transform hover:scale-[1.02]"
                      style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--surface-raised)' }}
                    >
                      <p className="text-caption font-semibold text-text-primary">Cloud Infrastructure Contract</p>
                      <div className="flex justify-between text-micro text-text-tertiary">
                        <span>Wayne Tech</span>
                        <span className="font-bold text-text-secondary">{formatCurrency(45000)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t text-center text-micro text-text-tertiary font-mono" style={{ borderColor: 'var(--border-subtle)' }}>
                    Stage Order #{stg.sort_order + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Create Pipeline Modal ────────────────────────────────────────────── */}
      {isCreatePipelineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleCreatePipeline} className="w-full max-w-md rounded-xl border bg-surface-overlay p-5 shadow-xl space-y-4"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <h3 className="text-h3 text-text-primary flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-forge-400" /> Create Sales Pipeline
              </h3>
            </div>

            <div className="space-y-3">
              <FormField label="Pipeline Name" htmlFor="p_name">
                <Input
                  id="p_name"
                  required
                  placeholder="e.g. Enterprise Account Pipeline"
                  value={newPipelineName}
                  onChange={(e) => setNewPipelineName(e.target.value)}
                />
              </FormField>

              <FormField label="Description (Optional)" htmlFor="p_desc">
                <Textarea
                  id="p_desc"
                  placeholder="e.g. Workflow for multi-year enterprise contracts and high-touch accounts"
                  value={newPipelineDesc}
                  onChange={(e) => setNewPipelineDesc(e.target.value)}
                  rows={3}
                />
              </FormField>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <Button type="button" variant="ghost" size="md" onClick={() => setIsCreatePipelineOpen(false)}>Cancel</Button>
              <Button type="submit" size="md">Create Pipeline</Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Edit Pipeline Details Modal ──────────────────────────────────────── */}
      {isEditPipelineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleUpdatePipeline} className="w-full max-w-md rounded-xl border bg-surface-overlay p-5 shadow-xl space-y-4"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <h3 className="text-h3 text-text-primary flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-forge-400" /> Edit Pipeline Details
              </h3>
            </div>

            <div className="space-y-3">
              <FormField label="Pipeline Name" htmlFor="ep_name">
                <Input
                  id="ep_name"
                  required
                  value={editPipelineName}
                  onChange={(e) => setEditPipelineName(e.target.value)}
                />
              </FormField>

              <FormField label="Description" htmlFor="ep_desc">
                <Textarea
                  id="ep_desc"
                  value={editPipelineDesc}
                  onChange={(e) => setEditPipelineDesc(e.target.value)}
                  rows={3}
                />
              </FormField>

              <label className="flex items-center gap-2 text-label text-text-primary cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={editPipelineIsDefault}
                  onChange={(e) => setEditPipelineIsDefault(e.target.checked)}
                  className="rounded accent-forge-500 h-4 w-4"
                />
                Set as Default Workspace Pipeline
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <Button type="button" variant="ghost" size="md" onClick={() => setIsEditPipelineOpen(false)}>Cancel</Button>
              <Button type="submit" size="md">Save Details</Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Add Stage Modal ─────────────────────────────────────────────────── */}
      {isAddStageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleAddStage} className="w-full max-w-md rounded-xl border bg-surface-overlay p-5 shadow-xl space-y-4"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <h3 className="text-h3 text-text-primary flex items-center gap-2">
                <Plus className="h-5 w-5 text-forge-400" /> Add Pipeline Stage
              </h3>
            </div>

            <div className="space-y-3">
              <FormField label="Stage Name" htmlFor="s_name">
                <Input
                  id="s_name"
                  required
                  placeholder="e.g. Security & Compliance Review"
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                />
              </FormField>

              <FormField label="Win Probability (%)" htmlFor="s_prob">
                <Input
                  id="s_prob"
                  type="number"
                  min={0}
                  max={100}
                  value={newStageProb}
                  onChange={(e) => setNewStageProb(parseInt(e.target.value, 10) || 0)}
                />
              </FormField>

              <FormField label="Stage Color Badge" htmlFor="s_color">
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setNewStageColor(c.hex)}
                      className={cn(
                        'h-6 w-6 rounded-full transition-transform hover:scale-110',
                        newStageColor === c.hex ? 'ring-2 ring-forge-500 ring-offset-2 scale-110' : '',
                      )}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </FormField>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 text-caption text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newStageIsWon}
                    onChange={(e) => {
                      setNewStageIsWon(e.target.checked);
                      if (e.target.checked) setNewStageProb(100);
                    }}
                    className="rounded accent-emerald-500 h-3.5 w-3.5"
                  />
                  Closed Won Stage
                </label>
                <label className="flex items-center gap-1.5 text-caption text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newStageIsLost}
                    onChange={(e) => {
                      setNewStageIsLost(e.target.checked);
                      if (e.target.checked) setNewStageProb(0);
                    }}
                    className="rounded accent-red-500 h-3.5 w-3.5"
                  />
                  Closed Lost Stage
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <Button type="button" variant="ghost" size="md" onClick={() => setIsAddStageOpen(false)}>Cancel</Button>
              <Button type="submit" size="md">Add Stage</Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Archive Pipeline Confirmation Modal ──────────────────────────────── */}
      {archiveTargetPipeline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border bg-surface-overlay p-5 shadow-xl space-y-4"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            <div className="flex items-center gap-3 text-red-400">
              <ShieldAlert className="h-6 w-6 shrink-0" />
              <h3 className="text-h3 font-semibold text-text-primary">Archive Pipeline</h3>
            </div>
            <p className="text-label text-text-secondary">
              Are you sure you want to archive <strong className="text-text-primary">{archiveTargetPipeline.name}</strong>? Pipelines with active deals assigned cannot be archived.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <Button variant="ghost" size="md" onClick={() => setArchiveTargetPipeline(null)}>Cancel</Button>
              <Button variant="danger" size="md" onClick={handleArchivePipeline}>Archive Pipeline</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Stage Confirmation Modal ─────────────────────────────────── */}
      {deleteTargetStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border bg-surface-overlay p-5 shadow-xl space-y-4"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            <div className="flex items-center gap-3 text-red-400">
              <ShieldAlert className="h-6 w-6 shrink-0" />
              <h3 className="text-h3 font-semibold text-text-primary">Delete Stage</h3>
            </div>
            <p className="text-label text-text-secondary">
              Are you sure you want to delete stage <strong className="text-text-primary">{deleteTargetStage.name}</strong>? Stages with active deals assigned cannot be deleted.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <Button variant="ghost" size="md" onClick={() => setDeleteTargetStage(null)}>Cancel</Button>
              <Button variant="danger" size="md" onClick={handleDeleteStage}>Delete Stage</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
