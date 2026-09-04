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
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';

import { ApplicationsPage } from '../pages/ApplicationsPage';
import { PlacementsPage } from '../pages/PlacementsPage';
import { AttendancePage } from '../pages/AttendancePage';
import { LogbookPage } from '../pages/LogbookPage';
import { EvaluationsPage } from '../pages/EvaluationsPage';
import { CertificatesPage } from '../pages/CertificatesPage';
import { PortalResourcePage } from '../pages/PortalResourcePage';

// University Dedicated Portal Pages
import { UniversityDashboardPage } from '../pages/university/UniversityDashboardPage';
import { UniversityMouPage } from '../pages/university/UniversityMouPage';
import { UniversityStudentsTrackingPage } from '../pages/university/UniversityStudentsTrackingPage';
import { UniversityNominateStudentPage } from '../pages/university/UniversityNominateStudentPage';
import { UniversityStudentStatusPage } from '../pages/university/UniversityStudentStatusPage';
import { UniversityStudentJourneyPage } from '../pages/university/UniversityStudentJourneyPage';
import { UniversityFinancialsPage } from '../pages/university/UniversityFinancialsPage';

// Organization Dedicated Portal Pages
import { OrganizationDashboardPage } from '../pages/organization/OrganizationDashboardPage';
import { OrganizationPlacementsPage } from '../pages/organization/OrganizationPlacementsPage';
import { OrganizationDepartmentsPage } from '../pages/organization/OrganizationDepartmentsPage';
import { OrganizationSupervisorsPage } from '../pages/organization/OrganizationSupervisorsPage';

// Supervisor Dedicated Portal Pages
import { SupervisorDashboardPage } from '../pages/supervisor/SupervisorDashboardPage';
import { SupervisorTraineesPage } from '../pages/supervisor/SupervisorTraineesPage';

// Student Dedicated Portal Pages
import { StudentDashboardPage } from '../pages/student/StudentDashboardPage';

