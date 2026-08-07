'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Folder, FolderOpen, FileText, Image as ImageIcon, FileCode, FileArchive,
  Download, Trash2, Search, UploadCloud, X, Eye, File, HardDrive,
  AlertCircle, ShieldAlert, RefreshCw, CheckCircle2, RotateCcw
} from 'lucide-react';

import { Heading, Text, Metric, Caption } from '@/components/ui/typography';
import { Container, Stack, PageHeader, PageActions, Grid } from '@/components/ui/layout-primitives';
import { useToast } from '@/components/ui/toast';
import { useStorage } from '@/hooks/use-storage';
import { useFormatters } from '@/hooks/use-formatters';
import { Button, Select, Skeleton, Badge, FormField } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import type { DocumentAttachmentResponse } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface UploadTask {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error' | 'cancelled';
  error?: string;
  cancelController?: AbortController;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function isImageFile(mimeType?: string, fileName?: string): boolean {
  if (mimeType && mimeType.toLowerCase().startsWith('image/')) return true;
  if (fileName && fileName.match(/\.(jpg|jpeg|png|webp|gif|svg|avif|bmp|tiff|heic|ico)$/i)) return true;
  return false;
}

function isPdfFile(mimeType?: string, fileName?: string): boolean {
  if (mimeType && mimeType.toLowerCase() === 'application/pdf') return true;
  if (fileName && fileName.toLowerCase().endsWith('.pdf')) return true;
  return false;
}

function getFileCategory(mimeType: string, fileName: string): 'Image' | 'PDF' | 'Document' | 'Archive' | 'Other' {
  if (isImageFile(mimeType, fileName)) return 'Image';
  if (isPdfFile(mimeType, fileName)) return 'PDF';
  if (mimeType.toLowerCase().includes('word') || mimeType.toLowerCase().includes('excel') || mimeType.toLowerCase().includes('spreadsheet') || fileName.match(/\.(doc|docx|xls|xlsx|csv|txt|md)$/i)) return 'Document';
  if (mimeType.toLowerCase().includes('zip') || mimeType.toLowerCase().includes('compressed') || fileName.match(/\.(zip|tar|gz|7z|rar)$/i)) return 'Archive';
  return 'Other';
}

function getFileIcon(mimeType: string, fileName: string) {
  const cat = getFileCategory(mimeType, fileName);
  switch (cat) {
    case 'Image': return <ImageIcon className="h-4 w-4 text-emerald-400" strokeWidth={1.5} />;
    case 'PDF': return <FileText className="h-4 w-4 text-rose-400" strokeWidth={1.5} />;
    case 'Document': return <FileCode className="h-4 w-4 text-sky-400" strokeWidth={1.5} />;
    case 'Archive': return <FileArchive className="h-4 w-4 text-amber-400" strokeWidth={1.5} />;
    default: return <File className="h-4 w-4 text-text-tertiary" strokeWidth={1.5} />;
  }
}

// ── Virtual Folders ───────────────────────────────────────────────────────────

const VIRTUAL_FOLDERS = [
  { id: 'all', name: 'All Files', entityType: undefined },
  { id: 'Company', name: 'Companies', entityType: 'Company' },
  { id: 'Contact', name: 'Contacts', entityType: 'Contact' },
  { id: 'Deal', name: 'Deals', entityType: 'Deal' },
  { id: 'Lead', name: 'Leads', entityType: 'Lead' },
  { id: 'Task', name: 'Tasks', entityType: 'Task' },
];

// ── Main Component ────────────────────────────────────────────────────────────

export default function StorageManagerPage(): React.JSX.Element {
  const { toast } = useToast();
  const { formatDate } = useFormatters();
  const {
    requestUploadUrl, confirmUpload, getDownloadUrl, deleteAttachment,
    isDeletingAttachment, useAllAttachments,
  } = useStorage();

  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const targetEntityType = activeFolder === 'all' ? undefined : activeFolder;
  const { data: attachments = [], isLoading, error, refetch } = useAllAttachments({
    entityType: targetEntityType,
    search: search || undefined,
  });

  // Selected file for preview / detail view
  const [previewAttachment, setPreviewAttachment] = useState<DocumentAttachmentResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Multi-file upload state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadEntityType, setUploadEntityType] = useState<string>('Company');
  const uploadEntityId = '00000000-0000-0000-0000-000000000000';
  const [uploadQueue, setUploadQueue] = useState<UploadTask[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<DocumentAttachmentResponse | null>(null);

  // ESC key listener to close active modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewAttachment(null);
        setPreviewUrl(null);
        setIsUploadOpen(false);
        setDeleteTarget(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter attachments by type
  const filteredAttachments = attachments.filter((att) => {
    if (typeFilter === 'all') return true;
    return getFileCategory(att.mime_type, att.file_name) === typeFilter;
  });

  // Statistics
  const totalBytes = attachments.reduce((acc, curr) => acc + curr.file_size, 0);
  const recentUploads = [...attachments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4);

  // Download handler
  const handleDownload = async (attachment: DocumentAttachmentResponse) => {
    try {
      const res = await getDownloadUrl(attachment.id);
      window.open(res.download_url, '_blank');
      toast('success', 'Download started', attachment.file_name);
    } catch {
      toast('error', 'Download failed', 'Could not generate download link.');
    }
  };

  // Preview handler
  const handlePreview = async (attachment: DocumentAttachmentResponse) => {
    setPreviewAttachment(attachment);
    setIsLoadingPreview(true);
    setPreviewUrl(null);
    try {
      const res = await getDownloadUrl(attachment.id);
      setPreviewUrl(res.download_url);
    } catch {
      toast('error', 'Preview failed', 'Could not load file preview.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAttachment(deleteTarget.id);
      toast('success', 'File deleted', deleteTarget.file_name);
      setDeleteTarget(null);
      if (previewAttachment?.id === deleteTarget.id) {
        setPreviewAttachment(null);
        setPreviewUrl(null);
      }
    } catch {
      toast('error', 'Delete failed', 'Could not delete file attachment.');
    }
  };

  // Upload single file task to Cloudinary
  const uploadSingleTask = async (task: UploadTask) => {
    if (task.file.size > 25 * 1024 * 1024) {
      setUploadQueue((prev) => prev.map((t) => t.id === task.id ? { ...t, status: 'error', error: 'File size exceeds 25 MB limit.' } : t));
      return;
    }

    const abortController = new AbortController();
    setUploadQueue((prev) => prev.map((t) => t.id === task.id ? { ...t, status: 'uploading', progress: 15, cancelController: abortController } : t));

    try {
      // 1. Get Cloudinary signed parameters from backend API
      const presigned = await requestUploadUrl({
        entity_type: uploadEntityType,
        entity_id: uploadEntityId,
        file_name: task.file.name,
        file_size: task.file.size,
        mime_type: task.file.type || 'application/octet-stream',
      });

      setUploadQueue((prev) => prev.map((t) => t.id === task.id ? { ...t, progress: 45 } : t));

      // 2. Direct upload to Cloudinary API using signed parameters (if available)
      if (presigned.signature && presigned.api_key && presigned.timestamp) {
        const formData = new FormData();
        formData.append('file', task.file);
        formData.append('api_key', presigned.api_key);
        formData.append('timestamp', String(presigned.timestamp));
        formData.append('signature', presigned.signature);
        if (presigned.folder) formData.append('folder', presigned.folder);
        if (presigned.public_id) formData.append('public_id', presigned.public_id);

        try {
          const cloudRes = await fetch(presigned.upload_url, {
            method: 'POST',
            body: formData,
            signal: abortController.signal,
          });
          if (!cloudRes.ok) {
            console.warn('Direct Cloudinary upload returned non-200, confirming fallback storage key');
          }
        } catch (e) {
          if (e instanceof Error && e.name === 'AbortError') {
            setUploadQueue((prev) => prev.map((t) => t.id === task.id ? { ...t, status: 'cancelled', error: 'Upload cancelled by user.' } : t));
            return;
          }
        }
      }

      setUploadQueue((prev) => prev.map((t) => t.id === task.id ? { ...t, progress: 85 } : t));

      // 3. Confirm upload metadata with backend DB
      await confirmUpload({
        storage_key: presigned.storage_key,
        entity_type: uploadEntityType,
        entity_id: uploadEntityId,
        file_name: task.file.name,
        file_size: task.file.size,
        mime_type: task.file.type || 'application/octet-stream',
      });

      setUploadQueue((prev) => prev.map((t) => t.id === task.id ? { ...t, status: 'completed', progress: 100 } : t));
      toast('success', 'File uploaded to Cloudinary', task.file.name);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setUploadQueue((prev) => prev.map((t) => t.id === task.id ? { ...t, status: 'error', error: msg } : t));
      toast('error', 'Upload failed', task.file.name);
    }
  };

  // Multi-file selection handler
  const handleFilesAdded = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newTasks: UploadTask[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      progress: 0,
      status: 'pending',
    }));

    setUploadQueue((prev) => [...prev, ...newTasks]);
    newTasks.forEach((task) => uploadSingleTask(task));
  };

  // Cancel task handler
  const handleCancelTask = (taskId: string) => {
    setUploadQueue((prev) => prev.map((t) => {
      if (t.id === taskId) {
        if (t.cancelController) t.cancelController.abort();
        return { ...t, status: 'cancelled', error: 'Upload cancelled.' };
      }
      return t;
    }));
  };

  // Retry task handler
  const handleRetryTask = (task: UploadTask) => {
    uploadSingleTask(task);
  };

  return (
    <Container size="xl" className="py-6">
      <Stack gap={5}>
        {/* Header */}
        <PageHeader>
          <div>
            <Heading level="h1">Storage Manager</Heading>
            <Text variant="body-m" color="secondary" tabular className="mt-0.5">
              {isLoading ? 'Loading Cloudinary workspace files…' : `${attachments.length} files stored · ${formatBytes(totalBytes)} used`}
            </Text>
          </div>
          <PageActions>
            <Button onClick={() => refetch()} variant="secondary" size="md" title="Refresh file list">
              <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
            </Button>
            <Button onClick={() => setIsUploadOpen(true)} size="md">
              <UploadCloud className="h-4 w-4" strokeWidth={2} />
              Upload File
            </Button>
          </PageActions>
        </PageHeader>

        {/* Storage Summary Widgets */}
        <Grid cols={{ mobile: 2, desktop: 4 }} gap={3}>
          {[
            { label: 'Total Files', value: String(attachments.length), icon: <File className="h-4 w-4 text-accent" /> },
            { label: 'Total Storage', value: formatBytes(totalBytes), icon: <HardDrive className="h-4 w-4 text-status-info-fg" /> },
            { label: 'Images', value: String(attachments.filter(a => getFileCategory(a.mime_type, a.file_name) === 'Image').length), icon: <ImageIcon className="h-4 w-4 text-status-success-fg" /> },
            { label: 'PDFs & Docs', value: String(attachments.filter(a => ['PDF', 'Document'].includes(getFileCategory(a.mime_type, a.file_name))).length), icon: <FileText className="h-4 w-4 text-status-danger-fg" /> },
          ].map((widget) => (
            <div
              key={widget.label}
              className="rounded-lg border border-border-default bg-surface p-4 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <Caption color="muted">{widget.label}</Caption>
                {widget.icon}
              </div>
              <Metric value={widget.value} size="md" className="mt-1" />
            </div>
          ))}
        </Grid>

      {/* Explorer Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Virtual Folder Sidebar */}
        <div className="space-y-1">
          <p className="text-micro font-medium uppercase tracking-wider text-text-tertiary px-3 mb-2">Folders</p>
          {VIRTUAL_FOLDERS.map((folder) => {
            const isActive = activeFolder === folder.id;
            const count = folder.id === 'all'
              ? attachments.length
              : attachments.filter((a) => a.entity_type === folder.entityType).length;

            return (
              <button
                key={folder.id}
                onClick={() => setActiveFolder(folder.id)}
                className={cn(
                  'w-full flex items-center justify-between rounded-md px-3 py-2 text-label transition-colors duration-100',
                  isActive
                    ? 'border border-forge-500/30 bg-forge-500/10 text-forge-400 font-medium'
                    : 'text-text-secondary hover:text-text-primary hover:bg-[rgba(255,255,255,0.03)]',
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isActive ? (
                    <FolderOpen className="h-4 w-4 text-forge-400 shrink-0" strokeWidth={1.5} />
                  ) : (
                    <Folder className="h-4 w-4 text-text-tertiary shrink-0" strokeWidth={1.5} />
                  )}
                  <span className="truncate">{folder.name}</span>
                </div>
                <Badge variant={isActive ? 'warning' : 'neutral'} className="tabular shrink-0">
                  {count}
                </Badge>
              </button>
            );
          })}

          {/* Recent Uploads Widget */}
          {recentUploads.length > 0 && (
            <div className="pt-5 space-y-2">
              <p className="text-micro font-medium uppercase tracking-wider text-text-tertiary px-3">Recent Uploads</p>
              <div className="space-y-1">
                {recentUploads.map((rec) => (
                  <button
                    key={rec.id}
                    onClick={() => handlePreview(rec)}
                    className="w-full text-left rounded-md p-2 hover:bg-[rgba(255,255,255,0.03)] transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      {getFileIcon(rec.mime_type, rec.file_name)}
                      <span className="text-caption text-text-secondary group-hover:text-forge-400 truncate flex-1">
                        {rec.file_name}
                      </span>
                    </div>
                    <p className="text-micro text-text-tertiary pl-6 mt-0.5">
                      {formatBytes(rec.file_size)} · {formatDate(rec.created_at)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Files View */}
        <div className="md:col-span-3 space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center justify-between">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" strokeWidth={1.5} />
              <input
                type="text"
                placeholder="Search Cloudinary files…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border bg-surface-sunken py-2 pl-9 pr-3 text-label text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-forge-500 transition-colors"
                style={{ borderColor: 'var(--border-default)' }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-label"
              >
                <option value="all">All File Types</option>
                <option value="Image">Images</option>
                <option value="PDF">PDFs</option>
                <option value="Document">Documents</option>
                <option value="Archive">Archives</option>
                <option value="Other">Other</option>
              </Select>
            </div>
          </div>

          {/* Files Grid / Table */}
          <div className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border-default)' }}>
            {isLoading ? (
              <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-3">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-48" />
                      <Skeleton className="h-2.5 w-32" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center py-12 text-center p-6">
                <AlertCircle className="h-10 w-10 text-red-400 mb-2" strokeWidth={1.5} />
                <p className="text-label font-medium text-text-primary">Failed to load files</p>
                <p className="text-caption text-text-tertiary mt-1">Please check your connection or Cloudinary API settings.</p>
                <Button variant="secondary" size="sm" onClick={() => refetch()} className="mt-3">
                  Retry
                </Button>
              </div>
            ) : filteredAttachments.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center p-6">
                <UploadCloud className="h-12 w-12 text-text-tertiary mb-3" strokeWidth={1} />
                <p className="text-label text-text-secondary">
                  {search ? `No files match "${search}"` : 'No files in this folder'}
                </p>
                <p className="text-caption text-text-tertiary mt-1">
                  Upload attachments to Cloudinary to manage company documents, contracts, and images
                </p>
                <Button variant="secondary" size="sm" onClick={() => setIsUploadOpen(true)} className="mt-4">
                  <UploadCloud className="h-3.5 w-3.5" strokeWidth={2} />
                  Upload File
                </Button>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead style={{ backgroundColor: 'var(--surface-overlay)' }}>
                  <tr className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    {['File Name', 'Entity', 'Provider', 'Size', 'Uploaded', ''].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-micro font-medium text-text-tertiary">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAttachments.map((att) => (
                    <tr
                      key={att.id}
                      className="group border-b transition-colors duration-100 hover:bg-[rgba(255,255,255,0.02)]"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border"
                            style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-raised)' }}
                          >
                            {getFileIcon(att.mime_type, att.file_name)}
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() => handlePreview(att)}
                              className="text-label text-text-primary hover:text-forge-400 transition-colors font-medium truncate block text-left"
                            >
                              {att.file_name}
                            </button>
                            <span className="text-caption text-text-tertiary">{att.mime_type}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <Badge variant="neutral">{att.entity_type}</Badge>
                      </td>

                      <td className="px-4 py-3">
                        <Badge variant="warning">{att.storage_provider}</Badge>
                      </td>

                      <td className="px-4 py-3 text-label tabular text-text-secondary">
                        {formatBytes(att.file_size)}
                      </td>

                      <td className="px-4 py-3 text-caption text-text-tertiary tabular">
                        {formatDate(att.created_at)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handlePreview(att)}
                            className="rounded-md p-1.5 text-text-tertiary hover:text-text-primary hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                            title="Preview file"
                          >
                            <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(att)}
                            className="rounded-md p-1.5 text-text-tertiary hover:text-forge-400 hover:bg-[rgba(251,191,36,0.08)] transition-colors"
                            title="Download file"
                          >
                            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(att)}
                            className="rounded-md p-1.5 text-text-tertiary hover:text-red-400 hover:bg-[rgba(239,68,68,0.08)] transition-colors"
                            title="Delete file"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ── Multi-File Upload Modal ────────────────────────────────────────────── */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border bg-surface-overlay p-5 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <h3 className="text-h3 text-text-primary flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-forge-400" /> Upload Files to Cloudinary
              </h3>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="rounded-md p-1 text-text-tertiary hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <FormField label="Link to Entity Type" htmlFor="up_entity">
                <Select
                  id="up_entity"
                  value={uploadEntityType}
                  onChange={(e) => setUploadEntityType(e.target.value)}
                >
                  <option value="Company">Company</option>
                  <option value="Contact">Contact</option>
                  <option value="Lead">Lead</option>
                  <option value="Deal">Deal</option>
                  <option value="Task">Task</option>
                </Select>
              </FormField>

              {/* Drag & Drop Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFilesAdded(e.dataTransfer.files);
                }}
                className="cursor-pointer border-2 border-dashed rounded-lg p-8 text-center transition-colors hover:border-forge-500/50 hover:bg-[rgba(251,191,36,0.03)]"
                style={{ borderColor: 'var(--border-default)' }}
              >
                <UploadCloud className="h-10 w-10 text-forge-400 mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-label font-medium text-text-primary">
                  Click or drag files here to upload
                </p>
                <p className="text-caption text-text-tertiary mt-1">
                  Supports Multi-File Uploads: Images, PDFs, Documents, Archives (Max 25 MB each)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFilesAdded(e.target.files)}
                />
              </div>

              {/* Upload Tasks Queue */}
              {uploadQueue.length > 0 && (
                <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <p className="text-micro font-medium uppercase text-text-tertiary">Upload Queue ({uploadQueue.length})</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {uploadQueue.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-md border p-2.5 space-y-1.5"
                        style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--surface-raised)' }}
                      >
                        <div className="flex items-center justify-between text-caption">
                          <div className="flex items-center gap-2 min-w-0">
                            {getFileIcon(task.file.type, task.file.name)}
                            <span className="text-text-primary font-medium truncate">{task.file.name}</span>
                            <span className="text-text-tertiary">({formatBytes(task.file.size)})</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {task.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                            {task.status === 'error' && (
                              <button
                                onClick={() => handleRetryTask(task)}
                                className="flex items-center gap-1 text-red-400 hover:text-red-300"
                                title="Retry upload"
                              >
                                <RotateCcw className="h-3.5 w-3.5" /> Retry
                              </button>
                            )}
                            {(task.status === 'uploading' || task.status === 'pending') && (
                              <button
                                onClick={() => handleCancelTask(task.id)}
                                className="text-text-tertiary hover:text-red-400"
                                title="Cancel upload"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1.5 w-full rounded-full bg-surface-sunken overflow-hidden">
                          <div
                            className={cn(
                              'h-full transition-all duration-300',
                              task.status === 'completed' ? 'bg-emerald-500' : task.status === 'error' ? 'bg-red-500' : 'bg-forge-500',
                            )}
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        {task.error && <p className="text-micro text-red-400">{task.error}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <Button variant="ghost" size="md" onClick={() => setIsUploadOpen(false)}>Done</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── File Preview Modal ────────────────────────────────────────────────── */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-xl border bg-surface-overlay shadow-2xl overflow-hidden"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            <div className="flex items-center justify-between border-b px-5 py-4 shrink-0"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {getFileIcon(previewAttachment.mime_type, previewAttachment.file_name)}
                <h3 className="text-h3 text-text-primary truncate">{previewAttachment.file_name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => handleDownload(previewAttachment)}>
                  <Download className="h-3.5 w-3.5" /> Download
                </Button>
                <button
                  onClick={() => { setPreviewAttachment(null); setPreviewUrl(null); }}
                  className="rounded-md p-1 text-text-tertiary hover:text-text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center min-h-[320px]">
              {isLoadingPreview ? (
                <div className="flex flex-col items-center gap-2 text-text-tertiary">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <p className="text-caption">Generating Cloudinary asset URL…</p>
                </div>
              ) : previewUrl && isImageFile(previewAttachment.mime_type, previewAttachment.file_name) ? (
                <div className="relative flex items-center justify-center w-full h-full max-h-[65vh] overflow-hidden rounded-lg bg-black/40 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={previewAttachment.file_name}
                    className="max-h-[62vh] max-w-full rounded-md object-contain shadow-2xl transition-all duration-200"
                    onError={() => {
                      console.error('Failed to render image preview:', previewUrl);
                    }}
                  />
                </div>
              ) : previewUrl && isPdfFile(previewAttachment.mime_type, previewAttachment.file_name) ? (
                <iframe
                  src={previewUrl}
                  title={previewAttachment.file_name}
                  className="w-full h-[62vh] rounded-md border"
                  style={{ borderColor: 'var(--border-default)' }}
                />
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 text-text-tertiary mx-auto mb-3" strokeWidth={1} />
                  <p className="text-label text-text-primary font-medium">{previewAttachment.file_name}</p>
                  <p className="text-caption text-text-tertiary mt-1">
                    {formatBytes(previewAttachment.file_size)} · {previewAttachment.mime_type}
                  </p>
                  <p className="text-caption text-text-tertiary mt-3">
                    Office documents & zip archives download directly via Cloudinary delivery CDN.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t px-5 py-3 flex items-center justify-between text-caption text-text-tertiary shrink-0"
              style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--surface-raised)' }}
            >
              <span>Entity: <strong className="text-text-primary">{previewAttachment.entity_type}</strong></span>
              <span>Storage Provider: <strong className="text-text-primary">{previewAttachment.storage_provider}</strong></span>
              <span>Uploaded: <strong className="text-text-primary">{formatDate(previewAttachment.created_at)}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border bg-surface-overlay p-5 shadow-xl space-y-4"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            <div className="flex items-center gap-3 text-red-400">
              <ShieldAlert className="h-6 w-6 shrink-0" />
              <h3 className="text-h3 font-semibold text-text-primary">Delete File</h3>
            </div>
            <p className="text-label text-text-secondary">
              Are you sure you want to delete <strong className="text-text-primary">{deleteTarget.file_name}</strong>? This action will soft-delete the Cloudinary document attachment.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <Button variant="ghost" size="md" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" size="md" loading={isDeletingAttachment} onClick={handleDelete}>
                Delete File
              </Button>
            </div>
          </div>
        </div>
      )}
      </Stack>
    </Container>
  );
}
