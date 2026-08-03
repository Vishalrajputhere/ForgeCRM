'use client';

import { useEffect, useState } from 'react';

import { useToast } from '@/components/ui/toast';
import { useWorkspace } from '@/hooks/use-workspace';
import {
  CURRENCY_OPTIONS,
  DATE_FORMAT_OPTIONS,
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
  WEEK_START_OPTIONS,
} from '@/lib/formatters';
import type { WorkspaceSettingsUpdate, WorkspaceUpdate } from '@/types';

type Tab = 'overview' | 'settings' | 'members';

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

export default function WorkspacePage(): React.JSX.Element {
  const {
    currentWorkspace,
    updateWorkspace,
    isUpdating,
    updateWorkspaceSettings,
    isUpdatingSettings,
    inviteMember,
    isInviting,
    useWorkspaceMembers,
    useWorkspaceSettings,
    useRoles,
  } = useWorkspace();

  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const workspaceId = currentWorkspace?.id;

  // Queries
  const membersQuery = useWorkspaceMembers(workspaceId);
  const settingsQuery = useWorkspaceSettings(workspaceId);
  const rolesQuery = useRoles();

  // ── Overview Tab Form State ────────────────────────────────────────────────
  const [overviewForm, setOverviewForm] = useState({
    name: '',
    slug: '',
    industry: '',
    website: '',
    logo_url: '',
    company_size: '5',
  });

  const [initialOverview, setInitialOverview] = useState(overviewForm);

  useEffect(() => {
    if (currentWorkspace) {
      const init = {
        name: currentWorkspace.name,
        slug: currentWorkspace.slug,
        industry: currentWorkspace.industry ?? 'Software & SaaS',
        website: currentWorkspace.website ?? '',
        logo_url: currentWorkspace.logo_url ?? '',
        company_size: currentWorkspace.company_size?.toString() ?? '5',
      };
      setOverviewForm(init);
      setInitialOverview(init);
    }
  }, [currentWorkspace]);

  const isOverviewDirty =
    JSON.stringify(overviewForm) !== JSON.stringify(initialOverview);

  const handleOverviewSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    try {
      const payload: WorkspaceUpdate = {
        name: overviewForm.name,
        slug: overviewForm.slug || undefined,
        industry: overviewForm.industry || undefined,
        website: overviewForm.website || undefined,
        logo_url: overviewForm.logo_url || undefined,
        company_size: Number(overviewForm.company_size) || undefined,
      };
      await updateWorkspace({ workspaceId, payload });
      toast('success', 'Workspace Updated', 'Workspace details saved successfully.');
      setInitialOverview(overviewForm);
    } catch (err: unknown) {
      toast('error', 'Update Failed', err instanceof Error ? err.message : 'Failed to update workspace.');
    }
  };

  const handleOverviewCancel = () => {
    setOverviewForm(initialOverview);
  };

  // ── Settings Tab Form State ────────────────────────────────────────────────
  const settings = settingsQuery.data;
  const [settingsForm, setSettingsForm] = useState<WorkspaceSettingsUpdate>({
    timezone: 'UTC',
    currency: 'USD',
    language: 'en',
    date_format: 'YYYY-MM-DD',
    time_format: '24h',
    week_start_day: 0,
  });

  const [initialSettings, setInitialSettings] = useState(settingsForm);

  useEffect(() => {
    if (settings) {
      const init = {
        timezone: settings.timezone ?? 'UTC',
        currency: settings.currency ?? 'USD',
        language: settings.language ?? 'en',
        date_format: settings.date_format ?? 'YYYY-MM-DD',
        time_format: settings.time_format ?? '24h',
        week_start_day: settings.week_start_day ?? 0,
      };
      setSettingsForm(init);
      setInitialSettings(init);
    }
  }, [settings]);

  const isSettingsDirty =
    JSON.stringify(settingsForm) !== JSON.stringify(initialSettings);

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    try {
      await updateWorkspaceSettings({ workspaceId, payload: settingsForm });
      toast('success', 'Settings Saved', 'Regional and locale settings updated.');
      setInitialSettings(settingsForm);
    } catch (err: unknown) {
      toast('error', 'Save Failed', err instanceof Error ? err.message : 'Failed to update settings.');
    }
  };

  const handleSettingsCancel = () => {
    setSettingsForm(initialSettings);
  };

  // ── Members & Invite Modal State ──────────────────────────────────────────
  const [memberSearch, setMemberSearch] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [inviteResult, setInviteResult] = useState<{ token?: string; email?: string } | null>(null);

  const members = membersQuery.data ?? [];
  const filteredMembers = members.filter((m) => {
    if (!memberSearch) return true;
    const q = memberSearch.toLowerCase();
    return (
      m.user.first_name.toLowerCase().includes(q) ||
      m.user.last_name.toLowerCase().includes(q) ||
      m.user.email.toLowerCase().includes(q)
    );
  });

  const roles = rolesQuery.data ?? [];
  const defaultRoleId = roles[0]?.id ?? members[0]?.role?.id;

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    const roleToAssign = selectedRoleId || defaultRoleId;
    if (!roleToAssign) {
      toast('error', 'Role Required', 'No role selected or available.');
      return;
    }

    try {
      const result = await inviteMember({
        workspaceId,
        payload: {
          email: inviteEmail.trim(),
          role_id: roleToAssign,
        },
      });
      setInviteResult({
        token: result.raw_token ?? '(Token created)',
        email: inviteEmail,
      });
      setInviteEmail('');
      toast('success', 'Invitation Sent', `Invite generated for ${inviteEmail}`);
    } catch (err: unknown) {
      toast('error', 'Invite Failed', err instanceof Error ? err.message : 'Failed to invite member.');
    }
  };

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast('info', 'Copied to Clipboard', text);
    }
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const inputCls =
    'w-full rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-forge-500 transition-colors';
  const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';
  const sectionCls = 'rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl space-y-5';

  const tabs: { id: Tab; label: string; icon: string }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    },
    {
      id: 'settings',
      label: 'Settings & Regional',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    },
    {
      id: 'members',
      label: 'Members & Invites',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Workspace Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure customer organization settings, regional localization, and team access.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 shadow-lg backdrop-blur-xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-forge-600 to-indigo-500 text-sm font-bold text-white shadow-md">
            {currentWorkspace?.name[0]?.toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{currentWorkspace?.name}</div>
            <div className="text-[11px] text-forge-400 font-mono">
              slug: {currentWorkspace?.slug}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 p-1.5 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-forge-600/20 text-forge-400 font-semibold border border-forge-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className={sectionCls}>
          {isOverviewDirty && (
            <div className="flex items-center justify-between rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-xs text-amber-300">
              <span className="font-medium">⚠ You have unsaved changes in Workspace Details.</span>
              <button
                type="button"
                onClick={handleOverviewCancel}
                className="underline hover:text-white font-semibold"
              >
                Discard Changes
              </button>
            </div>
          )}

          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-semibold text-white">General Overview</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Update organization metadata, branding, and industry context.
            </p>
          </div>

          <form onSubmit={handleOverviewSave} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>
                  Workspace Name <span className="text-rose-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={overviewForm.name}
                  onChange={(e) => setOverviewForm({ ...overviewForm, name: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>URL Slug</label>
                <input
                  type="text"
                  value={overviewForm.slug}
                  onChange={(e) => setOverviewForm({ ...overviewForm, slug: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Industry</label>
                <select
                  value={overviewForm.industry}
                  onChange={(e) => setOverviewForm({ ...overviewForm, industry: e.target.value })}
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
                  value={overviewForm.company_size}
                  onChange={(e) => setOverviewForm({ ...overviewForm, company_size: e.target.value })}
                  className={inputCls}
                >
                  {COMPANY_SIZE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Website URL</label>
                <input
                  type="url"
                  placeholder="https://company.com"
                  value={overviewForm.website}
                  onChange={(e) => setOverviewForm({ ...overviewForm, website: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Branding / Logo URL</label>
                <input
                  type="url"
                  placeholder="https://company.com/logo.png"
                  value={overviewForm.logo_url}
                  onChange={(e) => setOverviewForm({ ...overviewForm, logo_url: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Read-only Information Card */}
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-800 bg-slate-800/40 p-4 sm:grid-cols-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Workspace ID
                </div>
                <button
                  type="button"
                  onClick={() => workspaceId && copyToClipboard(workspaceId)}
                  className="font-mono text-xs text-forge-400 hover:underline truncate block text-left"
                >
                  {workspaceId ?? '—'}
                </button>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Subscription Plan
                </div>
                <span className="rounded-full bg-forge-500/20 px-2.5 py-0.5 text-xs font-semibold text-forge-300 border border-forge-500/30 capitalize">
                  {currentWorkspace?.subscription_plan ?? 'Free'}
                </span>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Status
                </div>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                  {currentWorkspace?.status ?? 'Active'}
                </span>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Created
                </div>
                <div className="text-xs text-slate-300 font-medium">
                  {currentWorkspace?.created_at
                    ? new Date(currentWorkspace.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—'}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              {isOverviewDirty && (
                <button
                  type="button"
                  onClick={handleOverviewCancel}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isUpdating || !isOverviewDirty}
                className="rounded-lg bg-forge-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-forge-500/20 hover:bg-forge-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isUpdating ? 'Saving...' : 'Save Overview'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Settings Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div className={sectionCls}>
          {isSettingsDirty && (
            <div className="flex items-center justify-between rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-xs text-amber-300">
              <span className="font-medium">⚠ You have unsaved changes in Regional Settings.</span>
              <button
                type="button"
                onClick={handleSettingsCancel}
                className="underline hover:text-white font-semibold"
              >
                Discard Changes
              </button>
            </div>
          )}

          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-semibold text-white">Dynamic Regional & Localization Settings</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Changes to Currency, Timezone, and Formatting immediately apply across Dashboard, Deals, Tasks, and Analytics.
            </p>
          </div>

          {settingsQuery.isLoading ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Loading workspace regional settings...
            </div>
          ) : (
            <form onSubmit={handleSettingsSave} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Timezone */}
                <div>
                  <label className={labelCls}>Workspace Timezone</label>
                  <select
                    value={settingsForm.timezone ?? 'UTC'}
                    onChange={(e) => setSettingsForm({ ...settingsForm, timezone: e.target.value })}
                    className={inputCls}
                  >
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Controls display of task due dates, timeline events, and activity logs.
                  </p>
                </div>

                {/* Currency */}
                <div>
                  <label className={labelCls}>Primary Currency</label>
                  <select
                    value={settingsForm.currency ?? 'USD'}
                    onChange={(e) => setSettingsForm({ ...settingsForm, currency: e.target.value })}
                    className={inputCls}
                  >
                    {CURRENCY_OPTIONS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label} ({c.symbol})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Controls financial values across Pipeline, Revenue Forecast, Deals, and Leads.
                  </p>
                </div>

                {/* Language */}
                <div>
                  <label className={labelCls}>Default Language</label>
                  <select
                    value={settingsForm.language ?? 'en'}
                    onChange={(e) => setSettingsForm({ ...settingsForm, language: e.target.value })}
                    className={inputCls}
                  >
                    {LANGUAGE_OPTIONS.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Format */}
                <div>
                  <label className={labelCls}>Date Format</label>
                  <select
                    value={settingsForm.date_format ?? 'YYYY-MM-DD'}
                    onChange={(e) => setSettingsForm({ ...settingsForm, date_format: e.target.value })}
                    className={inputCls}
                  >
                    {DATE_FORMAT_OPTIONS.map((df) => (
                      <option key={df.value} value={df.value}>
                        {df.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Week Start Day */}
                <div>
                  <label className={labelCls}>Week Starts On</label>
                  <select
                    value={settingsForm.week_start_day ?? 0}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, week_start_day: Number(e.target.value) })
                    }
                    className={inputCls}
                  >
                    {WEEK_START_OPTIONS.map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                {isSettingsDirty && (
                  <button
                    type="button"
                    onClick={handleSettingsCancel}
                    className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isUpdatingSettings || !isSettingsDirty}
                  className="rounded-lg bg-forge-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-forge-500/20 hover:bg-forge-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {isUpdatingSettings ? 'Saving Settings...' : 'Save All Settings'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── Members & Invites Tab ────────────────────────────────────────────── */}
      {activeTab === 'members' && (
        <div className="space-y-5">
          {/* Header Action Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500"
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
              <input
                type="text"
                placeholder="Search members by name or email..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-9 pr-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-forge-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="rounded-xl bg-forge-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-forge-500/20 hover:bg-forge-400 transition-all flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
              Invite Member
            </button>
          </div>

          {/* Members Table */}
          <div className={`${sectionCls} !space-y-0 !p-0 overflow-hidden`}>
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Active Members ({filteredMembers.length})</h2>
            </div>

            {membersQuery.isLoading ? (
              <div className="p-8 text-center text-sm text-slate-400">Loading members...</div>
            ) : filteredMembers.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-400">
                {memberSearch ? `No members match "${memberSearch}"` : 'No members in this workspace.'}
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-900/80 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-3.5">Member</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-forge-600/30 to-indigo-600/30 border border-forge-500/30 text-sm font-bold text-forge-300">
                            {member.user.first_name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {member.user.first_name} {member.user.last_name}
                            </div>
                            <div className="text-xs text-slate-400">{member.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300 capitalize">
                          {member.role.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold border ${
                            member.status === 'Active'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                          }`}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {member.joined_at
                          ? new Date(member.joined_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pending Invitations Banner / Card if token generated */}
          {inviteResult && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-emerald-400">
                  ✓ Invitation Token Generated for {inviteResult.email}
                </span>
                <button
                  type="button"
                  onClick={() => setInviteResult(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Dismiss
                </button>
              </div>
              <p className="text-xs text-slate-300">
                Share this token or token URL with the user to accept the invitation:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-xs bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-forge-300 break-all select-all">
                  {inviteResult.token}
                </code>
                <button
                  type="button"
                  onClick={() => inviteResult.token && copyToClipboard(inviteResult.token)}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
                >
                  Copy Token
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Invite Member Modal ──────────────────────────────────────────────── */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Invite Team Member</h3>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  required
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Assigned Role</label>
                <select
                  value={selectedRoleId || defaultRoleId || ''}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className={inputCls}
                >
                  {roles.length === 0 ? (
                    <option value="">Default Role (Workspace Admin / Member)</option>
                  ) : (
                    roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} — {r.description ?? 'System Role'}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="rounded-lg bg-forge-500 px-4 py-2 text-xs font-semibold text-white hover:bg-forge-400 disabled:opacity-40"
                >
                  {isInviting ? 'Generating Invitation...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
