'use client';

import { useState } from 'react';

import { useToast } from '@/components/ui/toast';
import { useWorkspace } from '@/hooks/use-workspace';
import {
  CURRENCY_OPTIONS,
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
} from '@/lib/formatters';

const INDUSTRY_OPTIONS = [
  'Software & SaaS',
  'Healthcare & Life Sciences',
  'Financial Services & Fintech',
  'E-commerce & Retail',
  'Real Estate & Construction',
  'Professional Services & Consulting',
  'Media & Entertainment',
  'Education',
  'Manufacturing',
  'Other',
];

const COMPANY_SIZE_OPTIONS = [
  { value: 5, label: '1 - 10 employees' },
  { value: 25, label: '11 - 50 employees' },
  { value: 100, label: '51 - 200 employees' },
  { value: 350, label: '201 - 500 employees' },
  { value: 1000, label: '500+ employees' },
];

export function CreateWorkspaceModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}): React.JSX.Element | null {
  const { createWorkspace, updateWorkspaceSettings, isCreating } = useWorkspace();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    industry: 'Software & SaaS',
    website: '',
    company_size: '5',
    timezone: 'UTC',
    currency: 'USD',
    language: 'en',
  });

  const [slugError, setSlugError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSlugChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    setFormData((prev) => ({ ...prev, slug: clean }));
    if (clean && !/^[a-z0-9-]+$/.test(clean)) {
      setSlugError('Slug can only contain lowercase letters, numbers, and hyphens.');
    } else {
      setSlugError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSlugError(null);

    if (!formData.name.trim()) {
      setError('Workspace name is required.');
      return;
    }

    try {
      // 1. Create Workspace
      const newWs = await createWorkspace({
        name: formData.name.trim(),
        ...(formData.slug.trim() ? { slug: formData.slug.trim() } : {}),
        ...(formData.industry ? { industry: formData.industry } : {}),
        ...(formData.website ? { website: formData.website } : {}),
        company_size: Number(formData.company_size),
      });

      // 2. Configure initial Workspace Settings (currency, timezone, language)
      if (newWs?.id) {
        try {
          await updateWorkspaceSettings({
            workspaceId: newWs.id,
            payload: {
              timezone: formData.timezone,
              currency: formData.currency,
              language: formData.language,
            },
          });
        } catch {
          // Non-blocking if settings patch fails
        }
      }

      toast('success', 'Workspace Created', `"${formData.name}" is now active.`);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace.');
    }
  };

  const inputCls =
    'w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-forge-500 transition-colors';
  const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Create New Workspace</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Set up a dedicated multi-tenant workspace for your organization.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Workspace Name & Slug */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>
                Workspace Name <span className="text-rose-400">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="Acme Corp"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>URL Slug</label>
              <input
                type="text"
                placeholder="acme-corp"
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className={inputCls}
              />
              {slugError && <p className="text-[11px] text-rose-400 mt-1">{slugError}</p>}
            </div>
          </div>

          {/* Industry & Company Size */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Industry</label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className={inputCls}
              >
                {INDUSTRY_OPTIONS.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Company Size</label>
              <select
                value={formData.company_size}
                onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
                className={inputCls}
              >
                {COMPANY_SIZE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Website */}
          <div>
            <label className={labelCls}>Website URL</label>
            <input
              type="url"
              placeholder="https://acme.com"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className={inputCls}
            />
          </div>

          {/* Regional Settings Divider */}
          <div className="pt-2 border-t border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-forge-400 mb-3">
              Regional & Formatting Preferences
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className={labelCls}>Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className={inputCls}
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Timezone</label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className={inputCls}
                >
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.value}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Language</label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className={inputCls}
                >
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="rounded-lg bg-forge-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-forge-500/20 hover:bg-forge-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isCreating ? 'Creating Workspace...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
