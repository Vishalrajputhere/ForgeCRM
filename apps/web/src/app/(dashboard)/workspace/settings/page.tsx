'use client';

import * as React from 'react';
import { Sliders, Save, Globe, Clock, DollarSign, Calendar } from 'lucide-react';
import { WorkspaceAdminNav } from '@/components/navigation/workspace-admin-nav';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAIFetch } from '@/hooks/use-ai-fetch';
import { useToast } from '@/components/ui/toast';

export default function WorkspaceSettingsPage() {
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const { aiFetch } = useAIFetch({ workspaceId: currentWorkspace?.id });
  const { toast } = useToast();

  const [name, setName] = React.useState(currentWorkspace?.name || '');
  const [industry, setIndustry] = React.useState(currentWorkspace?.industry || 'Technology & B2B SaaS');
  const [website, setWebsite] = React.useState(currentWorkspace?.website || 'https://forgecrm.io');
  const [timezone, setTimezone] = React.useState('UTC');
  const [currency, setCurrency] = React.useState('USD');
  const [dateFormat, setDateFormat] = React.useState('YYYY-MM-DD');
  const [timeFormat, setTimeFormat] = React.useState('24h');
  const [weekStartDay, setWeekStartDay] = React.useState(1);
  const [primaryColor, setPrimaryColor] = React.useState('#06b6d4');
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    async function loadSettings() {
      if (!currentWorkspace?.id) return;
      try {
        const res = await aiFetch(`/api/v1/workspaces/${currentWorkspace.id}/settings`, null, 'GET');
        if (res.ok) {
          const s = await res.json();
          if (s.timezone) setTimezone(s.timezone);
          if (s.currency) setCurrency(s.currency);
          if (s.date_format) setDateFormat(s.date_format);
          if (s.time_format) setTimeFormat(s.time_format);
          if (s.week_start_day !== undefined) setWeekStartDay(s.week_start_day);
          if (s.branding_primary_color) setPrimaryColor(s.branding_primary_color);
        }
      } catch {
        // silent
      }
    }
    loadSettings();
  }, [currentWorkspace?.id, aiFetch]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace?.id) return;

    try {
      setIsSaving(true);
      // 1. Update workspace metadata
      const resWs = await aiFetch(`/api/v1/workspaces/${currentWorkspace.id}`, {
        name,
        industry,
        website,
      }, 'PATCH');

      if (resWs.ok) {
        const updatedWs = await resWs.json();
        setCurrentWorkspace(updatedWs);
      }

      // 2. Update regional settings
      const resSettings = await aiFetch(`/api/v1/workspaces/${currentWorkspace.id}/settings`, {
        timezone,
        currency,
        date_format: dateFormat,
        time_format: timeFormat,
        week_start_day: weekStartDay,
        branding_primary_color: primaryColor,
      }, 'PATCH');

      if (resSettings.ok) {
        toast('success', 'Settings Saved', 'Workspace organization and regional preferences updated.');
      } else {
        toast('error', 'Update Failed', 'Failed to update workspace settings.');
      }
    } catch (err: unknown) {
      toast('error', 'Error', (err as Error).message || 'Error saving workspace settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">General &amp; Regional Settings</h1>
            <p className="text-sm text-slate-400">Manage workspace branding, regional currency formats, timezones, and localization</p>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <WorkspaceAdminNav />

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* Workspace Organization Info */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Globe className="h-4 w-4 text-cyan-400" /> Organization Profile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Workspace Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Industry Sector</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Corporate Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Workspace Slug (Tenant Identifier)</label>
              <input
                type="text"
                disabled
                value={currentWorkspace?.slug || 'workspace-slug'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 text-sm text-slate-500 cursor-not-allowed font-mono"
              />
            </div>
          </div>
        </div>

        {/* Regional & Formatting Preferences */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-400" /> Regional Localization &amp; Currency
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" /> Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-purple-500/50"
              >
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">Eastern Time (US &amp; Canada)</option>
                <option value="America/Los_Angeles">Pacific Time (US &amp; Canada)</option>
                <option value="Europe/London">London (GMT/BST)</option>
                <option value="Asia/Kolkata">India Standard Time (IST)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" /> Currency Symbol
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500/50"
              >
                <option value="USD">USD ($ United States Dollar)</option>
                <option value="EUR">EUR (€ Euro)</option>
                <option value="GBP">GBP (£ British Pound)</option>
                <option value="INR">INR (₹ Indian Rupee)</option>
                <option value="CAD">CAD ($ Canadian Dollar)</option>
                <option value="AUD">AUD ($ Australian Dollar)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-amber-400" /> Date Format
              </label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none"
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO standard)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (US standard)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (UK/EU standard)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold hover:from-cyan-400 hover:to-blue-500 shadow-md transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
}
