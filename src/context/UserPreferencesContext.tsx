'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { TaskPriority } from '@/types';

export type AccentColor = 'indigo' | 'teal' | 'rose';
export type BoardDensity = 'comfortable' | 'compact';

export interface UserPreferences {
  accent: AccentColor;
  boardDensity: BoardDensity;
  defaultTaskPriority: TaskPriority;
}

interface UserPreferencesContextValue {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
}

const STORAGE_KEY = 'teamflow_preferences';
const DEFAULT_PREFERENCES: UserPreferences = {
  accent: 'indigo',
  boardDensity: 'comfortable',
  defaultTaskPriority: 'Medium',
};

const UserPreferencesContext = createContext<UserPreferencesContextValue | null>(null);

function isAccentColor(value: unknown): value is AccentColor {
  return value === 'indigo' || value === 'teal' || value === 'rose';
}

function isBoardDensity(value: unknown): value is BoardDensity {
  return value === 'comfortable' || value === 'compact';
}

function isTaskPriority(value: unknown): value is TaskPriority {
  return value === 'Low' || value === 'Medium' || value === 'High' || value === 'Urgent';
}

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Partial<UserPreferences> = JSON.parse(stored);
        setPreferences({
          accent: isAccentColor(parsed.accent) ? parsed.accent : DEFAULT_PREFERENCES.accent,
          boardDensity: isBoardDensity(parsed.boardDensity) ? parsed.boardDensity : DEFAULT_PREFERENCES.boardDensity,
          defaultTaskPriority: isTaskPriority(parsed.defaultTaskPriority)
            ? parsed.defaultTaskPriority
            : DEFAULT_PREFERENCES.defaultTaskPriority,
        });
      }
    } catch {
      // Ignore unavailable or malformed browser storage and keep defaults.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.dataset.accent = preferences.accent;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Preferences remain available for this session when storage is unavailable.
    }
  }, [hydrated, preferences]);

  const value: UserPreferencesContextValue = {
    preferences,
    updatePreferences: (updates) => setPreferences((current) => ({ ...current, ...updates })),
    resetPreferences: () => setPreferences(DEFAULT_PREFERENCES),
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences(): UserPreferencesContextValue {
  const context = useContext(UserPreferencesContext);
  if (!context) throw new Error('useUserPreferences must be used inside <UserPreferencesProvider>');
  return context;
}