/**
 * Unified Portal Layout
 * Responsive layout for all authenticated portals.
 * Super Admin receives the premium dark-sidebar dashboard shell.
 */

import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Menu,
  X,
  Bell,
  LogOut,
  ChevronRight,
  ChevronDown,
  Search,
  LifeBuoy,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/frontend';
import { getPortalConfig, getPortalRoot } from '../config/navigation';

export const PortalLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const currentRole = user?.roles?.[0] || UserRole.STUDENT;
  const portalConfig = getPortalConfig(currentRole);
  const isAdminPortal = currentRole === UserRole.SUPER_ADMIN || currentRole === UserRole.AZAAM_STAFF;

  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSection = (title: string | undefined) => {
    if (!title) return;
    setExpandedSections((previous) => {
      const next = new Set(previous);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const isItemActive = (itemPath: string) => {
    if (itemPath === location.pathname) return true;
    return itemPath !== '/' && location.pathname.startsWith(itemPath);
  };

  const hasSectionActive = (title: string | undefined) => {
    if (!title) return false;
    const section = portalConfig.sections.find((item) => item.title === title);
    return section ? section.items.some((item) => isItemActive(item.path)) : false;
  };

  useEffect(() => {
    const next = new Set<string>();
    portalConfig.sections.forEach((section) => {
      if (section.title && hasSectionActive(section.title)) next.add(section.title);
    });
    setExpandedSections(next);
  }, [currentRole, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Azaam Admin';
  const roleLabel = String(currentRole).replaceAll('_', ' ').toLowerCase();

  return (
    <div className="min-h-screen bg-[#f5f8fb] font-sans text-slate-800">
      {mobileDrawerOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      <header className={`sticky top-0 z-30 flex h-[72px] items-center border-b px-3 sm:px-4 lg:px-6 ${isAdminPortal ? 'border-slate-200/80 bg-white/95 shadow-[0_2px_16px_rgba(15,23,42,0.04)] backdrop-blur-xl' : 'border-slate-200/80 bg-white shadow-sm'}`}>
        <div className="flex w-full items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-6 w-6" />
          </button>

          <Link to={getPortalRoot(currentRole)} className="flex min-w-fit items-center gap-2.5">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white ${isAdminPortal ? 'bg-gradient-to-br from-teal-500 to-teal-700 shadow-[0_8px_22px_rgba(13,148,136,0.22)]' : 'bg-teal-600 shadow-sm'}`}>
              <Activity className="h-6 w-6" />
            </div>
            <div className="leading-tight">
              <span className="block text-[17px] font-extrabold tracking-tight text-slate-950 sm:text-lg">AZAAM MEDICS</span>
              <span className={`block text-[9px] font-semibold uppercase tracking-[0.14em] ${isAdminPortal ? 'text-slate-500' : 'text-teal-700'}`}>
                {isAdminPortal ? 'Education · Practice · Better Health' : portalConfig.portalTitle}
              </span>
            </div>
          </Link>

          {isAdminPortal && (
            <div className="mx-auto hidden w-full max-w-xl md:block">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  aria-label="Search admin portal"
                  placeholder="Search students, universities, hospitals, or users..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-4 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-300 focus:bg-white focus:ring-4 focus:ring-teal-50"
                />
              </div>
            </div>
          )}

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
            <button
              type="button"
              className="relative hidden h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 sm:inline-flex"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            <div className="hidden h-8 w-px bg-slate-200 sm:block" />

            <div className="flex items-center gap-2 rounded-xl px-1 py-1 sm:px-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-extrabold text-slate-700">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden min-w-0 lg:block">
                <div className="max-w-[150px] truncate text-xs font-bold text-slate-900">{displayName}</div>
                <div className="max-w-[150px] truncate text-[10px] capitalize text-slate-500">{roleLabel}</div>
              </div>
              {isAdminPortal && <ChevronDown className="hidden h-4 w-4 text-slate-400 lg:block" />}
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
          className={`fixed left-0 top-[72px] z-50 flex h-[calc(100vh-72px)] w-[272px] shrink-0 flex-col border-r transition-transform duration-200 md:sticky md:z-20 md:w-64 md:translate-x-0 ${
            mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
          } ${
            isAdminPortal
              ? 'border-slate-800 bg-gradient-to-b from-[#0f2238] via-[#11283f] to-[#0b1b2d] text-white shadow-2xl md:shadow-none'
              : 'border-slate-200/80 bg-white shadow-xl md:shadow-none'
          }`}
        >
          <div className={`flex items-center justify-between border-b px-4 py-3 md:hidden ${isAdminPortal ? 'border-white/10' : 'border-slate-100 bg-slate-50'}`}>
            <div className="flex items-center gap-2">
              {isAdminPortal && (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500 text-white">
                  <Activity className="h-5 w-5" />
                </div>
              )}
              <div>
                <div className={`text-xs font-extrabold ${isAdminPortal ? 'text-white' : 'text-slate-700'}`}>Navigation</div>
                {isAdminPortal && <div className="text-[10px] text-slate-400">Super Admin</div>}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl transition ${isAdminPortal ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin]">
            <div className="space-y-6">
              {portalConfig.sections.map((section) => {
                if (!section.items?.length) return null;
                const isExpanded = !section.title || expandedSections.has(section.title);

                return (
                  <div key={section.title || 'default'}>
                    {section.title && (
                      <button
                        type="button"
                        onClick={() => toggleSection(section.title)}
                        className={`mb-2 flex w-full items-center justify-between px-3 text-[10px] font-bold uppercase tracking-[0.14em] transition ${isAdminPortal ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        <span>{section.title}</span>
                        {section.collapsible !== false && (
                          <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        )}
                      </button>
                    )}

                    {isExpanded && (
                      <div className="space-y-1">
                        {section.items.map((item) => {
                          const Icon = item.icon;
                          const active = isItemActive(item.path);
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                                active
                                  ? isAdminPortal
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)]'
                                    : 'bg-teal-600 text-white shadow-sm'
                                  : isAdminPortal
                                    ? 'text-slate-200 hover:bg-white/[0.08] hover:text-white'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                              }`}
                            >
                              <Icon className={`h-[18px] w-[18px] ${active ? 'text-white' : isAdminPortal ? 'text-slate-400 group-hover:text-white' : 'text-slate-400'}`} />
                              <span>{item.label}</span>
                              {item.badge && (
                                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] text-white">{item.badge}</span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

          {isAdminPortal ? (
            <div className="p-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                    <LifeBuoy className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Need Help?</div>
                    <div className="text-[10px] text-slate-400">Contact support</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-t border-slate-100 bg-slate-50/60 p-3 text-center font-mono text-[10px] text-slate-400">AZAAM v1.0.0</div>
          )}
        </aside>

        <main className="min-w-0 flex-1 overflow-x-hidden bg-[#f5f8fb]">
          {isAdminPortal ? (
            <div className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6 xl:px-7">
              <Outlet />
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};
