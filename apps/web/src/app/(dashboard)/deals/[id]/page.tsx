'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';

import { TimelineWidget } from '@/components/crm/timeline-widget';
import { useToast } from '@/components/ui/toast';
import { useCRM } from '@/hooks/use-crm';
import { useProducts } from '@/hooks/use-products';
import { useFormatters } from '@/hooks/use-formatters';
import { useStorage } from '@/hooks/use-storage';
import type { DealLineItemResponse, DealUpdate } from '@/types';
import {
  Paperclip,
  Upload,
  Trash2,
  Download,
  File,
  ImageIcon,
  FileText,
  Film,
  Archive,
  Package,
  Plus,
  Edit2,
} from 'lucide-react';

const inputCls = 'w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-forge-500 transition-colors';
const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <ImageIcon className="h-4 w-4 text-blue-400" />;
  if (mimeType.startsWith('video/')) return <Film className="h-4 w-4 text-purple-400" />;
  if (mimeType.includes('pdf')) return <FileText className="h-4 w-4 text-rose-400" />;
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('gz')) return <Archive className="h-4 w-4 text-amber-400" />;
  return <File className="h-4 w-4 text-slate-400" />;
}

export default function DealDetailPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;
  const { toast } = useToast();
  const { formatCurrency, formatDate } = useFormatters();

  const {
    useDeal,
    updateDeal,
    deleteDeal,
    isUpdatingDeal,
    isDeletingDeal,
    moveDealStage,
    useDealLineItems,
    addDealLineItem,
    updateDealLineItem,
    deleteDealLineItem,
    pipelines,
    companies,
    contacts,
  } = useCRM();

  const { products } = useProducts({ is_active: true });
  const { data: lineItems = [] } = useDealLineItems(dealId);

  const {
    requestUploadUrl,
    confirmUpload,
    getDownloadUrl,
    deleteAttachment,
    isDeletingAttachment,
    useEntityAttachments,
  } = useStorage();

  const { data: deal, isLoading } = useDeal(dealId);

  const pipeline = pipelines.find((p) => p.id === deal?.pipeline_id);
  const currentStage = pipeline?.stages?.find((s) => s.id === deal?.stage_id);
  const company = companies.find((c) => c.id === deal?.company_id);
  const contact = contacts.find((c) => c.id === deal?.primary_contact_id);

  const [tab, setTab] = useState<'overview' | 'products' | 'timeline' | 'attachments'>('overview');

  // ── Line Item Modal State ──────────────────────────────────────────────────
  const [isAddingLineItem, setIsAddingLineItem] = useState(false);
  const [editingLineItem, setEditingLineItem] = useState<DealLineItemResponse | null>(null);
  const [lineItemForm, setLineItemForm] = useState({
    product_id: '',
    product_name: '',
    sku: '',
    quantity: 1,
    unit_price: 0,
    discount_percent: 0,
    tax_rate: 0,
  });

  // ── Attachments ───────────────────────────────────────────────────────────
  const { data: attachments = [], refetch: refetchAttachments } = useEntityAttachments('Deal', dealId);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files.item(0);
    if (!file) return;

    if (file.size > 26_214_400) {
      setUploadError('File exceeds the 25 MB maximum size limit.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Step 1: Request presigned upload URL from backend
      const presigned = await requestUploadUrl({
        entity_type: 'Deal',
        entity_id: dealId as unknown as import('@/types').UUID,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
      });

      // Step 2: Upload directly to storage provider via presigned URL
      const uploadRes = await fetch(presigned.upload_url, {
        method: 'PUT',
        body: file as BodyInit,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });

      if (!uploadRes.ok) {
        throw new Error(`Storage upload failed (HTTP ${uploadRes.status})`);
      }

      // Step 3: Confirm upload to backend — creates DocumentAttachment record
      await confirmUpload({
        storage_key: presigned.storage_key,
        entity_type: 'Deal',
        entity_id: dealId as unknown as import('@/types').UUID,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
      });

      toast('success', 'File Uploaded', `"${file.name}" attached to this deal.`);
      await refetchAttachments();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed. Please try again.');
      toast('error', 'Upload Failed', err.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  }, [dealId, requestUploadUrl, confirmUpload, refetchAttachments, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleDownload = async (attachmentId: string, fileName: string) => {
    try {
      const { download_url } = await getDownloadUrl(attachmentId);
      const a = document.createElement('a');
      a.href = download_url;
      a.download = fileName;
      a.target = '_blank';
      a.click();
    } catch (err: any) {
      toast('error', 'Download Failed', err.message || 'Failed to generate download link');
    }
  };

  const handleDelete = async (attachmentId: string, fileName: string) => {
    try {
      await deleteAttachment(attachmentId);
      toast('success', 'Attachment Removed', `"${fileName}" has been deleted.`);
    } catch (err: any) {
      toast('error', 'Delete Failed', err.message || 'Failed to delete attachment');
    }
  };

  // ── Line Items Handlers ───────────────────────────────────────────────────
  const subtotalSum = lineItems.reduce((acc, i) => acc + (Number(i.subtotal) || 0), 0);
  const discountSum = lineItems.reduce((acc, i) => acc + (Number(i.discount_amount) || 0), 0);
  const taxSum = lineItems.reduce((acc, i) => acc + (Number(i.tax_amount) || 0), 0);
  const totalSum = lineItems.reduce((acc, i) => acc + (Number(i.total) || 0), 0);

  const handleOpenAddLineItem = () => {
    setLineItemForm({
      product_id: '',
      product_name: '',
      sku: '',
      quantity: 1,
      unit_price: 0,
      discount_percent: 0,
      tax_rate: 0,
    });
    setIsAddingLineItem(true);
  };

  const handleSelectCatalogProduct = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      setLineItemForm({
        ...lineItemForm,
        product_id: prod.id,
        product_name: prod.name,
        sku: prod.sku || '',
        unit_price: Number(prod.unit_price) || 0,
        tax_rate: Number(prod.tax_rate) || 0,
      });
    } else {
      setLineItemForm({
        ...lineItemForm,
        product_id: '',
      });
    }
  };

  const handleSaveAddLineItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lineItemForm.product_name.trim()) {
      toast('error', 'Item name is required');
      return;
    }
    try {
      await addDealLineItem({
        dealId,
        payload: {
          product_id: lineItemForm.product_id || null,
          product_name: lineItemForm.product_name.trim(),
          sku: lineItemForm.sku.trim() || null,
          quantity: Number(lineItemForm.quantity) || 1,
          unit_price: Number(lineItemForm.unit_price) || 0,
          discount_percent: Number(lineItemForm.discount_percent) || 0,
          tax_rate: Number(lineItemForm.tax_rate) || 0,
        },
      });
      toast('success', 'Line item added', `"${lineItemForm.product_name}" added and deal total updated.`);
      setIsAddingLineItem(false);
    } catch (err: unknown) {
      toast('error', 'Failed to add item', err instanceof Error ? err.message : '');
    }
  };

  const handleOpenEditLineItem = (item: DealLineItemResponse) => {
    setEditingLineItem(item);
    setLineItemForm({
      product_id: item.product_id || '',
      product_name: item.product_name_snapshot,
      sku: item.sku_snapshot || '',
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percent: item.discount_percent,
      tax_rate: item.tax_rate,
    });
  };

  const handleSaveEditLineItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLineItem) return;
    try {
      await updateDealLineItem({
        dealId,
        itemId: editingLineItem.id,
        payload: {
          quantity: Number(lineItemForm.quantity) || 1,
          unit_price: Number(lineItemForm.unit_price) || 0,
          discount_percent: Number(lineItemForm.discount_percent) || 0,
          tax_rate: Number(lineItemForm.tax_rate) || 0,
        },
      });
      toast('success', 'Line item updated', `Recalculated line item and deal total.`);
      setEditingLineItem(null);
    } catch (err: unknown) {
      toast('error', 'Failed to update item', err instanceof Error ? err.message : '');
    }
  };

  const handleDeleteLineItem = async (itemId: string, name: string) => {
    try {
      await deleteDealLineItem({ dealId, itemId });
      toast('success', 'Line item removed', `"${name}" removed and deal value recalculated.`);
    } catch (err: unknown) {
      toast('error', 'Failed to remove item', err instanceof Error ? err.message : '');
    }
  };

  // ── Stage Move ────────────────────────────────────────────────────────────
  const handleMoveStage = async (stageId: string) => {
    try {
      await moveDealStage({ dealId, payload: { stage_id: stageId } });
      toast('success', 'Stage updated');
    } catch (err: unknown) {
      toast('error', 'Stage move failed', err instanceof Error ? err.message : '');
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState(false);
  const handleDelete2 = async () => {
    try {
      await deleteDeal(dealId);
      toast('success', 'Deal cancelled');
      router.push('/deals');
    } catch (err: unknown) {
      toast('error', 'Delete failed', err instanceof Error ? err.message : '');
    }
  };

  // ── Edit Form State ───────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<DealUpdate>>({});

  const openEdit = () => {
    if (!deal) return;
    const form: Partial<DealUpdate> = {
      name: deal.name,
      value: deal.value,
      expected_close_date: deal.expected_close_date ?? '',
      description: deal.description ?? '',
    };
    if (deal.probability != null) form.probability = deal.probability;
    setEditForm(form);
    setIsEditing(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDeal({ id: dealId, payload: editForm });
      setIsEditing(false);
      toast('success', 'Deal updated');
    } catch (err: unknown) {
      toast('error', 'Update failed', err instanceof Error ? err.message : '');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-52 bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-24 bg-slate-800/60 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-8 text-center text-rose-400">
          Deal not found.{' '}
          <Link href="/deals" className="underline hover:text-rose-300">Go back</Link>
        </div>
      </div>
    );
  }

  const weightedValue = deal.probability ? (deal.value * deal.probability) / 100 : deal.value;

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/deals" className="hover:text-white transition-colors">Deals</Link>
        <span>/</span>
        <span className="text-white">{deal.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{deal.name}</h1>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold border ${
              deal.status === 'Won' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
              deal.status === 'Lost' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
              deal.status === 'Cancelled' ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' :
              'bg-blue-500/20 text-blue-400 border-blue-500/30'
            }`}>{deal.status}</span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-sm text-slate-400 flex-wrap">
            {company && (
              <Link href={`/companies/${company.id}`} className="hover:text-forge-300 transition-colors">{company.name}</Link>
            )}
            {currentStage && (
              <>
                <span className="text-slate-600">·</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: currentStage.color || '#6366f1' }} />
                  {currentStage.name}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={openEdit} className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-all">
            Edit
          </button>
          <button onClick={() => setConfirmDelete(true)} className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/20 transition-all">
            Cancel Deal
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
          <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide mb-1">Deal Value</p>
          <p className="text-xl font-bold text-white">{formatCurrency(deal.value)}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
          <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide mb-1">Probability</p>
          <p className="text-xl font-bold text-forge-400">{deal.probability ?? 0}%</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
          <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide mb-1">Weighted Value</p>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(weightedValue)}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center">
          <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide mb-1">Close Date</p>
          <p className="text-xl font-bold text-white">{formatDate(deal.expected_close_date)}</p>
        </div>
      </div>

      {/* Stage Progress */}
      {pipeline && pipeline.stages.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Pipeline Stage</h3>
          <div className="flex items-center gap-1 overflow-x-auto">
            {pipeline.stages
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((stage, idx) => {
                const isCurrent = stage.id === deal.stage_id;
                const currentIdx = pipeline.stages.findIndex((s) => s.id === deal.stage_id);
                const isPast = idx < currentIdx;
                return (
                  <button
                    key={stage.id}
                    onClick={() => handleMoveStage(stage.id)}
                    className={`flex-1 min-w-[80px] rounded-lg px-3 py-2 text-xs font-medium transition-all text-center ${
                      isCurrent
                        ? 'bg-forge-500 text-white shadow font-bold'
                        : isPast
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {stage.name}
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800">
        <button
          onClick={() => setTab('overview')}
          className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
            tab === 'overview'
              ? 'border-forge-500 text-forge-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Overview &amp; Details
        </button>
        <button
          onClick={() => setTab('products')}
          className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
            tab === 'products'
              ? 'border-forge-500 text-forge-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Package className="h-3.5 w-3.5" />
          Products &amp; Line Items
          {lineItems.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-forge-500/20 text-forge-400 text-[10px] font-bold">
              {lineItems.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('timeline')}
          className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
            tab === 'timeline'
              ? 'border-forge-500 text-forge-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Activity Timeline
        </button>
        <button
          onClick={() => setTab('attachments')}
          className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
            tab === 'attachments'
              ? 'border-forge-500 text-forge-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Paperclip className="h-3.5 w-3.5" />
          Attachments
          {attachments.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-forge-500/20 text-forge-400 text-[10px] font-bold">
              {attachments.length}
            </span>
          )}
        </button>
      </div>

      {/* Products & Line Items Tab */}
      {tab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-white">Line Items Breakdown</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage products, pricing, discounts, and real-time deal total calculations.
              </p>
            </div>
            <button
              onClick={handleOpenAddLineItem}
              className="inline-flex items-center gap-1.5 rounded-lg bg-forge-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-forge-400 transition-all shadow"
            >
              <Plus className="h-4 w-4" />
              Add Product / Line Item
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left 2 Cols: Line Items Table */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                {lineItems.length === 0 ? (
                  <div className="p-12 text-center">
                    <Package className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-300">No Line Items Attached</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Add products from your workspace catalog or custom quote items to calculate subtotal, discounts, taxes, and deal value.
                    </p>
                    <button
                      onClick={handleOpenAddLineItem}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add First Item
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider">
                          <th className="py-3 px-4">Item / Product</th>
                          <th className="py-3 px-3 text-right">Qty</th>
                          <th className="py-3 px-3 text-right">Unit Price</th>
                          <th className="py-3 px-3 text-right">Disc %</th>
                          <th className="py-3 px-3 text-right">Tax %</th>
                          <th className="py-3 px-4 text-right">Total</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {lineItems.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-4 font-medium text-white">
                              <div>
                                <span className="font-semibold">{item.product_name_snapshot}</span>
                                {item.sku_snapshot && (
                                  <span className="ml-2 font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                                    {item.sku_snapshot}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-300">{item.quantity}</td>
                            <td className="py-3 px-3 text-right font-mono text-slate-300">
                              ${Number(item.unit_price).toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-400">
                              {item.discount_percent > 0 ? (
                                <span className="text-amber-400">-{item.discount_percent}%</span>
                              ) : (
                                '0%'
                              )}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-400">
                              {item.tax_rate > 0 ? `${item.tax_rate}%` : '0%'}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                              ${Number(item.total).toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleOpenEditLineItem(item)}
                                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                  title="Edit Line Item"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLineItem(item.id, item.product_name_snapshot)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                  title="Remove Line Item"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Col: Financial Summary Card */}
            <div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Financial Summary
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Items Subtotal</span>
                    <span className="font-mono text-slate-200">${subtotalSum.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Discounts Applied</span>
                    <span className="font-mono text-amber-400">-${discountSum.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Taxes &amp; Duties</span>
                    <span className="font-mono text-slate-200">+${taxSum.toFixed(2)}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline font-bold text-sm">
                    <span className="text-white">Deal Grand Total</span>
                    <span className="font-mono text-lg text-emerald-400">${totalSum.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 border-t border-slate-800/80 pt-3">
                  Deal value is automatically synced from total line items.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Deal Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-slate-500 block">Deal Name</span>
                  <span className="text-white font-medium">{deal.name}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Status</span>
                  <span className="text-white font-medium">{deal.status}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Value</span>
                  <span className="text-emerald-400 font-bold">{formatCurrency(deal.value)}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Expected Close</span>
                  <span className="text-white font-medium">{formatDate(deal.expected_close_date)}</span>
                </div>
              </div>
              {deal.description && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-500 block mb-1">Description</span>
                  <p className="text-slate-300 text-sm leading-relaxed">{deal.description}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Associated Company</h3>
              {company ? (
                <Link href={`/companies/${company.id}`} className="block rounded-lg border border-slate-800 bg-slate-800/40 p-3 hover:border-slate-700 transition-colors group">
                  <p className="text-sm font-bold text-white group-hover:text-forge-300 transition-colors">{company.name}</p>
                  {company.website && <p className="text-xs text-slate-500 truncate mt-0.5">{company.website}</p>}
                </Link>
              ) : (
                <p className="text-xs text-slate-500">No associated company</p>
              )}
            </div>

            {contact && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Primary Contact</h3>
                <Link href={`/contacts/${contact.id}`} className="block rounded-lg border border-slate-800 bg-slate-800/40 p-3 hover:border-slate-700 transition-colors group">
                  <p className="text-sm font-bold text-white group-hover:text-forge-300 transition-colors">{contact.first_name} {contact.last_name}</p>
                  {contact.email && <p className="text-xs text-slate-500 truncate mt-0.5">{contact.email}</p>}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline Tab */}
      {tab === 'timeline' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Deal Activity Log</h3>
          <TimelineWidget entityType="Deal" entityId={dealId} />
        </div>
      )}

      {/* Attachments Tab */}
      {tab === 'attachments' && (
        <div className="space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-forge-500 bg-forge-500/10 scale-[1.01]'
                : isUploading
                  ? 'border-slate-700 bg-slate-900/40 opacity-60 cursor-not-allowed'
                  : 'border-slate-700 bg-slate-900/40 hover:border-forge-500/50 hover:bg-slate-900/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
              disabled={isUploading}
              accept="*/*"
            />
            <div className="flex flex-col items-center gap-3">
              {isUploading ? (
                <>
                  <div className="h-10 w-10 rounded-full border-2 border-forge-500 border-t-transparent animate-spin" />
                  <p className="text-sm font-medium text-slate-300">Uploading...</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-slate-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-300">
                      {isDragging ? 'Drop file here' : 'Drag & drop or click to upload'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Maximum file size: 25 MB</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {uploadError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
              {uploadError}
            </div>
          )}

          {/* Attachments List */}
          {attachments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 space-y-2">
              <Paperclip className="h-8 w-8 text-slate-700" />
              <p className="text-sm">No attachments yet — upload a file above</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center justify-between">
                <span>{attachments.length} {attachments.length === 1 ? 'File' : 'Files'} Attached</span>
              </div>
              <div className="divide-y divide-slate-800/60">
                {attachments.map((att) => (
                  <div key={String(att.id)} className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/20 transition-colors group">
                    <div className="flex items-center gap-3 min-w-0">
                      {fileIcon(att.mime_type)}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{att.file_name}</p>
                        <p className="text-xs text-slate-500">
                          {formatBytes(att.file_size)} · {new Date(att.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-4">
                      <button
                        onClick={() => handleDownload(String(att.id), att.file_name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(String(att.id), att.file_name)}
                        disabled={isDeletingAttachment}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-40"
                        title="Delete attachment"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Edit Deal</h3>
            <form onSubmit={handleEdit} className="space-y-3">
              <div>
                <label className={labelCls}>Deal Name</label>
                <input required type="text" value={editForm.name ?? ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Value ($)</label>
                  <input type="number" min={0} value={editForm.value ?? ''} onChange={(e) => setEditForm({ ...editForm, value: Number(e.target.value) })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Probability (%)</label>
                  <input type="number" min={0} max={100} value={editForm.probability ?? ''} onChange={(e) => setEditForm({ ...editForm, probability: Number(e.target.value) })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Expected Close Date</label>
                <input type="date" value={editForm.expected_close_date ?? ''} onChange={(e) => setEditForm({ ...editForm, expected_close_date: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea rows={3} value={editForm.description ?? ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className={inputCls} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsEditing(false)} className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={isUpdatingDeal} className="rounded-lg bg-forge-500 px-4 py-2 text-xs font-semibold text-white hover:bg-forge-400 disabled:opacity-40">
                  {isUpdatingDeal ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Cancel Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 text-center">
            <h3 className="text-lg font-bold text-white">Cancel Deal?</h3>
            <p className="text-xs text-slate-400">Are you sure you want to mark this deal as cancelled?</p>
            <div className="flex justify-center gap-3 pt-2">
              <button onClick={() => setConfirmDelete(false)} className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white">Back</button>
              <button onClick={handleDelete2} disabled={isDeletingDeal} className="rounded-lg bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-400 disabled:opacity-40">
                {isDeletingDeal ? 'Cancelling…' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Line Item */}
      {isAddingLineItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Add Line Item / Product</h3>
              <button onClick={() => setIsAddingLineItem(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveAddLineItem} className="space-y-3.5 text-xs">
              <div>
                <label className={labelCls}>Select from Catalog (Optional)</label>
                <select
                  value={lineItemForm.product_id}
                  onChange={(e) => handleSelectCatalogProduct(e.target.value)}
                  className={inputCls}
                >
                  <option value="">-- Custom Quote Item --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku || 'No SKU'}) — ${p.unit_price}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>
                  Item / Product Name <span className="text-rose-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Annual License or Implementation Fee"
                  value={lineItemForm.product_name}
                  onChange={(e) => setLineItemForm({ ...lineItemForm, product_name: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>SKU / Code</label>
                  <input
                    type="text"
                    placeholder="Optional item code"
                    value={lineItemForm.sku}
                    onChange={(e) => setLineItemForm({ ...lineItemForm, sku: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={lineItemForm.quantity}
                    onChange={(e) => setLineItemForm({ ...lineItemForm, quantity: Math.max(1, parseFloat(e.target.value) || 1) })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Unit Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={lineItemForm.unit_price}
                    onChange={(e) => setLineItemForm({ ...lineItemForm, unit_price: parseFloat(e.target.value) || 0 })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={lineItemForm.discount_percent}
                    onChange={(e) => setLineItemForm({ ...lineItemForm, discount_percent: parseFloat(e.target.value) || 0 })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={lineItemForm.tax_rate}
                    onChange={(e) => setLineItemForm({ ...lineItemForm, tax_rate: parseFloat(e.target.value) || 0 })}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Calculated Preview */}
              {(() => {
                const sub = lineItemForm.quantity * lineItemForm.unit_price;
                const disc = sub * (lineItemForm.discount_percent / 100);
                const taxable = Math.max(0, sub - disc);
                const tax = taxable * (lineItemForm.tax_rate / 100);
                const tot = taxable + tax;
                return (
                  <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800 space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal:</span>
                      <span>${sub.toFixed(2)}</span>
                    </div>
                    {disc > 0 && (
                      <div className="flex justify-between text-amber-400">
                        <span>Discount:</span>
                        <span>-${disc.toFixed(2)}</span>
                      </div>
                    )}
                    {tax > 0 && (
                      <div className="flex justify-between text-slate-400">
                        <span>Tax:</span>
                        <span>+${tax.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-1 text-xs">
                      <span>Item Total:</span>
                      <span>${tot.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingLineItem(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-forge-500 px-4 py-2 text-xs font-semibold text-white hover:bg-forge-400"
                >
                  Add to Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Line Item */}
      {editingLineItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Edit Line Item</h3>
              <button onClick={() => setEditingLineItem(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveEditLineItem} className="space-y-3.5 text-xs">
              <div>
                <label className={labelCls}>Product Name (Snapshot)</label>
                <input
                  disabled
                  type="text"
                  value={editingLineItem.product_name_snapshot}
                  className={`${inputCls} opacity-60`}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={lineItemForm.quantity}
                    onChange={(e) => setLineItemForm({ ...lineItemForm, quantity: Math.max(1, parseFloat(e.target.value) || 1) })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Unit Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={lineItemForm.unit_price}
                    onChange={(e) => setLineItemForm({ ...lineItemForm, unit_price: parseFloat(e.target.value) || 0 })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={lineItemForm.discount_percent}
                    onChange={(e) => setLineItemForm({ ...lineItemForm, discount_percent: parseFloat(e.target.value) || 0 })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={lineItemForm.tax_rate}
                  onChange={(e) => setLineItemForm({ ...lineItemForm, tax_rate: parseFloat(e.target.value) || 0 })}
                  className={inputCls}
                />
              </div>

              {/* Calculated Preview */}
              {(() => {
                const sub = lineItemForm.quantity * lineItemForm.unit_price;
                const disc = sub * (lineItemForm.discount_percent / 100);
                const taxable = Math.max(0, sub - disc);
                const tax = taxable * (lineItemForm.tax_rate / 100);
                const tot = taxable + tax;
                return (
                  <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800 space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal:</span>
                      <span>${sub.toFixed(2)}</span>
                    </div>
                    {disc > 0 && (
                      <div className="flex justify-between text-amber-400">
                        <span>Discount:</span>
                        <span>-${disc.toFixed(2)}</span>
                      </div>
                    )}
                    {tax > 0 && (
                      <div className="flex justify-between text-slate-400">
                        <span>Tax:</span>
                        <span>+${tax.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-1 text-xs">
                      <span>Recalculated Item Total:</span>
                      <span>${tot.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingLineItem(null)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-forge-500 px-4 py-2 text-xs font-semibold text-white hover:bg-forge-400"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
