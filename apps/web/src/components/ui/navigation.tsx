'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: 'line' | 'segmented';
}

export function Tabs({ items, activeId, onChange, variant = 'segmented' }: TabsProps) {
  if (variant === 'segmented') {
    return (
      <div className="inline-flex gap-1 rounded-xl border border-border-default bg-sunken p-1">
        {items.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer select-none',
                isActive
                  ? 'bg-surface text-primary shadow-xs border border-border-default'
                  : 'text-secondary hover:text-primary hover:bg-hover'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={cn('rounded px-1.5 py-0.2 text-[10px] font-mono', isActive ? 'bg-accent/15 text-accent font-bold' : 'bg-subtle text-muted')}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex border-b border-border-default gap-6">
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 pb-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer select-none',
              isActive
                ? 'border-accent text-primary'
                : 'border-transparent text-secondary hover:text-primary'
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
