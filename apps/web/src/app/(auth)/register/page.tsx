'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAuth } from '@/hooks/use-auth';

// ── Form Validation Schema (Password min 12 chars per 504_IDENTITY_AND_AUTHENTICATION.md) ────

const registerSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters long')
    .max(128, 'Password must not exceed 128 characters'),
  job_title: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage(): React.JSX.Element {
  const { register: registerUser, isRegistering } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData): Promise<void> => {
    setErrorMessage(null);
    try {
      await registerUser(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Registration failed. Please try again.');
      }
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Create an account
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Get started with ForgeCRM today
        </p>
      </div>

      {errorMessage !== null && (
        <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-400">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="first_name"
              className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-1.5"
            >
              First Name
            </label>
            <input
              id="first_name"
              type="text"
              placeholder="Jane"
              {...register('first_name')}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm text-white placeholder-slate-500 transition-all focus:border-forge-500 focus:outline-none focus:ring-1 focus:ring-forge-500"
            />
            {errors.first_name?.message !== undefined && (
              <p className="mt-1 text-xs text-rose-400">{errors.first_name.message}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="last_name"
              className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-1.5"
            >
              Last Name
            </label>
            <input
              id="last_name"
              type="text"
              placeholder="Doe"
              {...register('last_name')}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm text-white placeholder-slate-500 transition-all focus:border-forge-500 focus:outline-none focus:ring-1 focus:ring-forge-500"
            />
            {errors.last_name?.message !== undefined && (
              <p className="mt-1 text-xs text-rose-400">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        {/* Email Input */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-1.5"
          >
            Work Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="jane@company.com"
            {...register('email')}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm text-white placeholder-slate-500 transition-all focus:border-forge-500 focus:outline-none focus:ring-1 focus:ring-forge-500"
          />
          {errors.email?.message !== undefined && (
            <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>
          )}
        </div>

        {/* Password Input */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="At least 12 characters"
            {...register('password')}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm text-white placeholder-slate-500 transition-all focus:border-forge-500 focus:outline-none focus:ring-1 focus:ring-forge-500"
          />
          <p className="mt-1 text-xs text-slate-400">
            Must be at least 12 characters long.
          </p>
          {errors.password?.message !== undefined && (
            <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>
          )}
        </div>

        {/* Job Title Optional Input */}
        <div>
          <label
            htmlFor="job_title"
            className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-1.5"
          >
            Job Title <span className="text-slate-500">(Optional)</span>
          </label>
          <input
            id="job_title"
            type="text"
            placeholder="Sales Executive"
            {...register('job_title')}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-sm text-white placeholder-slate-500 transition-all focus:border-forge-500 focus:outline-none focus:ring-1 focus:ring-forge-500"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isRegistering}
          className="mt-6 flex w-full items-center justify-center rounded-lg bg-forge-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-forge-500/25 transition-all hover:bg-forge-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-400 disabled:opacity-50"
        >
          {isRegistering ? (
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span>Creating account…</span>
            </div>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {/* Footer Link */}
      <div className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-forge-400 hover:text-forge-300 transition-colors"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
