'use client';

import * as React from 'react';
import {
  Package,
  Plus,
  Search,
  DollarSign,
  Layers,
  Edit2,
  Trash2,
  CheckCircle2,
  Archive,
  Filter,
  RefreshCw,
} from 'lucide-react';

import { useProducts } from '@/hooks/use-products';
import { useToast } from '@/components/ui/toast';
import { Modal } from '@/components/ui/overlay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Heading, Text } from '@/components/ui/typography';
import type { Product, ProductCreate } from '@/types';

const PRESET_CATEGORIES = [
  'Software Licenses',
  'Professional Services',
  'Hardware & Equipment',
  'Cloud Infrastructure',
  'Support & Maintenance',
  'Consulting & Training',
  'Custom Development',
];

export default function ProductsPage() {
  const { toast } = useToast();

  // Filter and Search States
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('ALL');
  const [activeFilter, setActiveFilter] = React.useState<string>('ALL');

  // Query Hook
  const {
    products,
    total,
    isLoading,
    refetch,
    createProduct,
    isCreating,
    updateProduct,
    isUpdating,
    deleteProduct,
    isDeleting,
  } = useProducts({
    search: searchTerm || undefined,
    category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
    is_active: activeFilter === 'ALL' ? undefined : activeFilter === 'ACTIVE',
  });

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = React.useState<Product | null>(null);

  // Form State
  const [formState, setFormState] = React.useState<ProductCreate>({
    name: '',
    sku: '',
    description: '',
    category: 'Software Licenses',
    unit_price: 0,
    currency: 'USD',
    tax_rate: 0,
    is_active: true,
  });

  // Category list computed from data + presets
  const availableCategories = React.useMemo(() => {
    const set = new Set<string>(PRESET_CATEGORIES);
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // KPI Metrics Computed
  const metrics = React.useMemo(() => {
    const totalCount = products.length;
    const activeCount = products.filter((p) => p.is_active).length;
    const categoriesCount = new Set(products.map((p) => p.category).filter(Boolean)).size;
    const avgPrice =
      totalCount > 0 ? products.reduce((acc, p) => acc + (Number(p.unit_price) || 0), 0) / totalCount : 0;

    return {
      totalCount,
      activeCount,
      categoriesCount,
      avgPrice,
    };
  }, [products]);

  // Handle open create modal
  const handleOpenCreate = () => {
    setFormState({
      name: '',
      sku: '',
      description: '',
      category: 'Software Licenses',
      unit_price: 0,
      currency: 'USD',
      tax_rate: 0,
      is_active: true,
    });
    setIsCreateOpen(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormState({
      name: product.name,
      sku: product.sku || '',
      description: product.description || '',
      category: product.category || 'Software Licenses',
      unit_price: product.unit_price,
      currency: product.currency || 'USD',
      tax_rate: product.tax_rate || 0,
      is_active: product.is_active,
    });
  };

  // Handle submit create
  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) {
      toast('error', 'Validation Error', 'Product name is required');
      return;
    }

    try {
      await createProduct({
        ...formState,
        unit_price: Number(formState.unit_price) || 0,
        tax_rate: Number(formState.tax_rate) || 0,
        sku: formState.sku?.trim() || null,
        description: formState.description?.trim() || null,
      });
      toast('success', 'Product Created', `Product '${formState.name}' created successfully`);
      setIsCreateOpen(false);
    } catch (err: any) {
      toast('error', 'Creation Failed', err?.message || 'Failed to create product');
    }
  };

  // Handle submit edit
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!formState.name.trim()) {
      toast('error', 'Validation Error', 'Product name is required');
      return;
    }

    try {
      await updateProduct({
        id: editingProduct.id,
        payload: {
          ...formState,
          unit_price: Number(formState.unit_price) || 0,
          tax_rate: Number(formState.tax_rate) || 0,
          sku: formState.sku?.trim() || null,
          description: formState.description?.trim() || null,
        },
      });
      toast('success', 'Product Updated', `Product '${formState.name}' updated successfully`);
      setEditingProduct(null);
    } catch (err: any) {
      toast('error', 'Update Failed', err?.message || 'Failed to update product');
    }
  };

  // Handle submit delete/archive
  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    try {
      await deleteProduct(deletingProduct.id);
      toast('success', 'Product Removed', `Product '${deletingProduct.name}' archived/removed`);
      setDeletingProduct(null);
    } catch (err: any) {
      toast('error', 'Removal Failed', err?.message || 'Failed to remove product');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Package className="h-7 w-7 text-primary-base" />
            <Heading level="h2">Product Catalog</Heading>
          </div>
          <Text className="text-text-muted mt-1">
            Manage sellable goods, software licenses, subscription plans, and professional services.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border-border-subtle bg-surface-subtle">
          <div className="flex items-center justify-between">
            <Text className="text-xs font-semibold uppercase tracking-wider text-text-muted">Total Products</Text>
            <div className="rounded-lg bg-primary-subtle/20 p-2 text-primary-base">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <Heading level="h2">{total || metrics.totalCount}</Heading>
            <Text className="text-xs text-text-muted">in catalog</Text>
          </div>
        </Card>

        <Card className="p-4 border-border-subtle bg-surface-subtle">
          <div className="flex items-center justify-between">
            <Text className="text-xs font-semibold uppercase tracking-wider text-text-muted">Active Offerings</Text>
            <div className="rounded-lg bg-success-subtle/20 p-2 text-success-base">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <Heading level="h2">{metrics.activeCount}</Heading>
            <Text className="text-xs text-text-muted">sellable items</Text>
          </div>
        </Card>

        <Card className="p-4 border-border-subtle bg-surface-subtle">
          <div className="flex items-center justify-between">
            <Text className="text-xs font-semibold uppercase tracking-wider text-text-muted">Categories</Text>
            <div className="rounded-lg bg-secondary-subtle/20 p-2 text-secondary-base">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <Heading level="h2">{metrics.categoriesCount}</Heading>
            <Text className="text-xs text-text-muted">product lines</Text>
          </div>
        </Card>

        <Card className="p-4 border-border-subtle bg-surface-subtle">
          <div className="flex items-center justify-between">
            <Text className="text-xs font-semibold uppercase tracking-wider text-text-muted">Average Price</Text>
            <div className="rounded-lg bg-warning-subtle/20 p-2 text-warning-base">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <Heading level="h2">${metrics.avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Heading>
            <Text className="text-xs text-text-muted">USD / unit</Text>
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="p-4 border-border-subtle">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search product name, SKU, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-base border border-border-strong rounded-lg text-sm focus:outline-hidden focus:border-primary-base"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <div className="flex items-center gap-1">
              <Filter className="h-4 w-4 text-text-muted" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="py-1.5 px-3 bg-surface-base border border-border-strong rounded-lg text-xs font-medium focus:outline-hidden"
              >
                <option value="ALL">All Categories</option>
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="py-1.5 px-3 bg-surface-base border border-border-strong rounded-lg text-xs font-medium focus:outline-hidden"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Archived / Inactive</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Product Table */}
      <Card className="overflow-hidden border-border-subtle">
        {isLoading ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary-base mb-3" />
            <Text className="text-text-muted">Loading product catalog...</Text>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-text-muted/50 mx-auto mb-3" />
            <Heading level="h4">No Products Found</Heading>
            <Text className="text-text-muted mt-1 max-w-sm mx-auto">
              {searchTerm || selectedCategory !== 'ALL' || activeFilter !== 'ALL'
                ? 'Try adjusting your search criteria or clear filters.'
                : 'Your workspace product catalog is empty. Add your first sellable offering to start attaching products to deals.'}
            </Text>
            <div className="mt-4">
              <Button variant="primary" size="sm" onClick={handleOpenCreate}>
                <Plus className="mr-1.5 h-4 w-4" />
                Add Product
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-subtle/50 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-center">Tax Rate</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-sm">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-surface-subtle/30 transition-colors">
                    <td className="py-3.5 px-4 font-medium">
                      <div>
                        <span className="text-text-strong font-semibold">{product.name}</span>
                        {product.description && (
                          <p className="text-xs text-text-muted truncate max-w-xs mt-0.5">{product.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {product.sku ? (
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-subtle border border-border-subtle text-text-muted">
                          {product.sku}
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="neutral" className="text-xs font-normal">
                        {product.category || 'General'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium font-mono text-text-strong">
                      ${Number(product.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs text-text-muted font-mono">
                      {product.tax_rate > 0 ? `${product.tax_rate}%` : '0%'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {product.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-subtle/20 text-success-base border border-success-subtle/30">
                          <span className="h-1.5 w-1.5 rounded-full bg-success-base animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-subtle text-text-muted border border-border-subtle">
                          Archived
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleOpenEdit(product)}
                          title="Edit Product"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-danger-base hover:bg-danger-subtle/20"
                          onClick={() => setDeletingProduct(product)}
                          title="Archive / Remove"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal: Create Product */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Catalog Product"
        size="lg"
      >
        <form onSubmit={handleSubmitCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-strong mb-1">
              Product / Service Name <span className="text-danger-base">*</span>
            </label>
            <Input
              placeholder="e.g. Enterprise License (Annual)"
              value={formState.name}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-strong mb-1">
                SKU / Item Code
              </label>
              <Input
                placeholder="e.g. LIC-ENT-001"
                value={formState.sku || ''}
                onChange={(e) => setFormState({ ...formState, sku: e.target.value })}
              />
              <span className="text-[11px] text-text-muted">Must be unique within this workspace</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-strong mb-1">
                Category
              </label>
              <select
                value={formState.category || 'Software Licenses'}
                onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                className="w-full py-2 px-3 bg-surface-base border border-border-strong rounded-lg text-sm focus:outline-hidden"
              >
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-strong mb-1">
                Unit Price ($) <span className="text-danger-base">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formState.unit_price}
                onChange={(e) => setFormState({ ...formState, unit_price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-strong mb-1">
                Tax Rate (%)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="0.00"
                value={formState.tax_rate}
                onChange={(e) => setFormState({ ...formState, tax_rate: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-strong mb-1">
                Currency
              </label>
              <Input
                value={formState.currency || 'USD'}
                onChange={(e) => setFormState({ ...formState, currency: e.target.value })}
                disabled
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-strong mb-1">
              Description / Specifications
            </label>
            <textarea
              rows={3}
              placeholder="Product description, deliverables, or service level details..."
              value={formState.description || ''}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
              className="w-full py-2 px-3 bg-surface-base border border-border-strong rounded-lg text-sm focus:outline-hidden focus:border-primary-base resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border-subtle">
            <input
              type="checkbox"
              id="is_active_create"
              checked={formState.is_active}
              onChange={(e) => setFormState({ ...formState, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-border-strong text-primary-base"
            />
            <label htmlFor="is_active_create" className="text-xs font-medium text-text-strong">
              Active for Sales Deals & Proposals
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
            <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isCreating}>
              {isCreating ? 'Adding...' : 'Save Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Product */}
      <Modal
        open={Boolean(editingProduct)}
        onClose={() => setEditingProduct(null)}
        title="Edit Catalog Product"
        size="lg"
      >
        <form onSubmit={handleSubmitEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-strong mb-1">
              Product / Service Name <span className="text-danger-base">*</span>
            </label>
            <Input
              value={formState.name}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-strong mb-1">
                SKU / Item Code
              </label>
              <Input
                value={formState.sku || ''}
                onChange={(e) => setFormState({ ...formState, sku: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-strong mb-1">
                Category
              </label>
              <select
                value={formState.category || 'Software Licenses'}
                onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                className="w-full py-2 px-3 bg-surface-base border border-border-strong rounded-lg text-sm focus:outline-hidden"
              >
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-strong mb-1">
                Unit Price ($) <span className="text-danger-base">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formState.unit_price}
                onChange={(e) => setFormState({ ...formState, unit_price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-strong mb-1">
                Tax Rate (%)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formState.tax_rate}
                onChange={(e) => setFormState({ ...formState, tax_rate: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-strong mb-1">
                Currency
              </label>
              <Input value={formState.currency || 'USD'} disabled />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-strong mb-1">
              Description / Specifications
            </label>
            <textarea
              rows={3}
              value={formState.description || ''}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
              className="w-full py-2 px-3 bg-surface-base border border-border-strong rounded-lg text-sm focus:outline-hidden focus:border-primary-base resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border-subtle">
            <input
              type="checkbox"
              id="is_active_edit"
              checked={formState.is_active}
              onChange={(e) => setFormState({ ...formState, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-border-strong text-primary-base"
            />
            <label htmlFor="is_active_edit" className="text-xs font-medium text-text-strong">
              Active for Sales Deals & Proposals
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
            <Button variant="outline" type="button" onClick={() => setEditingProduct(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Update Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Delete/Archive Confirmation */}
      <Modal
        open={Boolean(deletingProduct)}
        onClose={() => setDeletingProduct(null)}
        title="Archive or Remove Product"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-warning-subtle/20 border border-warning-subtle/40 rounded-lg">
            <Archive className="h-5 w-5 text-warning-base shrink-0 mt-0.5" />
            <div className="text-xs text-text-strong space-y-1">
              <p className="font-semibold">Safe Historical Archival</p>
              <p className="text-text-muted">
                If <strong>{deletingProduct?.name}</strong> is referenced in existing deals or proposals, it will be safely archived (marked inactive) to preserve historical accounting accuracy.
              </p>
            </div>
          </div>

          <p className="text-sm text-text-muted">
            Are you sure you want to remove <strong>{deletingProduct?.name}</strong> from active offerings?
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
            <Button variant="outline" type="button" onClick={() => setDeletingProduct(null)}>
              Cancel
            </Button>
            <Button variant="primary" className="bg-danger-base hover:bg-danger-strong text-white" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Removing...' : 'Confirm Remove'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
