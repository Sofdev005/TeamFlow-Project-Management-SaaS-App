'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/apiClient';
import BrandLogo from '@/components/BrandLogo';
import Spinner from '@/components/Spinner';
import { FlowButton } from '@/components/ui/flow-button';
import KineticGrid from '@/components/KineticGrid';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.push('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed. Check your credentials.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <KineticGrid />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <BrandLogo className="mb-3" />
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to your TeamFlow workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Your password"
            />
          </div>

          <FlowButton
            type="submit"
            loading={submitting}
            className="w-full"
          >
            {submitting && (
              <Spinner className="h-4 w-4 text-[var(--flow-accent)] group-hover:text-white group-focus-visible:text-white" />
            )}
            {submitting ? 'Signing in...' : 'Sign in'}
          </FlowButton>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          No account yet?{' '}
          <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-700">
            Create a workspace
          </Link>
        </p>
      </div>
    </div>
  );
}
