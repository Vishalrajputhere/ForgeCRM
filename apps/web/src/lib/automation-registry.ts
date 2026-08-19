/**
 * ForgeCRM — Frontend Automation Schema Registry
 *
 * Single Source of Truth for Trigger Entities, Canonical Field Keys,
 * Allowed Operators, and UI Input Controls.
 */

import type { ConditionOperator, TriggerEvent } from '@/types';

export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'enum';
export type ControlType = 'text_input' | 'number_input' | 'select_dropdown' | 'boolean_toggle' | 'date_picker';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  control_type: ControlType;
  allowed_operators: ConditionOperator[];
  options?: FieldOption[];
  description?: string;
}

export interface EntityDefinition {
  entity_name: string;
  label: string;
  fields: FieldDefinition[];
}

export const OPERATORS_BY_TYPE: Record<FieldType, { value: ConditionOperator; label: string }[]> = {
  number: [
    { value: 'EQUALS', label: 'equals (=)' },
    { value: 'NOT_EQUALS', label: 'does not equal (!=)' },
    { value: 'GREATER_THAN', label: 'greater than (>)' },
    { value: 'LESS_THAN', label: 'less than (<)' },
    { value: 'GREATER_OR_EQUAL', label: 'greater or equal (>=)' },
    { value: 'LESS_OR_EQUAL', label: 'less or equal (<=)' },
    { value: 'EMPTY', label: 'is empty' },
    { value: 'NOT_EMPTY', label: 'is not empty' },
  ],
  string: [
    { value: 'EQUALS', label: 'equals' },
    { value: 'NOT_EQUALS', label: 'does not equal' },
    { value: 'CONTAINS', label: 'contains' },
    { value: 'NOT_CONTAINS', label: 'does not contain' },
    { value: 'STARTS_WITH', label: 'starts with' },
    { value: 'ENDS_WITH', label: 'ends with' },
    { value: 'EMPTY', label: 'is empty' },
    { value: 'NOT_EMPTY', label: 'is not empty' },
  ],
  boolean: [
    { value: 'EQUALS', label: 'equals' },
    { value: 'NOT_EQUALS', label: 'does not equal' },
  ],
  date: [
    { value: 'EQUALS', label: 'equals date' },
    { value: 'NOT_EQUALS', label: 'does not equal date' },
    { value: 'GREATER_THAN', label: 'after date (>)' },
    { value: 'LESS_THAN', label: 'before date (<)' },
    { value: 'GREATER_OR_EQUAL', label: 'on or after date (>=)' },
    { value: 'LESS_OR_EQUAL', label: 'on or before date (<=)' },
    { value: 'EMPTY', label: 'is empty' },
    { value: 'NOT_EMPTY', label: 'is not empty' },
  ],
  enum: [
    { value: 'EQUALS', label: 'is' },
    { value: 'NOT_EQUALS', label: 'is not' },
    { value: 'EMPTY', label: 'is empty' },
    { value: 'NOT_EMPTY', label: 'is not empty' },
  ],
};

