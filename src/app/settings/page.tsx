'use client';

import { Building2, Check, ListTodo, Palette, RotateCcw, User } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useUserPreferences, type AccentColor, type BoardDensity } from '@/context/UserPreferencesContext';
import type { TaskPriority } from '@/types';

const ACCENTS: { id: AccentColor; label: string; swatch: string }[] = [
  { id: 'indigo', label: 'Indigo', swatch: '#4f46e5' },
  { id: 'teal', label: 'Teal', swatch: '#0f766e' },
  { id: 'rose', label: 'Rose', swatch: '#be123c' },
];

const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

const DENSITIES: { id: BoardDensity; label: string; description: string }[] = [
  { id: 'comfortable', label: 'Comfortable', description: 'More room on each task card' },
  { id: 'compact', label: 'Compact', description: 'Fit more tasks on the board' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { preferences, updatePreferences, resetPreferences } = useUserPreferences();

  return (
    <DashboardLayout>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Personalize how TeamFlow looks and works for you.</p>
      </header>

      <div className="max-w-3xl divide-y divide-slate-200">
        <section className="py-6 first:pt-2">
          <div className="mb-5 flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-semibold">Profile</h2>
          </div>
          <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Full name</dt>
              <dd className="mt-1 font-medium text-slate-900">{user?.fullName ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="mt-1 font-medium text-slate-900">{user?.email ?? '—'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-500">User ID</dt>
              <dd className="mt-1 break-all font-mono text-xs text-slate-700">{user?.id ?? '—'}</dd>
            </div>
          </dl>
        </section>

        <section className="py-6">
          <div className="mb-5 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-semibold">Workspace</h2>
          </div>
          <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Organization ID</dt>
              <dd className="mt-1 break-all font-mono text-xs text-slate-700">
                {user?.organizationId ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Plan</dt>
              <dd className="mt-1 font-medium text-slate-900">Free</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-slate-500">
            Profile and workspace details are managed by your organization administrator.
          </p>
        </section>

        <section className="py-6">
          <div className="mb-5 flex items-center gap-2">
            <Palette className="h-5 w-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-semibold">Appearance</h2>
              <p className="mt-0.5 text-xs text-slate-500">Choose an accent used throughout the app.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {ACCENTS.map((accent) => {
              const selected = preferences.accent === accent.id;
              return (
                <button
                  key={accent.id}
                  type="button"
                  onClick={() => updatePreferences({ accent: accent.id })}
                  aria-label={`${accent.label} accent`}
                  aria-pressed={selected}
                  className={`flex min-w-28 items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    selected ? 'border-slate-900 bg-white text-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: accent.swatch }}>
                    {selected && <Check className="h-3 w-3 text-white" />}
                  </span>
                  {accent.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="py-6">
          <div className="mb-5 flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-semibold">Board defaults</h2>
              <p className="mt-0.5 text-xs text-slate-500">Applied when you create tasks or open a board.</p>
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-700">Default task priority</legend>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => updatePreferences({ defaultTaskPriority: priority })}
                  aria-pressed={preferences.defaultTaskPriority === priority}
                  className={`rounded-md border px-3 py-2 text-sm font-medium ${
                    preferences.defaultTaskPriority === priority
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-medium text-slate-700">Board density</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {DENSITIES.map((density) => {
                const selected = preferences.boardDensity === density.id;
                return (
                  <button
                    key={density.id}
                    type="button"
                    onClick={() => updatePreferences({ boardDensity: density.id })}
                    aria-pressed={selected}
                    className={`rounded-md border p-3 text-left ${
                      selected ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-sm font-medium text-slate-900">{density.label}</span>
                    <span className="mt-1 block text-xs text-slate-500">{density.description}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Preferences are saved automatically in this browser.</p>
            <button
              type="button"
              onClick={resetPreferences}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" /> Reset preferences
            </button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}