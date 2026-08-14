'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState, Suspense } from 'react';
import { CheckCircle2, KeyRound, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { useAIFetch } from '@/hooks/use-ai-fetch';
import { Button, Input } from '@/components/ui/primitives';

function AcceptInvitationForm(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialToken = searchParams.get('token') || '';

  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { aiFetch } = useAIFetch();

  const [token, setToken] = useState(initialToken);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAcceptToken = useCallback(
    async (tokenToAccept: string) => {
      if (!tokenToAccept.trim()) {
        setError('Please enter a valid invitation token.');
        return;
      }
      setError(null);
      setIsSubmitting(true);

      try {
        const res = await aiFetch(
          `/api/v1/workspaces/invitations/accept?token=${encodeURIComponent(tokenToAccept.trim())}`,
          null,
          'GET'
        );

        if (res.ok) {
          const data = await res.json();
          setSuccessMsg(`Successfully joined workspace "${data.workspace_name || 'Workspace'}"! Redirecting...`);
          setTimeout(() => {
            router.push('/workspace');
          }, 2000);
        } else {
          const errData = await res.json().catch(() => ({}));
          setError(errData.detail || `Failed to accept invitation token (HTTP ${res.status}).`);
        }
      } catch (err: unknown) {
        setError((err as Error).message || 'Failed to connect to workspace authorization service.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [aiFetch, router]
  );

  // Auto-trigger if token parameter is present and user is logged in
  useEffect(() => {
    if (initialToken && isAuthenticated && !isSubmitting && !successMsg && !error) {
      handleAcceptToken(initialToken);
    }
  }, [initialToken, isAuthenticated, handleAcceptToken, isSubmitting, successMsg, error]);

  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-3 text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Verifying session credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirectUrl = `/login?redirect=${encodeURIComponent(`/accept-invitation?token=${token}`)}`;
    const registerUrl = `/register?redirect=${encodeURIComponent(`/accept-invitation?token=${token}`)}`;

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
            <KeyRound className="w-3.5 h-3.5" /> Workspace Invitation
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Accept Workspace Access</h1>
          <p className="text-sm text-slate-400">
            You received an invitation code. Please sign in or create an account with your invited email to accept access.
          </p>
        </div>

        {token && (
          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Invitation Token</span>
            <p className="font-mono text-xs text-indigo-300 break-all">{token}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link href={redirectUrl} className="w-full">
            <Button variant="primary" className="w-full justify-center">
              Sign In to Accept
            </Button>
          </Link>
          <Link href={registerUrl} className="w-full">
            <Button variant="outline" className="w-full justify-center">
              Create Account
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" /> Logged in as {user?.email}
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Join Workspace</h1>
        <p className="text-sm text-slate-400">Enter or confirm your single-use invitation token below.</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to Accept Invitation</p>
            <p className="mt-0.5 text-rose-200/80">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-200 text-sm">Invitation Accepted!</p>
            <p className="mt-0.5 text-emerald-300/80">{successMsg}</p>
          </div>
        </div>
      )}

      {!successMsg && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAcceptToken(token);
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Invitation Token Code</label>
            <Input
              type="text"
              placeholder="e.g. 019fff74-de56-76a2-9e36-3aa4de85585d"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="font-mono text-xs bg-slate-900/90 border-slate-700 text-white placeholder:text-slate-600 focus:border-indigo-500"
            />
          </div>

          <Button type="submit" disabled={isSubmitting || !token.trim()} className="w-full justify-center gap-2">
            {isSubmitting ? 'Verifying Token...' : 'Accept Invitation'}
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </Button>
        </form>
      )}

      <div className="text-center pt-2">
        <Link href="/workspace" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
          Go back to Workspace Console
        </Link>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center p-8 space-y-3 text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading invitation page...</p>
        </div>
      }
    >
      <AcceptInvitationForm />
    </Suspense>
  );
}
