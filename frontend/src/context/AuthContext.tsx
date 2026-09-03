import React, { createContext, useContext, useState, useEffect } from 'react';
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

const clearStoredSession = () => {
  localStorage.removeItem('azaam_token');
  localStorage.removeItem('azaam_user');
  localStorage.removeItem('azaam_user_role');
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('azaam_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const handleSessionExpired = () => {
      setToken(null);
      setUser(null);
      clearStoredSession();
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);

    const initAuth = async () => {
      const savedUserRaw = localStorage.getItem('azaam_user');

      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success && res.data?.data?.user) {
            setUser(res.data.data.user);
            localStorage.setItem('azaam_user', JSON.stringify(res.data.data.user));
            setIsLoading(false);
            return;
          }
        } catch {
          handleSessionExpired();
          setIsLoading(false);
          return;
        }
      } else {
        setUser(null);
      }

      if (!savedUserRaw) {
        clearStoredSession();
      }
      setIsLoading(false);
    };

    initAuth();

    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    if (!res.data?.success || !res.data?.data?.user || !res.data?.data?.token) {
      throw new Error('Login response was invalid');
    }

    const { token: authToken, user: userData } = res.data.data;
    setToken(authToken);
    setUser(userData);
    localStorage.setItem('azaam_token', authToken);
    localStorage.setItem('azaam_user', JSON.stringify(userData));
    if (userData.roles && userData.roles[0]) {
      localStorage.setItem('azaam_user_role', userData.roles[0]);
    }
  };

  const register = async (data: any) => {
    const res = await api.post('/auth/register', data);
    if (!res.data?.success || !res.data?.data?.user || !res.data?.data?.token) {
      throw new Error('Registration response was invalid');
    }

    const { token: authToken, user: userData } = res.data.data;
    setToken(authToken);
    setUser(userData);
    localStorage.setItem('azaam_token', authToken);
    localStorage.setItem('azaam_user', JSON.stringify(userData));
    if (userData.roles && userData.roles[0]) {
      localStorage.setItem('azaam_user_role', userData.roles[0]);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    clearStoredSession();
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
