import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  UserCheck,
  FileText,
  Building,
  CheckSquare,
  BookOpen,
  Award,
  ShieldCheck,
  BarChart3,
  History,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/frontend';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle escape key for mobile menu drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const navSections: NavSection[] = [
    {
      title: 'OVERVIEW',
      items: [{ name: 'Dashboard', href: '/admin', icon: LayoutDashboard }],
    },
    {
      title: 'PLATFORM',
      items: [
        {
          name: 'Users',
          href: '/admin/users',
          icon: Users,
          roles: [UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF, UserRole.UNIVERSITY_ADMIN, UserRole.ORGANIZATION_ADMIN],
        },
        {
          name: 'Universities',
          href: '/admin/universities',
          icon: GraduationCap,
          roles: [UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF, UserRole.UNIVERSITY_ADMIN],
        },
        {
          name: 'Hospitals',
          href: '/admin/organizations',
          icon: Building2,
          roles: [UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF, UserRole.ORGANIZATION_ADMIN],
        },
        {
          name: 'Supervisors',
          href: '/admin/supervisors',
          icon: UserCheck,
          roles: [UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF, UserRole.ORGANIZATION_ADMIN],
        },
      ],
    },
    {
      title: 'CLINICAL OPERATIONS',
      items: [
        { name: 'Applications', href: '/dashboard/applications', icon: FileText },
        { name: 'Placements', href: '/dashboard/placements', icon: Building },
        { name: 'Attendance', href: '/dashboard/attendance', icon: CheckSquare },
        { name: 'Logbooks', href: '/dashboard/logbook', icon: BookOpen },
        { name: 'Evaluations', href: '/dashboard/evaluations', icon: Award },
        { name: 'Certificates', href: '/dashboard/certificates', icon: ShieldCheck },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        {
          name: 'Audit Logs',
          href: '/admin/audit-logs',
          icon: History,
          roles: [UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF],
        },
      ],
    },
  ];

  const hasRolePermission = (itemRoles?: UserRole[]) => {
    if (!itemRoles || itemRoles.length === 0) return true;
    if (!user || !user.roles) return false;
    return user.roles.some((r) => itemRoles.includes(r as UserRole));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentRole = user?.roles?.[0] || UserRole.STUDENT;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Top Navigation Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-xs h-16 flex items-center px-4 md:px-6 justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link to="/admin" className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base tracking-tight leading-none block">
                AZAAM MEDICS
              </span>
              <span className="text-[10px] font-semibold text-teal-700 tracking-wider uppercase block">
                Admin Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Right Header Menu */}
        <div className="flex items-center space-x-3">
          {/* Quick Demo Role Switcher */}
          <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition relative hidden sm:flex">
            <Bell className="w-5 h-5" />
            <span className="w-2 h-2 bg-rose-500 rounded-full absolute top-1.5 right-1.5"></span>
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-xs">
              {user?.firstName ? user.firstName[0] : 'A'}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-none">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex flex-1 relative">
        {/* Sidebar (Desktop) & Drawer (Mobile) */}
        <aside
          className={`fixed md:sticky top-16 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-200 shrink-0 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Mobile Drawer Close Button */}
          <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
            <span className="text-xs font-bold uppercase text-slate-500">Navigation Menu</span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            {navSections.map((section) => {
              const visibleItems = section.items.filter((item) => hasRolePermission(item.roles));
              if (visibleItems.length === 0) return null;

              return (
                <div key={section.title}>
                  <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {section.title}
                  </p>
                  <div className="space-y-1">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        location.pathname === item.href ||
                        (item.href !== '/admin' && location.pathname.startsWith(item.href));

                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                            isActive
                              ? 'bg-teal-600 text-white shadow-xs font-semibold'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/60 text-center text-[10px] text-slate-400 font-mono">
            AZAAM Admin v1.0.0
          </div>
        </aside>

        {/* Main Workspace View */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
