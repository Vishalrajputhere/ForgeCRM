'use client';

import * as React from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Input } from '@/components/ui/input';
import { EmptyState, Skeleton } from '@/components/ui/feedback';
import { Caption } from '@/components/ui/typography';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface EnterpriseDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (selected: Set<string>) => void;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  pageSize?: number;
  bulkActions?: React.ReactNode;
}

export function EnterpriseDataTable<T>({
  data,
  columns,
  keyExtractor,
  searchable = true,
  searchPlaceholder = 'Search records…',
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items matching your criteria.',
  pageSize = 10,
  bulkActions,
}: EnterpriseDataTableProps<T>) {
  const [search, setSearch] = React.useState('');
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');
  const [page, setPage] = React.useState(1);

  // Search Filter
  const filteredData = React.useMemo(() => {
    if (!search) return data;
    return data.filter((row) =>
      JSON.stringify(row).toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  // Sort
  const sortedData = React.useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a: any, b: any) => {
      const valA = a[sortKey] ?? '';
      const valB = b[sortKey] ?? '';
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange(new Set(paginatedData.map(keyExtractor)));
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    onSelectionChange(next);
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Top Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {searchable && (
          <div className="w-full sm:max-w-xs">
            <Input
              placeholder={searchPlaceholder}
              leftIcon={<Search className="h-3.5 w-3.5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}
        {selectedIds.size > 0 && bulkActions && <div>{bulkActions}</div>}
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-border-default bg-surface shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border-subtle bg-subtle text-muted">
            <tr>
              {selectable && (
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={paginatedData.length > 0 && paginatedData.every((r) => selectedIds.has(keyExtractor(r)))}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-3.5 w-3.5 rounded accent-accent"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-2.5 font-medium uppercase tracking-wider',
                    col.sortable ? 'cursor-pointer select-none hover:text-primary' : '',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="inline-flex items-center gap-1">
                    <span>{col.header}</span>
                    {col.sortable && <ArrowUpDown className="h-3 w-3 opacity-60" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {selectable && <td className="px-3 py-3"><Skeleton className="h-4 w-4" /></td>}
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="py-8">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => {
                const id = keyExtractor(row);
                const isSelected = selectedIds.has(id);
                return (
                  <tr key={id} className={cn('hover:bg-hover transition-colors', isSelected ? 'bg-accent/5' : '')}>
                    {selectable && (
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(id, e.target.checked)}
                          className="h-3.5 w-3.5 rounded accent-accent"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className={cn('px-4 py-3 text-secondary', col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left')}>
                        {col.render ? col.render(row) : (row as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1 py-1">
          <Caption color="muted" tabular>
            Page {page} of {totalPages} ({sortedData.length} total records)
          </Caption>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-7 w-7 items-center justify-center rounded border border-border-default bg-surface text-secondary hover:text-primary disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-7 w-7 items-center justify-center rounded border border-border-default bg-surface text-secondary hover:text-primary disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
