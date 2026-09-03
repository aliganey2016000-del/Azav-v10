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

import { ApplicationsPage } from '../pages/ApplicationsPage';
import { PlacementsPage } from '../pages/PlacementsPage';
import { AttendancePage } from '../pages/AttendancePage';
import { LogbookPage } from '../pages/LogbookPage';
import { EvaluationsPage } from '../pages/EvaluationsPage';
import { CertificatesPage } from '../pages/CertificatesPage';
import { PortalResourcePage } from '../pages/PortalResourcePage';

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
            <Route path="/admin/dashboard" element={<PortalResourcePage eyebrow="Super Admin" title="System Overview" description="Monitor live universities, organizations, users, and platform activity." endpoint="/admin/dashboard" />} />
            <Route path="/admin/users" element={<PortalResourcePage eyebrow="Super Admin" title="User Management" description="Review live user accounts and role assignments from the database." endpoint="/admin/users" />} />
            <Route path="/admin/universities" element={<PortalResourcePage eyebrow="Super Admin" title="Universities" description="Review live university tenants registered with AIMN." endpoint="/admin/universities" />} />
            <Route path="/admin/universities/:id" element={<PortalResourcePage eyebrow="Super Admin" title="University Details" description="Review the selected university record returned by the live API." endpoint="/admin/universities" />} />
            <Route path="/admin/organizations" element={<PortalResourcePage eyebrow="Super Admin" title="Organizations" description="Review live healthcare organization tenants registered with AIMN." endpoint="/admin/organizations" />} />
            <Route path="/admin/organizations/:id" element={<PortalResourcePage eyebrow="Super Admin" title="Organization Details" description="Review the selected organization record returned by the live API." endpoint="/admin/organizations" />} />
            <Route path="/admin/supervisors" element={<PortalResourcePage eyebrow="Super Admin" title="Clinical Supervisors" description="Review live clinical supervisor records and assignments." endpoint="/admin/supervisors" />} />
            <Route path="/admin/supervisors/:id" element={<PortalResourcePage eyebrow="Super Admin" title="Supervisor Details" description="Review the selected supervisor record returned by the live API." endpoint="/admin/supervisors" />} />
            <Route path="/admin/audit-logs" element={<PortalResourcePage eyebrow="Super Admin" title="Audit Logs" description="Review live security and administrative activity records." endpoint="/admin/audit-logs" />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

            {/* UNIVERSITY PORTAL ROUTES - /university/* */}
            <Route path="/university/dashboard" element={<PortalResourcePage eyebrow="University Admin" title="University Overview" description="Review your institution's live applications, placements, and student activity." endpoint="/admin/dashboard" />} />
            <Route path="/university/nominate-student" element={<UniversityNominateStudentPage />} />
            <Route path="/university/students" element={<UniversityStudentsTrackingPage />} />
            <Route path="/university/students/:id" element={<UniversityStudentJourneyPage />} />
            <Route path="/university/student-status" element={<UniversityStudentStatusPage />} />
            <Route path="/university/mou" element={<PortalResourcePage eyebrow="University Admin" title="University MoU" description="Review the live institutional agreement and placement coordination records for this university." endpoint="/auth/me" />} />
            <Route path="/university/financials" element={<PortalResourcePage eyebrow="University Admin" title="University Financials" description="Review live fee, invoice, and payment records associated with this university account." endpoint="/finance" />} />
            <Route path="/university/applications" element={<PortalResourcePage eyebrow="University Admin" title="Student Applications" description="Review live applications submitted by or associated with this university." endpoint="/applications" />} />
            <Route path="/university/clinical-attachments" element={<PortalResourcePage eyebrow="University Admin" title="Clinical Attachments" description="Track clinical attachment records coordinated for university students." endpoint="/placements" />} />
            <Route path="/university/attendance" element={<PortalResourcePage eyebrow="University Admin" title="Student Attendance" description="Review live attendance records returned for university clinical attachments." endpoint="/attendance" />} />
            <Route path="/university/logbook" element={<PortalResourcePage eyebrow="University Admin" title="Student Logbooks" description="Review live clinical logbook records for university students." endpoint="/logbooks" />} />
            <Route path="/university/evaluations" element={<PortalResourcePage eyebrow="University Admin" title="Student Evaluations" description="Review live evaluation records submitted for university students." endpoint="/evaluations" />} />
            <Route path="/university/certificates" element={<PortalResourcePage eyebrow="University Admin" title="Student Certificates" description="Review live certificates issued for university students." endpoint="/certificates" />} />
            <Route path="/university" element={<Navigate to="/university/dashboard" replace />} />

            {/* ORGANIZATION PORTAL ROUTES - /organization/* */}
            <Route path="/organization/dashboard" element={<PortalResourcePage eyebrow="Organization Admin" title="Organization Overview" description="Monitor live trainees, placements, departments, and clinical operations." endpoint="/admin/dashboard" />} />
            <Route path="/organization/placements" element={<PortalResourcePage eyebrow="Organization Admin" title="Placements" description="Manage and review live clinical placements hosted by your organization." endpoint="/placements" />} />
            <Route path="/organization/clinical-attachments" element={<PortalResourcePage eyebrow="Organization Admin" title="Clinical Attachments" description="Review active and completed clinical attachment placements at your organization." endpoint="/placements" />} />
            <Route path="/organization/departments" element={<PortalResourcePage eyebrow="Organization Admin" title="Departments" description="Review departments and clinical training capacity provided by your organization." endpoint="/organizations/current/departments" />} />
            <Route path="/organization/trainees" element={<PortalResourcePage eyebrow="Organization Admin" title="Trainees" description="Review live student applications and trainees assigned to your organization." endpoint="/applications" />} />
            <Route path="/organization/attendance" element={<PortalResourcePage eyebrow="Organization Admin" title="Attendance" description="Review live attendance records for hosted trainees." endpoint="/attendance" />} />
            <Route path="/organization/logbooks" element={<PortalResourcePage eyebrow="Organization Admin" title="Logbooks" description="Review live clinical logbook entries for hosted trainees." endpoint="/logbooks" />} />
            <Route path="/organization/evaluations" element={<PortalResourcePage eyebrow="Organization Admin" title="Evaluations" description="Review live clinical evaluations for hosted trainees." endpoint="/evaluations" />} />
            <Route path="/organization/supervisors" element={<PortalResourcePage eyebrow="Organization Admin" title="Clinical Supervisors" description="Review supervisors associated with the organization and their live assignments." endpoint="/admin/supervisors" />} />
            <Route path="/organization/staff" element={<PortalResourcePage eyebrow="Organization Admin" title="Organization Staff" description="Review staff accounts authorized for this organization." endpoint="/admin/users" />} />
            <Route path="/organization/documents" element={<PortalResourcePage eyebrow="Organization Admin" title="Organization Documents" description="Review documents submitted for organization and placement compliance." endpoint="/documents" />} />
            <Route path="/organization/certificates" element={<PortalResourcePage eyebrow="Organization Admin" title="Certificates" description="Review certificates issued for trainees hosted by your organization." endpoint="/certificates" />} />
            <Route path="/organization/profile" element={<PortalResourcePage eyebrow="Organization Admin" title="Organization Profile" description="View the organization profile currently associated with this account." endpoint="/auth/me" />} />
            <Route path="/organization" element={<Navigate to="/organization/dashboard" replace />} />

            {/* SUPERVISOR PORTAL ROUTES - /supervisor/* */}
            <Route path="/supervisor/dashboard" element={<PortalResourcePage eyebrow="Clinical Supervisor" title="Supervisor Overview" description="Review assigned trainees, clinical activity, and evaluation work from one live view." endpoint="/placements" />} />
            <Route path="/supervisor/trainees" element={<PortalResourcePage eyebrow="Clinical Supervisor" title="Assigned Trainees" description="Review live trainees assigned to your clinical supervision." endpoint="/applications" />} />
            <Route path="/supervisor/clinical-attachments" element={<PortalResourcePage eyebrow="Clinical Supervisor" title="Clinical Attachments" description="Review the placements and rotations assigned to your supervision." endpoint="/placements" />} />
            <Route path="/supervisor/attendance" element={<PortalResourcePage eyebrow="Clinical Supervisor" title="Attendance" description="Review live attendance records for assigned clinical attachments." endpoint="/attendance" />} />
            <Route path="/supervisor/logbooks" element={<PortalResourcePage eyebrow="Clinical Supervisor" title="Logbooks" description="Review and follow live clinical logbook records." endpoint="/logbooks" />} />
            <Route path="/supervisor/evaluations" element={<PortalResourcePage eyebrow="Clinical Supervisor" title="Evaluations" description="Review live trainee evaluations and performance records." endpoint="/evaluations" />} />
            <Route path="/supervisor/documents" element={<PortalResourcePage eyebrow="Clinical Supervisor" title="Trainee Documents" description="Review live documents available for assigned trainees and placements." endpoint="/documents" />} />
            <Route path="/supervisor/certificates" element={<PortalResourcePage eyebrow="Clinical Supervisor" title="Certificates" description="Review live certificates associated with completed clinical training." endpoint="/certificates" />} />
            <Route path="/supervisor" element={<Navigate to="/supervisor/dashboard" replace />} />

            {/* STUDENT PORTAL ROUTES - /student/* */}
            <Route path="/student/dashboard" element={<PortalResourcePage eyebrow="Student" title="Student Overview" description="Follow your live application, placement, attendance, and training progress." endpoint="/auth/me" />} />
            <Route path="/student/applications" element={<PortalResourcePage eyebrow="Student" title="My Applications" description="Review applications submitted by your authenticated student account." endpoint="/applications" />} />
            <Route path="/student/application-status" element={<PortalResourcePage eyebrow="Student" title="Application Status" description="Review the current status of applications submitted through AIMN." endpoint="/applications" />} />
            <Route path="/student/clinical-attachment" element={<PortalResourcePage eyebrow="Student" title="Clinical Attachment" description="Review your live placement, host institution, department, and rotation information." endpoint="/placements" />} />
            <Route path="/student/attendance" element={<PortalResourcePage eyebrow="Student" title="My Attendance" description="Review attendance records returned for your clinical attachments." endpoint="/attendance" />} />
            <Route path="/student/logbook" element={<PortalResourcePage eyebrow="Student" title="My Logbook" description="Review live clinical logbook records associated with your attachment." endpoint="/logbooks" />} />
            <Route path="/student/evaluations" element={<PortalResourcePage eyebrow="Student" title="My Evaluations" description="Review evaluation feedback returned by your clinical supervisors." endpoint="/evaluations" />} />
            <Route path="/student/finance/fees" element={<PortalResourcePage eyebrow="Student" title="Training Fees" description="Review fee records and payment obligations returned by the live finance service." endpoint="/finance" />} />
            <Route path="/student/finance/payments" element={<PortalResourcePage eyebrow="Student" title="Payments" description="Review payment records associated with your clinical training applications." endpoint="/finance" />} />
            <Route path="/student/finance/history" element={<PortalResourcePage eyebrow="Student" title="Payment History" description="Review the live payment history available to your account." endpoint="/finance" />} />
            <Route path="/student/documents" element={<PortalResourcePage eyebrow="Student" title="My Documents" description="Upload and review documents required for application and placement clearance." endpoint="/documents" />} />
            <Route path="/student/certificates" element={<PortalResourcePage eyebrow="Student" title="My Certificates" description="Review certificates issued for your completed clinical training." endpoint="/certificates" />} />
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
