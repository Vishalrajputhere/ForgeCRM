'use client';

import { FileSpreadsheet } from 'lucide-react';
import { useCRM } from '@/hooks/use-crm';
import { Badge, Skeleton } from '@/components/ui/primitives';

export default function ImportHistoryPage(): React.JSX.Element {
  const { importHistory, isLoadingImportHistory } = useCRM();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <h1 className="text-h1 font-bold text-text-primary flex items-center gap-2.5">
            <FileSpreadsheet className="h-6 w-6 text-forge-400" /> Data Import History Log
          </h1>
          <p className="text-caption text-text-tertiary mt-1">Audit log of all CSV and Excel data import operations across the workspace.</p>
        </div>
      </div>

      {isLoadingImportHistory ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : importHistory.length === 0 ? (
        <div className="rounded-xl border p-12 text-center space-y-3" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-raised)' }}>
          <FileSpreadsheet className="h-10 w-10 text-text-tertiary mx-auto opacity-50" />
          <h3 className="text-h3 font-semibold text-text-primary">No Imports Executed Yet</h3>
          <p className="text-caption text-text-tertiary max-w-sm mx-auto">
            When users import Companies, Contacts, Leads, or Deals via CSV/Excel, execution logs will appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden shadow-xs" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-raised)' }}>
          <table className="w-full text-left text-label">
            <thead className="bg-surface-sunken border-b text-caption font-semibold text-text-secondary" style={{ borderColor: 'var(--border-subtle)' }}>
              <tr>
                <th className="p-3.5">Filename & Entity</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Total Rows</th>
                <th className="p-3.5">Imported</th>
                <th className="p-3.5">Skipped / Errors</th>
                <th className="p-3.5">Duration</th>
                <th className="p-3.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {importHistory.map((item) => (
                <tr key={item.id} className="hover:bg-surface-sunken/50 transition-colors">
                  <td className="p-3.5">
                    <p className="font-semibold text-text-primary">{item.filename}</p>
                    <span className="text-micro text-text-tertiary">{item.entity_type}</span>
                  </td>
                  <td className="p-3.5">
                    <Badge variant={item.status === 'Completed' ? 'success' : item.status === 'Partial' ? 'warning' : 'danger'}>
                      {item.status}
                    </Badge>
                  </td>
                  <td className="p-3.5 tabular text-text-primary font-medium">{item.total_rows}</td>
                  <td className="p-3.5 tabular text-emerald-400 font-semibold">{item.imported_rows}</td>
                  <td className="p-3.5 tabular text-amber-400 font-medium">
                    {item.skipped_rows} / {item.error_rows}
                  </td>
                  <td className="p-3.5 text-text-tertiary font-mono">{item.duration_seconds}s</td>
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
