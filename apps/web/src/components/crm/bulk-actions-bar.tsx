'use client';

import {
  X, UserCheck, Download, Trash2, Archive, ArrowRightLeft,
  CheckCircle2, Layers
} from 'lucide-react';

import { Button, Badge } from '@/components/ui/primitives';

interface BulkActionsBarProps {
  entityType: 'Company' | 'Contact' | 'Lead' | 'Deal' | 'Task' | 'Storage';
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete?: () => void;
  onBulkArchive?: () => void;
  onBulkAssignOwner?: () => void;
  onBulkUpdateStatus?: () => void;
  onBulkMoveStage?: () => void;
  onBulkExport?: () => void;
}

export function BulkActionsBar({
  entityType,
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkArchive,
  onBulkAssignOwner,
  onBulkUpdateStatus,
  onBulkMoveStage,
  onBulkExport,
}: BulkActionsBarProps): React.JSX.Element | null {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-center justify-between gap-3 rounded-2xl border p-3 shadow-2xl backdrop-blur-xl bg-surface-overlay/90"
        style={{ borderColor: 'var(--border-strong)', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.7)' }}
      >
        <div className="flex items-center gap-2.5">
          <Badge variant="warning" className="text-label font-bold px-2.5 py-1 tabular flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" /> {selectedCount} Selected
          </Badge>
          <span className="text-caption text-text-tertiary hidden sm:inline">
            {entityType}s
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {onBulkAssignOwner && (
            <Button size="sm" variant="ghost" onClick={onBulkAssignOwner} title="Assign Owner">
              <UserCheck className="h-3.5 w-3.5 text-forge-400" /> <span className="hidden sm:inline">Assign</span>
            </Button>
          )}

          {onBulkUpdateStatus && (
            <Button size="sm" variant="ghost" onClick={onBulkUpdateStatus} title="Change Status">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> <span className="hidden sm:inline">Status</span>
            </Button>
          )}

          {entityType === 'Deal' && onBulkMoveStage && (
            <Button size="sm" variant="ghost" onClick={onBulkMoveStage} title="Move Pipeline Stage">
              <ArrowRightLeft className="h-3.5 w-3.5 text-purple-400" /> <span className="hidden sm:inline">Stage</span>
            </Button>
          )}

          {onBulkExport && (
            <Button size="sm" variant="ghost" onClick={onBulkExport} title="Export CSV/Excel">
              <Download className="h-3.5 w-3.5 text-sky-400" /> <span className="hidden sm:inline">Export</span>
            </Button>
          )}

          {onBulkArchive && (
            <Button size="sm" variant="ghost" onClick={onBulkArchive} className="text-amber-400 hover:text-amber-300" title="Archive Records">
              <Archive className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Archive</span>
            </Button>
          )}

          {onBulkDelete && (
            <Button size="sm" variant="ghost" onClick={onBulkDelete} className="text-red-400 hover:text-red-300" title="Delete Records">
              <Trash2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Delete</span>
            </Button>
          )}

          <div className="h-4 w-px bg-border-subtle mx-1" />

          <button
            type="button"
            onClick={onClearSelection}
            className="rounded-full p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-sunken transition-colors"
            title="Clear Selection (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
