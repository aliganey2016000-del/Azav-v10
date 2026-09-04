import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { PortalLayout } from '../layouts/PortalLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { getPortalRoot } from '../config/navigation';
import { UserRole } from '../types/frontend';
import { useAuth } from '../context/AuthContext';

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

import { UniversityMouPage } from '../pages/university/UniversityMouPage';
import { UniversityStudentsTrackingPage } from '../pages/university/UniversityStudentsTrackingPage';
import { UniversityNominateStudentPage } from '../pages/university/UniversityNominateStudentPage';
import { UniversityStudentStatusPage } from '../pages/university/UniversityStudentStatusPage';
import { UniversityStudentJourneyPage } from '../pages/university/UniversityStudentJourneyPage';
import { UniversityFinancialsPage } from '../pages/university/UniversityFinancialsPage';

import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { UsersManagementPage } from '../pages/admin/UsersManagementPage';
import { UniversitiesPage } from '../pages/admin/UniversitiesPage';
import { UniversityDetailPage } from '../pages/admin/UniversityDetailPage';
import { OrganizationsPage } from '../pages/admin/OrganizationsPage';
import { OrganizationDetailPage } from '../pages/admin/OrganizationDetailPage';
import { SupervisorsPage } from '../pages/admin/SupervisorsPage';
import { SupervisorDetailPage } from '../pages/admin/SupervisorDetailPage';
import { AuditLogsPage } from '../pages/admin/AuditLogsPage';

const RoleRoute: React.FC<{ roles: UserRole[]; children: React.ReactNode }> = ({ roles, children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.roles?.some((role) => roles.includes(role))) {
    return <Navigate to={getPortalRoot(user.roles?.[0] || UserRole.STUDENT) + '/dashboard'} replace />;
  }
  return <>{children}</>;
};

const PortalRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  const role = user.roles?.[0];
  if (!role) return <Navigate to="/login" replace />;
  return <Navigate to={`${getPortalRoot(role)}/dashboard`} replace />;
};

