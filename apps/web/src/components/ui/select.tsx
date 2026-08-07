'use client';

import * as React from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options?: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, options, children, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        <select
          ref={ref}
          className={cn(
            'w-full rounded-lg border px-3 py-2 pr-8 text-xs appearance-none transition-colors duration-150',
            'bg-sunken text-primary',
            'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
            error ? 'border-status-danger-fg' : 'border-border-default hover:border-border-strong',
            'disabled:pointer-events-none disabled:opacity-40',
            className
          )}
          {...props}
        >
          {options ? options.map(o => <option key={o.value} value={o.value}>{o.label}</option>) : children}
        </select>
        <ChevronDown className="absolute right-2.5 h-3.5 w-3.5 text-muted pointer-events-none" />
      </div>
    );
  }
);
Select.displayName = 'Select';

// ── Combobox Component ───────────────────────────────────────────────────────

export interface ComboboxProps {
  options: SelectOption[];
  value?: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function Combobox({ options, value, onChange, placeholder = 'Select option…' }: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const selected = options.find((o) => o.value === value);
  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-border-default bg-sunken px-3 py-2 text-xs text-primary hover:border-border-strong focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <span className={selected ? 'text-primary' : 'text-muted'}>{selected ? selected.label : placeholder}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-border-default bg-overlay p-1 shadow-lg">
          <div className="flex items-center px-2 py-1 border-b border-border-subtle mb-1">
            <Search className="h-3.5 w-3.5 text-muted mr-1.5" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-primary placeholder:text-muted focus:outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted">No matching options</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-secondary hover:text-primary hover:bg-hover transition-colors"
                >
                  <span>{opt.label}</span>
                  {opt.value === value && <Check className="h-3.5 w-3.5 text-accent" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
