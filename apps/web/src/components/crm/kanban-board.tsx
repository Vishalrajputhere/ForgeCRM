'use client';

import Link from 'next/link';
import { useState } from 'react';

import { useCRM } from '@/hooks/use-crm';
import { useFormatters } from '@/hooks/use-formatters';
import type { DealResponse, PipelineResponse, StageResponse } from '@/types';

interface KanbanBoardProps {
  pipeline?: PipelineResponse;
  deals?: DealResponse[];
  companies?: { id: string; name: string }[];
}

export function KanbanBoard({ pipeline, deals = [], companies = [] }: KanbanBoardProps): React.JSX.Element {
  const { moveDealStage } = useCRM();
  const { formatCurrency } = useFormatters();
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

  if (!pipeline || !pipeline.stages || pipeline.stages.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-sm text-slate-400">
        No sales stages available for this pipeline.
      </div>
    );
  }

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setDraggedDealId(dealId);
    e.dataTransfer.setData('text/plain', dealId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain') || draggedDealId;
    if (!dealId) return;

    const deal = deals.find((d) => d.id === dealId);
    if (deal && deal.stage_id === stageId) {
      setDraggedDealId(null);
      setDragOverStageId(null);
      return;
    }

    try {
      await moveDealStage({ dealId, payload: { stage_id: stageId } });
    } catch (err) {
      console.error('Failed to move stage:', err);
    } finally {
      setDraggedDealId(null);
      setDragOverStageId(null);
    }
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStageId(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStageId(null);
  };

  const totalPipelineValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <div className="space-y-3">
      {/* Pipeline summary */}
      <div className="flex items-center gap-6 rounded-xl border border-slate-800 bg-slate-900/40 px-5 py-3">
        <div>
          <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">Total Pipeline</p>
          <p className="text-lg font-bold text-white">{formatCurrency(totalPipelineValue)}</p>
        </div>
        <div className="h-8 w-px bg-slate-800" />
        <div>
          <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">Open Deals</p>
          <p className="text-lg font-bold text-white">{deals.filter((d) => d.status === 'Open').length}</p>
        </div>
        <div className="h-8 w-px bg-slate-800" />
        <div>
          <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide">Stages</p>
          <p className="text-lg font-bold text-white">{pipeline.stages.length}</p>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex w-full gap-4 overflow-x-auto pb-4 pt-1 min-h-[500px]">
        {pipeline.stages
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((stage: StageResponse) => {
            const stageDeals = deals.filter(
              (d) => d.stage_id === stage.id && d.status !== 'Cancelled'
            );
            const stageTotal = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);
            const isDropTarget = dragOverStageId === stage.id;

            return (
              <div
                key={stage.id}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
                className={`flex h-full w-72 shrink-0 flex-col rounded-xl border backdrop-blur-xl transition-all ${
                  isDropTarget
                    ? 'border-forge-500/60 bg-forge-500/5 shadow-lg shadow-forge-500/10'
                    : 'border-slate-800 bg-slate-900/60'
                }`}
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between border-b border-slate-800 p-3 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: stage.color || '#6366f1' }}
                    />
                    <h3 className="text-sm font-semibold text-white">{stage.name}</h3>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400 font-medium">
                      {stageDeals.length}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    {formatCurrency(stageTotal)}
                  </span>
                </div>

                {/* Drop zone / Cards */}
                <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-2.5 min-h-[400px]">
                  {stageDeals.length === 0 ? (
                    <div className={`flex flex-1 items-center justify-center rounded-lg border border-dashed p-4 text-center text-xs transition-all ${
                      isDropTarget ? 'border-forge-500/40 text-forge-500' : 'border-slate-800/80 text-slate-700'
                    }`}>
                      {isDropTarget ? 'Drop here' : 'No deals'}
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <DealCard key={deal.id} deal={deal} companies={companies} onDragStart={handleDragStart} isDragging={draggedDealId === deal.id} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function DealCard({
  deal,
  companies,
  onDragStart,
  isDragging,
}: {
  deal: DealResponse;
  companies: { id: string; name: string }[];
  onDragStart: (e: React.DragEvent, dealId: string) => void;
  isDragging: boolean;
}) {
  const { formatCurrency, formatDate } = useFormatters();
  const company = companies.find((c) => c.id === deal.company_id);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, deal.id)}
      className={`group cursor-grab rounded-xl border bg-slate-800/80 p-3.5 shadow-sm transition-all hover:border-forge-500/40 hover:bg-slate-800 hover:shadow-md active:cursor-grabbing ${
        isDragging ? 'opacity-40 border-forge-500/50' : 'border-slate-700/60'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link
          href={`/deals/${deal.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-sm font-semibold text-slate-100 hover:text-forge-300 transition-colors line-clamp-2 flex-1"
        >
          {deal.name}
        </Link>
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase flex-shrink-0 ${
          deal.status === 'Won'
            ? 'bg-emerald-500/20 text-emerald-400'
            : deal.status === 'Lost'
              ? 'bg-rose-500/20 text-rose-400'
              : 'bg-forge-500/20 text-forge-400'
        }`}>
          {deal.status}
        </span>
      </div>

      {company && (
        <p className="text-xs text-slate-500 mb-2.5 truncate">{company.name}</p>
      )}

      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-white text-sm">
          {formatCurrency(deal.value || 0)}
        </span>
        {deal.expected_close_date && (
          <span className="text-slate-500">
            {formatDate(deal.expected_close_date)}
          </span>
        )}
      </div>

      {deal.probability !== undefined && deal.probability !== null && (
        <div className="mt-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-600">Probability</span>
            <span className="text-xs font-semibold text-slate-400">{deal.probability}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-forge-600 to-indigo-500 transition-all"
              style={{ width: `${deal.probability}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
