'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import {
  AuthResponse,
  User,
  login as loginRequest,
  signup as signupRequest,
  fetchCurrentUser,
} from '@/lib/api';
import { clearToken, getToken, setToken } from '@/lib/storage';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  token: string | null;
  login: (credentials: { email: string; password: string }) => Promise<AuthResponse>;
  signup: (input: { email: string; password: string; displayName?: string }) => Promise<AuthResponse>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const applyAuthResponse = useCallback((response: AuthResponse) => {
    setToken(response.token);
    setTokenState(response.token);
    setUser(response.user);
    setStatus('authenticated');
    return response;
  }, []);

  const loadUser = useCallback(async (tokenValue: string | null) => {
    setStatus('loading');

    if (!tokenValue) {
      setUser(null);
      setStatus('unauthenticated');
      return null;
    }

    try {
      const { user: fetchedUser } = await fetchCurrentUser();
      setUser(fetchedUser);
      setStatus('authenticated');
      return fetchedUser;
    } catch (error) {
      console.error('Failed to load current user', error);
      clearToken();
      setTokenState(null);
      setUser(null);
      setStatus('unauthenticated');
      return null;
    }
  }, []);

  useEffect(() => {
    const storedToken = getToken();
    setTokenState(storedToken);
    loadUser(storedToken);
  }, [loadUser]);

  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      const response = await loginRequest(credentials);
      return applyAuthResponse(response);
    },
    [applyAuthResponse]
  );

  const signup = useCallback(
    async (input: { email: string; password: string; displayName?: string }) => {
      const response = await signupRequest(input);
      return applyAuthResponse(response);
    },
    [applyAuthResponse]
  );

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const refreshUser = useCallback(async () => {
    const storedToken = getToken();
    setTokenState(storedToken);
    return loadUser(storedToken);
  }, [loadUser]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, token, login, signup, logout, refreshUser }),
    [status, user, token, login, signup, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
