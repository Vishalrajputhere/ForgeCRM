'use client';

/**
 * ForgeCRM — Workflow Builder Page
 *
 * Create a new automation rule with a commercial-grade step-flow builder.
 * Three-panel layout: trigger → conditions → actions.
 *
 * Uses the same HubSpot-style structured builder approach (not a canvas).
 */

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Zap, Plus, Trash2, ChevronDown, ChevronUp,
  Save, LayoutTemplate, CheckCircle2, XCircle,
  Activity, User, Building2, TrendingUp, CheckSquare2,
  Users, Bell, Globe, Archive, ListChecks, RefreshCw,
  Loader2,
} from 'lucide-react';

import { useAutomation } from '@/hooks/use-automation';
import {
  getAllowedOperatorsForField,
  getFieldDefinition,
  getFieldsForTrigger,
} from '@/lib/automation-registry';
import type {
  ActionType, AutomationActionCreate, AutomationConditionCreate,
  AutomationTemplate, TriggerEvent,
} from '@/types';


// ── Data Maps ──────────────────────────────────────────────────────────────────

const TRIGGER_GROUPS = [
  {
    label: 'Leads',
    icon: <Zap className="h-4 w-4" />,
    color: '#f59e0b',
    triggers: [
      { value: 'LEAD_CREATED', label: 'Lead Created' },
      { value: 'LEAD_UPDATED', label: 'Lead Updated' },
      { value: 'LEAD_CONVERTED', label: 'Lead Converted' },
    ],
  },
  {
    label: 'Deals',
    icon: <TrendingUp className="h-4 w-4" />,
    color: '#3b82f6',
    triggers: [
      { value: 'DEAL_CREATED', label: 'Deal Created' },
      { value: 'DEAL_UPDATED', label: 'Deal Updated' },
      { value: 'DEAL_STAGE_CHANGED', label: 'Deal Stage Changed' },
    ],
  },
  {
    label: 'Tasks',
    icon: <CheckSquare2 className="h-4 w-4" />,
    color: '#06b6d4',
    triggers: [
      { value: 'TASK_CREATED', label: 'Task Created' },
      { value: 'TASK_COMPLETED', label: 'Task Completed' },
    ],
  },
  {
    label: 'Contacts',
    icon: <Users className="h-4 w-4" />,
    color: '#f43f5e',
    triggers: [
      { value: 'CONTACT_CREATED', label: 'Contact Created' },
      { value: 'CONTACT_UPDATED', label: 'Contact Updated' },
    ],
  },
  {
    label: 'Companies',
    icon: <Building2 className="h-4 w-4" />,
    color: '#a78bfa',
    triggers: [
      { value: 'COMPANY_CREATED', label: 'Company Created' },
      { value: 'COMPANY_UPDATED', label: 'Company Updated' },
    ],
  },
  {
    label: 'Other',
    icon: <Activity className="h-4 w-4" />,
    color: '#64748b',
    triggers: [
      { value: 'MANUAL', label: 'Manual Trigger' },
    ],
  },
] as const;

const ACTION_OPTIONS: { value: ActionType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'CREATE_TASK', label: 'Create Task', icon: <CheckSquare2 className="h-4 w-4" />, desc: 'Create a follow-up task' },
  { value: 'CREATE_FOLLOWUP_TASK', label: 'Create Follow-up Task', icon: <ListChecks className="h-4 w-4" />, desc: 'Create a follow-up with delay' },
  { value: 'CREATE_ACTIVITY', label: 'Log Activity', icon: <Activity className="h-4 w-4" />, desc: 'Write a timeline activity' },
  { value: 'UPDATE_LEAD', label: 'Update Lead', icon: <Zap className="h-4 w-4" />, desc: 'Update lead fields' },
  { value: 'UPDATE_DEAL', label: 'Update Deal', icon: <TrendingUp className="h-4 w-4" />, desc: 'Update deal fields' },
  { value: 'UPDATE_COMPANY', label: 'Update Company', icon: <Building2 className="h-4 w-4" />, desc: 'Update company fields' },
  { value: 'UPDATE_CONTACT', label: 'Update Contact', icon: <Users className="h-4 w-4" />, desc: 'Update contact fields' },
  { value: 'MOVE_DEAL_STAGE', label: 'Move Deal Stage', icon: <RefreshCw className="h-4 w-4" />, desc: 'Move deal to a stage' },
  { value: 'ASSIGN_OWNER', label: 'Assign Owner', icon: <User className="h-4 w-4" />, desc: 'Assign to a team member' },
  { value: 'SEND_NOTIFICATION', label: 'Send Notification', icon: <Bell className="h-4 w-4" />, desc: 'Trigger a notification' },
  { value: 'ARCHIVE_RECORD', label: 'Archive Record', icon: <Archive className="h-4 w-4" />, desc: 'Soft-delete the entity' },
  { value: 'WEBHOOK', label: 'Webhook', icon: <Globe className="h-4 w-4" />, desc: 'Call an external URL' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(245,158,11,0.2)] text-[10px] font-bold text-[#f59e0b]">
      {n}
    </span>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4 border-b border-[rgba(255,255,255,0.06)] pb-3">
      <h2 className="text-sm font-semibold text-[#f2f2f3]">{title}</h2>
      <p className="mt-0.5 text-xs text-[#9898a0]">{subtitle}</p>
    </div>
  );
}