export const AppRouter: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/verify-certificate" element={<VerifyCertificatePage />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route path="/portal" element={<ProtectedRoute />}>
        <Route index element={<PortalRedirect />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<PortalLayout />}>
          <Route path="/admin/dashboard" element={<RoleRoute roles={[UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF]}><AdminDashboardPage /></RoleRoute>} />
          <Route path="/admin/users" element={<RoleRoute roles={[UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF]}><UsersManagementPage /></RoleRoute>} />
          <Route path="/admin/universities" element={<RoleRoute roles={[UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF]}><UniversitiesPage /></RoleRoute>} />
          <Route path="/admin/universities/:id" element={<RoleRoute roles={[UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF]}><UniversityDetailPage /></RoleRoute>} />
          <Route path="/admin/organizations" element={<RoleRoute roles={[UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF]}><OrganizationsPage /></RoleRoute>} />
          <Route path="/admin/organizations/:id" element={<RoleRoute roles={[UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF]}><OrganizationDetailPage /></RoleRoute>} />
          <Route path="/admin/supervisors" element={<RoleRoute roles={[UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF]}><SupervisorsPage /></RoleRoute>} />
          <Route path="/admin/supervisors/:id" element={<RoleRoute roles={[UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF]}><SupervisorDetailPage /></RoleRoute>} />
          <Route path="/admin/audit-logs" element={<RoleRoute roles={[UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF]}><AuditLogsPage /></RoleRoute>} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

          <Route path="/university/dashboard" element={<RoleRoute roles={[UserRole.UNIVERSITY_ADMIN, UserRole.UNIVERSITY_STAFF]}><PortalResourcePage eyebrow="University Admin" title="University Overview" description="Review your institution's live applications, placements, and student activity." endpoint="/admin/dashboard" /></RoleRoute>} />
          <Route path="/university/nominate-student" element={<RoleRoute roles={[UserRole.UNIVERSITY_ADMIN, UserRole.UNIVERSITY_STAFF]}><UniversityNominateStudentPage /></RoleRoute>} />
          <Route path="/university/students" element={<RoleRoute roles={[UserRole.UNIVERSITY_ADMIN, UserRole.UNIVERSITY_STAFF]}><UniversityStudentsTrackingPage /></RoleRoute>} />
          <Route path="/university/students/:id" element={<RoleRoute roles={[UserRole.UNIVERSITY_ADMIN, UserRole.UNIVERSITY_STAFF]}><UniversityStudentJourneyPage /></RoleRoute>} />
          <Route path="/university/student-status" element={<RoleRoute roles={[UserRole.UNIVERSITY_ADMIN, UserRole.UNIVERSITY_STAFF]}><UniversityStudentStatusPage /></RoleRoute>} />
          <Route path="/university/mou" element={<RoleRoute roles={[UserRole.UNIVERSITY_ADMIN, UserRole.UNIVERSITY_STAFF]}><PortalResourcePage eyebrow="University Admin" title="University MoU" description="Review the live institutional agreement and placement coordination records for this university." endpoint="/auth/me" /></RoleRoute>} />
          <Route path="/university/financials" element={<RoleRoute roles={[UserRole.UNIVERSITY_ADMIN, UserRole.UNIVERSITY_STAFF]}><UniversityFinancialsPage /></RoleRoute>} />
          <Route path="/university/applications" element={<RoleRoute roles={[UserRole.UNIVERSITY_ADMIN, UserRole.UNIVERSITY_STAFF]}><PortalResourcePage eyebrow="University Admin" title="Student Applications" description="Review live applications submitted by or associated with this university." endpoint="/applications" /></RoleRoute>} />
          <Route path="/university/clinical-attachments" element={<RoleRoute roles={[UserRole.UNIVERSITY_ADMIN, UserRole.UNIVERSITY_STAFF]}><PortalResourcePage eyebrow="University Admin" title="Clinical Attachments" description="Track clinical attachment records coordinated for university students." endpoint="/placements" /></RoleRoute>} />
          <Route path="/university/attendance" element={<RoleRoute roles={[UserRole.UNIVERSITY_ADMIN, UserRole.UNIVERSITY_STAFF]}><PortalResourcePage eyebrow="University Admin" title="Student Attendance" description="Review live attendance records returned for university clinical attachments." endpoint="/attendance" /></RoleRoute>} />
          <Route path="/university/logbook" element={<RoleRoute roles={[UserRole.UNIVERSITY_ADMIN, UserRole.UNIVERSITY_STAFF]}><PortalResourcePage eyebrow="University Admin" title="Student Logbooks" description="Review live clinical logbook records for university students." endpoint="/logbooks" /></RoleRoute>} />
          <Route path="/university/evaluations" element={<RoleRoute roles={[UserRole.UNIVERSITY_ADMIN, UserRole.UNIVERSITY_STAFF]}><PortalResourcePage eyebrow="University Admin" title="Student Evaluations" description="Review live evaluation records submitted for university students." endpoint="/evaluations" /></RoleRoute>} />
          <Route path="/university/certificates" element={<RoleRoute roles={[UserRole.UNIVERSITY_ADMIN, UserRole.UNIVERSITY_STAFF]}><PortalResourcePage eyebrow="University Admin" title="Student Certificates" description="Review live certificates issued for university students." endpoint="/certificates" /></RoleRoute>} />
          <Route path="/university" element={<Navigate to="/university/dashboard" replace />} />

          <Route path="/organization/dashboard" element={<RoleRoute roles={[UserRole.ORGANIZATION_ADMIN, UserRole.ORGANIZATION_STAFF]}><PortalResourcePage eyebrow="Organization Admin" title="Organization Overview" description="Monitor live trainees, placements, departments, and clinical operations." endpoint="/admin/dashboard" /></RoleRoute>} />
          <Route path="/organization/placements" element={<RoleRoute roles={[UserRole.ORGANIZATION_ADMIN, UserRole.ORGANIZATION_STAFF]}><PortalResourcePage eyebrow="Organization Admin" title="Placements" description="Manage and review live clinical placements hosted by your organization." endpoint="/placements" /></RoleRoute>} />
          <Route path="/organization/clinical-attachments" element={<RoleRoute roles={[UserRole.ORGANIZATION_ADMIN, UserRole.ORGANIZATION_STAFF]}><PortalResourcePage eyebrow="Organization Admin" title="Clinical Attachments" description="Review active and completed clinical attachment placements at your organization." endpoint="/placements" /></RoleRoute>} />
          <Route path="/organization/departments" element={<RoleRoute roles={[UserRole.ORGANIZATION_ADMIN, UserRole.ORGANIZATION_STAFF]}><PortalResourcePage eyebrow="Organization Admin" title="Departments" description="Review departments and clinical training capacity provided by your organization." endpoint="/organizations/current/departments" /></RoleRoute>} />
          <Route path="/organization/trainees" element={<RoleRoute roles={[UserRole.ORGANIZATION_ADMIN, UserRole.ORGANIZATION_STAFF]}><PortalResourcePage eyebrow="Organization Admin" title="Trainees" description="Review live student applications and trainees assigned to your organization." endpoint="/applications" /></RoleRoute>} />
          <Route path="/organization/attendance" element={<RoleRoute roles={[UserRole.ORGANIZATION_ADMIN, UserRole.ORGANIZATION_STAFF]}><PortalResourcePage eyebrow="Organization Admin" title="Attendance" description="Review live attendance records for hosted trainees." endpoint="/attendance" /></RoleRoute>} />
          <Route path="/organization/logbooks" element={<RoleRoute roles={[UserRole.ORGANIZATION_ADMIN, UserRole.ORGANIZATION_STAFF]}><PortalResourcePage eyebrow="Organization Admin" title="Logbooks" description="Review live clinical logbook entries for hosted trainees." endpoint="/logbooks" /></RoleRoute>} />
          <Route path="/organization/evaluations" element={<RoleRoute roles={[UserRole.ORGANIZATION_ADMIN, UserRole.ORGANIZATION_STAFF]}><PortalResourcePage eyebrow="Organization Admin" title="Evaluations" description="Review live clinical evaluations for hosted trainees." endpoint="/evaluations" /></RoleRoute>} />
          <Route path="/organization/supervisors" element={<RoleRoute roles={[UserRole.ORGANIZATION_ADMIN, UserRole.ORGANIZATION_STAFF]}><PortalResourcePage eyebrow="Organization Admin" title="Clinical Supervisors" description="Review supervisors associated with the organization and their live assignments." endpoint="/admin/supervisors" /></RoleRoute>} />
          <Route path="/organization/staff" element={<RoleRoute roles={[UserRole.ORGANIZATION_ADMIN, UserRole.ORGANIZATION_STAFF]}><PortalResourcePage eyebrow="Organization Admin" title="Organization Staff" description="Review staff accounts authorized for this organization." endpoint="/admin/users" /></RoleRoute>} />
          <Route path="/organization/documents" element={<RoleRoute roles={[UserRole.ORGANIZATION_ADMIN, UserRole.ORGANIZATION_STAFF]}><PortalResourcePage eyebrow="Organization Admin" title="Organization Documents" description="Review documents submitted for organization and placement compliance." endpoint="/documents" /></RoleRoute>} />
          <Route path="/organization/certificates" element={<RoleRoute roles={[UserRole.ORGANIZATION_ADMIN, UserRole.ORGANIZATION_STAFF]}><PortalResourcePage eyebrow="Organization Admin" title="Certificates" description="Review certificates issued for trainees hosted by your organization." endpoint="/certificates" /></RoleRoute>} />
          <Route path="/organization/profile" element={<RoleRoute roles={[UserRole.ORGANIZATION_ADMIN, UserRole.ORGANIZATION_STAFF]}><PortalResourcePage eyebrow="Organization Admin" title="Organization Profile" description="View the organization profile currently associated with this account." endpoint="/auth/me" /></RoleRoute>} />
          <Route path="/organization" element={<Navigate to="/organization/dashboard" replace />} />

          <Route path="/supervisor/dashboard" element={<RoleRoute roles={[UserRole.CLINICAL_SUPERVISOR]}><PortalResourcePage eyebrow="Clinical Supervisor" title="Supervisor Overview" description="Review assigned trainees, clinical activity, and evaluation work from one live view." endpoint="/placements" /></RoleRoute>} />
          <Route path="/supervisor/trainees" element={<RoleRoute roles={[UserRole.CLINICAL_SUPERVISOR]}><PortalResourcePage eyebrow="Clinical Supervisor" title="Assigned Trainees" description="Review live trainees assigned to your clinical supervision." endpoint="/applications" /></RoleRoute>} />
          <Route path="/supervisor/clinical-attachments" element={<RoleRoute roles={[UserRole.CLINICAL_SUPERVISOR]}><PortalResourcePage eyebrow="Clinical Supervisor" title="Clinical Attachments" description="Review the placements and rotations assigned to your supervision." endpoint="/placements" /></RoleRoute>} />
          <Route path="/supervisor/attendance" element={<RoleRoute roles={[UserRole.CLINICAL_SUPERVISOR]}><PortalResourcePage eyebrow="Clinical Supervisor" title="Attendance" description="Review live attendance records for assigned clinical attachments." endpoint="/attendance" /></RoleRoute>} />
          <Route path="/supervisor/logbooks" element={<RoleRoute roles={[UserRole.CLINICAL_SUPERVISOR]}><PortalResourcePage eyebrow="Clinical Supervisor" title="Logbooks" description="Review and follow live clinical logbook records." endpoint="/logbooks" /></RoleRoute>} />
          <Route path="/supervisor/evaluations" element={<RoleRoute roles={[UserRole.CLINICAL_SUPERVISOR]}><PortalResourcePage eyebrow="Clinical Supervisor" title="Evaluations" description="Review live trainee evaluations and performance records." endpoint="/evaluations" /></RoleRoute>} />
          <Route path="/supervisor/documents" element={<RoleRoute roles={[UserRole.CLINICAL_SUPERVISOR]}><PortalResourcePage eyebrow="Clinical Supervisor" title="Trainee Documents" description="Review live documents available for assigned trainees and placements." endpoint="/documents" /></RoleRoute>} />
          <Route path="/supervisor/certificates" element={<RoleRoute roles={[UserRole.CLINICAL_SUPERVISOR]}><PortalResourcePage eyebrow="Clinical Supervisor" title="Certificates" description="Review live certificates associated with completed clinical training." endpoint="/certificates" /></RoleRoute>} />
          <Route path="/supervisor" element={<Navigate to="/supervisor/dashboard" replace />} />

          <Route path="/student/dashboard" element={<RoleRoute roles={[UserRole.STUDENT, UserRole.INDEPENDENT_APPLICANT]}><PortalResourcePage eyebrow="Student" title="Student Overview" description="Follow your live application, placement, attendance, and training progress." endpoint="/auth/me" /></RoleRoute>} />
          <Route path="/student/applications" element={<RoleRoute roles={[UserRole.STUDENT, UserRole.INDEPENDENT_APPLICANT]}><PortalResourcePage eyebrow="Student" title="My Applications" description="Review applications submitted by your authenticated student account." endpoint="/applications" /></RoleRoute>} />
          <Route path="/student/application-status" element={<RoleRoute roles={[UserRole.STUDENT, UserRole.INDEPENDENT_APPLICANT]}><PortalResourcePage eyebrow="Student" title="Application Status" description="Review the current status of applications submitted through AIMN." endpoint="/applications" /></RoleRoute>} />
          <Route path="/student/clinical-attachment" element={<RoleRoute roles={[UserRole.STUDENT, UserRole.INDEPENDENT_APPLICANT]}><PortalResourcePage eyebrow="Student" title="Clinical Attachment" description="Review your live placement, host institution, department, and rotation information." endpoint="/placements" /></RoleRoute>} />
          <Route path="/student/attendance" element={<RoleRoute roles={[UserRole.STUDENT, UserRole.INDEPENDENT_APPLICANT]}><PortalResourcePage eyebrow="Student" title="My Attendance" description="Review attendance records returned for your clinical attachments." endpoint="/attendance" /></RoleRoute>} />
          <Route path="/student/logbook" element={<RoleRoute roles={[UserRole.STUDENT, UserRole.INDEPENDENT_APPLICANT]}><PortalResourcePage eyebrow="Student" title="My Logbook" description="Review live clinical logbook records associated with your attachment." endpoint="/logbooks" /></RoleRoute>} />
          <Route path="/student/evaluations" element={<RoleRoute roles={[UserRole.STUDENT, UserRole.INDEPENDENT_APPLICANT]}><PortalResourcePage eyebrow="Student" title="My Evaluations" description="Review evaluation feedback returned by your clinical supervisors." endpoint="/evaluations" /></RoleRoute>} />
          <Route path="/student/finance/fees" element={<RoleRoute roles={[UserRole.STUDENT, UserRole.INDEPENDENT_APPLICANT]}><PortalResourcePage eyebrow="Student" title="Training Fees" description="Review fee records and payment obligations returned by the live finance service." endpoint="/finance" /></RoleRoute>} />
          <Route path="/student/finance/payments" element={<RoleRoute roles={[UserRole.STUDENT, UserRole.INDEPENDENT_APPLICANT]}><PortalResourcePage eyebrow="Student" title="Payments" description="Review payment records associated with your clinical training applications." endpoint="/finance" /></RoleRoute>} />
          <Route path="/student/finance/history" element={<RoleRoute roles={[UserRole.STUDENT, UserRole.INDEPENDENT_APPLICANT]}><PortalResourcePage eyebrow="Student" title="Payment History" description="Review the live payment history available to your account." endpoint="/finance" /></RoleRoute>} />
          <Route path="/student/documents" element={<RoleRoute roles={[UserRole.STUDENT, UserRole.INDEPENDENT_APPLICANT]}><PortalResourcePage eyebrow="Student" title="My Documents" description="Upload and review documents required for application and placement clearance." endpoint="/documents" /></RoleRoute>} />
          <Route path="/student/certificates" element={<RoleRoute roles={[UserRole.STUDENT, UserRole.INDEPENDENT_APPLICANT]}><PortalResourcePage eyebrow="Student" title="My Certificates" description="Review certificates issued for your completed clinical training." endpoint="/certificates" /></RoleRoute>} />
          <Route path="/student/notifications" element={<RoleRoute roles={[UserRole.STUDENT, UserRole.INDEPENDENT_APPLICANT]}><PortalResourcePage eyebrow="Student" title="Notifications" description="Review account and placement updates delivered by the AIMN notification service." endpoint="/notifications" /></RoleRoute>} />
          <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/dashboard" element={<PortalRedirect />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
