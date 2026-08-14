'use client';

/**
 * ForgeCRM — PermissionGuard & ProtectedRoute Components
 *
 * Conditional rendering component for enforcing RBAC permissions in frontend UI.
 */

import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';

interface PermissionGuardProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { can, hasAnyPermission, hasAllPermissions } = usePermissions();

  let hasAccess = true;

  if (permission) {
    hasAccess = can(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface PagePermissionGuardProps {
  permission: string;
  children: React.ReactNode;
}

export function PagePermissionGuard({ permission, children }: PagePermissionGuardProps) {
  const { can } = usePermissions();

  if (!can(permission)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4 shadow-xl">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Access Denied</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          You do not have the required permission (<code className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded font-mono text-xs">{permission}</code>) to view this enterprise administration page. Please contact your Workspace Administrator.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
