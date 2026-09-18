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

  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);

    const initAuth = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data?.success && res.data?.data?.user) {
          setUser(res.data.data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, []);

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
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
