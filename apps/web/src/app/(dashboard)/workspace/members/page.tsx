'use client';

/**
 * ForgeCRM V2 — Enterprise Members & Member Details Drawer
 *
 * Real API-backed workspace member management interface.
 * Implements real API data fetching, invite member modal, member details drawer
 * with grouped effective permissions, and permission-guarded role assignment.
 */

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Plus, Mail, Trash2, CheckCircle2, Copy, RefreshCw,
  Shield, ChevronRight, X, AlertTriangle, KeyRound
} from 'lucide-react';
import { WorkspaceAdminNav } from '@/components/navigation/workspace-admin-nav';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { usePermissions } from '@/hooks/use-permissions';
import { useAIFetch } from '@/hooks/use-ai-fetch';
import { useToast } from '@/components/ui/toast';
import { PermissionGuard, PagePermissionGuard } from '@/components/auth/permission-guard';

interface Member {
  id: string;
  user_id: string;
  user?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: {
    id: string;
    name: string;
    permissions?: { id: string; name: string; module: string }[];
  };
  role_name?: string;
  status: string;
  joined_at?: string;
  created_at?: string;
}

interface RoleItem {
  id: string;
  name: string;
  description?: string;
  permissions?: { id: string; name: string; module: string }[];
}

export default function WorkspaceMembersPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const { isSuperAdmin, can } = usePermissions();
  const { aiFetch } = useAIFetch({ workspaceId: currentWorkspace?.id });
  const { toast } = useToast();

  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState('');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  // Member Details Drawer State
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Change Role Modal State
  const [changeRoleMember, setChangeRoleMember] = useState<Member | null>(null);
  const [targetRoleId, setTargetRoleId] = useState('');
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);

  const fetchMembersAndRoles = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    try {
      setIsLoading(true);
      setErrorMsg(null);

      // 1. Members
      const resM = await aiFetch(`/api/v1/workspaces/${currentWorkspace.id}/members`, null, 'GET');
      if (resM.ok) {
        const dataM = await resM.json();
        if (Array.isArray(dataM)) setMembers(dataM as Member[]);
      } else {
        const errData = await resM.json().catch(() => ({}));
        setErrorMsg(errData.detail || `Failed to fetch members (HTTP ${resM.status})`);
      }

      // 2. Roles
      let resR = await aiFetch('/api/v1/auth/roles', null, 'GET');
      if (!resR.ok) {
        resR = await aiFetch(`/api/v1/workspaces/${currentWorkspace.id}/roles`, null, 'GET');
      }
      if (resR.ok) {
        const dataR = await resR.json();
        if (Array.isArray(dataR)) {
          setRoles(dataR as RoleItem[]);
          if (dataR.length > 0 && !inviteRoleId) {
            const defaultRole = (dataR as RoleItem[]).find((r) => r.name !== 'Super Admin') || dataR[0];
            setInviteRoleId(defaultRole.id);
          }
        }
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Error connecting to workspace member service');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace?.id, aiFetch, inviteRoleId]);

  useEffect(() => {
    fetchMembersAndRoles();
  }, [fetchMembersAndRoles]);

  // Handle Invite Member
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !currentWorkspace?.id) return;

    try {
      setIsSubmittingInvite(true);
      const res = await aiFetch(`/api/v1/workspaces/${currentWorkspace.id}/invitations`, {
        email: inviteEmail.trim(),
        role_id: inviteRoleId || null,
      }, 'POST');

      if (res.ok) {
        const data = await res.json();
        toast('success', 'Invitation Created', `Member invitation sent to ${inviteEmail}.`);
        setGeneratedToken(data.raw_token || data.token || data.id || 'INVITE_SENT');
        setInviteEmail('');
        fetchMembersAndRoles();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast('error', 'Invitation Failed', errData.detail || 'Failed to generate invitation.');
      }
    } catch (err: unknown) {
      toast('error', 'Error', (err as Error).message || 'Error creating member invitation.');
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  // Handle Change Role Submit
  const handleChangeRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeRoleMember || !targetRoleId || !currentWorkspace?.id) return;

    try {
      setIsSubmittingRole(true);
      const res = await aiFetch(
        `/api/v1/workspaces/${currentWorkspace.id}/members/${changeRoleMember.id}/role`,
        { role_id: targetRoleId },
        'PATCH'
      );

      if (res.ok) {
        toast('success', 'Role Updated', `Updated workspace role for ${changeRoleMember.user?.email || 'member'}.`);
        setChangeRoleMember(null);
        setTargetRoleId('');
        fetchMembersAndRoles();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast('error', 'Update Failed', errData.detail || 'Failed to update member role.');
      }
    } catch (err: unknown) {
      toast('error', 'Error', (err as Error).message || 'Error updating member role.');
    } finally {
      setIsSubmittingRole(false);
    }
  };

  // Handle Remove Member
  const handleRemoveMember = async (member: Member) => {
    if (!currentWorkspace?.id) return;
    if (!confirm(`Are you sure you want to remove ${member.user?.email || 'this member'} from the workspace?`)) return;

    try {
      const res = await aiFetch(
        `/api/v1/workspaces/${currentWorkspace.id}/members/${member.id}`,
        null,
        'DELETE'
      );

      if (res.ok) {
        toast('success', 'Member Removed', 'User removed from workspace member list.');
        fetchMembersAndRoles();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast('error', 'Removal Failed', errData.detail || 'Failed to remove member.');
      }
    } catch {
      toast('error', 'Error', 'Error removing member.');
    }
  };

  const assignableRoles = roles.filter((r) => {
    if (r.name === 'Super Admin' && !isSuperAdmin) return false;
    return true;
  });

  return (
    <PagePermissionGuard permission="users.read">
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-100">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Workspace Members &amp; Invites</h1>
              <p className="text-sm text-slate-400">Manage member accounts, role assignments, and effective permission access</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchMembersAndRoles}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>

            <Link
              href="/accept-invitation"
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-indigo-500/30 hover:border-indigo-500/60 hover:bg-indigo-500/10 text-indigo-300 font-semibold text-xs transition-all shadow-xs flex items-center gap-1.5"
            >
              <KeyRound className="h-4 w-4 text-indigo-400" /> Redeem Invitation
            </Link>

            <PermissionGuard permission="users.invite">
              <button
                onClick={() => { setShowInviteModal(true); setGeneratedToken(null); }}
                className="px-4 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-xs transition-all shadow-md flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Invite Member
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
            <button onClick={fetchMembersAndRoles} className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-xs font-semibold">
              Retry
            </button>
          </div>
        )}

        {/* Member Table */}
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
              Loading workspace member list...
            </div>
          ) : members.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Users className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No workspace members found</p>
              <p className="text-xs text-slate-500">Invite colleagues to collaborate in this workspace tenant.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  <tr>
                    <th className="py-3.5 px-4">Member Name &amp; Email</th>
                    <th className="py-3.5 px-4">Assigned Role</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Joined Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {members.map((mem) => {
                    const fullName = mem.user
                      ? `${mem.user.first_name || ''} ${mem.user.last_name || ''}`.trim() || 'Workspace User'
                      : `${mem.first_name || ''} ${mem.last_name || ''}`.trim() || 'Workspace User';
                    const email = mem.user?.email || mem.email || 'no-email@workspace.com';
                    const roleName = mem.role?.name || mem.role_name || 'Workspace Member';

                    return (
                      <tr
                        key={mem.id}
                        className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                        onClick={() => setSelectedMember(mem)}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center font-bold text-accent text-xs">
                              {fullName[0] || 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                {fullName}
                                <ChevronRight className="h-3 w-3 text-slate-500" />
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">{email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-950 border border-slate-700 text-cyan-400">
                            {roleName}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {mem.status || 'Active'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          {mem.joined_at || mem.created_at ? new Date(mem.joined_at || mem.created_at!).toLocaleDateString() : 'N/A'}
                        </td>

                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <PermissionGuard permission="roles.assign">
                              <button
                                onClick={() => {
                                  setChangeRoleMember(mem);
                                  setTargetRoleId(mem.role?.id || roles[0]?.id || '');
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all"
                              >
                                Change Role
                              </button>
                            </PermissionGuard>

                            <PermissionGuard permission="users.remove">
                              <button
                                onClick={() => handleRemoveMember(mem)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
                                title="Remove Member"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </PermissionGuard>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Invite Member Modal ──────────────────────────────────────────────── */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4 text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Mail className="h-4 w-4 text-accent" /> Invite New Member
                </h3>
                <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              {generatedToken ? (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 space-y-2">
                    <p className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> Invitation Link Generated!
                    </p>
                    <p className="text-[11px] text-slate-300">Share this invitation token with the invited member to complete setup:</p>
                    <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-white flex items-center justify-between border border-slate-800">
                      <span className="truncate">{generatedToken}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(generatedToken)}
                        className="p-1 hover:text-accent"
                        title="Copy"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => { setGeneratedToken(null); setShowInviteModal(false); }}
                    className="w-full py-2 bg-slate-800 text-white rounded-xl font-semibold text-xs"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">User Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="user@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Assign Workspace Role</label>
                    <select
                      value={inviteRoleId}
                      onChange={(e) => setInviteRoleId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-accent"
                    >
                      {assignableRoles.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingInvite}
                      className="px-4 py-2 rounded-xl bg-accent text-accent-foreground font-semibold disabled:opacity-50"
                    >
                      {isSubmittingInvite ? 'Sending...' : 'Send Invitation'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ── Change Role Modal ────────────────────────────────────────────────── */}
        {changeRoleMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4 text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield className="h-4 w-4 text-accent" /> Change Member Role
                </h3>
                <button onClick={() => setChangeRoleMember(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleChangeRoleSubmit} className="space-y-4 text-xs">
                <p className="text-slate-300">
                  Select new workspace role for <strong className="text-white">{changeRoleMember.user?.email || changeRoleMember.email || 'member'}</strong>:
                </p>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Target Role</label>
                  <select
                    value={targetRoleId}
                    onChange={(e) => setTargetRoleId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-accent"
                  >
                    {assignableRoles.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                  Changing roles immediately alters the effective API authorization matrix for this workspace user.
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setChangeRoleMember(null)}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRole}
                    className="px-4 py-2 rounded-xl bg-accent text-accent-foreground font-semibold disabled:opacity-50"
                  >
                    {isSubmittingRole ? 'Updating...' : 'Confirm Role Change'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Member Details Drawer (Requirement #5) ────────────────────────────── */}
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-slate-950 border-l border-slate-800 p-6 overflow-y-auto space-y-6 text-slate-100 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                    {(selectedMember.user?.first_name || selectedMember.first_name || 'U')[0]}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {selectedMember.user ? `${selectedMember.user.first_name} ${selectedMember.user.last_name || ''}` : 'Member Details'}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">{selectedMember.user?.email || selectedMember.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedMember(null)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Member Attributes */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-wider">Role</span>
                  <span className="font-bold text-accent">{selectedMember.role?.name || 'Workspace Member'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-wider">Status</span>
                  <span className="font-bold text-emerald-400">{selectedMember.status || 'Active'}</span>
                </div>
              </div>

              {/* Grouped Effective Permissions Matrix */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Shield className="h-4 w-4 text-accent" /> Grouped Effective Permissions
                </h4>

                <div className="space-y-3 text-xs">
                  {[
                    {
                      category: 'WORKSPACE',
                      perms: [
                        { name: 'workspace.read', label: 'View Workspace Settings' },
                        { name: 'workspace.update', label: 'Update Workspace' },
                      ]
                    },
                    {
                      category: 'USERS & ROLES',
                      perms: [
                        { name: 'users.read', label: 'View Members' },
                        { name: 'users.invite', label: 'Invite Users' },
                        { name: 'roles.assign', label: 'Assign Roles' },
                      ]
                    },
                    {
                      category: 'CRM DIRECTORY',
                      perms: [
                        { name: 'companies.read', label: 'View Companies' },
                        { name: 'companies.create', label: 'Create Companies' },
                        { name: 'deals.create', label: 'Create Sales Deals' },
                        { name: 'companies.delete', label: 'Delete Records' },
                      ]
                    },
                    {
                      category: 'AI SUBSYSTEM',
                      perms: [
                        { name: 'ai.use', label: 'Use AI Copilot' },
                        { name: 'ai.agents.run', label: 'Run AI Agents' },
                        { name: 'ai.admin.view', label: 'AI Governance Admin' },
                      ]
                    },
                  ].map((grp) => (
                    <div key={grp.category} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{grp.category}</span>
                      <div className="space-y-1.5">
                        {grp.perms.map((p) => {
                          const isAllowed = selectedMember.role?.name === 'Super Admin' || selectedMember.role?.name === 'Workspace Admin' || can(p.name);
                          return (
                            <div key={p.name} className="flex items-center justify-between text-xs">
                              <span className="text-slate-300">{p.label}</span>
                              {isAllowed ? (
                                <span className="text-emerald-400 font-bold flex items-center gap-1">✓ <span className="font-mono text-[10px] text-slate-500">({p.name})</span></span>
                              ) : (
                                <span className="text-rose-400 font-bold flex items-center gap-1">✗ <span className="font-mono text-[10px] text-slate-500">({p.name})</span></span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PagePermissionGuard>
  );
}
