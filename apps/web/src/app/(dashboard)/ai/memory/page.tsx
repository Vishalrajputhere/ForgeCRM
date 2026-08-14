'use client';

import * as React from 'react';
import {
  Brain, Plus, Trash2, Pin, PinOff, Search, RefreshCw, Inbox
} from 'lucide-react';
import { useAIFetch } from '@/hooks/use-ai-fetch';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useToast } from '@/components/ui/toast';

interface AIMemory {
  id: string;
  workspace_id: string;
  user_id: string | null;
  key: string;
  value: string;
  memory_type: 'workspace' | 'user' | 'summary' | 'preference' | string;
  is_pinned: boolean;
  importance_score?: number;
  confidence?: number;
  created_at?: string;
}

export default function AIMemoryPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const { aiFetch } = useAIFetch({ workspaceId: currentWorkspace?.id });
  const { toast } = useToast();

  const [memories, setMemories] = React.useState<AIMemory[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterType, setFilterType] = React.useState<string>('all');

  // Add Memory Modal
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [key, setKey] = React.useState('');
  const [value, setValue] = React.useState('');
  const [memoryType, setMemoryType] = React.useState<string>('workspace');
  const [isPinned, setIsPinned] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchMemories = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const res = await aiFetch('/api/v1/ai/memory', null, 'GET');
      if (res.ok) {
        const data = await res.json();
        setMemories(data);
      } else {
        const errBody = await res.json().catch(() => ({}));
        setLoadError(errBody.detail || `Failed to load memories (HTTP ${res.status})`);
        setMemories([]);
      }
    } catch (err: any) {
      setLoadError(err.message || 'Unable to connect to AI memory service');
      setMemories([]);
    } finally {
      setIsLoading(false);
    }
  }, [aiFetch]);

  React.useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !value.trim()) return;

    try {
      setIsSubmitting(true);
      const url = `/api/v1/ai/memory?key=${encodeURIComponent(key)}&value=${encodeURIComponent(value)}&memory_type=${encodeURIComponent(memoryType)}&is_pinned=${isPinned}`;
      const res = await aiFetch(url, {}, 'POST');
      if (res.ok) {
        toast('success', 'AI Memory Rule Saved', `Memory "${key}" created successfully.`);
        setShowAddModal(false);
        setKey('');
        setValue('');
        setIsPinned(false);
        await fetchMemories();
      } else {
        const errBody = await res.json().catch(() => ({}));
        toast('error', 'Creation Failed', errBody.detail || `HTTP ${res.status}`);
      }
    } catch (err: any) {
      toast('error', 'Error', err.message || 'Error creating memory');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      const res = await aiFetch(`/api/v1/ai/memory/${id}`, null, 'DELETE');
      if (res.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== id));
        toast('success', 'Memory Rule Deleted', 'AI memory rule deleted successfully.');
      } else {
        const errBody = await res.json().catch(() => ({}));
        toast('error', 'Delete Failed', errBody.detail || `HTTP ${res.status}`);
      }
    } catch (err: any) {
      toast('error', 'Delete Failed', err.message || 'Failed to delete memory');
    }
  };

  const filteredMemories = React.useMemo(() => {
    return memories.filter((m) => {
      const matchesSearch =
        m.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.value.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || m.memory_type.toLowerCase() === filterType.toLowerCase();
      return matchesSearch && matchesType;
    });
  }, [memories, searchQuery, filterType]);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">AI Memory Management</h1>
            <p className="text-sm text-slate-400">Long-term workspace knowledge rules, conversation summaries, and user preferences</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-medium text-sm hover:from-purple-400 hover:to-indigo-500 transition-all shadow-md shadow-purple-500/20 active:scale-95"
        >
          <Plus className="h-4 w-4" /> Add Memory Rule
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search memory rules & values..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none"
          >
            <option value="all">All Memory Types</option>
            <option value="workspace">Workspace Rules</option>
            <option value="user">User Memories</option>
            <option value="preference">User Preferences</option>
            <option value="summary">Summaries</option>
          </select>
          <button onClick={fetchMemories} disabled={isLoading} className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error State */}
      {loadError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-sm text-rose-400">
          {loadError}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !loadError && filteredMemories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80 border-dashed space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Inbox className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-300">No Memory Rules</p>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery || filterType !== 'all'
                ? 'No memories match your filter'
                : 'Add your first workspace knowledge rule above'}
            </p>
          </div>
        </div>
      )}

      {/* Memories Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMemories.map((mem) => (
          <div
            key={mem.id}
            className={`p-5 rounded-2xl border transition-all space-y-3 relative group ${
              mem.is_pinned
                ? 'bg-purple-500/10 border-purple-500/30 shadow-lg shadow-purple-500/5'
                : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20 truncate max-w-[180px]">
                {mem.key}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {mem.is_pinned ? (
                  <Pin className="h-4 w-4 text-purple-400 fill-current" />
                ) : (
                  <PinOff className="h-4 w-4 text-slate-600" />
                )}
                <button
                  onClick={() => handleDeleteMemory(mem.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed font-medium">{mem.value}</p>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/60">
              <span className="capitalize px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">{mem.memory_type}</span>
              <div className="flex items-center gap-2">
                {mem.is_pinned && <span className="text-purple-400 font-semibold">Pinned</span>}
                {mem.confidence != null && (
                  <span className="text-emerald-400 font-semibold">{Math.round(mem.confidence * 100)}%</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-400" /> Create Workspace AI Memory Rule
            </h2>
            <form onSubmit={handleCreateMemory} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Memory Key Identifier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. acme_security_requirement"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-purple-500/50 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Memory Fact / Rule Content</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Acme Corp requires SOC2 Type II report before deal close..."
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Memory Type</label>
                  <select
                    value={memoryType}
                    onChange={(e) => setMemoryType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none"
                  >
                    <option value="workspace">Workspace Rule</option>
                    <option value="user">User Memory</option>
                    <option value="preference">User Preference</option>
                    <option value="summary">Summary</option>
                  </select>
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="rounded border-slate-800 bg-slate-950 text-purple-500 focus:ring-0"
                    />
                    Pin Memory Rule
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-medium text-sm hover:from-purple-400 hover:to-indigo-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Memory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
