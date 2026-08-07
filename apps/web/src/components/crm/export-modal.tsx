'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, X } from 'lucide-react';

import { Button, Select } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { useCRM } from '@/hooks/use-crm';

interface ExportModalProps {
  entityType: 'Company' | 'Contact' | 'Lead' | 'Deal' | 'Task' | 'Storage';
  selectedIds?: string[];
  onClose: () => void;
}

export function ExportModal({
  entityType,
  selectedIds = [],
  onClose,
}: ExportModalProps): React.JSX.Element {
  const { toast } = useToast();
  const { exportDataset } = useCRM();

  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');
  const [scope, setScope] = useState<'selected' | 'workspace'>(selectedIds.length > 0 ? 'selected' : 'workspace');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await exportDataset({
        entity_type: entityType,
        format,
        scope,
        selected_ids: scope === 'selected' ? selectedIds : [],
      });

      const mimeType = format === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv';

      const downloadUrl = window.URL.createObjectURL(new Blob([blob], { type: mimeType }));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${entityType.toLowerCase()}_export.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast('success', 'Export Complete', `Exported ${entityType}s dataset to ${format.toUpperCase()}.`);
      onClose();
    } catch {
      toast('error', 'Export Failed', 'Could not generate dataset export.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border bg-surface-overlay p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
        style={{ borderColor: 'var(--border-strong)' }}
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
          <h3 className="text-h3 font-bold text-text-primary flex items-center gap-2">
            <Download className="h-5 w-5 text-forge-400" /> Export {entityType}s Dataset
          </h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-sunken">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-micro text-text-tertiary block mb-1.5">Export Scope</label>
            <Select value={scope} onChange={(e) => setScope(e.target.value as any)}>
              {selectedIds.length > 0 && (
                <option value="selected">Selected Records ({selectedIds.length})</option>
              )}
              <option value="workspace">Entire Workspace Dataset</option>
            </Select>
          </div>

          <div>
            <label className="text-micro text-text-tertiary block mb-1.5">File Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-label font-medium transition-all ${
                  format === 'csv'
                    ? 'border-forge-500 bg-forge-500/10 text-forge-400 font-semibold'
                    : 'border-border-default text-text-secondary hover:text-text-primary'
                }`}
              >
                <FileText className="h-4 w-4" /> CSV Format
              </button>
              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-label font-medium transition-all ${
                  format === 'xlsx'
                    ? 'border-forge-500 bg-forge-500/10 text-forge-400 font-semibold'
                    : 'border-border-default text-text-secondary hover:text-text-primary'
                }`}
              >
                <FileSpreadsheet className="h-4 w-4" /> Excel (.xlsx)
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <Button variant="ghost" size="md" onClick={onClose}>Cancel</Button>
          <Button size="md" onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Generating...' : `Export ${format.toUpperCase()}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
