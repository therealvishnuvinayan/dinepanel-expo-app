import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import * as authApi from '@/api/auth';
import type { RequestOtpResponse } from '@/api/auth';
import { setApiAccessToken, setUnauthorizedHandler } from '@/api/client';
import { getStoredToken, removeStoredToken, storeToken } from '@/api/tokenStorage';
import type { ApiUser } from '@/api/types';

export type AuthStatus = 'RESTORING' | 'AUTHENTICATED' | 'UNAUTHENTICATED';

type AuthContextValue = {
  user: ApiUser | null;
  authStatus: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  requestOtp: (phone: string) => Promise<RequestOtpResponse>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('RESTORING');

  const clearSession = useCallback(async () => {
    setApiAccessToken(null);
    setUser(null);
    setAuthStatus('UNAUTHENTICATED');
    await removeStoredToken();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      try {
        const token = await getStoredToken();
        if (!active) return;
        if (!token) {
          setAuthStatus('UNAUTHENTICATED');
          return;
        }
        setApiAccessToken(token);
        const restoredUser = await authApi.getMe();
        if (!active) return;
        setUser(restoredUser);
        setAuthStatus('AUTHENTICATED');
      } catch {
        if (active) await clearSession();
      }
    };
    restoreSession();
    return () => {
      active = false;
    };
  }, [clearSession]);

  const requestOtp = useCallback(async (phone: string) => {
    return authApi.requestOtp(phone);
  }, []);

  const verifyOtp = useCallback(async (phone: string, otp: string) => {
    const response = await authApi.verifyOtp(phone, otp);
    setApiAccessToken(response.access_token);
    await storeToken(response.access_token);
    setUser(response.user);
    setAuthStatus('AUTHENTICATED');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      authStatus,
      isLoading: authStatus === 'RESTORING',
      isAuthenticated: authStatus === 'AUTHENTICATED',
      requestOtp,
      verifyOtp,
      logout: clearSession,
    }),
    [authStatus, clearSession, requestOtp, user, verifyOtp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