// Admin Management Pages
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { UsersManagementPage } from '../pages/admin/UsersManagementPage';
import { UniversitiesPage } from '../pages/admin/UniversitiesPage';
import { UniversityDetailPage } from '../pages/admin/UniversityDetailPage';
import { OrganizationsPage } from '../pages/admin/OrganizationsPage';
import { OrganizationDetailPage } from '../pages/admin/OrganizationDetailPage';
import { SupervisorsPage } from '../pages/admin/SupervisorsPage';
import { SupervisorDetailPage } from '../pages/admin/SupervisorDetailPage';
import { StudentsManagementPage } from '../pages/admin/StudentsManagementPage';
import { StudentJourneyAdminPage } from '../pages/admin/StudentJourneyAdminPage';
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
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Portal redirect - takes authenticated users to their role-based portal */}
        <Route path="/portal" element={<ProtectedRoute />}>
          <Route index element={<PortalRedirect />} />
        </Route>

        {/* Protected Role-Based Portal Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<PortalLayout />}>
            {/* ADMIN PORTAL ROUTES - /admin/* */}
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<UsersManagementPage />} />
            <Route path="/admin/students" element={<StudentsManagementPage />} />
            <Route path="/admin/students/:id" element={<StudentJourneyAdminPage />} />
            <Route path="/admin/universities" element={<UniversitiesPage />} />
            <Route path="/admin/universities/:id" element={<UniversityDetailPage />} />
            <Route path="/admin/organizations" element={<OrganizationsPage />} />
            <Route path="/admin/organizations/:id" element={<OrganizationDetailPage />} />
            <Route path="/admin/supervisors" element={<SupervisorsPage />} />
            <Route path="/admin/supervisors/:id" element={<SupervisorDetailPage />} />
            <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

            {/* UNIVERSITY PORTAL ROUTES - /university/* */}
            <Route path="/university/dashboard" element={<UniversityDashboardPage />} />
            <Route path="/university/nominate-student" element={<UniversityNominateStudentPage />} />
            <Route path="/university/students" element={<UniversityStudentsTrackingPage />} />
            <Route path="/university/students/:id" element={<UniversityStudentJourneyPage />} />
            <Route path="/university/student-status" element={<UniversityStudentStatusPage />} />
            <Route path="/university/mou" element={<UniversityMouPage />} />
            <Route path="/university/financials" element={<UniversityFinancialsPage />} />
            <Route path="/university/applications" element={<PortalResourcePage eyebrow="University Admin" title="Student Applications" description="Review live applications submitted by or associated with this university." endpoint="/applications" />} />
            <Route path="/university/clinical-attachments" element={<PortalResourcePage eyebrow="University Admin" title="Clinical Attachments" description="Track clinical attachment records coordinated for university students." endpoint="/placements" />} />
            <Route path="/university/attendance" element={<PortalResourcePage eyebrow="University Admin" title="Student Attendance" description="Review live attendance records returned for university clinical attachments." endpoint="/attendance" />} />
            <Route path="/university/logbook" element={<PortalResourcePage eyebrow="University Admin" title="Student Logbooks" description="Review live clinical logbook records for university students." endpoint="/logbooks" />} />
            <Route path="/university/evaluations" element={<PortalResourcePage eyebrow="University Admin" title="Student Evaluations" description="Review live evaluation records submitted for university students." endpoint="/evaluations" />} />
            <Route path="/university/certificates" element={<PortalResourcePage eyebrow="University Admin" title="Student Certificates" description="Review live certificates issued for university students." endpoint="/certificates" />} />
            <Route path="/university" element={<Navigate to="/university/dashboard" replace />} />

            {/* ORGANIZATION PORTAL ROUTES - /organization/* */}
            <Route path="/organization/dashboard" element={<OrganizationDashboardPage />} />
            <Route path="/organization/placements" element={<OrganizationPlacementsPage />} />
            <Route path="/organization/clinical-attachments" element={<OrganizationPlacementsPage />} />
            <Route path="/organization/departments" element={<OrganizationDepartmentsPage />} />
            <Route path="/organization/trainees" element={<OrganizationPlacementsPage />} />
            <Route path="/organization/attendance" element={<AttendancePage />} />
            <Route path="/organization/logbooks" element={<LogbookPage />} />
            <Route path="/organization/evaluations" element={<EvaluationsPage />} />
            <Route path="/organization/supervisors" element={<OrganizationSupervisorsPage />} />
            <Route path="/organization/staff" element={<UsersManagementPage />} />
            <Route path="/organization/documents" element={<PortalResourcePage eyebrow="Organization Admin" title="Organization Documents" description="Review documents submitted for organization and placement compliance." endpoint="/documents" />} />
            <Route path="/organization/certificates" element={<CertificatesPage />} />
            <Route path="/organization/profile" element={<PortalResourcePage eyebrow="Organization Admin" title="Organization Profile" description="View the organization profile currently associated with this account." endpoint="/auth/me" />} />
            <Route path="/organization" element={<Navigate to="/organization/dashboard" replace />} />

            {/* SUPERVISOR PORTAL ROUTES - /supervisor/* */}
            <Route path="/supervisor/dashboard" element={<SupervisorDashboardPage />} />
            <Route path="/supervisor/trainees" element={<SupervisorTraineesPage />} />
            <Route path="/supervisor/clinical-attachments" element={<SupervisorTraineesPage />} />
            <Route path="/supervisor/attendance" element={<AttendancePage />} />
            <Route path="/supervisor/logbooks" element={<LogbookPage />} />
            <Route path="/supervisor/evaluations" element={<EvaluationsPage />} />
            <Route path="/supervisor/documents" element={<PortalResourcePage eyebrow="Clinical Supervisor" title="Trainee Documents" description="Review live documents available for assigned trainees and placements." endpoint="/documents" />} />
            <Route path="/supervisor/certificates" element={<CertificatesPage />} />
            <Route path="/supervisor" element={<Navigate to="/supervisor/dashboard" replace />} />

            {/* STUDENT PORTAL ROUTES - /student/* */}
            <Route path="/student/dashboard" element={<StudentDashboardPage />} />
            <Route path="/student/applications" element={<ApplicationsPage />} />
            <Route path="/student/application-status" element={<ApplicationsPage />} />
            <Route path="/student/clinical-attachment" element={<PlacementsPage />} />
            <Route path="/student/attendance" element={<AttendancePage />} />
            <Route path="/student/logbook" element={<LogbookPage />} />
            <Route path="/student/evaluations" element={<EvaluationsPage />} />
            <Route path="/student/finance/fees" element={<PortalResourcePage eyebrow="Student" title="Training Fees" description="Review fee records and payment obligations returned by the live finance service." endpoint="/finance" />} />
            <Route path="/student/finance/payments" element={<PortalResourcePage eyebrow="Student" title="Payments" description="Review payment records associated with your clinical training applications." endpoint="/finance" />} />
            <Route path="/student/finance/history" element={<PortalResourcePage eyebrow="Student" title="Payment History" description="Review the live payment history available to your account." endpoint="/finance" />} />
            <Route path="/student/documents" element={<PortalResourcePage eyebrow="Student" title="My Documents" description="Upload and review documents required for application and placement clearance." endpoint="/documents" />} />
            <Route path="/student/certificates" element={<CertificatesPage />} />
            <Route path="/student/notifications" element={<PortalResourcePage eyebrow="Student" title="Notifications" description="Review account and placement updates delivered by the AIMN notification service." endpoint="/notifications" />} />
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
