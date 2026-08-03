'use client';

import Link from 'next/link';
import { useState } from 'react';

import { useCRM } from '@/hooks/use-crm';
import { useFormatters } from '@/hooks/use-formatters';
import { Badge } from '@/components/ui/primitives';
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
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-label text-text-tertiary"
        style={{ borderColor: 'var(--border-default)' }}
      >
        No sales stages configured for this pipeline.
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
    if (deal?.stage_id === stageId) {
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

  const totalPipelineValue = deals.reduce((sum, d) => sum + (d.value ?? 0), 0);

  return (
    <div className="space-y-3">
      {/* Pipeline summary */}
      <div className="flex items-center gap-5 rounded-lg border px-4 py-2.5"
        style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-raised)' }}
      >
        <div>
          <p className="text-caption text-text-tertiary">Total pipeline</p>
          <p className="text-h3 tabular text-text-primary">{formatCurrency(totalPipelineValue)}</p>
        </div>
        <div className="h-6 w-px" style={{ backgroundColor: 'var(--border-subtle)' }} />
        <div>
          <p className="text-caption text-text-tertiary">Open deals</p>
          <p className="text-h3 tabular text-text-primary">{deals.filter((d) => d.status === 'Open').length}</p>
        </div>
        <div className="h-6 w-px" style={{ backgroundColor: 'var(--border-subtle)' }} />
        <div>
          <p className="text-caption text-text-tertiary">Stages</p>
          <p className="text-h3 tabular text-text-primary">{pipeline.stages.length}</p>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex w-full gap-3 overflow-x-auto pb-4 min-h-[480px]">
        {pipeline.stages
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((stage: StageResponse) => {
            const stageDeals = deals.filter(
              (d) => d.stage_id === stage.id && d.status !== 'Cancelled'
            );
            const stageTotal = stageDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);
            const isDropTarget = dragOverStageId === stage.id;

            return (
              <div
                key={stage.id}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={() => setDragOverStageId(null)}
                onDrop={(e) => handleDrop(e, stage.id)}
                className="flex h-full w-64 shrink-0 flex-col rounded-lg border transition-all duration-150"
                style={{
                  borderColor: isDropTarget ? 'rgba(251,191,36,0.4)' : 'var(--border-default)',
                  backgroundColor: isDropTarget ? 'rgba(251,191,36,0.04)' : 'var(--surface-raised)',
                }}
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between border-b px-3 py-2.5"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: stage.color ?? '#6366f1' }}
                    />
                    <span className="text-label text-text-primary">{stage.name}</span>
                    <span className="text-micro px-1.5 py-0.5 rounded-sm tabular"
                      style={{ backgroundColor: 'var(--surface-overlay)', color: 'var(--text-tertiary)' }}
                    >
                      {stageDeals.length}
                    </span>
                  </div>
                  <span className="text-caption tabular text-text-tertiary">
                    {formatCurrency(stageTotal)}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2 min-h-[400px]">
                  {stageDeals.length === 0 ? (
                    <div className={`flex flex-1 items-center justify-center rounded-md border border-dashed p-4 text-center text-caption transition-colors ${
                      isDropTarget ? 'border-forge-500/40 text-forge-400' : 'text-text-tertiary'
                    }`}
                      style={isDropTarget ? {} : { borderColor: 'var(--border-subtle)' }}
                    >
                      {isDropTarget ? 'Drop here' : 'No deals'}
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        companies={companies}
                        onDragStart={handleDragStart}
                        isDragging={draggedDealId === deal.id}
                      />
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

  const statusVariant = deal.status === 'Won' ? 'success' : deal.status === 'Lost' ? 'danger' : 'default';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, deal.id)}
      className="group cursor-grab rounded-md border p-3 transition-all duration-100 active:cursor-grabbing"
      style={{
        borderColor: isDragging ? 'rgba(251,191,36,0.4)' : 'var(--border-default)',
        backgroundColor: 'var(--surface-overlay)',
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <Link
          href={`/deals/${deal.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-label text-text-primary hover:text-forge-400 transition-colors duration-100 line-clamp-2 flex-1"
        >
          {deal.name}
        </Link>
        <Badge variant={statusVariant}>{deal.status}</Badge>
      </div>

      {company && (
        <p className="text-caption text-text-tertiary mb-2 truncate">{company.name}</p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-label tabular font-semibold text-text-primary">
          {formatCurrency(deal.value ?? 0)}
        </span>
        {deal.expected_close_date && (
          <span className="text-caption text-text-tertiary">
            {formatDate(deal.expected_close_date)}
          </span>
        )}
      </div>

      {deal.probability !== undefined && deal.probability !== null && (
        <div className="mt-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-caption text-text-tertiary">Probability</span>
            <span className="text-caption tabular text-text-secondary">{deal.probability}%</span>
          </div>
          <div className="h-1 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-default)' }}>
            <div
              className="h-full rounded-full bg-forge-500 transition-all"
              style={{ width: `${deal.probability}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
