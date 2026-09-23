import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { AUTH_SESSION_EXPIRED_EVENT } from '../services/api';
import { UserProfile } from '../types/frontend';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sessionError, setSessionError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);

    const controller = new AbortController();
    let active = true;
    const initAuth = async () => {
      setIsLoading(true);
      setSessionError(false);
      try {
        const res = await api.get('/auth/me', { timeout: 15000, signal: controller.signal });
        if (!active) return;
        if (res.data?.success && res.data?.data?.user) {
          setUser(res.data.data.user);
        } else {
          setUser(null);
        }
      } catch (error: any) {
        if (!active) return;
        setUser(null);
        setSessionError(error?.response?.status !== 401);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      active = false;
      controller.abort();
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [attempt]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    if (!res.data?.success || !res.data?.data?.user) {
      throw new Error('Login response was invalid');
    }
    setUser(res.data.data.user);
  };

  const register = async (data: any) => {
    const res = await api.post('/auth/register', data);
    if (!res.data?.success || !res.data?.data?.user) {
      throw new Error('Registration response was invalid');
    }
    setUser(res.data.data.user);
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token: null, isLoading, login, register, logout }}>
      {sessionError ? (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-800">
          <div role="alert" className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm">
            <h1 className="text-lg font-bold">Unable to connect</h1>
            <p className="mt-2 text-sm">Check your connection and try again to restore your session.</p>
            <button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-4 rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white">Try again</button>
          </div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
