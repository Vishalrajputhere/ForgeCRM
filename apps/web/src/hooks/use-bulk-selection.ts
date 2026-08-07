'use client';

/**
 * ForgeCRM — useBulkSelection Hook
 *
 * Client-side bulk record selection hook supporting Shift+Click range select,
 * Ctrl+A page selection, Esc clear, and pagination survival.
 *
 * Documentation: docs/04_Frontend/401_FRONTEND_OVERVIEW.md
 */

import { useState, useCallback, useEffect } from 'react';

export function useBulkSelection(allIds: string[] = []) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setLastSelectedIndex(null);
  }, []);

  const toggleRow = useCallback((id: string, index?: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    if (typeof index === 'number') {
      setLastSelectedIndex(index);
    }
  }, []);

  const toggleAllPage = useCallback(() => {
    setSelectedIds((prev) => {
      const isAllPageSelected = allIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (isAllPageSelected) {
        allIds.forEach((id) => next.delete(id));
      } else {
        allIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [allIds]);

  // Shift + Click Range Selection
  const handleShiftClick = useCallback(
    (id: string, targetIndex: number) => {
      if (lastSelectedIndex === null || lastSelectedIndex === targetIndex) {
        toggleRow(id, targetIndex);
        return;
      }

      const start = Math.min(lastSelectedIndex, targetIndex);
      const end = Math.max(lastSelectedIndex, targetIndex);
      const rangeIds = allIds.slice(start, end + 1);

      setSelectedIds((prev) => {
        const next = new Set(prev);
        rangeIds.forEach((rId) => next.add(rId));
        return next;
      });
      setLastSelectedIndex(targetIndex);
    },
    [allIds, lastSelectedIndex, toggleRow],
  );

  // Keyboard Shortcuts (Ctrl+A / ⌘A & Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedIds.size > 0) {
        clearSelection();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && allIds.length > 0) {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
          return;
        }
        e.preventDefault();
        toggleAllPage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allIds, clearSelection, selectedIds.size, toggleAllPage]);

  const isPageSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  const isSomePageSelected = allIds.some((id) => selectedIds.has(id)) && !isPageSelected;

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    isPageSelected,
    isSomePageSelected,
    toggleRow,
    toggleAllPage,
    handleShiftClick,
    clearSelection,
    isSelected: useCallback((id: string) => selectedIds.has(id), [selectedIds]),
  };
}
