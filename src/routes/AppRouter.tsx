import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { PortalLayout } from '../layouts/PortalLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { getPortalRoot } from '../config/navigation';
import { UserRole } from '../types/frontend';

import { LandingPage } from '../pages/LandingPage';
import { VerifyCertificatePage } from '../pages/VerifyCertificatePage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';

import { DashboardPage } from '../pages/DashboardPage';
import { ApplicationsPage } from '../pages/ApplicationsPage';
import { PlacementsPage } from '../pages/PlacementsPage';
import { AttendancePage } from '../pages/AttendancePage';
import { LogbookPage } from '../pages/LogbookPage';
import { EvaluationsPage } from '../pages/EvaluationsPage';
import { CertificatesPage } from '../pages/CertificatesPage';

// University Dedicated Portal Pages
import { UniversityMouPage } from '../pages/university/UniversityMouPage';
import { UniversityStudentsTrackingPage } from '../pages/university/UniversityStudentsTrackingPage';
import { UniversityNominateStudentPage } from '../pages/university/UniversityNominateStudentPage';
import { UniversityStudentStatusPage } from '../pages/university/UniversityStudentStatusPage';
import { UniversityStudentJourneyPage } from '../pages/university/UniversityStudentJourneyPage';
import { UniversityFinancialsPage } from '../pages/university/UniversityFinancialsPage';

// Admin Management Pages
import { UsersManagementPage } from '../pages/admin/UsersManagementPage';
import { UniversitiesPage } from '../pages/admin/UniversitiesPage';
import { UniversityDetailPage } from '../pages/admin/UniversityDetailPage';
import { OrganizationsPage } from '../pages/admin/OrganizationsPage';
import { OrganizationDetailPage } from '../pages/admin/OrganizationDetailPage';
import { SupervisorsPage } from '../pages/admin/SupervisorsPage';
import { SupervisorDetailPage } from '../pages/admin/SupervisorDetailPage';
import { AuditLogsPage } from '../pages/admin/AuditLogsPage';

/**
 * Portal Redirect Component
 * Redirects to the appropriate portal based on user role
 */
