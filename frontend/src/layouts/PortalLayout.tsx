/**
 * Unified Portal Layout
 * Responsive layout for all authenticated portals
 * Supports role-based navigation, desktop sidebar, mobile drawer
 */

import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Menu,
  X,
  Bell,
  LogOut,
  ChevronRight,
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

  // Get current role
  const currentRole = user?.roles?.[0] || UserRole.STUDENT;
  const portalConfig = getPortalConfig(currentRole);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  // Handle escape key for mobile menu drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileDrawerOpen]);

  // Toggle section expansion
  const toggleSection = (title: string | undefined) => {
    if (!title) return;
    const newSet = new Set(expandedSections);
    if (newSet.has(title)) {
      newSet.delete(title);
    } else {
      newSet.add(title);
    }
    setExpandedSections(newSet);
  };

  // Check if item is active
  const isItemActive = (itemPath: string) => {
    if (itemPath === location.pathname) return true;
    if (itemPath !== '/' && location.pathname.startsWith(itemPath)) return true;
    return false;
  };

  // Check if section has active items
  const hasSectionActive = (title: string | undefined) => {
    if (!title) return false;
    const section = portalConfig.sections.find(s => s.title === title);
    if (!section) return false;
    return section.items.some(item => isItemActive(item.path));
  };

  // Auto-expand sections with active items
  useEffect(() => {
    const newSet = new Set<string>();
    portalConfig.sections.forEach(section => {
      if (section.title && hasSectionActive(section.title)) {
        newSet.add(section.title);
      }
    });
    setExpandedSections(newSet);
  }, [currentRole, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Demo role switcher - only show in development

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setMobileDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Top Navigation Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-xs h-16 flex items-center px-4 md:px-6 justify-between">
        <div className="flex items-center space-x-3">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Portal Logo & Title */}
          <Link to={getPortalRoot(currentRole)} className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base tracking-tight leading-none block">
                AZAAM MEDICS
              </span>
              <span className="text-[10px] font-semibold text-teal-700 tracking-wider uppercase block">
                {portalConfig.portalTitle}
              </span>
            </div>
          </Link>
        </div>

        {/* Right Header Menu */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <button
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition relative hidden sm:flex"
            aria-label="Notifications"
          >
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
        {/* Sidebar (Desktop & Mobile Drawer) */}
        <aside
          className={`fixed md:sticky top-16 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-200 shrink-0 ${
            mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Mobile Drawer Close Button */}
          <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
            <span className="text-xs font-bold uppercase text-slate-500">Navigation</span>
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            {portalConfig.sections.map((section) => {
              if (!section.items || section.items.length === 0) return null;

              const isExpanded = !section.title || expandedSections.has(section.title);
              const hasActive = section.title && hasSectionActive(section.title);

              return (
                <div key={section.title || 'default'}>
                  {section.title && (
                    <button
                      onClick={() => toggleSection(section.title)}
                      className="w-full flex items-center justify-between px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 hover:text-slate-600 transition"
                    >
                      <span>{section.title}</span>
                      {section.collapsible !== false && (
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
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
                            className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                              active
                                ? 'bg-teal-600 text-white shadow-xs font-semibold'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                            <span>{item.label}</span>
                            {item.badge && (
                              <span className="ml-auto text-[9px] bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
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
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/60 text-center text-[10px] text-slate-400 font-mono">
            AZAAM v1.0.0
          </div>
        </aside>

        {/* Main Workspace View */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
