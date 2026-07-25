'use client';

import { useState } from 'react';

import { useCRM } from '@/hooks/use-crm';
import type { DealResponse, PipelineResponse, StageResponse } from '@/types';

interface KanbanBoardProps {
  pipeline: PipelineResponse;
  deals: DealResponse[];
}

export function KanbanBoard({ pipeline, deals }: KanbanBoardProps): React.JSX.Element {
  const { moveDealStage } = useCRM();
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setDraggedDealId(dealId);
    e.dataTransfer.setData('text/plain', dealId);
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain') || draggedDealId;
    if (!dealId) return;

    try {
      await moveDealStage({ dealId, payload: { stage_id: stageId } });
    } catch (err) {
      console.error('Failed to move stage:', err);
    } finally {
      setDraggedDealId(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex w-full gap-4 overflow-x-auto pb-4 pt-2">
      {pipeline.stages.map((stage: StageResponse) => {
        const stageDeals = deals.filter((d) => d.stage_id === stage.id);
        const stageTotal = stageDeals.reduce((sum, d) => sum + d.value, 0);

        return (
          <div
            key={stage.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
            className="flex h-full w-80 shrink-0 flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-3 backdrop-blur-xl"
          >
            {/* Stage Header */}
            <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: stage.color || '#3B82F6' }}
                />
                <h3 className="text-sm font-semibold text-white">{stage.name}</h3>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                  {stageDeals.length}
                </span>
              </div>
              <span className="text-xs font-medium text-slate-400">
                ${stageTotal.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </span>
            </div>

            {/* Stage Column Dropzone */}
            <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto min-h-[400px]">
              {stageDeals.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-800/80 p-4 text-center text-xs text-slate-600">
                  Drag deal here
                </div>
              ) : (
                stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal.id)}
                    className="group cursor-grab rounded-lg border border-slate-800 bg-slate-800/70 p-3.5 shadow-sm transition-all hover:border-forge-500/50 hover:bg-slate-800 hover:shadow-md active:cursor-grabbing"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium text-slate-100 group-hover:text-forge-400">
                        {deal.name}
                      </h4>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                          deal.status === 'Won'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : deal.status === 'Lost'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-forge-500/20 text-forge-400'
                        }`}
                      >
                        {deal.status}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-white">
                        ${deal.value.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                      </span>
                      {deal.expected_close_date && (
                        <span>Close: {deal.expected_close_date}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
