import React, { useEffect, useState } from 'react';
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
  History,
  Bell,
  LogOut,
  Menu,
  X,
  Search,
  LifeBuoy,
  ChevronDown,
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

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navSections: NavSection[] = [
    {
      title: 'OVERVIEW',
      items: [{ name: 'Dashboard', href: '/admin', icon: LayoutDashboard }],
    },
    {
      title: 'MANAGEMENT',
      items: [
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
          name: 'Students',
          href: '/admin/students',
          icon: Users,
          roles: [UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF, UserRole.UNIVERSITY_ADMIN],
        },
        {
          name: 'Supervisors',
          href: '/admin/supervisors',
          icon: UserCheck,
          roles: [UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF, UserRole.ORGANIZATION_ADMIN],
        },
        {
          name: 'Users & Roles',
          href: '/admin/users',
          icon: Users,
          roles: [UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF, UserRole.UNIVERSITY_ADMIN, UserRole.ORGANIZATION_ADMIN],
        },
      ],
    },
    {
      title: 'CLINICAL OPERATIONS',
      items: [
        { name: 'Applications', href: '/dashboard/applications', icon: FileText },
        { name: 'Clinical Placements', href: '/dashboard/placements', icon: Building },
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
    if (!user?.roles) return false;
    return user.roles.some((role) => itemRoles.includes(role as UserRole));
  };

  const isItemActive = (href: string) =>
    location.pathname === href || (href !== '/admin' && location.pathname.startsWith(href));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentRole = String(user?.roles?.[0] || UserRole.STUDENT).replaceAll('_', ' ');
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Azaam Admin';

  return (
    <div className="min-h-screen bg-[#f5f8fb] font-sans text-slate-800">
      {mobileMenuOpen && (
        <button
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <header className="sticky top-0 z-30 h-[72px] border-b border-slate-200/80 bg-white/95 shadow-[0_2px_16px_rgba(15,23,42,0.04)] backdrop-blur-xl">
        <div className="flex h-full items-center gap-3 px-3 sm:px-4 lg:px-6">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setMobileMenuOpen(true)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 md:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>

          <Link to="/admin" className="flex min-w-fit items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-[0_8px_22px_rgba(13,148,136,0.22)]">
              <Activity className="h-6 w-6" />
            </div>
            <div className="leading-tight">
              <div className="text-[17px] font-extrabold tracking-tight text-slate-950 sm:text-lg">AZAAM MEDICS</div>
              <div className="hidden text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:block">
                Education · Practice · Better Health
              </div>
            </div>
          </Link>

          <div className="mx-auto hidden w-full max-w-xl md:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                aria-label="Search portal"
                placeholder="Search students, universities, hospitals, or users..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-4 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-300 focus:bg-white focus:ring-4 focus:ring-teal-50"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
            <button
              type="button"
              aria-label="Notifications"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            <div className="hidden h-8 w-px bg-slate-200 sm:block" />

            <div className="flex items-center gap-2 rounded-xl px-1.5 py-1 sm:px-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-extrabold text-slate-700">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden min-w-0 lg:block">
                <div className="max-w-[150px] truncate text-xs font-bold text-slate-900">{displayName}</div>
                <div className="max-w-[150px] truncate text-[10px] capitalize text-slate-500">{currentRole.toLowerCase()}</div>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-slate-400 lg:block" />
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-72px)]">
        <aside
          className={`fixed left-0 top-[72px] z-50 flex h-[calc(100vh-72px)] w-[272px] shrink-0 flex-col border-r border-slate-800 bg-gradient-to-b from-[#0f2238] via-[#11283f] to-[#0b1b2d] text-white shadow-2xl transition-transform duration-200 md:sticky md:z-20 md:w-64 md:translate-x-0 md:shadow-none ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 md:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500 text-white">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-extrabold">AZAAM MEDICS</div>
                <div className="text-[10px] text-slate-400">Admin Navigation</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
            <div className="space-y-6">
              {navSections.map((section) => {
                const visibleItems = section.items.filter((item) => hasRolePermission(item.roles));
                if (visibleItems.length === 0) return null;

                return (
                  <div key={section.title}>
                    <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      {section.title}
                    </div>
                    <div className="space-y-1">
                      {visibleItems.map((item) => {
                        const Icon = item.icon;
                        const active = isItemActive(item.href);
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                              active
                                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)]'
                                : 'text-slate-200 hover:bg-white/8 hover:text-white'
                            }`}
                          >
                            <Icon className={`h-[18px] w-[18px] ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                            <span>{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </nav>

          <div className="p-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                  <LifeBuoy className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white">Need Help?</div>
                  <div className="text-[10px] text-slate-400">Contact support</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-x-hidden bg-[#f5f8fb]">
          <div className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6 xl:px-7">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
