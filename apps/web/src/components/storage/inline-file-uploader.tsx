'use client';

import * as React from 'react';
import {
  Upload, FileText, Image, File, Trash2, Download, RefreshCw
} from 'lucide-react';
import { useAIFetch } from '@/hooks/use-ai-fetch';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useToast } from '@/components/ui/toast';

export interface DocumentAttachment {
  id: string;
  file_name: string;
  file_size: number;
  content_type: string;
  entity_type?: string;
  entity_id?: string;
  storage_provider?: string;
  uploaded_at?: string;
}

interface InlineFileUploaderProps {
  entityType?: string;
  entityId?: string;
  onUploadSuccess?: (attachment: DocumentAttachment) => void;
}

export function InlineFileUploader({ entityType, entityId, onUploadSuccess }: InlineFileUploaderProps) {
  const { currentWorkspace } = useWorkspaceStore();
  const { aiFetch } = useAIFetch({ workspaceId: currentWorkspace?.id });
  const { toast } = useToast();

  const [attachments, setAttachments] = React.useState<DocumentAttachment[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const fetchAttachments = React.useCallback(async () => {
    if (!currentWorkspace?.id) return;
    try {
      let url = '/api/v1/storage/attachments';
      if (entityType && entityId) {
        url += `?entity_type=${encodeURIComponent(entityType)}&entity_id=${encodeURIComponent(entityId)}`;
      }
      const res = await aiFetch(url, null, 'GET');
      if (res.ok) {
        const data = await res.json();
        setAttachments(data);
      }
    } catch {
      // Ignore
    }
  }, [aiFetch, currentWorkspace, entityType, entityId]);

  React.useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(20);

      // 1. Request Upload URL
      const urlRes = await aiFetch('/api/v1/storage/upload-url', {
        filename: file.name,
        content_type: file.type || 'application/octet-stream',
        size_bytes: file.size,
      });

      if (!urlRes.ok) {
        throw new Error('Failed to request presigned upload URL');
      }

      setUploadProgress(50);
      const urlData = await urlRes.json();

      // 2. Confirm Attachment Metadata
      const confirmRes = await aiFetch('/api/v1/storage/confirm', {
        storage_key: urlData.storage_key,
        file_name: file.name,
        file_size: file.size,
        content_type: file.type || 'application/octet-stream',
        entity_type: entityType,
        entity_id: entityId,
      });

      if (!confirmRes.ok) {
        throw new Error('Failed to confirm document attachment');
      }

      setUploadProgress(100);
      const newAttachment = await confirmRes.json();
      setAttachments((prev) => [newAttachment, ...prev]);
      toast('success', 'Upload Successful', `File "${file.name}" attached successfully.`);
      if (onUploadSuccess) onUploadSuccess(newAttachment);
    } catch (err: any) {
      toast('error', 'Upload Failed', err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (attachmentId: string) => {
    try {
      const res = await aiFetch(`/api/v1/storage/attachments/${attachmentId}/download-url`, null, 'GET');
      if (res.ok) {
        const data = await res.json();
        window.open(data.download_url, '_blank');
      }
    } catch {
      toast('error', 'Download Failed', 'Failed to generate download link');
    }
  };

  const handleDelete = async (attachmentId: string) => {
    try {
      const res = await aiFetch(`/api/v1/storage/attachments/${attachmentId}`, null, 'DELETE');
      if (res.ok || res.status === 204) {
        setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
        toast('success', 'Attachment Deleted', 'File attachment removed.');
      }
    } catch {
      toast('error', 'Delete Failed', 'Failed to delete attachment');
    }
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.includes('image')) return <Image className="h-4 w-4 text-cyan-400" />;
    if (contentType.includes('pdf')) return <FileText className="h-4 w-4 text-rose-400" />;
    return <File className="h-4 w-4 text-blue-400" />;
  };

  return (
    <div className="space-y-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Upload className="h-4 w-4 text-cyan-400" /> Document Attachments & Files
        </h3>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-semibold hover:bg-cyan-500/20 flex items-center gap-1.5"
          >
            {isUploading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {isUploading ? `Uploading ${uploadProgress}%` : 'Upload File'}
          </button>
        </div>
      </div>

      {/* Attachments List */}
      {attachments.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
          No document attachments uploaded yet. Drag & drop or click Upload above.
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {getFileIcon(att.content_type || '')}
                <span className="font-medium text-slate-200 truncate">{att.file_name}</span>
                <span className="text-slate-500 font-mono">({Math.round((att.file_size || 1024) / 1024)} KB)</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleDownload(att.id)}
                  className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"
                  title="Download File"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(att.id)}
                  className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                  title="Delete Attachment"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
