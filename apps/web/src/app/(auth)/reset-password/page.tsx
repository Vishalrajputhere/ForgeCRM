'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { apiPost } from '@/lib/api-client';

const resetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPasswordPage(): React.JSX.Element {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetFormData): Promise<void> => {
    setIsSubmitting(true);
    try {
      await apiPost('/auth/password-reset/request', data);
    } catch {
      // Security standard: Always display success message regardless of email existence to prevent user enumeration
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Reset password
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Enter your email and we&apos;ll send you a recovery link
        </p>
      </div>

      {isSubmitted ? (
        <div className="space-y-4 text-center">
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-400">
            If an account exists for that email, password recovery instructions have been sent.
          </div>
          <Link
            href="/login"
            className="inline-block text-sm font-medium text-forge-400 hover:text-forge-300 transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-1.5"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@company.com"
              {...register('email')}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 transition-all focus:border-forge-500 focus:outline-none focus:ring-1 focus:ring-forge-500"
            />
            {errors.email?.message !== undefined && (
              <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 flex w-full items-center justify-center rounded-lg bg-forge-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-forge-500/25 transition-all hover:bg-forge-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-400 disabled:opacity-50"
          >
            {isSubmitting ? 'Sending Link…' : 'Send Reset Link'}
          </button>

          <div className="mt-6 text-center text-sm text-slate-400">
            Remembered your password?{' '}
            <Link
              href="/login"
              className="font-medium text-forge-400 hover:text-forge-300 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
