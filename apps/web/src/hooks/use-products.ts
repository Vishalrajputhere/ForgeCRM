'use client';

/**
 * ForgeCRM — useProducts Hook
 *
 * Custom React Query hook for Product Catalog management.
 * Provides queries, mutations, search, filtering, and pagination.
 * Automatically attaches workspace headers and invalidates cache on mutation.
 *
 * Documentation: docs/04_Frontend/401_FRONTEND_OVERVIEW.md
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api-client';
import { useWorkspaceStore } from '@/stores/workspace-store';
import type {
  ProductCreate,
  ProductListResponse,
  ProductResponse,
  ProductUpdate,
} from '@/types';

export interface ProductQueryParams {
  search?: string | undefined;
  category?: string | undefined;
  is_active?: boolean | undefined;
  page?: number | undefined;
  page_size?: number | undefined;
}

export function useProducts(params: ProductQueryParams = {}) {
  const queryClient = useQueryClient();
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const workspaceId = currentWorkspace?.id;

  const queryKey = ['products', workspaceId, params];

  // 1. List Products Query
  const productsQuery = useQuery<ProductListResponse>({
    queryKey,
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.search) searchParams.set('search', params.search);
      if (params.category) searchParams.set('category', params.category);
      if (params.is_active !== undefined) searchParams.set('is_active', String(params.is_active));
      if (params.page) searchParams.set('page', String(params.page));
      if (params.page_size) searchParams.set('page_size', String(params.page_size));

      const queryStr = searchParams.toString();
      const endpoint = queryStr ? `/products?${queryStr}` : '/products';
      return await apiGet<ProductListResponse>(endpoint);
    },
    enabled: !!workspaceId,
  });

  // 2. Create Product Mutation
  const createProductMutation = useMutation({
    mutationFn: async (payload: ProductCreate) => {
      return await apiPost<ProductResponse>('/products', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', workspaceId] });
    },
  });

  // 3. Update Product Mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ProductUpdate }) => {
      return await apiPatch<ProductResponse>(`/products/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', workspaceId] });
    },
  });

  // 4. Delete / Archive Product Mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiDelete<void>(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', workspaceId] });
    },
  });

  return {
    products: productsQuery.data?.items ?? [],
    total: productsQuery.data?.total ?? 0,
    page: productsQuery.data?.page ?? 1,
    pageSize: productsQuery.data?.page_size ?? 50,
    totalPages: productsQuery.data?.total_pages ?? 0,
    isLoading: productsQuery.isLoading,
    isError: productsQuery.isError,
    error: productsQuery.error,
    refetch: productsQuery.refetch,
    createProduct: createProductMutation.mutateAsync,
    isCreating: createProductMutation.isPending,
    updateProduct: updateProductMutation.mutateAsync,
    isUpdating: updateProductMutation.isPending,
    deleteProduct: deleteProductMutation.mutateAsync,
    isDeleting: deleteProductMutation.isPending,
  };
}

export function useProduct(productId?: string) {
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const workspaceId = currentWorkspace?.id;

  return useQuery<ProductResponse>({
    queryKey: ['product', workspaceId, productId],
    queryFn: async () => {
      return await apiGet<ProductResponse>(`/products/${productId}`);
    },
    enabled: !!workspaceId && !!productId,
  });
}
