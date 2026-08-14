'use client';

import * as React from 'react';
import {
  Server, Play, RefreshCw, CheckCircle2, XCircle,
  Search, Activity, Inbox, AlertCircle
} from 'lucide-react';
import { useAIFetch } from '@/hooks/use-ai-fetch';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useToast } from '@/components/ui/toast';

interface BackgroundJob {
  job_id: string;
  job_type: string;
  status: 'Queued' | 'Running' | 'Completed' | 'Failed' | 'Unknown';
  target_email?: string | undefined;
  dispatched_at: string;
}

export default function AdminJobsPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const { aiFetch } = useAIFetch({ workspaceId: currentWorkspace?.id });
  const { toast } = useToast();

  // Start with an empty list — no hardcoded sample jobs
  const [jobs, setJobs] = React.useState<BackgroundJob[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState('all');

  // Dispatch Modal
  const [showDispatchModal, setShowDispatchModal] = React.useState(false);
  const [jobType, setJobType] = React.useState('email');
  const [targetEmail, setTargetEmail] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [body] = React.useState('Automated notification from ForgeCRM background job system.');
  const [isDispatching, setIsDispatching] = React.useState(false);

  const refreshJobStatus = React.useCallback(async (jobId: string) => {
    try {
      const res = await aiFetch(`/api/v1/jobs/status/${jobId}`, null, 'GET');
      if (res.ok) {
        const data = await res.json();
        setJobs((prev) =>
          prev.map((j) =>
            j.job_id === jobId ? { ...j, status: data.status as BackgroundJob['status'] } : j
          )
        );
      }
    } catch {
      // silent
    }
  }, [aiFetch]);

  const handleDispatchJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsDispatching(true);
      const res = await aiFetch('/api/v1/jobs/dispatch', {
        job_type: jobType,
        target_email: jobType === 'email' ? targetEmail : undefined,
        subject: jobType === 'email' ? subject : undefined,
        body: jobType === 'email' ? body : undefined,
      });

      if (res.ok) {
        const data = await res.json();
        // Build job entry from real API response only
        const newJob: BackgroundJob = {
          job_id: data.job_id,
          job_type: jobType,
          status: (data.status as BackgroundJob['status']) || 'Queued',
          target_email: jobType === 'email' ? targetEmail : undefined,
          dispatched_at: new Date().toLocaleTimeString(),
        };
        setJobs((prev) => [newJob, ...prev]);
        toast('success', 'Background Job Dispatched', `Job ${newJob.job_id} — Status: ${newJob.status}`);
        setShowDispatchModal(false);
        setTargetEmail('');
        setSubject('');
      } else {
        const errBody = await res.json().catch(() => ({}));
        toast('error', 'Dispatch Failed', errBody.detail || `HTTP ${res.status}`);
      }
    } catch (err: any) {
      toast('error', 'Dispatch Error', err.message || 'Error dispatching job');
    } finally {
      setIsDispatching(false);
    }
  };

  const filteredJobs = React.useMemo(() => {
    return jobs.filter((j) => {
      const matchesSearch =
        j.job_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.job_type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || j.status.toLowerCase() === filterStatus.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [jobs, searchQuery, filterStatus]);

  const getStatusBadge = (status: BackgroundJob['status']) => {
    switch (status) {
      case 'Completed':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium flex items-center gap-1 w-max"><CheckCircle2 className="h-3 w-3" /> Completed</span>;
      case 'Running':
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-medium flex items-center gap-1 w-max"><RefreshCw className="h-3 w-3 animate-spin" /> Running</span>;
      case 'Failed':
        return <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-medium flex items-center gap-1 w-max"><XCircle className="h-3 w-3" /> Failed</span>;
      case 'Queued':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium">Queued</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Server className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Background Jobs Monitor</h1>
            <p className="text-sm text-slate-400">Dispatch and track asynchronous background tasks. Job history is session-scoped.</p>
          </div>
        </div>
        <button
          onClick={() => setShowDispatchModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium text-sm hover:from-emerald-400 hover:to-teal-500 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
        >
          <Play className="h-4 w-4" /> Dispatch New Job
        </button>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
        <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-400">
          Job history is tracked per-session. Dispatch a job and click the refresh icon on any row to poll its latest status from the server.
          Available job types: <span className="text-slate-300 font-mono">email</span>, <span className="text-slate-300 font-mono">cleanup</span>.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search jobs by ID or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="running">Running</option>
            <option value="queued">Queued</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      {filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80 border-dashed space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Inbox className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-300">No Jobs Dispatched</p>
            <p className="text-xs text-slate-500 mt-1">Dispatch a background job above to see it tracked here</p>
          </div>
        </div>
      ) : (
        /* Jobs Table */
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Job ID</th>
                  <th className="px-6 py-3.5">Job Type</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Target</th>
                  <th className="px-6 py-3.5">Dispatched</th>
                  <th className="px-6 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {filteredJobs.map((j) => (
                  <tr key={j.job_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-cyan-400">{j.job_id}</td>
                    <td className="px-6 py-4 font-sans text-slate-200">{j.job_type}</td>
                    <td className="px-6 py-4 font-sans">{getStatusBadge(j.status)}</td>
                    <td className="px-6 py-4 text-slate-400 font-sans">{j.target_email || '—'}</td>
                    <td className="px-6 py-4 text-slate-400 font-sans">{j.dispatched_at}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => refreshJobStatus(j.job_id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                        title="Refresh job status"
                      >
                        <Activity className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Server className="h-5 w-5 text-emerald-400" /> Dispatch Background Job
            </h2>
            <form onSubmit={handleDispatchJob} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Job Type</label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none"
                >
                  <option value="email">Async Email Job</option>
                  <option value="cleanup">Cleanup Expired Auth Tokens</option>
                </select>
              </div>

              {jobType === 'email' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Target Email <span className="text-rose-400">*</span></label>
                    <input
                      type="email"
                      required
                      placeholder="recipient@example.com"
                      value={targetEmail}
                      onChange={(e) => setTargetEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Email Subject <span className="text-rose-400">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Weekly AI Revenue Briefing"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDispatching}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium text-sm hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50"
                >
                  {isDispatching ? 'Dispatching...' : 'Submit Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
