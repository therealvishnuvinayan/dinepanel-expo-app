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
import { setApiAccessToken, setUnauthorizedHandler } from '@/api/client';
import { getStoredToken, removeStoredToken, storeToken } from '@/api/tokenStorage';
import type { ApiUser } from '@/api/types';

type AuthContextValue = {
  user: ApiUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(async () => {
    setApiAccessToken(null);
    setUser(null);
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
        if (!token) return;
        setApiAccessToken(token);
        const restoredUser = await authApi.getMe();
        if (active) setUser(restoredUser);
      } catch {
        await clearSession();
      } finally {
        if (active) setIsLoading(false);
      }
    };
    restoreSession();
    return () => {
      active = false;
    };
  }, [clearSession]);

  const requestOtp = useCallback(async (phone: string) => {
    await authApi.requestOtp(phone);
  }, []);

  const verifyOtp = useCallback(async (phone: string, otp: string) => {
    const response = await authApi.verifyOtp(phone, otp);
    setApiAccessToken(response.access_token);
    await storeToken(response.access_token);
    setUser(response.user);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      requestOtp,
      verifyOtp,
      logout: clearSession,
    }),
    [clearSession, isLoading, requestOtp, user, verifyOtp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
