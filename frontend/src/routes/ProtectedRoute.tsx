import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPortalRoot } from '../config/navigation';
import { UserRole } from '../types/frontend';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

function rolesForPortalPath(pathname: string): UserRole[] | undefined {
  if (pathname.startsWith('/admin')) {
    return [UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF];
  }
  if (pathname.startsWith('/university')) {
    return [UserRole.UNIVERSITY_ADMIN, UserRole.UNIVERSITY_STAFF];
  }
  if (pathname.startsWith('/organization')) {
    return [UserRole.ORGANIZATION_ADMIN, UserRole.ORGANIZATION_STAFF];
  }
  if (pathname.startsWith('/supervisor')) {
    return [UserRole.CLINICAL_SUPERVISOR];
  }
  if (pathname.startsWith('/student')) {
    return [UserRole.STUDENT, UserRole.INDEPENDENT_APPLICANT];
  }
  return undefined;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isLoading, sessionError, retrySession } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-300 text-xs font-semibold">
        Authenticating session...
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-800">
        <div role="alert" className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold">Unable to connect</h1>
          <p className="mt-2 text-sm">Check your connection and try again to restore your session.</p>
          <button type="button" onClick={retrySession} className="mt-4 rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white">Try again</button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const effectiveAllowedRoles = allowedRoles ?? rolesForPortalPath(location.pathname);
  if (effectiveAllowedRoles?.length) {
    const hasAllowedRole = user.roles?.some((role) => effectiveAllowedRoles.includes(role));
    if (!hasAllowedRole) {
      const primaryRole = user.roles?.[0];
      const safePortal = primaryRole ? `${getPortalRoot(primaryRole)}/dashboard` : '/';
      return <Navigate to={safePortal} replace />;
    }
  }

  return <Outlet />;
};
