/**
 * Unified Portal Layout
 * Responsive layout for all authenticated portals.
 * Includes persistent Light/Dark mode, responsive desktop sidebar,
 * and full-height mobile drawer.
 */

import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ChevronDown,
  Search,
  LifeBuoy,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/frontend';
import { getPortalConfig, getPortalRoot } from '../config/navigation';

type ThemeMode = 'light' | 'dark';

export const PortalLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const currentRole = user?.roles?.[0] || UserRole.STUDENT;
  const portalConfig = getPortalConfig(currentRole);
  const isAdminPortal = currentRole === UserRole.SUPER_ADMIN || currentRole === UserRole.AZAAM_STAFF;
  const isUniversityPortal = currentRole === UserRole.UNIVERSITY_ADMIN;
  const useConstrainedContent = isAdminPortal || isUniversityPortal;
  const darkMode = theme === 'dark';
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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';
  }, [theme, darkMode]);

  useEffect(() => {
    if (!mobileDrawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileDrawerOpen]);

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
    <div className="azaam-portal-system flex min-h-screen w-full max-w-full overflow-x-hidden bg-[#f5f8fb] font-sans text-slate-800 transition-colors duration-200 dark:bg-[#08111f] dark:text-slate-100">
      {mobileDrawerOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      <aside
        className={
          'fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[86vw] max-w-[272px] shrink-0 flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-200 md:sticky md:top-0 md:z-20 md:h-screen md:w-64 md:max-w-64 md:translate-x-0 md:shadow-none dark:border-slate-800 dark:bg-[#0b1626] ' +
          (mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full')
        }
      >
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-100 px-4 dark:border-slate-800">
          <Link
            to={getPortalRoot(currentRole)}
            className="flex min-w-0 items-center gap-2.5"
            onClick={() => setMobileDrawerOpen(false)}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-[0_8px_22px_rgba(13,148,136,0.22)]">
              <Activity className="h-5 w-5" />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[15px] font-black tracking-tight text-slate-950 dark:text-white">
                AZAAM MEDICS
              </div>
              <div className="truncate text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                Education Management System
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileDrawerOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 md:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 [scrollbar-width:thin]">
          <div className="space-y-5">
            {portalConfig.sections.map((section) => {
              if (!section.items?.length) return null;
              const isExpanded = !section.title || expandedSections.has(section.title);

              return (
                <div key={section.title || 'default'} className="min-w-0">
                  {section.title && (
                    <button
                      type="button"
                      onClick={() => toggleSection(section.title)}
                      className="mb-1.5 flex w-full min-w-0 items-center justify-between gap-2 px-3 text-left text-[9px] font-extrabold uppercase tracking-[0.15em] text-slate-400 transition hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
                    >
                      <span className="min-w-0 truncate">{section.title}</span>
                      {section.collapsible !== false && (
                        <ChevronRight
                          className={
                            'h-3.5 w-3.5 shrink-0 transition-transform ' +
                            (isExpanded ? 'rotate-90' : '')
                          }
                        />
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
                            onClick={() => setMobileDrawerOpen(false)}
                            className={
                              'group flex min-h-10 w-full min-w-0 items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-xs font-bold transition ' +
                              (active
                                ? 'bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-[0_8px_20px_rgba(13,148,136,0.22)]'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white')
                            }
                          >
                            <Icon
                              className={
                                'h-[18px] w-[18px] shrink-0 ' +
                                (active
                                  ? 'text-white'
                                  : 'text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-white')
                              }
                            />
                            <span className="min-w-0 flex-1 truncate">{item.label}</span>
                            {item.badge && (
                              <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] text-white">
                                {item.badge}
                              </span>
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

        <div className="shrink-0 border-t border-slate-100 p-3 pb-[max(12px,env(safe-area-inset-bottom))] dark:border-slate-800">
          <div className="mb-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-emerald-500 text-sm font-extrabold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-extrabold text-slate-950 dark:text-white">
                  {displayName}
                </div>
                <div className="truncate text-[10px] capitalize text-slate-500 dark:text-slate-400">
                  {roleLabel}
                </div>
              </div>
            </div>
          </div>

          {isAdminPortal && (
            <div className="mb-1 flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              <LifeBuoy className="h-3.5 w-3.5" />
              <span>Need help? Contact support</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[72px] w-full max-w-full shrink-0 items-center border-b border-slate-200/80 bg-white/95 px-3 shadow-[0_2px_16px_rgba(15,23,42,0.04)] backdrop-blur-xl transition-colors sm:px-4 lg:px-6 dark:border-slate-800 dark:bg-[#0b1626]/95 dark:shadow-[0_2px_18px_rgba(0,0,0,0.22)]">
          <div className="flex w-full min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Open navigation"
            >
              <Menu className="h-6 w-6" />
            </button>

            <Link
              to={getPortalRoot(currentRole)}
              className="flex min-w-0 flex-1 items-center gap-2 md:hidden"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white">
                <Activity className="h-4 w-4" />
              </div>
              <span className="truncate text-[14px] font-black tracking-tight text-slate-950 dark:text-white">
                AZAAM MEDICS
              </span>
            </Link>

            {isAdminPortal ? (
              <div className="hidden w-full max-w-xl md:block">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    aria-label="Search admin portal"
                    placeholder="Search anything..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-600 dark:focus:bg-slate-900"
                  />
                </div>
              </div>
            ) : (
              <div className="hidden min-w-0 md:block">
                <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {portalConfig.portalTitle}
                </div>
                <div className="text-[10px] capitalize text-slate-500 dark:text-slate-400">
                  {roleLabel}
                </div>
              </div>
            )}

            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-amber-300 dark:hover:bg-slate-800"
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-pressed={darkMode}
                title={darkMode ? 'Dark mode — tap for light mode' : 'Light mode — tap for dark mode'}
              >
                {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </button>

              <div className="hidden h-8 w-px bg-slate-200 sm:block dark:bg-slate-700" />

              <div className="hidden items-center gap-2 sm:flex">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-500 text-xs font-extrabold text-white shadow-sm">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden min-w-0 lg:block">
                  <div className="max-w-[140px] truncate text-xs font-extrabold text-slate-950 dark:text-white">
                    {displayName}
                  </div>
                  <div className="max-w-[140px] truncate text-[10px] capitalize text-slate-500 dark:text-slate-400">
                    {roleLabel}
                  </div>
                </div>
                <ChevronDown className="hidden h-4 w-4 text-slate-400 lg:block" />
              </div>
            </div>
          </div>
        </header>

        <main className="w-full min-w-0 max-w-full flex-1 overflow-x-hidden bg-[#f5f8fb] transition-colors duration-200 dark:bg-[#08111f]">
          {useConstrainedContent ? (
            <div className="mx-auto w-full min-w-0 max-w-[1600px] overflow-x-hidden px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6 xl:px-7">
              <Outlet />
            </div>
          ) : (
            <div className="w-full min-w-0 max-w-full overflow-x-hidden">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
