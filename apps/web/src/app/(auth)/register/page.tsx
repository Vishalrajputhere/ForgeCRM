'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAuth } from '@/hooks/use-auth';
import { Button, Input, FormField } from '@/components/ui/primitives';

// ── Validation ────────────────────────────────────────────────────────────────

const registerSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name:  z.string().min(1, 'Last name is required').max(100),
  email:      z.string().email('Please enter a valid email'),
  password:   z.string().min(6, 'Must be at least 6 characters').max(128),
  job_title:  z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RegisterPage(): React.JSX.Element {
  const { register: registerUser, isRegistering } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterFormData): Promise<void> => {
    setError(null);
    try {
      await registerUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="space-y-1">
        <h1 className="text-h1 text-text-primary">Create your account</h1>
        <p className="text-body text-text-secondary">Get started with ForgeCRM, free for 14 days</p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/8 px-3.5 py-2.5 text-label text-red-400">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="First name" htmlFor="first_name" error={errors.first_name?.message}>
            <Input
              id="first_name"
              type="text"
              placeholder="Jane"
              autoComplete="given-name"
              error={!!errors.first_name}
              {...register('first_name')}
            />
          </FormField>
          <FormField label="Last name" htmlFor="last_name" error={errors.last_name?.message}>
            <Input
              id="last_name"
              type="text"
              placeholder="Doe"
              autoComplete="family-name"
              error={!!errors.last_name}
              {...register('last_name')}
            />
          </FormField>
        </div>

        <FormField label="Work email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            placeholder="jane@company.com"
            autoComplete="email"
            error={!!errors.email}
            {...register('email')}
          />
        </FormField>

        <FormField
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
          hint="Must be at least 6 characters"
        >
          <Input
            id="password"
            type="password"
            placeholder="6+ characters"
            autoComplete="new-password"
            error={!!errors.password}
            {...register('password')}
          />
        </FormField>

        <FormField label="Job title" htmlFor="job_title">
          <Input
            id="job_title"
            type="text"
            placeholder="Sales Executive (optional)"
            autoComplete="organization-title"
            {...register('job_title')}
          />
        </FormField>

        <Button type="submit" size="lg" loading={isRegistering} className="mt-2 w-full">
          {isRegistering ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      {/* Footer */}
      <p className="text-center text-caption text-text-tertiary">
        Already have an account?{' '}
        <Link href="/login" className="text-forge-400 hover:text-forge-300 transition-colors duration-100">
          Sign in
        </Link>
      </p>
    </div>
  );
}
