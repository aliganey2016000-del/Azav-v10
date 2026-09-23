import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { AUTH_SESSION_EXPIRED_EVENT } from '../services/api';
import { UserProfile } from '../types/frontend';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  sessionError: boolean;
  retrySession: () => void;
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

  const retrySession = () => setAttempt((value) => value + 1);

  return (
    <AuthContext.Provider value={{ user, token: null, isLoading, sessionError, retrySession, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