// ── Action Config Form ────────────────────────────────────────────────────────

function ActionConfigForm({
  actionType,
  config,
  onChange,
}: {
  actionType: ActionType;
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}) {
  const update = (key: string, value: unknown) => onChange({ ...config, [key]: value });

  const inputCls = 'w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#0e0e10] px-3 py-2 text-sm text-[#f2f2f3] placeholder-[#65656e] outline-none focus:border-[rgba(245,158,11,0.4)] focus:ring-1 focus:ring-[rgba(245,158,11,0.15)] transition-all';

  if (actionType === 'CREATE_TASK' || actionType === 'CREATE_FOLLOWUP_TASK') {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs text-[#9898a0]">Task Title</label>
          <input className={inputCls} placeholder="Follow up with {{entity_name}}" value={(config.title as string) ?? ''} onChange={e => update('title', e.target.value)} />
          <p className="mt-1 text-[10px] text-[#65656e]">Use {'{{entity_name}}'} as a placeholder.</p>
        </div>
        <div>
          <label className="mb-1 block text-xs text-[#9898a0]">Priority</label>
          <select className={inputCls} value={(config.priority as string) ?? 'Medium'} onChange={e => update('priority', e.target.value)}>
            {['Low', 'Medium', 'High'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-[#9898a0]">Due in (hours)</label>
          <input type="number" className={inputCls} min={1} value={(config.due_offset_hours as number) ?? 24} onChange={e => update('due_offset_hours', parseInt(e.target.value))} />
        </div>
      </div>
    );
  }

  if (actionType === 'CREATE_ACTIVITY') {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs text-[#9898a0]">Activity Title</label>
          <input className={inputCls} placeholder="Automated action for {{entity_name}}" value={(config.title as string) ?? ''} onChange={e => update('title', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[#9898a0]">Description (optional)</label>
          <textarea rows={2} className={inputCls} value={(config.description as string) ?? ''} onChange={e => update('description', e.target.value)} />
        </div>
      </div>
    );
  }

  if (actionType === 'SEND_NOTIFICATION' || actionType === 'SEND_EMAIL') {
    return (
      <div className="flex flex-col gap-3">
        {actionType === 'SEND_EMAIL' && (
          <div>
            <label className="mb-1 block text-xs text-[#9898a0]">Recipient Email</label>
            <input type="email" className={inputCls} placeholder="team@example.com" value={(config.to_email as string) ?? ''} onChange={e => update('to_email', e.target.value)} />
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs text-[#9898a0]">Subject</label>
          <input className={inputCls} placeholder="ForgeCRM Alert" value={(config.subject as string) ?? ''} onChange={e => update('subject', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[#9898a0]">Message</label>
          <textarea rows={2} className={inputCls} placeholder="{{entity_name}} triggered this automation." value={(config.message as string) ?? ''} onChange={e => update('message', e.target.value)} />
        </div>
      </div>
    );
  }

  if (actionType === 'WEBHOOK') {
    return (
      <div>
        <label className="mb-1 block text-xs text-[#9898a0]">Webhook URL</label>
        <input type="url" className={inputCls} placeholder="https://hooks.example.com/…" value={(config.url as string) ?? ''} onChange={e => update('url', e.target.value)} />
        <p className="mt-1 text-[10px] text-[#65656e]">Outbound HTTP execution is queued via background worker.</p>
      </div>
    );
  }

  return (
    <p className="text-xs text-[#65656e]">
      This action has no additional configuration required. It will use context from the triggering entity.
    </p>
  );
}

// ── Template Gallery ──────────────────────────────────────────────────────────

function TemplateGallery({ onSelect }: { onSelect: (t: AutomationTemplate) => void }) {
  const { useAutomationTemplates } = useAutomation();
  const { data: templates = [], isLoading } = useAutomationTemplates();

  const TRIGGER_LABELS: Record<string, string> = {
    LEAD_CREATED: 'Lead Created', LEAD_CONVERTED: 'Lead Converted',
    DEAL_CREATED: 'Deal Created', DEAL_STAGE_CHANGED: 'Deal Stage Changed',
    TASK_COMPLETED: 'Task Completed', COMPANY_CREATED: 'Company Created',
  };

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[#f59e0b]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {templates.map(t => (
        <div key={t.id} className="flex items-start gap-3 rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#141416] p-4 transition-all hover:border-[rgba(245,158,11,0.3)] hover:shadow-[0_0_16px_rgba(245,158,11,0.05)]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(245,158,11,0.1)]">
            <Zap className="h-4 w-4 text-[#f59e0b]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-[#f2f2f3]">{t.name}</h4>
              {t.is_featured && (
                <span className="rounded-full bg-[rgba(245,158,11,0.15)] px-2 py-0.5 text-[10px] font-medium text-[#f59e0b]">Featured</span>
              )}
            </div>
            {t.description && <p className="mt-0.5 text-xs text-[#9898a0]">{t.description}</p>}
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full bg-[rgba(255,255,255,0.06)] px-2 py-0.5 text-[10px] text-[#9898a0]">{t.category}</span>
              <span className="rounded-full bg-[rgba(255,255,255,0.06)] px-2 py-0.5 text-[10px] text-[#9898a0]">
                {TRIGGER_LABELS[t.trigger_event] ?? t.trigger_event}
              </span>
            </div>
          </div>
          <button
            onClick={() => onSelect(t)}
            className="shrink-0 rounded-lg bg-[rgba(245,158,11,0.15)] px-3 py-1.5 text-xs font-medium text-[#f59e0b] transition-all hover:bg-[rgba(245,158,11,0.25)]"
          >
            Use Template
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Main Builder ───────────────────────────────────────────────────────────────

function WorkflowBuilderInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'templates' ? 'templates' : 'builder';

  const { createAutomationRule } = useAutomation();

  const [tab, setTab] = useState<'builder' | 'templates'>(initialTab as 'builder' | 'templates');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTrigger, setSelectedTrigger] = useState<TriggerEvent | ''>('');
  const [conditionLogic, setConditionLogic] = useState<'AND' | 'OR'>('AND');
  const [conditions, setConditions] = useState<AutomationConditionCreate[]>([]);
  const [actions, setActions] = useState<AutomationActionCreate[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  // ── Conditions helpers
  const addCondition = () => {
    setConditions(prev => [...prev, { group_index: 0, field_path: '', operator: 'EQUALS', value: '', value_type: 'string' }]);
  };
  const updateCondition = (i: number, key: keyof AutomationConditionCreate, value: unknown) => {
    setConditions(prev => prev.map((c, idx) => idx === i ? { ...c, [key]: value } : c));
  };
  const removeCondition = (i: number) => setConditions(prev => prev.filter((_, idx) => idx !== i));

  // ── Actions helpers
  const addAction = (actionType: ActionType) => {
    setActions(prev => [...prev, { position: prev.length, action_type: actionType, config: {} }]);
  };
  const updateActionConfig = (i: number, config: Record<string, unknown>) => {
    setActions(prev => prev.map((a, idx) => idx === i ? { ...a, config } : a));
  };
  const removeAction = (i: number) => setActions(prev => prev.filter((_, idx) => idx !== i));
  const moveAction = (i: number, dir: 'up' | 'down') => {
    const j = dir === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= actions.length) return;
    const next = [...actions];
    const itemI = next[i];
    const itemJ = next[j];
    if (itemI && itemJ) {
      next[i] = itemJ;
      next[j] = itemI;
      setActions(next.map((a, idx) => ({ ...a, position: idx })));
    }
  };

  // ── Validation
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required.';
    if (!selectedTrigger) errs.trigger = 'Select a trigger event.';
    if (actions.length === 0) errs.actions = 'Add at least one action.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Save
  const handleSave = () => {
    if (!validate()) return;

    createAutomationRule.mutate(
      {
        name: name.trim(),
        description: description.trim() || null,
        trigger_event: selectedTrigger as TriggerEvent,
        condition_logic: conditionLogic,
        conditions: conditions.filter(c => c.field_path.trim()),
        actions: actions.map((a, i) => ({ ...a, position: i })),
      },
      {
        onSuccess: (rule) => {
          setSaved(true);
          setTimeout(() => router.push(`/automations/${rule.id}`), 800);
        },
      },
    );
  };

  // ── Use template
  const handleUseTemplate = (t: AutomationTemplate) => {
    const cfg = t.template_config as {
      conditions?: AutomationConditionCreate[];
      actions?: AutomationActionCreate[];
      condition_logic?: 'AND' | 'OR';
    };
    setName(t.name);
    setDescription(t.description ?? '');
    setSelectedTrigger(t.trigger_event as TriggerEvent);
    setConditionLogic(cfg.condition_logic ?? 'AND');
    setConditions(cfg.conditions ?? []);
    setActions(cfg.actions ?? []);
    setTab('builder');
  };

  const inputCls = 'w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#141416] px-3 py-2.5 text-sm text-[#f2f2f3] placeholder-[#65656e] outline-none focus:border-[rgba(245,158,11,0.4)] focus:ring-1 focus:ring-[rgba(245,158,11,0.15)] transition-all';
  const errCls = 'mt-1 text-[11px] text-red-400';

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/automations')}
          className="rounded-lg p-2 text-[#65656e] transition-colors hover:bg-[rgba(255,255,255,0.06)] hover:text-[#f2f2f3]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[#f2f2f3]">Create Automation</h1>
          <p className="text-sm text-[#9898a0]">Build a workflow that reacts to CRM events automatically.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab(t => t === 'builder' ? 'templates' : 'builder')}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-all ${tab === 'templates' ? 'border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.1)] text-[#f59e0b]' : 'border-[rgba(255,255,255,0.1)] text-[#9898a0] hover:text-[#f2f2f3]'}`}
          >
            <LayoutTemplate className="h-4 w-4" />
            Templates
          </button>
          <button
            id="automation-save-btn"
            onClick={handleSave}
            disabled={createAutomationRule.isPending || saved}
            className="flex items-center gap-1.5 rounded-lg bg-[#f59e0b] px-4 py-2 text-sm font-semibold text-[#0e0e10] shadow-[0_0_16px_rgba(245,158,11,0.35)] transition-all hover:bg-[#d97706] disabled:opacity-60 active:scale-95"
          >
            {saved ? (
              <><CheckCircle2 className="h-4 w-4" /> Saved!</>
            ) : createAutomationRule.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
            ) : (
              <><Save className="h-4 w-4" /> Save Rule</>
            )}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {createAutomationRule.isError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <XCircle className="h-4 w-4 shrink-0" />
          Failed to create automation. Please check your configuration.
        </div>
      )}

      {tab === 'templates' ? (
        <TemplateGallery onSelect={handleUseTemplate} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* ── LEFT PANEL: Trigger + Name ── */}
          <div className="flex flex-col gap-5">
            {/* Name */}
            <div className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#141416] p-4">
              <SectionHeader title="Rule Details" subtitle="Name and describe your automation." />
              <div className="flex flex-col gap-3">
                <div>
                  <label className="mb-1 block text-xs text-[#9898a0]">Name *</label>
                  <input
                    id="automation-name-input"
                    className={inputCls}
                    placeholder="e.g. New Lead → Create Task"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                  {errors.name && <p className={errCls}>{errors.name}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#9898a0]">Description</label>
                  <textarea
                    rows={2}
                    className={inputCls}
                    placeholder="What does this automation do?"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Trigger */}
            <div className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#141416] p-4">
              <SectionHeader title="Trigger Event" subtitle="When should this automation run?" />
              {errors.trigger && <p className={`${errCls} mb-3`}>{errors.trigger}</p>}
              <div className="flex flex-col gap-4">
                {TRIGGER_GROUPS.map(group => (
                  <div key={group.label}>
                    <div className="mb-2 flex items-center gap-1.5">
                      <span style={{ color: group.color }}>{group.icon}</span>
                      <span className="text-xs font-medium text-[#9898a0]">{group.label}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {group.triggers.map(t => (
                        <button
                          key={t.value}
                          onClick={() => setSelectedTrigger(t.value as TriggerEvent)}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all ${
                            selectedTrigger === t.value
                              ? 'bg-[rgba(245,158,11,0.12)] text-[#f59e0b] shadow-[inset_0_0_0_1px_rgba(245,158,11,0.3)]'
                              : 'text-[#9898a0] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#f2f2f3]'
                          }`}
                        >
                          {selectedTrigger === t.value && (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#f59e0b]" />
                          )}
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── CENTER PANEL: Conditions ── */}
          <div className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#141416] p-4">
            <SectionHeader
              title="Conditions (Optional)"
              subtitle="Only run when these conditions pass."
            />
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs text-[#9898a0]">Logic:</span>
              {(['AND', 'OR'] as const).map(logic => (
                <button
                  key={logic}
                  onClick={() => setConditionLogic(logic)}
                  className={`rounded-md px-2 py-0.5 text-xs font-medium transition-all ${conditionLogic === logic ? 'bg-[rgba(245,158,11,0.2)] text-[#f59e0b]' : 'text-[#65656e] hover:text-[#9898a0]'}`}
                >
                  {logic}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              {conditions.map((c, i) => {
                const availableFields = selectedTrigger ? getFieldsForTrigger(selectedTrigger) : [];
                const currentFieldDef = selectedTrigger && c.field_path ? getFieldDefinition(selectedTrigger, c.field_path) : undefined;
                const allowedOperators = getAllowedOperatorsForField(currentFieldDef);

                return (
                  <div key={i} className="rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#0e0e10] p-3">
                    <div className="flex items-center gap-1 mb-2">
                      <StepBadge n={i + 1} />
                      <span className="flex-1 text-xs text-[#9898a0]">
                        Condition {currentFieldDef ? `• ${currentFieldDef.type.toUpperCase()}` : ''}
                      </span>
                      <button onClick={() => removeCondition(i)} className="rounded p-0.5 text-[#65656e] hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {/* Field Selection Dropdown */}
                      <select
                        className="w-full rounded-md border border-[rgba(255,255,255,0.08)] bg-[#141416] px-2 py-1.5 text-xs text-[#f2f2f3] outline-none focus:border-[rgba(245,158,11,0.3)]"
                        value={c.field_path}
                        onChange={e => {
                          const fieldKey = e.target.value;
                          const fieldDef = selectedTrigger ? getFieldDefinition(selectedTrigger, fieldKey) : undefined;
                          updateCondition(i, 'field_path', fieldKey);
                          if (fieldDef) {
                            updateCondition(i, 'value_type', fieldDef.type);
                            const allowed = getAllowedOperatorsForField(fieldDef);
                            if (allowed.length > 0 && !allowed.some(op => op.value === c.operator)) {
                              updateCondition(i, 'operator', allowed[0]?.value ?? 'EQUALS');
                            }
                          }
                        }}
                      >
                        <option value="">— select field —</option>
                        {availableFields.map(f => (
                          <option key={f.key} value={f.key}>{f.label}</option>
                        ))}
                      </select>

                      {/* Filtered Operator Dropdown */}
                      <select
                        className="w-full rounded-md border border-[rgba(255,255,255,0.08)] bg-[#141416] px-2 py-1.5 text-xs text-[#f2f2f3] outline-none focus:border-[rgba(245,158,11,0.3)]"
                        value={c.operator}
                        onChange={e => updateCondition(i, 'operator', e.target.value)}
                      >
                        {allowedOperators.map(op => (
                          <option key={op.value} value={op.value}>{op.label}</option>
                        ))}
                      </select>

                      {/* Contextual Value Input Control */}
                      {!['EMPTY', 'NOT_EMPTY'].includes(c.operator) && (
                        <>
                          {currentFieldDef?.control_type === 'select_dropdown' && currentFieldDef.options ? (
                            <select
                              className="w-full rounded-md border border-[rgba(255,255,255,0.08)] bg-[#141416] px-2 py-1.5 text-xs text-[#f2f2f3] outline-none focus:border-[rgba(245,158,11,0.3)]"
                              value={c.value ?? ''}
                              onChange={e => updateCondition(i, 'value', e.target.value)}
                            >
                              <option value="">— select value —</option>
                              {currentFieldDef?.options?.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          ) : currentFieldDef?.control_type === 'boolean_toggle' ? (
                            <select
                              className="w-full rounded-md border border-[rgba(255,255,255,0.08)] bg-[#141416] px-2 py-1.5 text-xs text-[#f2f2f3] outline-none focus:border-[rgba(245,158,11,0.3)]"
                              value={c.value ?? 'true'}
                              onChange={e => updateCondition(i, 'value', e.target.value)}
                            >
                              <option value="true">True / Yes</option>
                              <option value="false">False / No</option>
                            </select>
                          ) : currentFieldDef?.control_type === 'number_input' ? (
                            <input
                              type="number"
                              className="w-full rounded-md border border-[rgba(255,255,255,0.08)] bg-[#141416] px-2 py-1.5 text-xs text-[#f2f2f3] placeholder-[#65656e] outline-none focus:border-[rgba(245,158,11,0.3)]"
                              placeholder="enter numeric value"
                              value={c.value ?? ''}
                              onChange={e => updateCondition(i, 'value', e.target.value)}
                            />
                          ) : currentFieldDef?.control_type === 'date_picker' ? (
                            <input
                              type="date"
                              className="w-full rounded-md border border-[rgba(255,255,255,0.08)] bg-[#141416] px-2 py-1.5 text-xs text-[#f2f2f3] outline-none focus:border-[rgba(245,158,11,0.3)]"
                              value={c.value ?? ''}
                              onChange={e => updateCondition(i, 'value', e.target.value)}
                            />
                          ) : (
                            <input
                              type="text"
                              className="w-full rounded-md border border-[rgba(255,255,255,0.08)] bg-[#141416] px-2 py-1.5 text-xs text-[#f2f2f3] placeholder-[#65656e] outline-none focus:border-[rgba(245,158,11,0.3)]"
                              placeholder="value to compare"
                              value={c.value ?? ''}
                              onChange={e => updateCondition(i, 'value', e.target.value)}
                            />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={addCondition}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[rgba(255,255,255,0.1)] py-2 text-xs text-[#65656e] transition-all hover:border-[rgba(245,158,11,0.3)] hover:text-[#f59e0b]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Condition
            </button>
          </div>

          {/* ── RIGHT PANEL: Actions ── */}
          <div className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#141416] p-4">
            <SectionHeader title="Actions" subtitle="What should happen when triggered?" />
            {errors.actions && <p className={`${errCls} mb-3`}>{errors.actions}</p>}

            <div className="flex flex-col gap-2">
              {actions.map((action, i) => {
                const meta = ACTION_OPTIONS.find(a => a.value === action.action_type);
                return (
                  <div key={i} className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#0e0e10] p-3">
                    <div className="mb-2 flex items-center gap-1.5">
                      <StepBadge n={i + 1} />
                      <span className="flex items-center gap-1 text-xs font-medium text-[#f2f2f3]">
                        {meta?.icon}
                        {meta?.label ?? action.action_type}
                      </span>
                      <div className="ml-auto flex items-center gap-1">
                        <button onClick={() => moveAction(i, 'up')} disabled={i === 0} className="rounded p-0.5 text-[#65656e] hover:text-[#9898a0] disabled:opacity-30">
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => moveAction(i, 'down')} disabled={i === actions.length - 1} className="rounded p-0.5 text-[#65656e] hover:text-[#9898a0] disabled:opacity-30">
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => removeAction(i)} className="rounded p-0.5 text-[#65656e] hover:text-red-400">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <ActionConfigForm
                      actionType={action.action_type}
                      config={action.config}
                      onChange={cfg => updateActionConfig(i, cfg)}
                    />
                  </div>
                );
              })}
            </div>

            {/* Action picker */}
            <div className="mt-3">
              <p className="mb-2 text-xs text-[#65656e]">Add an action:</p>
              <div className="grid grid-cols-2 gap-1.5">
                {ACTION_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => addAction(opt.value)}
                    className="flex items-center gap-1.5 rounded-lg border border-[rgba(255,255,255,0.07)] px-2.5 py-2 text-left text-xs text-[#9898a0] transition-all hover:border-[rgba(245,158,11,0.25)] hover:bg-[rgba(245,158,11,0.06)] hover:text-[#f59e0b]"
                  >
                    {opt.icon}
                    <span className="truncate">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkflowBuilderPage() {
  return (
    <Suspense>
      <WorkflowBuilderInner />
    </Suspense>
  );
}
