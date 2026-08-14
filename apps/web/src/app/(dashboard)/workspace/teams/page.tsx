'use client';

/**
 * ForgeCRM V2 — Teams & Organizational Hierarchy
 *
 * Real API-backed workspace sales teams & organizational hierarchy management interface.
 * Supports team creation, editing, deletion, and member association.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Plus, FolderTree, Layers, RefreshCw, AlertTriangle, Trash2, Edit
} from 'lucide-react';
import { WorkspaceAdminNav } from '@/components/navigation/workspace-admin-nav';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAIFetch } from '@/hooks/use-ai-fetch';
import { useToast } from '@/components/ui/toast';
import { PermissionGuard, PagePermissionGuard } from '@/components/auth/permission-guard';

interface Team {
  id: string;
  workspace_id: string;
  name: string;
  description?: string | null;
  manager_member_id?: string | null;
  created_at: string;
  members_count?: number;
}

export default function WorkspaceTeamsPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const { aiFetch } = useAIFetch({ workspaceId: currentWorkspace?.id });
  const { toast } = useToast();

  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTeams = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await aiFetch(`/api/v1/workspaces/${currentWorkspace.id}/teams`, null, 'GET');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setTeams(data as Team[]);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMsg(errData.detail || `Failed to load teams (HTTP ${res.status})`);
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Error connecting to workspace team service');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace?.id, aiFetch]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !currentWorkspace?.id) return;

    try {
      setIsSubmitting(true);
      if (editingTeam) {
        // Update
        const res = await aiFetch(
          `/api/v1/workspaces/${currentWorkspace.id}/teams/${editingTeam.id}`,
          { name: name.trim(), description: description.trim() || null },
          'PATCH'
        );
        if (res.ok) {
          toast('success', 'Team Updated', `Team "${name}" updated successfully.`);
          setEditingTeam(null);
          setName('');
          setDescription('');
          fetchTeams();
        } else {
          const errData = await res.json().catch(() => ({}));
          toast('error', 'Update Failed', errData.detail || 'Failed to update team.');
        }
      } else {
        // Create
        const res = await aiFetch(
          `/api/v1/workspaces/${currentWorkspace.id}/teams`,
          { name: name.trim(), description: description.trim() || null },
          'POST'
        );
        if (res.ok) {
          toast('success', 'Team Created', `Sales team "${name}" created successfully.`);
          setShowCreateModal(false);
          setName('');
          setDescription('');
          fetchTeams();
        } else {
          const errData = await res.json().catch(() => ({}));
          toast('error', 'Creation Failed', errData.detail || 'Failed to create team.');
        }
      }
    } catch (err: unknown) {
      toast('error', 'Error', (err as Error).message || 'Error saving team.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeam = async (team: Team) => {
    if (!currentWorkspace?.id) return;
    if (!confirm(`Are you sure you want to delete team "${team.name}"?`)) return;

    try {
      const res = await aiFetch(
        `/api/v1/workspaces/${currentWorkspace.id}/teams/${team.id}`,
        null,
        'DELETE'
      );
      if (res.ok) {
        toast('success', 'Team Deleted', `Deleted team "${team.name}".`);
        fetchTeams();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast('error', 'Delete Failed', errData.detail || 'Failed to delete team.');
      }
    } catch {
      toast('error', 'Error', 'Error deleting team.');
    }
  };

  return (
    <PagePermissionGuard permission="teams.read">
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-100">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <FolderTree className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Teams &amp; Organizational Hierarchy</h1>
              <p className="text-sm text-slate-400">Configure functional units, sales divisions, and team member assignments</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchTeams}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>

            <PermissionGuard permission="teams.create">
              <button
                onClick={() => { setShowCreateModal(true); setEditingTeam(null); setName(''); setDescription(''); }}
                className="px-4 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-xs transition-all shadow-md flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Create Team
              </button>
            </PermissionGuard>
          </div>
        </div>

        {/* Workspace Admin Navigation */}
        <WorkspaceAdminNav />

        {/* Error State */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={fetchTeams} className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-xs font-semibold">
              Retry
            </button>
          </div>
        )}

        {/* Teams List */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
            Loading workspace teams...
          </div>
        ) : teams.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
            <FolderTree className="h-8 w-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No organizational teams created</p>
            <p className="text-xs text-slate-500">Create team structures to group members by sales region or territory.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((t) => (
              <div key={t.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-white flex items-center gap-2">
                      <Layers className="h-4 w-4 text-accent" /> {t.name}
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-950 text-cyan-400 border border-slate-800">
                      {t.members_count ?? 0} Members
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 min-h-[36px]">{t.description || 'Enterprise Sales Division'}</p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono text-[10px]">Created: {new Date(t.created_at).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1">
                    <PermissionGuard permission="teams.update">
                      <button
                        onClick={() => {
                          setEditingTeam(t);
                          setName(t.name);
                          setDescription(t.description || '');
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        title="Edit Team"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                    </PermissionGuard>

                    <PermissionGuard permission="teams.delete">
                      <button
                        onClick={() => handleDeleteTeam(t)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20"
                        title="Delete Team"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </PermissionGuard>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Create / Edit Team Modal ───────────────────────────────────────────── */}
        {(showCreateModal || editingTeam) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4 text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-accent" /> {editingTeam ? 'Edit Team' : 'Create Organizational Team'}
                </h3>
                <button onClick={() => { setShowCreateModal(false); setEditingTeam(null); }} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleSaveTeam} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Team Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Enterprise Sales APAC"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Team division purpose and territory responsibility"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-accent resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowCreateModal(false); setEditingTeam(null); }}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl bg-accent text-accent-foreground font-semibold disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : editingTeam ? 'Save Changes' : 'Create Team'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PagePermissionGuard>
  );
}
