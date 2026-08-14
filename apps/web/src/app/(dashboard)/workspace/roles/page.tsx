'use client';

/**
 * ForgeCRM V2 — Roles & Permissions Matrix
 *
 * Real API-backed workspace roles and permissions management interface.
 * Shows system & custom roles, permission matrix grouped by module,
 * and full CRUD operations for custom roles (Create, Edit, Delete, Live Permission Toggles)
 * with authorization safety checks.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Shield, Plus, Key, Sliders, CheckCircle2, XCircle,
  RefreshCw, AlertTriangle, Pencil, Trash2, Edit3, Save, Lock
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

  // Create Custom Role Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createRoleName, setCreateRoleName] = useState('');
  const [createRoleDescription, setCreateRoleDescription] = useState('');
  const [createPermIds, setCreatePermIds] = useState<string[]>([]);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Edit Custom Role Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editRoleName, setEditRoleName] = useState('');
  const [editRoleDescription, setEditRoleDescription] = useState('');
  const [editPermIds, setEditPermIds] = useState<string[]>([]);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Custom Role Modal State
  const [deletingRole, setDeletingRole] = useState<RoleItem | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

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
          setSelectedRole((prev) => {
            if (!prev) return dataR[0] || null;
            // Update reference if existing role in list
            const found = dataR.find((r: RoleItem) => r.id === prev.id);
            return found || dataR[0] || null;
          });
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
  }, [aiFetch]);

  useEffect(() => {
    fetchRolesAndPermissions();
  }, [fetchRolesAndPermissions]);

  // Create Modal Permission Toggle
  const toggleCreatePerm = (permId: string, permName: string) => {
    if (!isSuperAdmin && !can(permName)) {
      toast('error', 'Unauthorized', 'You cannot grant permissions you do not possess.');
      return;
    }
    setCreatePermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  // Edit Modal Permission Toggle
  const toggleEditPerm = (permId: string, permName: string) => {
    if (!isSuperAdmin && !can(permName)) {
      toast('error', 'Unauthorized', 'You cannot grant permissions you do not possess.');
      return;
    }
    setEditPermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  // Handle Create Custom Role
  const handleCreateCustomRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createRoleName.trim()) return;

    try {
      setIsSubmittingCreate(true);
      const res = await aiFetch('/api/v1/workspaces/roles/custom', {
        name: createRoleName.trim(),
        description: createRoleDescription.trim() || 'Custom Enterprise Workspace Role',
        permission_ids: createPermIds,
      }, 'POST');

      if (res.ok) {
        toast('success', 'Role Created', `Custom role "${createRoleName}" created successfully.`);
        setShowCreateModal(false);
        setCreateRoleName('');
        setCreateRoleDescription('');
        setCreatePermIds([]);
        await fetchRolesAndPermissions();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast('error', 'Creation Failed', errData.detail || errData.message || 'Failed to create custom role.');
      }
    } catch (err: unknown) {
      toast('error', 'Error', (err as Error).message || 'Error creating custom role.');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const canEditRole = (role: RoleItem) => {
    if (role.is_system !== false) {
      return isSuperAdmin; // Only Super Admin can edit system roles
    }
    return can('roles.manage');
  };

  // Open Edit Modal for a Role (Custom Role, or System Role if Super Admin)
  const openEditModal = (role: RoleItem) => {
    if (role.is_system !== false && !isSuperAdmin) {
      toast('error', 'Super Admin Required', 'Only a Super Admin can modify system role definitions.');
      return;
    }
    setEditingRoleId(role.id);
    setEditRoleName(role.name);
    setEditRoleDescription(role.description || '');
    setEditPermIds(role.permissions ? role.permissions.map((p) => p.id) : []);
    setShowEditModal(true);
  };

  // Handle Update Role
  const handleUpdateCustomRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoleId || !editRoleName.trim()) return;

    try {
      setIsSubmittingEdit(true);
      const payload = {
        name: editRoleName.trim(),
        description: editRoleDescription.trim(),
        permission_ids: editPermIds,
      };

      let res = await aiFetch(`/api/v1/workspaces/roles/${editingRoleId}`, payload, 'PUT');
      if (!res.ok && currentWorkspace?.id) {
        res = await aiFetch(`/api/v1/workspaces/${currentWorkspace.id}/roles/${editingRoleId}`, payload, 'PUT');
      }

      if (res.ok) {
        const updatedRole = await res.json();
        toast('success', 'Role Updated', `Role "${editRoleName}" updated successfully.`);
        setShowEditModal(false);
        setEditingRoleId(null);
        setSelectedRole(updatedRole);
        await fetchRolesAndPermissions();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast('error', 'Update Failed', errData.detail || errData.message || 'Failed to update role.');
      }
    } catch (err: unknown) {
      toast('error', 'Error', (err as Error).message || 'Error updating role.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Live Permission Toggle on Role (Custom Role, or System Role if Super Admin)
  const handleLiveTogglePermission = async (role: RoleItem, perm: PermissionItem) => {
    if (role.is_system !== false && !isSuperAdmin) {
      toast('error', 'Super Admin Required', 'Only a Super Admin can modify system role definitions.');
      return;
    }
    if (!isSuperAdmin && !can(perm.name)) {
      toast('error', 'Unauthorized', 'You cannot grant or revoke permissions you do not possess.');
      return;
    }

    const currentPermIds = role.permissions ? role.permissions.map((p) => p.id) : [];
    const hasPerm = currentPermIds.includes(perm.id);
    const newPermIds = hasPerm
      ? currentPermIds.filter((id) => id !== perm.id)
      : [...currentPermIds, perm.id];

    try {
      const payload = { permission_ids: newPermIds };
      let res = await aiFetch(`/api/v1/workspaces/roles/${role.id}`, payload, 'PUT');
      if (!res.ok && currentWorkspace?.id) {
        res = await aiFetch(`/api/v1/workspaces/${currentWorkspace.id}/roles/${role.id}`, payload, 'PUT');
      }

      if (res.ok) {
        const updatedRole = await res.json();
        toast('success', 'Permission Updated', `${hasPerm ? 'Revoked' : 'Granted'} "${perm.name}" for ${role.name}.`);
        setSelectedRole(updatedRole);
        setRoles((prev) => prev.map((r) => (r.id === role.id ? updatedRole : r)));
      } else {
        const errData = await res.json().catch(() => ({}));
        toast('error', 'Update Failed', errData.detail || errData.message || 'Failed to update role permissions.');
      }
    } catch (err: unknown) {
      toast('error', 'Error', (err as Error).message || 'Failed to toggle permission.');
    }
  };

  // Handle Delete Custom Role
  const handleDeleteCustomRole = async () => {
    if (!deletingRole) return;

    try {
      setIsSubmittingDelete(true);
      let res = await aiFetch(`/api/v1/workspaces/roles/${deletingRole.id}`, null, 'DELETE');
      if (!res.ok && currentWorkspace?.id) {
        res = await aiFetch(`/api/v1/workspaces/${currentWorkspace.id}/roles/${deletingRole.id}`, null, 'DELETE');
      }

      if (res.ok || res.status === 204) {
        toast('success', 'Role Deleted', `Custom role "${deletingRole.name}" deleted.`);
        setDeletingRole(null);
        setSelectedRole(null);
        await fetchRolesAndPermissions();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast('error', 'Deletion Failed', errData.detail || errData.message || 'Failed to delete role.');
      }
    } catch (err: unknown) {
      toast('error', 'Error', (err as Error).message || 'Error deleting role.');
    } finally {
      setIsSubmittingDelete(false);
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
                  const isCustom = r.is_system === false;

                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRole(r)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                        isSelected
                          ? 'bg-accent/15 border-accent/40 text-white shadow-md'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{r.name}</span>
                        {!isCustom ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-cyan-400 border border-slate-700 flex items-center gap-1">
                            <Lock className="h-3 w-3" /> System Role
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
                            Custom Role
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{r.description || 'Enterprise RBAC Role'}</p>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                        {canEditRole(r) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(r);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-accent border border-accent/30 text-[11px] font-semibold transition-all flex items-center gap-1"
                          >
                            <Pencil className="h-3 w-3" /> {r.is_system !== false ? 'Edit (Super Admin)' : 'Edit'}
                          </button>
                        )}
                        {isCustom && can('roles.manage') && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingRole(r);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-semibold transition-all flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Role Permission Detail Matrix */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
              {selectedRole ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                          <Sliders className="h-5 w-5 text-accent" /> {selectedRole.name} — Permission Matrix
                        </h2>
                        {selectedRole.is_system !== false ? (
                          isSuperAdmin ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                              <Edit3 className="h-3 w-3" /> System Role (Super Admin Editable)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-cyan-400 border border-slate-700 flex items-center gap-1">
                              <Lock className="h-3 w-3" /> System Role (Super Admin Required)
                            </span>
                          )
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <Edit3 className="h-3 w-3" /> Custom Editable Role
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{selectedRole.description || 'Effective RBAC permissions for members assigned to this role'}</p>
                    </div>

                    {canEditRole(selectedRole) && (
                      <button
                        onClick={() => openEditModal(selectedRole)}
                        className="px-3.5 py-1.5 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm shrink-0"
                      >
                        <Pencil className="h-3.5 w-3.5" /> {selectedRole.is_system !== false ? 'Edit System Role' : 'Edit Custom Role'}
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {Object.keys(permissionsByModule).length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        No atomic permissions returned from server.
                      </div>
                    ) : (
                      Object.entries(permissionsByModule).map(([moduleName, perms]) => (
                        <div key={moduleName} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                          <h3 className="text-xs font-bold text-accent uppercase tracking-wider">{moduleName} Module</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                            {perms.map((p) => {
                              const isGranted =
                                selectedRole.name === 'Super Admin' ||
                                selectedRole.name === 'Workspace Admin' ||
                                selectedRole.permissions?.some((rp) => rp.id === p.id || rp.name === p.name);

                              const isEditable = canEditRole(selectedRole);

                              return (
                                <div
                                  key={p.id}
                                  onClick={() => {
                                    if (isEditable) {
                                      handleLiveTogglePermission(selectedRole, p);
                                    }
                                  }}
                                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                                    isGranted
                                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                                      : 'bg-slate-900 border-slate-800 text-slate-400'
                                  } ${isEditable ? 'cursor-pointer hover:border-accent' : ''}`}
                                >
                                  <div>
                                    <span className="font-mono text-xs font-bold block text-slate-100">{p.name}</span>
                                    {p.description && <span className="text-[10px] text-slate-400">{p.description}</span>}
                                  </div>

                                  {isGranted ? (
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                                      <CheckCircle2 className="h-3.5 w-3.5" /> Granted
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-500 font-bold text-[10px]">
                                      <XCircle className="h-3.5 w-3.5" /> Revoked
                                    </div>
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

        {/* ── 1. Create Custom Role Modal ────────────────────────────────────────────── */}
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
                    value={createRoleName}
                    onChange={(e) => setCreateRoleName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Brief summary of permissions and responsibilities"
                    value={createRoleDescription}
                    onChange={(e) => setCreateRoleDescription(e.target.value)}
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
                          const isChecked = createPermIds.includes(p.id);
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
                                onChange={() => toggleCreatePerm(p.id, p.name)}
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
                    disabled={isSubmittingCreate}
                    className="px-4 py-2 rounded-xl bg-accent text-accent-foreground font-semibold disabled:opacity-50"
                  >
                    {isSubmittingCreate ? 'Creating...' : 'Create Custom Role'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── 2. Edit Custom Role Modal ────────────────────────────────────────────── */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4 text-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-accent" /> Edit Custom Role: {editRoleName}
                </h3>
                <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleUpdateCustomRole} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Role Name</label>
                  <input
                    type="text"
                    required
                    value={editRoleName}
                    onChange={(e) => setEditRoleName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Description</label>
                  <input
                    type="text"
                    value={editRoleDescription}
                    onChange={(e) => setEditRoleDescription(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">Configured Permissions</label>
                  {Object.entries(permissionsByModule).map(([mod, perms]) => (
                    <div key={mod} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{mod}</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {perms.map((p) => {
                          const isChecked = editPermIds.includes(p.id);
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
                                onChange={() => toggleEditPerm(p.id, p.name)}
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
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEdit}
                    className="px-4 py-2 rounded-xl bg-accent text-accent-foreground font-semibold disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Save className="h-4 w-4" /> {isSubmittingEdit ? 'Saving...' : 'Save Role Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── 3. Delete Custom Role Confirmation Modal ────────────────────────────────── */}
        {deletingRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-slate-950 p-6 shadow-2xl space-y-4 text-slate-100">
              <div className="flex items-center gap-3 text-rose-400">
                <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Delete Custom Role</h3>
                  <p className="text-xs text-rose-400/80">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-xs text-slate-300">
                Are you sure you want to permanently delete the custom role <strong className="text-white font-bold">"{deletingRole.name}"</strong>?
              </p>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeletingRole(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCustomRole}
                  disabled={isSubmittingDelete}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Trash2 className="h-4 w-4" /> {isSubmittingDelete ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PagePermissionGuard>
  );
}
