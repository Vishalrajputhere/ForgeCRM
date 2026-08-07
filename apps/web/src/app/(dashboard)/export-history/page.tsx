'use client';

import { Download } from 'lucide-react';
import { useCRM } from '@/hooks/use-crm';
import { Badge, Skeleton } from '@/components/ui/primitives';

export default function ExportHistoryPage(): React.JSX.Element {
  const { exportHistory, isLoadingExportHistory } = useCRM();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <h1 className="text-h1 font-bold text-text-primary flex items-center gap-2.5">
            <Download className="h-6 w-6 text-sky-400" /> Dataset Export History Log
          </h1>
          <p className="text-caption text-text-tertiary mt-1">Audit log of all CSV and Excel dataset exports generated across the workspace.</p>
        </div>
      </div>

      {isLoadingExportHistory ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : exportHistory.length === 0 ? (
        <div className="rounded-xl border p-12 text-center space-y-3" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-raised)' }}>
          <Download className="h-10 w-10 text-text-tertiary mx-auto opacity-50" />
          <h3 className="text-h3 font-semibold text-text-primary">No Dataset Exports Generated Yet</h3>
          <p className="text-caption text-text-tertiary max-w-sm mx-auto">
            When users export records from Companies, Contacts, Leads, or Deals, download logs will appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden shadow-xs" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-raised)' }}>
          <table className="w-full text-left text-label">
            <thead className="bg-surface-sunken border-b text-caption font-semibold text-text-secondary" style={{ borderColor: 'var(--border-subtle)' }}>
              <tr>
                <th className="p-3.5">Entity & Scope</th>
                <th className="p-3.5">Format</th>
                <th className="p-3.5">Total Records</th>
                <th className="p-3.5">Exported Date</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {exportHistory.map((item) => (
                <tr key={item.id} className="hover:bg-surface-sunken/50 transition-colors">
                  <td className="p-3.5">
                    <p className="font-semibold text-text-primary">{item.entity_type}s Dataset</p>
                    <span className="text-micro text-text-tertiary capitalize">Scope: {item.filter_scope}</span>
                  </td>
                  <td className="p-3.5">
                    <Badge variant="info" className="uppercase font-mono">
                      {item.export_format}
                    </Badge>
                  </td>
                  <td className="p-3.5 tabular text-text-primary font-medium">{item.total_records}</td>
                  <td className="p-3.5 text-caption text-text-tertiary">
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
