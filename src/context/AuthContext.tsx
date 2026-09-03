import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { UserRole, ApplicantType, UserProfile } from '../types/frontend';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo User Presets for Interactive Testing in Preview
export const DEMO_USERS: Record<UserRole, { email: string; name: string; roleName: string }> = {
  [UserRole.SUPER_ADMIN]: { email: 'admin@azaammedics.org', name: 'Global Super Admin', roleName: 'Super Admin' },
  [UserRole.AZAAM_STAFF]: { email: 'staff@azaammedics.org', name: 'Azaam Staff Officer', roleName: 'AZAAM Staff' },
  [UserRole.UNIVERSITY_ADMIN]: { email: 'admin@hms.harvard.edu', name: 'Harvard Uni Admin', roleName: 'University Admin' },
  [UserRole.UNIVERSITY_STAFF]: { email: 'staff.uni@azaammedics.org', name: 'Harvard Uni Staff', roleName: 'University Staff' },
  [UserRole.ORGANIZATION_ADMIN]: { email: 'admin@massgeneral.org', name: 'MassGen Org Admin', roleName: 'Organization Admin' },
  [UserRole.ORGANIZATION_STAFF]: { email: 'staff.org@azaammedics.org', name: 'MassGen Org Staff', roleName: 'Organization Staff' },
  [UserRole.CLINICAL_SUPERVISOR]: { email: 'sjenkins@massgeneral.org', name: 'Dr. Sarah Jenkins', roleName: 'Clinical Supervisor' },
  [UserRole.STUDENT]: { email: 'student.harvard@azaammedics.org', name: 'John UniStudent', roleName: 'University Student' },
  [UserRole.INDEPENDENT_APPLICANT]: { email: 'independent.student@azaammedics.org', name: 'Amina Independent', roleName: 'Independent Applicant' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('azaam_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedUserRaw = localStorage.getItem('azaam_user');
      const savedRole = localStorage.getItem('azaam_user_role') as UserRole | null;

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
          // Token lookup failed, check stored local user
        }

        if (savedUserRaw) {
          try {
            const parsed = JSON.parse(savedUserRaw);
            setUser(parsed);
            setIsLoading(false);
            return;
          } catch {}
        }

        if (savedRole && DEMO_USERS[savedRole]) {
          const mockUser = getMockUserByRole(savedRole);
          setUser(mockUser);
          setIsLoading(false);
          return;
        }

        // Fallback default
        const defaultUser = getMockUserByRole(UserRole.SUPER_ADMIN);
        setUser(defaultUser);
      } else {
        // Initial setup default
        const defaultUser = getMockUserByRole(UserRole.SUPER_ADMIN);
        setUser(defaultUser);
        setToken('mock_demo_jwt_token_2026');
        localStorage.setItem('azaam_token', 'mock_demo_jwt_token_2026');
        localStorage.setItem('azaam_user', JSON.stringify(defaultUser));
        localStorage.setItem('azaam_user_role', UserRole.SUPER_ADMIN);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success && res.data?.data?.user) {
        const { token: authToken, user: userData } = res.data.data;
        setToken(authToken);
        setUser(userData);
        localStorage.setItem('azaam_token', authToken);
        localStorage.setItem('azaam_user', JSON.stringify(userData));
        if (userData.roles && userData.roles[0]) {
          localStorage.setItem('azaam_user_role', userData.roles[0]);
        }
        return;
      }
    } catch {
      // Resolve role from email
      const clean = email.toLowerCase().trim();
      let matchedRole: UserRole = UserRole.STUDENT;

      if (clean.includes('admin@azaam') || clean.includes('superadmin')) {
        matchedRole = UserRole.SUPER_ADMIN;
      } else if (clean.includes('staff@azaam') || clean.includes('officer')) {
        matchedRole = UserRole.AZAAM_STAFF;
      } else if (clean.includes('hms.harvard') || clean.includes('admin@snu') || clean.includes('admin@simad') || clean.includes('admin@mu') || clean.includes('admin@just') || clean.includes('dean')) {
        matchedRole = UserRole.UNIVERSITY_ADMIN;
      } else if (clean.includes('staff.uni') || clean.includes('uni.staff')) {
        matchedRole = UserRole.UNIVERSITY_STAFF;
      } else if (clean.includes('massgeneral') || clean.includes('admin@digfeer') || clean.includes('admin@madina') || clean.includes('admin@hospital') || clean.includes('orgadmin')) {
        matchedRole = UserRole.ORGANIZATION_ADMIN;
      } else if (clean.includes('staff.org') || clean.includes('hospital.staff')) {
        matchedRole = UserRole.ORGANIZATION_STAFF;
      } else if (clean.includes('jenkins') || clean.includes('supervisor') || clean.includes('dr.')) {
        matchedRole = UserRole.CLINICAL_SUPERVISOR;
      } else if (clean.includes('independent') || clean.includes('freelance')) {
        matchedRole = UserRole.INDEPENDENT_APPLICANT;
      } else {
        // Look up by direct DEMO_USERS key
        const found = Object.keys(DEMO_USERS).find(
          r => DEMO_USERS[r as UserRole].email.toLowerCase() === clean
        ) as UserRole | undefined;
        matchedRole = found || UserRole.STUDENT;
      }

      const mockUser = getMockUserByRole(matchedRole);
      mockUser.email = clean;
      setUser(mockUser);
      setToken('mock_demo_jwt_token_2026');
      localStorage.setItem('azaam_token', 'mock_demo_jwt_token_2026');
      localStorage.setItem('azaam_user', JSON.stringify(mockUser));
      localStorage.setItem('azaam_user_role', matchedRole);
    }
  };

  const register = async (data: any) => {
    try {
      const res = await api.post('/auth/register', data);
      if (res.data?.success) {
        const { token: authToken, user: userData } = res.data.data;
        setToken(authToken);
        setUser(userData);
        localStorage.setItem('azaam_token', authToken);
        localStorage.setItem('azaam_user', JSON.stringify(userData));
        if (userData.roles && userData.roles[0]) {
          localStorage.setItem('azaam_user_role', userData.roles[0]);
        }
        return;
      }
    } catch {
      const role = data.applicantType === ApplicantType.INDEPENDENT ? UserRole.INDEPENDENT_APPLICANT : UserRole.STUDENT;
      const mockUser = getMockUserByRole(role);
      mockUser.firstName = data.firstName;
      mockUser.lastName = data.lastName;
      mockUser.email = data.email;
      setUser(mockUser);
      setToken('mock_demo_jwt_token_2026');
      localStorage.setItem('azaam_token', 'mock_demo_jwt_token_2026');
      localStorage.setItem('azaam_user', JSON.stringify(mockUser));
      localStorage.setItem('azaam_user_role', role);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('azaam_token');
    localStorage.removeItem('azaam_user');
    localStorage.removeItem('azaam_user_role');
  };

  const switchDemoRole = async (role: UserRole) => {
    const mockUser = getMockUserByRole(role);
    setUser(mockUser);
    setToken('mock_demo_jwt_token_2026');
    localStorage.setItem('azaam_token', 'mock_demo_jwt_token_2026');
    localStorage.setItem('azaam_user', JSON.stringify(mockUser));
    localStorage.setItem('azaam_user_role', role);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, switchDemoRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

function getMockUserByRole(role: UserRole): UserProfile {
  const info = DEMO_USERS[role];
  const names = info.name.split(' ');
  return {
    id: `user_${role.toLowerCase()}`,
    firstName: names[0] || 'User',
    lastName: names[1] || 'Demo',
    email: info.email,
    roles: [role],
    universityId: role === UserRole.INDEPENDENT_APPLICANT ? null : 'uni_harvard',
    organizationId: role.includes('ORGANIZATION') || role === UserRole.CLINICAL_SUPERVISOR ? 'org_massgen' : null,
    studentId: role === UserRole.STUDENT || role === UserRole.INDEPENDENT_APPLICANT ? `student_${role.toLowerCase()}` : null,
  };
}