const PortalRedirect: React.FC = () => {
  const userRaw = localStorage.getItem('azaam_user');
  const userRole = localStorage.getItem('azaam_user_role') as UserRole | null;

  if (userRole) {
    const portalRoot = getPortalRoot(userRole);
    return <Navigate to={`${portalRoot}/dashboard`} replace />;
  }

  if (userRaw) {
    try {
      const user = JSON.parse(userRaw);
      const role = user.roles?.[0] as UserRole;
      if (role) {
        const portalRoot = getPortalRoot(role);
        return <Navigate to={`${portalRoot}/dashboard`} replace />;
      }
    } catch {}
  }

  // Fallback to student portal
  return <Navigate to="/student/dashboard" replace />;
};

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/verify-certificate" element={<VerifyCertificatePage />} />
        </Route>

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Portal redirect - takes authenticated users to their role-based portal */}
        <Route path="/portal" element={<ProtectedRoute />}>
          <Route index element={<PortalRedirect />} />
        </Route>

        {/* Protected Role-Based Portal Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<PortalLayout />}>
            {/* ADMIN PORTAL ROUTES - /admin/* */}
            <Route path="/admin/dashboard" element={<DashboardPage />} />
            <Route path="/admin/users" element={<UsersManagementPage />} />
            <Route path="/admin/universities" element={<UniversitiesPage />} />
            <Route path="/admin/universities/:id" element={<UniversityDetailPage />} />
            <Route path="/admin/organizations" element={<OrganizationsPage />} />
            <Route path="/admin/organizations/:id" element={<OrganizationDetailPage />} />
            <Route path="/admin/supervisors" element={<SupervisorsPage />} />
            <Route path="/admin/supervisors/:id" element={<SupervisorDetailPage />} />
            <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

            {/* UNIVERSITY PORTAL ROUTES - /university/* */}
            <Route path="/university/dashboard" element={<DashboardPage />} />
            <Route path="/university/nominate-student" element={<UniversityNominateStudentPage />} />
            <Route path="/university/students" element={<UniversityStudentsTrackingPage />} />
            <Route path="/university/students/:id" element={<UniversityStudentJourneyPage />} />
            <Route path="/university/student-status" element={<UniversityStudentStatusPage />} />
            <Route path="/university/mou" element={<UniversityMouPage />} />
            <Route path="/university/financials" element={<UniversityFinancialsPage />} />
            <Route path="/university/applications" element={<ApplicationsPage />} />
            <Route path="/university/clinical-attachments" element={<DashboardPage />} />
            <Route path="/university/attendance" element={<AttendancePage />} />
            <Route path="/university/logbook" element={<LogbookPage />} />
            <Route path="/university/evaluations" element={<EvaluationsPage />} />
            <Route path="/university/certificates" element={<CertificatesPage />} />
            <Route path="/university" element={<Navigate to="/university/dashboard" replace />} />

            {/* ORGANIZATION PORTAL ROUTES - /organization/* */}
            <Route path="/organization/dashboard" element={<DashboardPage />} />
            <Route path="/organization/placements" element={<PlacementsPage />} />
            <Route path="/organization/clinical-attachments" element={<DashboardPage />} />
            <Route path="/organization/departments" element={<DashboardPage />} />
            <Route path="/organization/trainees" element={<ApplicationsPage />} />
            <Route path="/organization/attendance" element={<AttendancePage />} />
            <Route path="/organization/logbooks" element={<LogbookPage />} />
            <Route path="/organization/evaluations" element={<EvaluationsPage />} />
            <Route path="/organization/supervisors" element={<SupervisorsPage />} />
            <Route path="/organization/staff" element={<UsersManagementPage />} />
            <Route path="/organization/documents" element={<DashboardPage />} />
            <Route path="/organization/certificates" element={<CertificatesPage />} />
            <Route path="/organization/profile" element={<DashboardPage />} />
            <Route path="/organization" element={<Navigate to="/organization/dashboard" replace />} />

            {/* SUPERVISOR PORTAL ROUTES - /supervisor/* */}
            <Route path="/supervisor/dashboard" element={<DashboardPage />} />
            <Route path="/supervisor/trainees" element={<ApplicationsPage />} />
            <Route path="/supervisor/clinical-attachments" element={<DashboardPage />} />
            <Route path="/supervisor/attendance" element={<AttendancePage />} />
            <Route path="/supervisor/logbooks" element={<LogbookPage />} />
            <Route path="/supervisor/evaluations" element={<EvaluationsPage />} />
            <Route path="/supervisor/documents" element={<DashboardPage />} />
            <Route path="/supervisor/certificates" element={<CertificatesPage />} />
            <Route path="/supervisor" element={<Navigate to="/supervisor/dashboard" replace />} />

            {/* STUDENT PORTAL ROUTES - /student/* */}
            <Route path="/student/dashboard" element={<DashboardPage />} />
            <Route path="/student/applications" element={<ApplicationsPage />} />
            <Route path="/student/application-status" element={<DashboardPage />} />
            <Route path="/student/clinical-attachment" element={<DashboardPage />} />
            <Route path="/student/attendance" element={<AttendancePage />} />
            <Route path="/student/logbook" element={<LogbookPage />} />
            <Route path="/student/evaluations" element={<EvaluationsPage />} />
            <Route path="/student/finance/fees" element={<DashboardPage />} />
            <Route path="/student/finance/payments" element={<DashboardPage />} />
            <Route path="/student/finance/history" element={<DashboardPage />} />
            <Route path="/student/documents" element={<DashboardPage />} />
            <Route path="/student/certificates" element={<CertificatesPage />} />
            <Route path="/student/notifications" element={<DashboardPage />} />
            <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />

            {/* Legacy routes for backward compatibility - redirect to new portals */}
            <Route path="/dashboard" element={<PortalRedirect />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
