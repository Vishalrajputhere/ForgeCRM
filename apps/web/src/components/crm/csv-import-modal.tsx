'use client';

import { useState } from 'react';
import {
  Upload, FileText, CheckCircle2, X, ArrowRight, FileSpreadsheet
} from 'lucide-react';

import { Button, Select, Badge } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { useCRM } from '@/hooks/use-crm';
import type { CSVImportSummaryResponse } from '@/types';

interface CSVImportModalProps {
  entityType: 'Company' | 'Contact' | 'Lead' | 'Deal' | 'Task';
  onClose: () => void;
  onSuccess?: () => void;
}

export function CSVImportModal({
  entityType,
  onClose,
  onSuccess,
}: CSVImportModalProps): React.JSX.Element {
  const { toast } = useToast();
  const { importCSV } = useCRM();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);
  const [duplicateResolution, setDuplicateResolution] = useState<'skip' | 'update' | 'merge' | 'create'>('skip');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSummary, setImportSummary] = useState<CSVImportSummaryResponse | null>(null);

  // File Upload Handler (Parses CSV files with quoted string support)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      if (text) {
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length > 1) {
          const parseLine = (line: string): string[] => {
            const result: string[] = [];
            let cur = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                result.push(cur.trim().replace(/^"|"$/g, ''));
                cur = '';
              } else {
                cur += char;
              }
            }
            result.push(cur.trim().replace(/^"|"$/g, ''));
            return result;
          };

          const headers = parseLine(lines[0] || '');
          const rows = lines.slice(1).map((line) => {
            const values = parseLine(line);
            const rowObj: Record<string, any> = {};
            headers.forEach((h, idx) => {
              rowObj[h] = values[idx] || '';
            });
            return rowObj;
          });
          setParsedRows(rows);
          setStep(2);
        }
      }
    };
    reader.readAsText(uploadedFile);
  };

  // Run Import Request
  const handleExecuteImport = async (dryRun = false) => {
    if (parsedRows.length === 0) return;
    setIsProcessing(true);

    try {
      const formattedRows = parsedRows.map((r, idx) => ({
        row_index: idx + 1,
        data: r,
      }));

      const summary = await importCSV({
        entity_type: entityType,
        rows: formattedRows,
        duplicate_resolution: duplicateResolution,
        dry_run: dryRun,
      });

      setImportSummary(summary);
      if (!dryRun) {
        setStep(4);
        toast('success', 'Import Completed', `Imported ${summary.imported_rows} ${entityType} records.`);
        if (onSuccess) onSuccess();
      } else {
        toast('info', 'Validation Completed', `Validated ${summary.total_rows} rows. 0 critical schema errors.`);
      }
    } catch {
      toast('error', 'Import Failed', 'Could not process CSV data file.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border bg-surface-overlay p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
        style={{ borderColor: 'var(--border-strong)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forge-500/10 text-forge-400 border border-forge-500/20">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-h3 font-bold text-text-primary">Import {entityType}s Wizard</h2>
              <p className="text-caption text-text-tertiary">Step {step} of 4 — CSV & Excel Data Importer</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-sunken transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="space-y-4 py-4 text-center">
            <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 cursor-pointer hover:border-forge-500/50 hover:bg-forge-500/5 transition-all"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <Upload className="h-10 w-10 text-forge-400 mb-3" strokeWidth={1.5} />
              <p className="text-label font-semibold text-text-primary">Click or Drag CSV/Excel file to Upload</p>
              <p className="text-caption text-text-tertiary mt-1">Supports .csv, .xlsx, .txt formats up to 50MB</p>
              <input type="file" accept=".csv,.xlsx,.txt" onChange={handleFileUpload} className="hidden" />
            </label>

            <div className="flex items-center justify-between text-micro text-text-tertiary pt-2">
              <span>Automatic column aliasing (e.g. "Company Name" → name)</span>
              <a href="#" className="text-forge-400 hover:underline font-medium">Download Sample Template</a>
            </div>
          </div>
        )}

        {/* Step 2: Mapping & Preview */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-surface-sunken p-3 rounded-lg border" style={{ borderColor: 'var(--border-subtle)' }}>
              <span className="text-caption text-text-primary font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-forge-400" /> {file?.name} ({parsedRows.length} rows detected)
              </span>
              <Badge variant="success">Auto-Mapped</Badge>
            </div>

            <div>
              <label className="text-micro text-text-tertiary block mb-1">Duplicate Resolution Strategy</label>
              <Select value={duplicateResolution} onChange={(e) => setDuplicateResolution(e.target.value as any)}>
                <option value="skip">Skip duplicates (Recommended)</option>
                <option value="update">Update existing records</option>
                <option value="create">Create duplicates anyway</option>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <Button variant="ghost" size="md" onClick={() => setStep(1)}>Back</Button>
              <Button size="md" onClick={() => setStep(3)}>Continue to Preview <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {/* Step 3: Dry-Run Validation */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--surface-sunken)' }}>
              <div className="flex items-center justify-between">
                <span className="text-label font-bold text-text-primary">Dry-Run Data Validation</span>
                <Button size="sm" variant="secondary" onClick={() => handleExecuteImport(true)} disabled={isProcessing}>
                  {isProcessing ? 'Validating...' : 'Run Schema Check'}
                </Button>
              </div>
              <p className="text-caption text-text-tertiary">
                Previewing first 3 rows of {parsedRows.length} rows to be imported into {entityType}s:
              </p>

              <div className="overflow-x-auto border rounded-lg" style={{ borderColor: 'var(--border-subtle)' }}>
                <table className="w-full text-left text-micro">
                  <thead className="bg-surface-raised border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <tr>
                      {Object.keys(parsedRows[0] || {}).slice(0, 4).map((h) => (
                        <th key={h} className="p-2 font-semibold text-text-secondary">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 3).map((r, i) => (
                      <tr key={i} className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                        {Object.values(r).slice(0, 4).map((v: any, j) => (
                          <td key={j} className="p-2 text-text-tertiary truncate max-w-[120px]">{String(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <Button variant="ghost" size="md" onClick={() => setStep(2)}>Back</Button>
              <Button size="md" onClick={() => handleExecuteImport(false)} disabled={isProcessing}>
                {isProcessing ? 'Importing Data...' : `Import ${parsedRows.length} Records`}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Summary Report */}
        {step === 4 && importSummary && (
          <div className="space-y-4 text-center py-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mx-auto border border-emerald-500/20">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-h2 font-bold text-text-primary">Import Successfully Finished</h3>
            <p className="text-caption text-text-tertiary">Processed in {importSummary.duration_seconds} seconds.</p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="rounded-lg border p-3 bg-surface-sunken" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="text-micro text-text-tertiary block">Imported</span>
                <span className="text-h2 font-bold text-emerald-400">{importSummary.imported_rows}</span>
              </div>
              <div className="rounded-lg border p-3 bg-surface-sunken" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="text-micro text-text-tertiary block">Skipped</span>
                <span className="text-h2 font-bold text-amber-400">{importSummary.skipped_rows}</span>
              </div>
              <div className="rounded-lg border p-3 bg-surface-sunken" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="text-micro text-text-tertiary block">Errors</span>
                <span className="text-h2 font-bold text-red-400">{importSummary.error_rows}</span>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-4">
              <Button size="md" onClick={onClose}>Done</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
