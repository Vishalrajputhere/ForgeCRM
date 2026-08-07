'use client';

import * as React from 'react';
import { Eye, EyeOff, Search } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, leftIcon, rightIcon, type = 'text', ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {leftIcon && <div className="absolute left-3 pointer-events-none text-muted">{leftIcon}</div>}
        <input
          ref={ref}
          type={type}
          className={cn(
            'w-full rounded-lg border px-3 py-2 text-xs transition-colors duration-150',
            'bg-sunken text-primary placeholder:text-muted',
            'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
            leftIcon ? 'pl-9' : '',
            rightIcon ? 'pr-9' : '',
            error ? 'border-status-danger-fg focus:ring-status-danger-fg' : 'border-border-default hover:border-border-strong',
            'disabled:pointer-events-none disabled:opacity-40',
            className
          )}
          {...props}
        />
        {rightIcon && <div className="absolute right-3 pointer-events-none text-muted">{rightIcon}</div>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ── Search Input ─────────────────────────────────────────────────────────────

export const SearchInput = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => <Input ref={ref} leftIcon={<Search className="h-3.5 w-3.5" />} placeholder="Search…" {...props} />
);
SearchInput.displayName = 'SearchInput';

// ── Password Input ───────────────────────────────────────────────────────────

export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    const [show, setShow] = React.useState(false);
    return (
      <div className="relative flex items-center w-full">
        <Input ref={ref} type={show ? 'text' : 'password'} className={className} {...props} />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 text-muted hover:text-primary transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';

// ── Textarea ─────────────────────────────────────────────────────────────────

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-lg border px-3 py-2 text-xs transition-colors duration-150 resize-none',
          'bg-sunken text-primary placeholder:text-muted',
          'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
          error ? 'border-status-danger-fg' : 'border-border-default hover:border-border-strong',
          'disabled:pointer-events-none disabled:opacity-40',
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

// ── Currency Input ───────────────────────────────────────────────────────────

export interface CurrencyInputProps extends Omit<InputProps, 'onChange'> {
  value?: number | string;
  onChange?: (val: number) => void;
  currencyPrefix?: string;
}

export function CurrencyInput({ value, onChange, currencyPrefix = '$', ...props }: CurrencyInputProps) {
  return (
    <Input
      type="number"
      leftIcon={<span className="font-mono text-xs text-muted">{currencyPrefix}</span>}
      value={value}
      onChange={(e) => onChange?.(Number(e.target.value))}
      {...props}
    />
  );
}
