'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { ApiError } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';

export type AuthFormVariant = 'login' | 'signup';

const titles: Record<AuthFormVariant, string> = {
  login: 'Welcome back',
  signup: 'Create your account',
};

const subtitles: Record<AuthFormVariant, string> = {
  login: 'Sign in to access your smart wardrobe.',
  signup: "Join now and start digitizing your closet.",
};

const oppositeVariant: Record<AuthFormVariant, { href: string; label: string }> = {
  login: { href: '/signup', label: "Don't have an account? Sign up" },
  signup: { href: '/login', label: 'Already have an account? Sign in' },
};

export type AuthFormProps = {
  variant: AuthFormVariant;
};

export const AuthForm = ({ variant }: AuthFormProps) => {
  const router = useRouter();
  const { login, signup } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(null);
    setIsSubmitting(true);

    try {
      if (variant === 'login') {
        await login({ email, password });
      } else {
        await signup({ email, password, displayName: displayName || undefined });
      }

      router.push('/');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unexpected error. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl shadow-black/40">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">{titles[variant]}</h1>
        <p className="text-sm text-slate-400">{subtitles[variant]}</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>

        {variant === 'signup' && (
          <div className="space-y-2">
            <label className="block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              Display name (optional)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Alex Miller"
              className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete={variant === 'login' ? 'current-password' : 'new-password'}
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            minLength={8}
          />
          <p className="text-xs text-slate-500">Use at least 8 characters.</p>
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Processing…' : variant === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <div className="text-center text-sm">
        <Link className="text-indigo-400 transition hover:text-indigo-300" href={oppositeVariant[variant].href}>
          {oppositeVariant[variant].label}
        </Link>
      </div>
    </div>
  );
};
