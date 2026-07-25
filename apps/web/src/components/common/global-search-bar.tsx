'use client';

import { useState } from 'react';

import { useSearch } from '@/hooks/use-search';

export function GlobalSearchBar(): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { results, isLoading } = useSearch(query);

  return (
    <div className="relative w-full max-w-md">
      {/* Search Input Field */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search companies, contacts, leads, deals..."
          className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 transition-all focus:border-forge-500 focus:outline-none focus:ring-1 focus:ring-forge-500"
        />
        <svg
          className="absolute left-3 top-2.5 h-4 w-4 text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl">
          {isLoading ? (
            <div className="p-4 text-center text-xs text-slate-500">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="max-h-80 space-y-1 overflow-y-auto">
              {results.map((item) => (
                <a
                  key={item.id}
                  href={item.url || '#'}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-slate-800/80"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="rounded bg-forge-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-forge-400">
                      {item.entity_type}
                    </span>
                    <span className="truncate text-slate-200">{item.title}</span>
                  </div>
                  {item.subtitle && (
                    <span className="truncate text-xs text-slate-500">{item.subtitle}</span>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
