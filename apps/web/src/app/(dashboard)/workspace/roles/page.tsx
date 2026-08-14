'use client';

/**
 * ForgeCRM V2 — Roles & Permissions Matrix
 *
 * Real API-backed workspace roles and permissions management interface.
 * Shows system & custom roles, permission matrix grouped by module,
 * and custom role creation with authorization safety checks.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Shield, Plus, Key, Sliders, CheckCircle2, XCircle,
  RefreshCw, AlertTriangle
} from 'lucide-react';
import { WorkspaceAdminNav } from '@/components/navigation/workspace-admin-nav';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { usePermissions } from '@/hooks/use-permissions';
import { useAIFetch } from '@/hooks/use-ai-fetch';
import { useToast } from '@/components/ui/toast';
import { PermissionGuard, PagePermissionGuard } from '@/components/auth/permission-guard';

interface PermissionItem {
  id: string;
  name: string;
  module: string;
  description?: string;
}

interface RoleItem {
  id: string;
  name: string;
  description?: string;
  is_system?: boolean;
  permissions?: PermissionItem[];
}

export default function WorkspaceRolesPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const { isSuperAdmin, can } = usePermissions();
  const { aiFetch } = useAIFetch({ workspaceId: currentWorkspace?.id });
  const { toast } = useToast();

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Custom Role Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRolesAndPermissions = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);

      // 1. Fetch Roles
      let resR = await aiFetch('/api/v1/auth/roles', null, 'GET');
      if (!resR.ok) {
        resR = await aiFetch('/api/v1/workspaces/roles', null, 'GET');
      }
      if (resR.ok) {
        const dataR = await resR.json();
        if (Array.isArray(dataR)) {
          setRoles(dataR as RoleItem[]);
          if (dataR.length > 0 && !selectedRole) {
            setSelectedRole(dataR[0]);
          }
        }
      } else {
        const errData = await resR.json().catch(() => ({}));
        setErrorMsg(errData.detail || `Failed to fetch roles (HTTP ${resR.status})`);
      }

      // 2. Fetch Permissions catalog
      const resP = await aiFetch('/api/v1/workspaces/permissions/all', null, 'GET');
      if (resP.ok) {
        const dataP = await resP.json();
        if (Array.isArray(dataP)) {
          setPermissions(dataP as PermissionItem[]);
        }
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Error connecting to authorization service');
    } finally {
      setIsLoading(false);
    }
  }, [aiFetch, selectedRole]);

  useEffect(() => {
    fetchRolesAndPermissions();
  }, [fetchRolesAndPermissions]);

  const togglePermissionSelection = (permId: string, permName: string) => {
    if (!isSuperAdmin && !can(permName)) {
      toast('error', 'Unauthorized', 'You cannot grant permissions you do not possess.');
      return;
    }
    setSelectedPermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const handleCreateCustomRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await aiFetch('/api/v1/workspaces/roles/custom', {
        name: roleName.trim(),
        description: roleDescription.trim() || 'Custom Enterprise Workspace Role',
        permission_ids: selectedPermIds,
      }, 'POST');

      if (res.ok) {
        toast('success', 'Role Created', `Custom role "${roleName}" created successfully.`);
        setShowCreateModal(false);
        setRoleName('');
        setRoleDescription('');
        setSelectedPermIds([]);
        fetchRolesAndPermissions();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast('error', 'Creation Failed', errData.detail || 'Failed to create custom role.');
      }
    } catch (err: unknown) {
      toast('error', 'Error', (err as Error).message || 'Error creating custom role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group permissions by module for permission matrix
  const permissionsByModule = permissions.reduce((acc, p) => {
    const mod = p.module || 'System';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {} as Record<string, PermissionItem[]>);

  return (
    <PagePermissionGuard permission="roles.read">
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-100">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Roles &amp; Permission Matrix</h1>
              <p className="text-sm text-slate-400">Configure system role definitions, granular resource permissions, and custom enterprise roles</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchRolesAndPermissions}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>

            <PermissionGuard permission="roles.manage">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-xs transition-all shadow-md flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Create Custom Role
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
            <button onClick={fetchRolesAndPermissions} className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-xs font-semibold">
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
            Loading system roles &amp; permission catalog...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Roles List */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Key className="h-4 w-4 text-accent" /> System &amp; Custom Roles ({roles.length})
              </h2>

              <div className="space-y-2">
                {roles.map((r) => {
                  const isSelected = selectedRole?.id === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRole(r)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer space-y-1 ${
                        isSelected
                          ? 'bg-accent/15 border-accent/40 text-white shadow-md'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{r.name}</span>
                        {r.is_system !== false ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-cyan-400 border border-slate-700">
                            System Role
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
                            Custom Role
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{r.description || 'Enterprise RBAC Role'}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Role Permission Detail Matrix */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
              {selectedRole ? (
                <>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Sliders className="h-5 w-5 text-accent" /> {selectedRole.name} — Permission Matrix
                      </h2>
                      <p className="text-xs text-slate-400">{selectedRole.description || 'Effective RBAC permissions for members assigned to this role'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {Object.keys(permissionsByModule).length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        No atomic permissions returned from server.
                      </div>
                    ) : (
                      Object.entries(permissionsByModule).map(([moduleName, perms]) => (
                        <div key={moduleName} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                          <h3 className="text-xs font-bold text-accent uppercase tracking-wider">{moduleName} Module</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {perms.map((p) => {
                              const isGranted =
                                selectedRole.name === 'Super Admin' ||
                                selectedRole.name === 'Workspace Admin' ||
                                selectedRole.permissions?.some((rp) => rp.id === p.id || rp.name === p.name);

                              return (
                                <div key={p.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                                  <div>
                                    <span className="font-medium text-slate-200 block">{p.name}</span>
                                    {p.description && <span className="text-[10px] text-slate-500">{p.description}</span>}
                                  </div>
                                  {isGranted ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-rose-500/60 shrink-0" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-slate-400 text-xs">Select a role to inspect permissions.</div>
              )}
            </div>
          </div>
        )}

        {/* ── Create Custom Role Modal ────────────────────────────────────────────── */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4 text-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield className="h-4 w-4 text-accent" /> Create Custom Workspace Role
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleCreateCustomRole} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Role Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Regional Sales Specialist"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Brief summary of permissions and responsibilities"
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">Select Granted Permissions</label>
                  {Object.entries(permissionsByModule).map(([mod, perms]) => (
                    <div key={mod} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{mod}</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {perms.map((p) => {
                          const isChecked = selectedPermIds.includes(p.id);
                          const isPossessed = isSuperAdmin || can(p.name);
                          return (
                            <label
                              key={p.id}
                              className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-accent/15 border-accent/40 text-white'
                                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                              } ${!isPossessed ? 'opacity-40 cursor-not-allowed' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={!isPossessed}
                                onChange={() => togglePermissionSelection(p.id, p.name)}
                                className="h-4 w-4 rounded border-slate-800 text-accent focus:ring-accent"
                              />
                              <span className="font-mono text-[11px] truncate">{p.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl bg-accent text-accent-foreground font-semibold disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Custom Role'}
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
