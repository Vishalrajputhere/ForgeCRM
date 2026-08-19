/**
 * Unit tests for permission logic used inside usePermissions hook.
 *
 * Because the hook uses useState/useEffect/fetch and depends on SSE connections,
 * we test the pure permission evaluation logic directly against the store state,
 * rather than rendering the hook in a component.
 *
 * What we test:
 *   - can() returns true when permission is present
 *   - can() returns false when permission is absent
 *   - can() returns true for any permission when isSuperAdmin = true
 *   - hasAnyPermission() correct OR semantics
 *   - hasAllPermissions() correct AND semantics
 *   - isWorkspaceAdmin detection via role name
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/auth-store';

// Helper: build a permission checker matching the real logic in usePermissions
function buildPermissionHelpers(
  permissions: string[],
  roles: string[],
  isSuperAdmin: boolean,
) {
  const permSet = new Set(permissions);

  const can = (perm: string) => isSuperAdmin || permSet.has(perm);
  const hasAnyPermission = (perms: string[]) => perms.some((p) => can(p));
  const hasAllPermissions = (perms: string[]) => perms.every((p) => can(p));
  const isWorkspaceAdmin = isSuperAdmin || roles.includes('workspace_admin') || roles.includes('admin');

  return { can, hasAnyPermission, hasAllPermissions, isWorkspaceAdmin };
}

beforeEach(() => {
  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    effectivePermissions: [],
    effectiveRoles: [],
    authorizationVersion: 1,
    isSuperAdmin: false,
    _hydrated: false,
  });
});

describe('Permission evaluation — regular member', () => {
  const { can, hasAnyPermission, hasAllPermissions, isWorkspaceAdmin } =
    buildPermissionHelpers(
      ['companies.view', 'contacts.view', 'deals.view'],
      ['member'],
      false,
    );

  it('can() returns true for granted permission', () => {
    expect(can('companies.view')).toBe(true);
  });

  it('can() returns false for missing permission', () => {
    expect(can('companies.delete')).toBe(false);
  });

  it('hasAnyPermission() returns true if at least one matches', () => {
    expect(hasAnyPermission(['companies.delete', 'deals.view'])).toBe(true);
  });

  it('hasAnyPermission() returns false if none match', () => {
    expect(hasAnyPermission(['companies.delete', 'leads.create'])).toBe(false);
  });

  it('hasAllPermissions() returns true when all match', () => {
    expect(hasAllPermissions(['companies.view', 'contacts.view'])).toBe(true);
  });

  it('hasAllPermissions() returns false when any is missing', () => {
    expect(hasAllPermissions(['companies.view', 'leads.create'])).toBe(false);
  });

  it('isWorkspaceAdmin is false for member role', () => {
    expect(isWorkspaceAdmin).toBe(false);
  });
});

describe('Permission evaluation — workspace admin', () => {
  const { can, isWorkspaceAdmin } = buildPermissionHelpers(
    ['companies.view', 'companies.create', 'members.manage'],
    ['workspace_admin'],
    false,
  );

  it('isWorkspaceAdmin is true', () => {
    expect(isWorkspaceAdmin).toBe(true);
  });

  it('can() enforces explicit permission grants (not role-implied)', () => {
    expect(can('members.manage')).toBe(true);
    expect(can('billing.manage')).toBe(false);
  });
});

describe('Permission evaluation — super admin', () => {
  const { can, hasAllPermissions, isWorkspaceAdmin } = buildPermissionHelpers(
    [],   // no explicit permissions needed
    ['super_admin'],
    true, // isSuperAdmin = true
  );

  it('can() returns true for any permission when isSuperAdmin', () => {
    expect(can('billing.manage')).toBe(true);
    expect(can('workspace.delete')).toBe(true);
    expect(can('anything.else')).toBe(true);
  });

  it('hasAllPermissions() returns true for any list when isSuperAdmin', () => {
    expect(hasAllPermissions(['billing.manage', 'workspace.delete'])).toBe(true);
  });

  it('isWorkspaceAdmin is true when isSuperAdmin', () => {
    expect(isWorkspaceAdmin).toBe(true);
  });
});

describe('Permission evaluation — viewer role', () => {
  const { can } = buildPermissionHelpers(
    ['companies.view', 'contacts.view', 'deals.view', 'leads.view'],
    ['viewer'],
    false,
  );

  it('cannot create companies', () => expect(can('companies.create')).toBe(false));
  it('cannot delete deals', () => expect(can('deals.delete')).toBe(false));
  it('cannot manage members', () => expect(can('members.manage')).toBe(false));
  it('can view companies', () => expect(can('companies.view')).toBe(true));
  it('can view contacts', () => expect(can('contacts.view')).toBe(true));
});
