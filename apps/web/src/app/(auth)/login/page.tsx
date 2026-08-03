'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAuth } from '@/hooks/use-auth';
import { Button, Input, FormField } from '@/components/ui/primitives';

// ── Validation ────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email:    z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LoginPage(): React.JSX.Element {
  const { login, isLoggingIn } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    setError(null);
    try {
      await login(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in. Please check your credentials.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="space-y-1">
        <h1 className="text-h1 text-text-primary">Welcome back</h1>
        <p className="text-body text-text-secondary">Sign in to your workspace</p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/8 px-3.5 py-2.5 text-label text-red-400">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            error={!!errors.email}
            {...register('email')}
          />
        </FormField>

        <FormField label="Password" htmlFor="password" error={errors.password?.message}>
          <div className="space-y-1.5">
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={!!errors.password}
              {...register('password')}
            />
            <div className="flex justify-end">
              <Link
                href="/reset-password"
                className="text-caption text-text-tertiary hover:text-forge-400 transition-colors duration-100"
              >
                Forgot password?
              </Link>
            </div>
          </div>
        </FormField>

        <Button
          type="submit"
          size="lg"
          loading={isLoggingIn}
          className="mt-2 w-full"
        >
          {isLoggingIn ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      {/* Footer */}
      <p className="text-center text-caption text-text-tertiary">
        No account?{' '}
        <Link href="/register" className="text-forge-400 hover:text-forge-300 transition-colors duration-100">
          Create one free
        </Link>
      </p>
    </div>
  );
}
