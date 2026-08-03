'use client';

import { useState } from 'react';

import { useToast } from '@/components/ui/toast';
import { useCRM } from '@/hooks/use-crm';
import { useFormatters } from '@/hooks/use-formatters';
import type { TaskResponse, TaskUpdate } from '@/types';

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];

const PRIORITY_COLORS: Record<string, string> = {
  Low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  Medium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  High: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Urgent: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

const STATUS_COLORS: Record<string, string> = {
  Open: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Cancelled: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export default function TasksPage(): React.JSX.Element {
  const {
    tasks,
    isLoadingTasks,
    createTask,
    isCreatingTask,
    completeTask,
    deleteTask,
    isDeletingTask,
    updateTask,
  } = useCRM();
  const { toast } = useToast();

  // ── Filters ───────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Open' | 'Completed'>('Open');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filtered = tasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openCount = tasks.filter((t) => t.status === 'Open').length;
  const overdueCount = tasks.filter(
    (t) => t.status === 'Open' && t.due_date && new Date(t.due_date) < new Date()
  ).length;
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;

  // ── Create Modal ──────────────────────────────────────────────────────────
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    due_date: '',
  });
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    try {
      await createTask({
        title: createForm.title,
        ...(createForm.description ? { description: createForm.description } : {}),
        priority: createForm.priority,
        ...(createForm.due_date ? { due_date: new Date(createForm.due_date).toISOString() } : {}),
      });
      setIsCreateOpen(false);
      setCreateForm({ title: '', description: '', priority: 'Medium', due_date: '' });
      toast('success', 'Task created');
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create task.');
    }
  };

  // ── Edit Modal ────────────────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<TaskResponse | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    due_date: '',
  });

  const openEdit = (task: TaskResponse) => {
    setEditTarget(task);
    setEditForm({
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      due_date: task.due_date ? task.due_date.slice(0, 10) : '',
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    try {
      const payload: Record<string, unknown> = { priority: editForm.priority };
      if (editForm.title) payload.title = editForm.title;
      if (editForm.description) payload.description = editForm.description;
      if (editForm.due_date) payload.due_date = new Date(editForm.due_date).toISOString();
      await updateTask({ id: editTarget.id, payload: payload as TaskUpdate });
      setEditTarget(null);
      toast('success', 'Task updated');
    } catch (err: unknown) {
      toast('error', 'Update failed', err instanceof Error ? err.message : '');
    }
  };

  // ── Complete Task ─────────────────────────────────────────────────────────
  const handleComplete = async (taskId: string, title: string) => {
    try {
      await completeTask(taskId);
      toast('success', `"${title}" completed`);
    } catch (err: unknown) {
      toast('error', 'Failed to complete task');
    }
  };

  // ── Delete Task ───────────────────────────────────────────────────────────
  const handleDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      toast('success', 'Task removed');
    } catch (err: unknown) {
      toast('error', 'Failed to remove task');
    }
  };

  const inputCls = 'w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-forge-500 transition-colors';
  const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5';

  const isOverdue = (task: TaskResponse) =>
    task.status === 'Open' && task.due_date && new Date(task.due_date) < new Date();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Tasks</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {openCount} open · {overdueCount > 0 ? <span className="text-rose-400">{overdueCount} overdue</span> : '0 overdue'} · {completedCount} completed
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-lg bg-forge-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-forge-500/20 hover:bg-forge-400 transition-all flex items-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-forge-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'Open', 'Completed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                statusFilter === s
                  ? 'bg-forge-500/20 text-forge-400 border border-forge-500/40'
                  : 'border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
              }`}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-400 focus:outline-none focus:ring-1 focus:ring-forge-500"
          >
            <option value="all">All Priorities</option>
            {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Task List */}
      {isLoadingTasks ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 py-16 text-center">
          <svg className="h-12 w-12 mx-auto text-slate-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-slate-500 text-sm">
            {search ? `No tasks match "${search}"` : `No ${statusFilter !== 'all' ? statusFilter.toLowerCase() + ' ' : ''}tasks found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              isOverdue={Boolean(isOverdue(task))}
              onComplete={handleComplete}
              onEdit={openEdit}
              onDelete={handleDelete}
              isDeletingTask={isDeletingTask}
            />
          ))}
        </div>
      )}

      {/* ── Create Task Modal ────────────────────────────────────────────────── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Create Task</h3>
            {createError && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400">{createError}</div>
            )}
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className={labelCls}>Title <span className="text-rose-400">*</span></label>
                <input required type="text" value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} className={inputCls} placeholder="Follow up with client…" />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea rows={2} value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Priority</label>
                  <select value={createForm.priority} onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })} className={inputCls}>
                    {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Due Date</label>
                  <input type="date" value={createForm.due_date} onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={isCreatingTask} className="rounded-lg bg-forge-500 px-4 py-2 text-xs font-semibold text-white hover:bg-forge-400 disabled:opacity-50">
                  {isCreatingTask ? 'Creating…' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Task Modal ──────────────────────────────────────────────────── */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Edit Task</h3>
            <form onSubmit={handleEdit} className="space-y-3">
              <div>
                <label className={labelCls}>Title <span className="text-rose-400">*</span></label>
                <input required type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea rows={2} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Priority</label>
                  <select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })} className={inputCls}>
                    {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Due Date</label>
                  <input type="date" value={editForm.due_date} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditTarget(null)} className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" className="rounded-lg bg-forge-500 px-4 py-2 text-xs font-semibold text-white hover:bg-forge-400">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({
  task,
  isOverdue,
  onComplete,
  onEdit,
  onDelete,
  isDeletingTask,
}: {
  task: TaskResponse;
  isOverdue: boolean;
  onComplete: (id: string, title: string) => void;
  onEdit: (task: TaskResponse) => void;
  onDelete: (id: string) => void;
  isDeletingTask: boolean;
}) {
  const { formatDate } = useFormatters();
  const isCompleted = task.status === 'Completed';
  const isCancelled = task.status === 'Cancelled';

  return (
    <div className={`flex items-center gap-4 rounded-xl border bg-slate-900/60 p-4 transition-all hover:border-slate-700 ${
      isOverdue ? 'border-rose-500/20 bg-rose-500/3' :
      isCompleted ? 'border-slate-800 opacity-60' :
      isCancelled ? 'border-slate-800 opacity-40' :
      'border-slate-800'
    }`}>
      {/* Complete checkbox */}
      <button
        onClick={() => !isCompleted && !isCancelled && onComplete(task.id, task.title)}
        disabled={isCompleted || isCancelled}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
          isCompleted
            ? 'border-emerald-500 bg-emerald-500'
            : 'border-slate-600 hover:border-forge-500 hover:bg-forge-500/20'
        } disabled:cursor-not-allowed`}
      >
        {isCompleted && (
          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isCompleted || isCancelled ? 'line-through text-slate-500' : isOverdue ? 'text-rose-300' : 'text-white'}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-slate-500 mt-0.5 truncate">{task.description}</p>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 shrink-0">
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold border ${PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.Medium}`}>
          {task.priority}
        </span>
        {task.due_date && (
          <span className={`text-xs font-medium ${isOverdue ? 'text-rose-400' : 'text-slate-500'}`}>
            {isOverdue ? '⚠ ' : ''}{formatDate(task.due_date)}
          </span>
        )}
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium border ${STATUS_COLORS[task.status] ?? STATUS_COLORS.Open}`}>
          {task.status}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {!isCompleted && !isCancelled && (
          <button
            onClick={() => onEdit(task)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        <button
          onClick={() => onDelete(task.id)}
          disabled={isDeletingTask}
          className="rounded-md p-1.5 text-slate-600 hover:bg-rose-500/10 hover:text-rose-400 transition-colors disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
