'use client';

import * as React from 'react';
import { ShieldAlert, Lock, LogOut, Save, RefreshCw, Laptop } from 'lucide-react';
import { WorkspaceAdminNav } from '@/components/navigation/workspace-admin-nav';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAIFetch } from '@/hooks/use-ai-fetch';
import { useToast } from '@/components/ui/toast';
import { PagePermissionGuard } from '@/components/auth/permission-guard';

interface MemberSession {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  ip_address: string;
  user_agent: string;
  device_name: string;
  platform: string;
  browser: string;
  last_activity_at: string;
  expires_at: string;
  is_current: boolean;
}

export default function WorkspaceSecurityPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const { aiFetch } = useAIFetch({ workspaceId: currentWorkspace?.id });
  const { toast } = useToast();

  const [minPasswordLength, setMinPasswordLength] = React.useState(12);
  const [requireSpecialChar, setRequireSpecialChar] = React.useState(true);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = React.useState(1440);
  const [mfaRequired, setMfaRequired] = React.useState(false);
  const [maxFailedLogins, setMaxFailedLogins] = React.useState(5);
  const [isSaving, setIsSaving] = React.useState(false);

  const [sessions, setSessions] = React.useState<MemberSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = React.useState(true);

  const fetchSecurityAndSessions = React.useCallback(async () => {
    if (!currentWorkspace?.id) return;
    try {
      setIsLoadingSessions(true);
      const resSec = await aiFetch(`/api/v1/workspaces/${currentWorkspace.id}/security`, null, 'GET');
      if (resSec.ok) {
        const dataSec = await resSec.json();
        if (dataSec) {
          setMinPasswordLength(dataSec.min_password_length ?? 12);
          setRequireSpecialChar(dataSec.require_special_char ?? true);
          setSessionTimeoutMinutes(dataSec.session_timeout_minutes ?? 1440);
          setMfaRequired(dataSec.mfa_required ?? false);
          setMaxFailedLogins(dataSec.max_failed_logins ?? 5);
        }
      }

      const resSess = await aiFetch(`/api/v1/workspaces/${currentWorkspace.id}/security/sessions`, null, 'GET');
      if (resSess.ok) {
        const dataSess = await resSess.json();
        if (Array.isArray(dataSess)) {
          setSessions(dataSess as MemberSession[]);
        }
      }
    } catch {
      toast('error', 'Fetch Error', 'Failed to load security settings or member sessions.');
    } finally {
      setIsLoadingSessions(false);
    }
  }, [currentWorkspace?.id, aiFetch, toast]);

  React.useEffect(() => {
    fetchSecurityAndSessions();
  }, [fetchSecurityAndSessions]);

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace?.id) return;

    try {
      setIsSaving(true);
      const res = await aiFetch(`/api/v1/workspaces/${currentWorkspace.id}/security`, {
        min_password_length: minPasswordLength,
        require_special_char: requireSpecialChar,
        session_timeout_minutes: sessionTimeoutMinutes,
        mfa_required: mfaRequired,
        max_failed_logins: maxFailedLogins,
      }, 'PATCH');

      if (res.ok) {
        toast('success', 'Security Policy Updated', 'Enterprise security controls and password rules updated.');
      } else {
        toast('error', 'Update Failed', 'Failed to update security settings.');
      }
    } catch (err: unknown) {
      toast('error', 'Error', (err as Error).message || 'Error updating security settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!currentWorkspace?.id) return;
    try {
      const res = await aiFetch(`/api/v1/workspaces/${currentWorkspace.id}/security/sessions/${sessionId}`, null, 'DELETE');
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        toast('success', 'Session Revoked', 'Active user login session revoked immediately.');
      }
    } catch {
      toast('error', 'Error', 'Failed to revoke session.');
    }
  };

  return (
    <PagePermissionGuard permission="security.read">
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-100">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Security &amp; Session Controls</h1>
              <p className="text-sm text-slate-400">Configure password strength requirements, MFA enforcement, and revoke active member login sessions</p>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <WorkspaceAdminNav />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Security Policy Form */}
          <form onSubmit={handleSaveSecurity} className="lg:col-span-1 p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-5 h-fit">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="h-4 w-4 text-accent" /> Password &amp; Auth Policy
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Min Password Length</label>
              <input
                type="number"
                min={8}
                max={64}
                value={minPasswordLength}
                onChange={(e) => setMinPasswordLength(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div>
                <span className="text-xs font-semibold text-white block">Require Special Characters</span>
                <span className="text-[11px] text-slate-400">Include !@#$%^&amp;* in passwords</span>
              </div>
              <input
                type="checkbox"
                checked={requireSpecialChar}
                onChange={(e) => setRequireSpecialChar(e.target.checked)}
                className="h-4 w-4 rounded border-slate-800 bg-slate-900 text-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Session Timeout (Minutes)</label>
              <input
                type="number"
                min={15}
                max={10080}
                value={sessionTimeoutMinutes}
                onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div>
                <span className="text-xs font-semibold text-white block">Enforce Multi-Factor Auth (MFA)</span>
                <span className="text-[11px] text-slate-400">Require TOTP for all members</span>
              </div>
              <input
                type="checkbox"
                checked={mfaRequired}
                onChange={(e) => setMfaRequired(e.target.checked)}
                className="h-4 w-4 rounded border-slate-800 bg-slate-900 text-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Max Failed Logins Before Lock</label>
              <input
                type="number"
                min={3}
                max={20}
                value={maxFailedLogins}
                onChange={(e) => setMaxFailedLogins(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full px-4 py-2.5 rounded-xl bg-accent text-accent-foreground font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {isSaving ? 'Saving...' : 'Update Security Policy'}
            </button>
          </form>

          {/* Right Column: Active Sessions Table */}
          <div className="lg:col-span-2 bg-slate-900/60 rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl space-y-4 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Laptop className="h-5 w-5 text-accent" /> Member Active Sessions ({sessions.length})
              </h2>
              <button onClick={fetchSecurityAndSessions} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {isLoadingSessions ? (
              <div className="p-12 text-center text-slate-400 text-sm">Loading active login sessions...</div>
            ) : (
              <div className="space-y-3">
                {sessions.map((sess) => (
                  <div key={sess.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{sess.user_name}</span>
                        <span className="font-mono text-xs text-cyan-400">({sess.user_email})</span>
                        {sess.is_current && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Current Device
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
                        <span>IP: <strong className="font-mono text-slate-300">{sess.ip_address}</strong></span>
                        <span>Platform: <strong className="text-slate-300">{sess.platform}</strong></span>
                        <span>Browser: <strong className="text-slate-300">{sess.browser}</strong></span>
                      </div>
                    </div>

                    {!sess.is_current && (
                      <button
                        onClick={() => handleRevokeSession(sess.id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium transition-all flex items-center gap-1 shrink-0"
                      >
                        <LogOut className="h-3.5 w-3.5" /> Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PagePermissionGuard>
  );
}
