'use client';

import * as React from 'react';
import { Label, Caption } from '@/components/ui/typography';

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string | undefined;
  hint?: string | undefined;
  required?: boolean;
  children: React.ReactNode;
}

export function FormField({ label, htmlFor, error, hint, required, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} required={required ?? false}>
        {label}
      </Label>
      {children}
      {hint && !error && <Caption color="muted">{hint}</Caption>}
      {error && <Caption color="danger">{error}</Caption>}
    </div>
  );
}