export const TRIGGER_ENTITY_REGISTRY: Record<string, EntityDefinition> = {
  LEAD_CREATED: {
    entity_name: 'lead',
    label: 'Lead',
    fields: [
      {
        key: 'value',
        label: 'Estimated Value',
        type: 'number',
        control_type: 'number_input',
        allowed_operators: OPERATORS_BY_TYPE.number.map(o => o.value),
        description: 'Estimated monetary value of the lead',
      },
      {
        key: 'priority',
        label: 'Priority',
        type: 'enum',
        control_type: 'select_dropdown',
        allowed_operators: OPERATORS_BY_TYPE.enum.map(o => o.value),
        options: [
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
          { value: 'urgent', label: 'Urgent' },
        ],
      },
      {
        key: 'first_name',
        label: 'First Name',
        type: 'string',
        control_type: 'text_input',
        allowed_operators: OPERATORS_BY_TYPE.string.map(o => o.value),
      },
      {
        key: 'last_name',
        label: 'Last Name',
        type: 'string',
        control_type: 'text_input',
        allowed_operators: OPERATORS_BY_TYPE.string.map(o => o.value),
      },
      {
        key: 'email',
        label: 'Email Address',
        type: 'string',
        control_type: 'text_input',
        allowed_operators: OPERATORS_BY_TYPE.string.map(o => o.value),
      },
      {
        key: 'company_name',
        label: 'Company Name',
        type: 'string',
        control_type: 'text_input',
        allowed_operators: OPERATORS_BY_TYPE.string.map(o => o.value),
      },
      {
        key: 'status',
        label: 'Status',
        type: 'string',
        control_type: 'text_input',
        allowed_operators: OPERATORS_BY_TYPE.string.map(o => o.value),
      },
    ],
  },
  LEAD_UPDATED: {
    entity_name: 'lead',
    label: 'Lead',
    fields: [
      {
        key: 'value',
        label: 'Estimated Value',
        type: 'number',
        control_type: 'number_input',
        allowed_operators: OPERATORS_BY_TYPE.number.map(o => o.value),
      },
      {
        key: 'priority',
        label: 'Priority',
        type: 'enum',
        control_type: 'select_dropdown',
        allowed_operators: OPERATORS_BY_TYPE.enum.map(o => o.value),
        options: [
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
          { value: 'urgent', label: 'Urgent' },
        ],
      },
      {
        key: 'email',
        label: 'Email Address',
        type: 'string',
        control_type: 'text_input',
        allowed_operators: OPERATORS_BY_TYPE.string.map(o => o.value),
      },
      {
        key: 'company_name',
        label: 'Company Name',
        type: 'string',
        control_type: 'text_input',
        allowed_operators: OPERATORS_BY_TYPE.string.map(o => o.value),
      },
    ],
  },
  LEAD_CONVERTED: {
    entity_name: 'lead',
    label: 'Lead',
    fields: [
      {
        key: 'value',
        label: 'Estimated Value',
        type: 'number',
        control_type: 'number_input',
        allowed_operators: OPERATORS_BY_TYPE.number.map(o => o.value),
      },
      {
        key: 'priority',
        label: 'Priority',
        type: 'enum',
        control_type: 'select_dropdown',
        allowed_operators: OPERATORS_BY_TYPE.enum.map(o => o.value),
        options: [
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
        ],
      },
    ],
  },
  DEAL_CREATED: {
    entity_name: 'deal',
    label: 'Deal',
    fields: [
      {
        key: 'value',
        label: 'Deal Value',
        type: 'number',
        control_type: 'number_input',
        allowed_operators: OPERATORS_BY_TYPE.number.map(o => o.value),
      },
      {
        key: 'name',
        label: 'Deal Name',
        type: 'string',
        control_type: 'text_input',
        allowed_operators: OPERATORS_BY_TYPE.string.map(o => o.value),
      },
      {
        key: 'stage',
        label: 'Stage',
        type: 'string',
        control_type: 'text_input',
        allowed_operators: OPERATORS_BY_TYPE.string.map(o => o.value),
      },
      {
        key: 'priority',
        label: 'Priority',
        type: 'enum',
        control_type: 'select_dropdown',
        allowed_operators: OPERATORS_BY_TYPE.enum.map(o => o.value),
        options: [
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
        ],
      },
    ],
  },
  DEAL_UPDATED: {
    entity_name: 'deal',
    label: 'Deal',
    fields: [
      {
        key: 'value',
        label: 'Deal Value',
        type: 'number',
        control_type: 'number_input',
        allowed_operators: OPERATORS_BY_TYPE.number.map(o => o.value),
      },
      {
        key: 'stage',
        label: 'Stage',
        type: 'string',
        control_type: 'text_input',
        allowed_operators: OPERATORS_BY_TYPE.string.map(o => o.value),
      },
    ],
  },
  DEAL_STAGE_CHANGED: {
    entity_name: 'deal',
    label: 'Deal',
    fields: [
      {
        key: 'stage',
        label: 'Current Stage',
        type: 'string',
        control_type: 'text_input',
        allowed_operators: OPERATORS_BY_TYPE.string.map(o => o.value),
      },
      {
        key: 'old_stage',
        label: 'Previous Stage',
        type: 'string',
        control_type: 'text_input',
        allowed_operators: OPERATORS_BY_TYPE.string.map(o => o.value),
      },
      {
        key: 'value',
        label: 'Deal Value',
        type: 'number',
        control_type: 'number_input',
        allowed_operators: OPERATORS_BY_TYPE.number.map(o => o.value),
      },
    ],
  },
  COMPANY_CREATED: {
    entity_name: 'company',
    label: 'Company',
    fields: [
      {
        key: 'name',
        label: 'Company Name',
        type: 'string',
        control_type: 'text_input',
        allowed_operators: OPERATORS_BY_TYPE.string.map(o => o.value),
      },
      {
        key: 'industry',
        label: 'Industry',
        type: 'string',
        control_type: 'text_input',
        allowed_operators: OPERATORS_BY_TYPE.string.map(o => o.value),
      },
      {
        key: 'website',
        label: 'Website URL',
        type: 'string',
        control_type: 'text_input',
        allowed_operators: OPERATORS_BY_TYPE.string.map(o => o.value),
      },
      {
        key: 'email',
        label: 'Company Email',
        type: 'string',
        control_type: 'text_input',
        allowed_operators: OPERATORS_BY_TYPE.string.map(o => o.value),
      },
      {
        key: 'phone',
        label: 'Phone Number',
        type: 'string',
        control_type: 'text_input',
        allowed_operators: OPERATORS_BY_TYPE.string.map(o => o.value),
      },
    ],
  },
  COMPANY_UPDATED: {
    entity_name: 'company',
    label: 'Company',
    fields: [
      {
        key: 'name',
        label: 'Company Name',
        type: 'string',
        control_type: 'text_input',
        allowed_operators: OPERATORS_BY_TYPE.string.map(o => o.value),
      },
      {
        key: 'industry',
        label: 'Industry',
        type: 'string',
        control_type: 'text_input',
        allowed_operators: OPERATORS_BY_TYPE.string.map(o => o.value),
      },
    ],
  },
  CONTACT_CREATED: {
    entity_name: 'contact',
    label: 'Contact',
    fields: [
      {
        key: 'first_name',
        label: 'First Name',
        type: 'string',
        control_type: 'text_input',
        allowed_operators: OPERATORS_BY_TYPE.string.map(o => o.value),
      },
      {
        key: 'last_name',
        label: 'Last Name',
        type: 'string',
        control_type: 'text_input',
        allowed_operators: OPERATORS_BY_TYPE.string.map(o => o.value),
      },
      {
        key: 'email',
        label: 'Email Address',
        type: 'string',
        control_type: 'text_input',
        allowed_operators: OPERATORS_BY_TYPE.string.map(o => o.value),
      },
      {
        key: 'company_name',
        label: 'Company Name',
        type: 'string',
        control_type: 'text_input',
        allowed_operators: OPERATORS_BY_TYPE.string.map(o => o.value),
      },
    ],
  },
  CONTACT_UPDATED: {
    entity_name: 'contact',
    label: 'Contact',
    fields: [
      {
        key: 'first_name',
        label: 'First Name',
        type: 'string',
        control_type: 'text_input',
        allowed_operators: OPERATORS_BY_TYPE.string.map(o => o.value),
      },
      {
        key: 'last_name',
        label: 'Last Name',
        type: 'string',
        control_type: 'text_input',
        allowed_operators: OPERATORS_BY_TYPE.string.map(o => o.value),
      },
      {
        key: 'email',
        label: 'Email Address',
        type: 'string',
        control_type: 'text_input',
        allowed_operators: OPERATORS_BY_TYPE.string.map(o => o.value),
      },
    ],
  },
  TASK_CREATED: {
    entity_name: 'task',
    label: 'Task',
    fields: [
      {
        key: 'title',
        label: 'Task Title',
        type: 'string',
        control_type: 'text_input',
        allowed_operators: OPERATORS_BY_TYPE.string.map(o => o.value),
      },
      {
        key: 'priority',
        label: 'Priority',
        type: 'enum',
        control_type: 'select_dropdown',
        allowed_operators: OPERATORS_BY_TYPE.enum.map(o => o.value),
        options: [
          { value: 'Low', label: 'Low' },
          { value: 'Medium', label: 'Medium' },
          { value: 'High', label: 'High' },
          { value: 'Urgent', label: 'Urgent' },
        ],
      },
    ],
  },
  TASK_COMPLETED: {
    entity_name: 'task',
    label: 'Task',
    fields: [
      {
        key: 'title',
        label: 'Task Title',
        type: 'string',
        control_type: 'text_input',
        allowed_operators: OPERATORS_BY_TYPE.string.map(o => o.value),
      },
      {
        key: 'priority',
        label: 'Priority',
        type: 'enum',
        control_type: 'select_dropdown',
        allowed_operators: OPERATORS_BY_TYPE.enum.map(o => o.value),
        options: [
          { value: 'Low', label: 'Low' },
          { value: 'Medium', label: 'Medium' },
          { value: 'High', label: 'High' },
          { value: 'Urgent', label: 'Urgent' },
        ],
      },
    ],
  },
  MANUAL: {
    entity_name: 'custom',
    label: 'Custom',
    fields: [
      {
        key: 'name',
        label: 'Name',
        type: 'string',
        control_type: 'text_input',
        allowed_operators: OPERATORS_BY_TYPE.string.map(o => o.value),
      },
    ],
  },
};

/** Get allowed fields for a trigger event */
export function getFieldsForTrigger(triggerEvent: TriggerEvent | string): FieldDefinition[] {
  const entityDef = TRIGGER_ENTITY_REGISTRY[triggerEvent];
  if (entityDef) {
    return entityDef.fields;
  }
  return TRIGGER_ENTITY_REGISTRY['MANUAL']?.fields ?? [];
}

/** Get field definition by key */
export function getFieldDefinition(triggerEvent: TriggerEvent | string, fieldKey: string): FieldDefinition | undefined {
  const fields = getFieldsForTrigger(triggerEvent);
  const keyNorm = fieldKey.trim().toLowerCase();
  return fields.find(f => f.key.toLowerCase() === keyNorm || f.label.toLowerCase() === keyNorm);
}


/** Get operators allowed for a specific field definition */
export function getAllowedOperatorsForField(fieldDef?: FieldDefinition): { value: ConditionOperator; label: string }[] {
  if (!fieldDef) {
    return OPERATORS_BY_TYPE.string;
  }
  const ops = OPERATORS_BY_TYPE[fieldDef.type] || OPERATORS_BY_TYPE.string;
  return ops.filter(o => fieldDef.allowed_operators.includes(o.value));
}
