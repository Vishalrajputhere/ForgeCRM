'use client';

import * as React from 'react';
import {
  Zap, Play, RefreshCw, CheckCircle2, Radio, Activity, Inbox
} from 'lucide-react';
import { useAIFetch } from '@/hooks/use-ai-fetch';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useToast } from '@/components/ui/toast';

interface EventSubscription {
  event_type: string;
  agent_name: string;
  description: string;
  status: string;
}

interface EventLog {
  event_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  status: 'Dispatched' | 'Failed' | 'Pending';
  timestamp: string;
}

export default function AIEventCenterPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const { aiFetch } = useAIFetch({ workspaceId: currentWorkspace?.id });
  const { toast } = useToast();

  const [subscriptions, setSubscriptions] = React.useState<EventSubscription[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  // Start empty — no hardcoded fake events
  const [eventLogs, setEventLogs] = React.useState<EventLog[]>([]);

  // Manual Trigger Modal
  const [showTriggerModal, setShowTriggerModal] = React.useState(false);
  const [eventType, setEventType] = React.useState('lead.created');
  const [entityType, setEntityType] = React.useState('lead');
  const [entityId, setEntityId] = React.useState('');
  const [isTriggering, setIsTriggering] = React.useState(false);

  const fetchSubscriptions = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const res = await aiFetch('/api/v1/ai/agents/events/subscriptions', null, 'GET');
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data);
      } else {
        setLoadError(`Failed to load subscriptions (HTTP ${res.status})`);
        setSubscriptions([]);
      }
    } catch (err: any) {
      setLoadError(err.message || 'Unable to reach AI agents service');
      setSubscriptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [aiFetch]);

  React.useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleTriggerEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityId.trim()) {
      toast('error', 'Entity UUID Required', 'Please enter a valid entity UUID to trigger the event.');
      return;
    }
    try {
      setIsTriggering(true);
      const url = `/api/v1/ai/agents/events/trigger?event_type=${encodeURIComponent(eventType)}&entity_type=${encodeURIComponent(entityType)}&entity_id=${encodeURIComponent(entityId)}`;
      const res = await aiFetch(url, {}, 'POST');
      if (res.ok) {
        const data = await res.json();
        // Build log entry only from real API response fields
        const newLog: EventLog = {
          event_id: data.event_id || `evt-${Date.now()}`,
          event_type: eventType,
          entity_type: entityType,
          entity_id: entityId,
          status: data.dispatched ? 'Dispatched' : 'Failed',
          timestamp: new Date().toLocaleTimeString(),
        };
        setEventLogs((prev) => [newLog, ...prev]);
        toast('success', 'Domain Event Dispatched', `Event ${eventType} triggered — dispatched: ${data.dispatched}`);
        setShowTriggerModal(false);
      } else {
        const errBody = await res.json().catch(() => ({}));
        toast('error', 'Trigger Failed', errBody.detail || `HTTP ${res.status}`);
      }
    } catch (err: any) {
      toast('error', 'Trigger Error', err.message || 'Error triggering domain event');
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">AI Event Center</h1>
            <p className="text-sm text-slate-400">Real-time CRM domain event streaming &amp; autonomous background AI agent triggers</p>
          </div>
        </div>
        <button
          onClick={() => setShowTriggerModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium text-sm hover:from-amber-400 hover:to-orange-500 transition-all shadow-md shadow-amber-500/20 active:scale-95"
        >
          <Play className="h-4 w-4" /> Trigger Manual Event
        </button>
      </div>

      {/* Subscriptions & Event Stream Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Subscriptions Card */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Radio className="h-5 w-5 text-amber-400" /> Active Event Subscriptions
              </h2>
              <button onClick={fetchSubscriptions} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800" disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                {loadError}
              </div>
            )}

            {!isLoading && !loadError && subscriptions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                <Inbox className="h-8 w-8 text-slate-600" />
                <p className="text-sm text-slate-500">No active event subscriptions</p>
              </div>
            )}

            <div className="space-y-3">
              {subscriptions.map((sub, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/30 transition-all">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      {sub.event_type}
                    </span>
                    <span className={`text-xs font-medium flex items-center gap-1 ${sub.status === 'active' ? 'text-emerald-400' : 'text-slate-400'}`}>
                      <CheckCircle2 className="h-3 w-3" /> {sub.status === 'active' ? 'Active Worker' : sub.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200 mt-2">{sub.agent_name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{sub.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Event History Stream */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-400" /> Event Execution Stream
            </h2>

            {eventLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                <Inbox className="h-8 w-8 text-slate-600" />
                <p className="text-sm text-slate-500">No events dispatched yet</p>
                <p className="text-xs text-slate-600">Trigger a domain event to see it appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {eventLogs.map((log) => (
                  <div key={log.event_id} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-cyan-400">{log.event_id}</span>
                      <span className="text-slate-500">{log.timestamp}</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-200">{log.event_type}</div>
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                      <span>Target: {log.entity_type} ({log.entity_id.slice(0, 8)}...)</span>
                      <span className={`font-semibold ${log.status === 'Dispatched' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Event Trigger Modal */}
      {showTriggerModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" /> Dispatch Manual CRM Domain Event
            </h2>
            <form onSubmit={handleTriggerEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Event Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none"
                >
                  <option value="lead.created">lead.created</option>
                  <option value="deal.stage_changed">deal.stage_changed</option>
                  <option value="email.received">email.received</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Entity Type</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. lead"
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Entity UUID <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Paste a real UUID..."
                    value={entityId}
                    onChange={(e) => setEntityId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <p className="text-xs text-slate-500">Enter a real entity UUID from your CRM (Lead, Deal, etc.)</p>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTriggerModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTriggering}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium text-sm hover:from-amber-400 hover:to-orange-500 disabled:opacity-50"
                >
                  {isTriggering ? 'Dispatching...' : 'Emit Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
