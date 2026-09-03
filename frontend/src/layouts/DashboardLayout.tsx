import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  LayoutDashboard,
  FileText,
  Building,
  GraduationCap,
  Users,
  UserCheck,
  CheckSquare,
  BookOpen,
  Award,
  Bell,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  Building2,
  History,
  Plane,
  FileCheck2,
  DollarSign,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/frontend';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Auto close mobile drawer on route changes
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  if (!user) {
    return null;
  }

  const role = user.roles[0] || UserRole.STUDENT;

  // Build role-based sidebar sections
  const getNavSections = (): NavSection[] => {
    if (role === UserRole.SUPER_ADMIN || role === UserRole.AZAAM_STAFF) {
      return [
        {
          title: 'OVERVIEW',
          items: [
            { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          ],
        },
        {
          title: 'MANAGEMENT',
          items: [
            { path: '/admin/users', label: 'Users', icon: Users },
            { path: '/admin/universities', label: 'Universities', icon: GraduationCap },
            { path: '/admin/organizations', label: 'Hospitals', icon: Building2 },
            { path: '/admin/supervisors', label: 'Supervisors', icon: UserCheck },
          ],
        },
        {
          title: 'CLINICAL OPERATIONS',
          items: [
            { path: '/dashboard/applications', label: 'Applications', icon: FileText },
            { path: '/dashboard/placements', label: 'Placements & Capacity', icon: Building },
            { path: '/dashboard/attendance', label: 'Attendance Monitoring', icon: CheckSquare },
            { path: '/dashboard/logbooks', label: 'Digital Logbooks', icon: BookOpen },
            { path: '/dashboard/evaluations', label: 'Evaluations', icon: Award },
            { path: '/dashboard/certificates', label: 'Certificates', icon: ShieldCheck },
          ],
        },
        {
          title: 'SYSTEM',
          items: [
            { path: '/admin/audit-logs', label: 'Audit Logs', icon: History },
          ],
        },
      ];
    }

    if (role === UserRole.UNIVERSITY_ADMIN || role === UserRole.UNIVERSITY_STAFF) {
      return [
        {
          title: 'MAIN MENU',
          items: [
            { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/university/mou', label: 'Bilateral MoU', icon: FileCheck2 },
            { path: '/university/students', label: 'Medical Trainees Hub', icon: Users },
            { path: '/university/financials', label: 'Billing & Invoices', icon: DollarSign },
          ],
        },
        {
          title: 'CLINICAL RECORDS',
          items: [
            { path: '/dashboard/attendance', label: 'Shift Attendance', icon: CheckSquare },
            { path: '/dashboard/logbooks', label: 'Clinical Logbooks', icon: BookOpen },
            { path: '/dashboard/evaluations', label: 'Preceptor Evaluations', icon: Award },
            { path: '/dashboard/certificates', label: 'Certificates', icon: ShieldCheck },
          ],
        },
      ];
    }

    if (role === UserRole.ORGANIZATION_ADMIN || role === UserRole.ORGANIZATION_STAFF) {
      return [
        {
          title: 'OVERVIEW',
          items: [
            { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          ],
        },
        {
          title: 'HOSPITAL MANAGEMENT',
          items: [
            { path: '/admin/organizations', label: 'Hospitals', icon: Building2 },
            { path: '/admin/supervisors', label: 'Supervisors', icon: UserCheck },
          ],
        },
        {
          title: 'CLINICAL ATTACHMENTS',
          items: [
            { path: '/dashboard/applications', label: 'Applications', icon: FileText },
            { path: '/dashboard/placements', label: 'Placements & Capacity', icon: Building },
            { path: '/dashboard/attendance', label: 'Attendance Records', icon: CheckSquare },
            { path: '/dashboard/logbooks', label: 'Supervisor Reviews', icon: BookOpen },
            { path: '/dashboard/evaluations', label: 'Evaluations', icon: Award },
            { path: '/dashboard/certificates', label: 'Issued Certificates', icon: ShieldCheck },
          ],
        },
      ];
    }

    if (role === UserRole.CLINICAL_SUPERVISOR) {
      return [
        {
          title: 'WORKSPACE',
          items: [
            { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/dashboard/placements', label: 'Assigned Trainees', icon: Users },
            { path: '/dashboard/attendance', label: 'Log Attendance', icon: CheckSquare },
            { path: '/dashboard/logbooks', label: 'Review Logbooks', icon: BookOpen },
            { path: '/dashboard/evaluations', label: 'Submit Evaluations', icon: Award },
          ],
        },
      ];
    }

    // Student & Independent Applicant
    return [
      {
        title: 'MY ROTATION',
        items: [
          { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
          { path: '/dashboard/applications', label: 'My Applications', icon: FileText },
          { path: '/dashboard/placements', label: 'My Placement', icon: Building },
          { path: '/dashboard/attendance', label: 'My Attendance', icon: CheckSquare },
          { path: '/dashboard/logbooks', label: 'Digital Logbook', icon: BookOpen },
          { path: '/dashboard/evaluations', label: 'My Evaluations', icon: Award },
          { path: '/dashboard/certificates', label: 'My Certificates', icon: ShieldCheck },
        ],
      },
    ];
  };

  const navSections = getNavSections();

  const isLinkActive = (itemPath: string) => {
    if (itemPath === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/admin';
    }
    return location.pathname === itemPath || location.pathname.startsWith(itemPath + '/');
  };

  // Helper to format breadcrumb
  const getBreadcrumbTitle = () => {
    const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length === 0 || (segments.length === 1 && (segments[0] === 'dashboard' || segments[0] === 'admin'))) {
      return 'Overview';
    }
    const last = segments[segments.length - 1];
    return last.replace(/-/g, ' ');
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col">
      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 md:hidden transition-opacity"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out md:hidden ${
          mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight text-xs block">AZAAM MEDICS</span>
              <span className="text-[9px] text-sky-400 uppercase tracking-widest font-semibold block -mt-0.5">
                Clinical Network
              </span>
            </div>
          </Link>
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="px-4 py-3 bg-slate-800/40 border-b border-slate-800 flex items-center gap-3 text-xs">
          <div className="w-8 h-8 rounded-full bg-sky-900/80 border border-sky-700 text-sky-300 flex items-center justify-center font-bold">
            {user.firstName[0]}
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-slate-200 truncate">{user.firstName} {user.lastName}</p>
            <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
          </div>
        </div>

        {/* Nav List with Sections */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {section.title && (
                <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isLinkActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      active
                        ? 'bg-sky-600 text-white font-semibold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <button
            onClick={() => {
              setMobileDrawerOpen(false);
              logout();
              navigate('/');
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Desktop */}
        <aside className="hidden md:flex md:w-64 bg-slate-900 text-slate-300 flex-col border-r border-slate-800 shrink-0">
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white tracking-tight text-sm block">AZAAM MEDICS</span>
                <span className="text-[10px] text-sky-400 uppercase tracking-widest font-semibold block -mt-0.5">
                  Clinical Network
                </span>
              </div>
            </Link>
          </div>

          {/* User Brief Card */}
          <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-800 flex items-center gap-3 text-xs">
            <div className="w-8 h-8 rounded-full bg-sky-900/80 border border-sky-700 text-sky-300 flex items-center justify-center font-bold">
              {user.firstName[0]}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-slate-200 truncate">{user.firstName} {user.lastName}</p>
              <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
            </div>
          </div>

          {/* Nav list with Sections */}
          <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                {section.title && (
                  <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {section.title}
                  </p>
                )}
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isLinkActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                        active
                          ? 'bg-sky-600 text-white font-semibold shadow-xs'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-800">
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Section */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Topbar */}
          <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileDrawerOpen(true)}
                className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Link to="/dashboard" className="hover:text-sky-600">Portal</Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-slate-800 font-semibold capitalize">
                  {getBreadcrumbTitle()}
                </span>
              </div>
            </div>

            {/* Topbar Controls */}
            <div className="flex items-center gap-3">
              <button className="relative p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-600"></span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-slate-900"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    {user.firstName[0]}
                  </div>
                  <span className="hidden sm:inline-block">{user.firstName}</span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 text-xs z-50">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="font-semibold text-slate-800">{user.firstName} {user.lastName}</p>
                      <p className="text-[10px] text-slate-500">{role}</p>
                    </div>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                        navigate('/');
                      }}
                      className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page Body Container */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

