import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPortalRoot } from '../config/navigation';
import { UserRole } from '../types/frontend';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-300 text-xs font-semibold">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles?.length) {
    const hasAllowedRole = user.roles?.some((role) => allowedRoles.includes(role));
    if (!hasAllowedRole) {
      const primaryRole = user.roles?.[0];
      const safePortal = primaryRole ? `${getPortalRoot(primaryRole)}/dashboard` : '/';
      return <Navigate to={safePortal} replace />;
    }
  }

  return <Outlet />;
};
