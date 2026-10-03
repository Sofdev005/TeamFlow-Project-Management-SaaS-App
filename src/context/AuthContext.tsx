'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import apiClient, { getErrorMessage } from '@/lib/apiClient';
import type { AuthUser, AuthenticationResult } from '@/types';

export interface RegisterInput {
  firstName: string;
  lastName: string;
  organizationName: string;
  email: string;
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  /** True until localStorage auth has been read on mount. */
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'teamflow_token';
const USER_KEY = 'teamflow_user';

function mapAuthResult(data: AuthenticationResult): AuthUser {
  return {
    id: data.userId,
    email: data.email,
    fullName: `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim() || data.email,
    organizationId: data.orgId,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else if (storedToken || storedUser) {
        // Partial state is unusable - clear it.
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = useCallback((nextToken: string, nextUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      const { data } = await apiClient.post<AuthenticationResult>('/auth/login', {
        email,
        password,
      });
      if (!data?.token) throw new Error(getErrorMessage(null, 'Login succeeded but no token was returned.'));
      const nextUser = mapAuthResult(data);
      persist(data.token, nextUser);
      return nextUser;
    },
    [persist]
  );

  const register = useCallback(
    async (input: RegisterInput): Promise<AuthUser> => {
      const { data } = await apiClient.post<AuthenticationResult>('/auth/register', input);
      if (!data?.token) throw new Error(getErrorMessage(null, 'Registration succeeded but no token was returned.'));
      const nextUser = mapAuthResult(data);
      persist(data.token, nextUser);
      return nextUser;
    },
    [persist]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!token, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
