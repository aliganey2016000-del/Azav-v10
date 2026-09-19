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
import { PortalResourcePage } from '../pages/PortalResourcePage';
import { LivePortalDashboardPage } from '../pages/LivePortalDashboardPage';

import { UniversityNominateStudentPage } from '../pages/university/UniversityNominateStudentPage';
import { UniversityStudentStatusPage } from '../pages/university/UniversityStudentStatusPage';
import { UniversityStudentJourneyPage } from '../pages/university/UniversityStudentJourneyPage';
import { UniversityPlacementsPage } from '../pages/university/UniversityPlacementsPage';
import { UniversityRotationsPage } from '../pages/university/UniversityRotationsPage';

import { OrganizationDepartmentsPage } from '../pages/organization/OrganizationDepartmentsPage';
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
import { JourneyChatPage } from '../pages/shared/JourneyChatPage';
import { AuditLogsPage } from '../pages/admin/AuditLogsPage';
import { AdminPlacementsPage } from '../pages/admin/AdminPlacementsPage';
import { AdminRotationsPage } from '../pages/admin/AdminRotationsPage';
import { AdminRotationTemplatesPage } from '../pages/admin/AdminRotationTemplatesPage';
import { AdminFinancePage } from '../pages/admin/AdminFinancePage';
import { StudentApplicationPage } from '../pages/student/StudentApplicationPage';
import { StudentPlacementPage } from '../pages/student/StudentPlacementPage';
import { StudentRotationsPage } from '../pages/student/StudentRotationsPage';

const PortalRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  const role = user?.roles?.[0] as UserRole | undefined;
  return <Navigate to={role ? `${getPortalRoot(role)}/dashboard` : '/login'} replace />;
}

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
      <Route path="/portal" element={<ProtectedRoute />}><Route index element={<PortalRedirect />} /></Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<PortalLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<UsersManagementPage />} />
          <Route path="/admin/students" element={<StudentsManagementPage />} />
          <Route path="/admin/students/:id" element={<StudentJourneyAdminPage />} />
          <Route path="/admin/students/:id/chat" element={<JourneyChatPage portal="admin" />} />
          <Route path="/admin/universities" element={<UniversitiesPage />} />
          <Route path="/admin/universities/:id" element={<UniversityDetailPage />} />
          <Route path="/admin/organizations" element={<OrganizationsPage />} />
          <Route path="/admin/organizations/:id" element={<OrganizationDetailPage />} />
          <Route path="/admin/supervisors" element={<SupervisorsPage />} />
          <Route path="/admin/supervisors/:id" element={<SupervisorDetailPage />} />
          <Route path="/admin/applications" element={<PortalResourcePage eyebrow="Platform Management" title="Applications" description="Review live student applications submitted to AZAAM." endpoint="/applications" />} />
          <Route path="/admin/placements" element={<AdminPlacementsPage />} />
          <Route path="/admin/rotation-planner" element={<AdminRotationsPage />} />
          <Route path="/admin/rotation-templates" element={<AdminRotationTemplatesPage />} />
          <Route path="/admin/finance/fees" element={<AdminFinancePage mode="fees" />} />
          <Route path="/admin/finance/payments" element={<AdminFinancePage mode="payments" />} />
          <Route path="/admin/finance/transactions" element={<AdminFinancePage mode="transactions" />} />
          <Route path="/admin/finance/settlements" element={<AdminFinancePage mode="settlements" />} />
          <Route path="/admin/finance/refunds" element={<AdminFinancePage mode="refunds" />} />
          <Route path="/admin/rotations" element={<Navigate to="/admin/rotation-planner" replace />} />
          <Route path="/admin/clinical-training" element={<Navigate to="/admin/placements" replace />} />
          <Route path="/admin/completion-certificates" element={<Navigate to="/admin/placements" replace />} />
          <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

          <Route path="/university/dashboard" element={
            <LivePortalDashboardPage
              eyebrow="University Portal"
              title="University Dashboard"
              description="Live university clinical-training data loaded directly from the AZAAM database."
              metrics={[
                { label: 'Applications', endpoint: '/applications', candidateKeys: ['applications'] },
                { label: 'Placements', endpoint: '/placements', candidateKeys: ['placements'] },
                { label: 'Certificates', endpoint: '/certificates', candidateKeys: ['certificates'] },
                { label: 'Finance Records', endpoint: '/finance' },
              ]}
            />
          } />
          <Route path="/university/nominate-student" element={<UniversityNominateStudentPage />} />
          <Route path="/university/students" element={<Navigate to="/university/nominate-student" replace />} />
          <Route path="/university/students/:id" element={<UniversityStudentJourneyPage />} />
          <Route path="/university/students/:id/chat" element={<JourneyChatPage portal="university" />} />
          <Route path="/university/student-status" element={<UniversityStudentStatusPage />} />
          <Route path="/university/mou" element={<PortalResourcePage eyebrow="University Admin" title="MoU & Agreement" description="View the university partnership agreement stored in the live database." endpoint="/universities/mou/current" />} />
          <Route path="/university/financials" element={<Navigate to="/university/finance/history" replace />} />
          <Route
            path="/university/finance/fees"
            element={
              <AdminFinancePage
                mode="fees"
                readOnly
                eyebrowOverride="University Finance · Billing"
                descriptionOverride="Track student invoices, amounts paid, outstanding balances and due dates for your university."
                registerTitleOverride="Student Invoices"
                registerDescriptionOverride="Read-only invoice register for students associated with your university."
              />
            }
          />
          <Route
            path="/university/finance/payments"
            element={
              <AdminFinancePage
                mode="payments"
                readOnly
                eyebrowOverride="University Finance · Payments"
                descriptionOverride="Review payments recorded against your students' clinical training invoices."
                registerTitleOverride="Student Payments"
                registerDescriptionOverride="Read-only payment records linked to university-associated student invoices."
              />
            }
          />
          <Route
            path="/university/finance/history"
            element={
              <AdminFinancePage
                mode="transactions"
                readOnly
                titleOverride="Payment History"
                eyebrowOverride="University Finance · Ledger"
                descriptionOverride="Review the complete finance history available to your university in one responsive ledger."
                registerTitleOverride="University Finance Ledger"
                registerDescriptionOverride="Invoices, payments and refunds for students associated with your university."
              />
            }
          />
          <Route path="/university/applications" element={<PortalResourcePage eyebrow="University Admin" title="Student Applications" description="Review live applications submitted by or associated with this university." endpoint="/applications" />} />
          <Route path="/university/placements" element={<UniversityPlacementsPage />} />
          <Route path="/university/rotations" element={<UniversityRotationsPage />} />
          <Route path="/university/clinical-attachments" element={<Navigate to="/university/placements" replace />} />
          <Route path="/university/attendance" element={<PortalResourcePage eyebrow="University Admin" title="Student Attendance" description="Review live attendance records returned for university clinical attachments." endpoint="/attendance" />} />
          <Route path="/university/logbook" element={<PortalResourcePage eyebrow="University Admin" title="Student Logbooks" description="Review live clinical logbook records for university students." endpoint="/logbooks" />} />
          <Route path="/university/evaluations" element={<PortalResourcePage eyebrow="University Admin" title="Student Evaluations" description="Review live evaluation records submitted for university students." endpoint="/evaluations" />} />
          <Route path="/university/certificates" element={<PortalResourcePage eyebrow="University Admin" title="Student Certificates" description="Review live certificates issued for university students." endpoint="/certificates" />} />
          <Route path="/university" element={<Navigate to="/university/dashboard" replace />} />

          <Route path="/organization/dashboard" element={
            <LivePortalDashboardPage
              eyebrow="Healthcare Organization"
              title="Organization Dashboard"
              description="Live placement, attendance, evaluation and certificate data from the database."
              metrics={[
                { label: 'Placements', endpoint: '/placements', candidateKeys: ['placements'] },
                { label: 'Attendance', endpoint: '/attendance', candidateKeys: ['attendanceLogs'] },
                { label: 'Evaluations', endpoint: '/evaluations', candidateKeys: ['evaluations'] },
                { label: 'Certificates', endpoint: '/certificates', candidateKeys: ['certificates'] },
              ]}
            />
          } />
          <Route path="/organization/placements" element={<PortalResourcePage eyebrow="Organization Admin" title="Clinical Placements" description="Review live clinical placements assigned to this organization." endpoint="/placements" />} />
          <Route path="/organization/clinical-attachments" element={<PortalResourcePage eyebrow="Organization Admin" title="Clinical Attachments" description="Review live clinical attachment placement records." endpoint="/placements" />} />
          <Route path="/organization/departments" element={<OrganizationDepartmentsPage />} />
          <Route path="/organization/trainees" element={<PortalResourcePage eyebrow="Organization Admin" title="Trainees" description="Review trainees currently represented in live placement records." endpoint="/placements" />} />
          <Route path="/organization/attendance" element={<PortalResourcePage eyebrow="Organization Admin" title="Attendance" description="Review attendance records persisted in the database." endpoint="/attendance" />} />
          <Route path="/organization/logbooks" element={<PortalResourcePage eyebrow="Organization Admin" title="Logbooks" description="Review clinical logbook records persisted in the database." endpoint="/logbooks" />} />
          <Route path="/organization/evaluations" element={<PortalResourcePage eyebrow="Organization Admin" title="Evaluations" description="Review clinical evaluations persisted in the database." endpoint="/evaluations" />} />
          <Route path="/organization/supervisors" element={<PortalResourcePage eyebrow="Organization Admin" title="Supervisors" description="Review supervisors registered for this organization." endpoint="/organizations/current/supervisors" />} />
          <Route path="/organization/staff" element={<UsersManagementPage />} />
          <Route path="/organization/documents" element={<PortalResourcePage eyebrow="Organization Admin" title="Organization Documents" description="Review documents submitted for organization and placement compliance." endpoint="/documents" />} />
          <Route path="/organization/certificates" element={<PortalResourcePage eyebrow="Organization Admin" title="Certificates" description="Review certificates persisted in the database." endpoint="/certificates" />} />
          <Route path="/organization/finance/fees" element={<PortalResourcePage eyebrow="Organization Finance" title="Placement Fees" description="Review finance records associated with organization placement fees." endpoint="/finance?type=FEE" />} />
          <Route path="/organization/finance/history" element={<PortalResourcePage eyebrow="Organization Finance" title="Payment History" description="Review payment records visible to this organization." endpoint="/finance?type=PAYMENT" />} />
          <Route path="/organization/finance/settlements" element={<PortalResourcePage eyebrow="Organization Finance" title="Settlement History" description="Review settlement transfers recorded for this organization." endpoint="/finance?type=SETTLEMENT" />} />
          <Route path="/organization/profile" element={<PortalResourcePage eyebrow="Organization Admin" title="Organization Profile" description="View the organization profile currently associated with this account." endpoint="/auth/me" />} />
          <Route path="/organization" element={<Navigate to="/organization/dashboard" replace />} />

          <Route path="/supervisor/dashboard" element={
            <LivePortalDashboardPage
              eyebrow="Clinical Supervisor"
              title="Supervisor Dashboard"
              description="Live assigned placements and clinical records loaded from the database."
              metrics={[
                { label: 'Placements', endpoint: '/placements', candidateKeys: ['placements'] },
                { label: 'Attendance', endpoint: '/attendance', candidateKeys: ['attendanceLogs'] },
                { label: 'Logbook Entries', endpoint: '/logbooks', candidateKeys: ['entries'] },
                { label: 'Evaluations', endpoint: '/evaluations', candidateKeys: ['evaluations'] },
              ]}
            />
          } />
          <Route path="/supervisor/trainees" element={<PortalResourcePage eyebrow="Clinical Supervisor" title="Assigned Trainees" description="Review live trainee placements assigned to your supervisor account." endpoint="/placements" />} />
          <Route path="/supervisor/clinical-attachments" element={<PortalResourcePage eyebrow="Clinical Supervisor" title="Clinical Attachments" description="Review live assigned clinical attachments." endpoint="/placements" />} />
          <Route path="/supervisor/attendance" element={<PortalResourcePage eyebrow="Clinical Supervisor" title="Attendance" description="Review live attendance records for assigned clinical attachments." endpoint="/attendance" />} />
          <Route path="/supervisor/logbooks" element={<PortalResourcePage eyebrow="Clinical Supervisor" title="Logbooks" description="Review live logbook records for assigned trainees." endpoint="/logbooks" />} />
          <Route path="/supervisor/evaluations" element={<PortalResourcePage eyebrow="Clinical Supervisor" title="Evaluations" description="Review live evaluations for assigned trainees." endpoint="/evaluations" />} />
          <Route path="/supervisor/documents" element={<PortalResourcePage eyebrow="Clinical Supervisor" title="Trainee Documents" description="Review live documents available for assigned trainees and placements." endpoint="/documents" />} />
          <Route path="/supervisor/certificates" element={<PortalResourcePage eyebrow="Clinical Supervisor" title="Certificates" description="Review live certificates associated with assigned trainees." endpoint="/certificates" />} />
          <Route path="/supervisor" element={<Navigate to="/supervisor/dashboard" replace />} />

          <Route path="/student/dashboard" element={
            <LivePortalDashboardPage
              eyebrow="Student Portal"
              title="Student Dashboard"
              description="Your live applications, placements, certificates and finance records from the database."
              metrics={[
                { label: 'Applications', endpoint: '/applications', candidateKeys: ['applications'] },
                { label: 'Placements', endpoint: '/placements', candidateKeys: ['placements'] },
                { label: 'Certificates', endpoint: '/certificates', candidateKeys: ['certificates'] },
                { label: 'Finance Records', endpoint: '/finance' },
              ]}
            />
          } />
          <Route path="/student/applications" element={<StudentApplicationPage />} />
          <Route path="/student/application-status" element={<PortalResourcePage eyebrow="Student" title="Application Status" description="Track the live status of your database-backed applications." endpoint="/applications" />} />
          <Route path="/student/placement" element={<StudentPlacementPage />} />
          <Route path="/student/rotations" element={<StudentRotationsPage />} />
          <Route path="/student/clinical-attachment" element={<Navigate to="/student/placement" replace />} />
          <Route path="/student/attendance" element={<PortalResourcePage eyebrow="Student" title="Attendance" description="Review your attendance records stored in the database." endpoint="/attendance" />} />
          <Route path="/student/logbook" element={<PortalResourcePage eyebrow="Student" title="Logbook" description="Review your clinical logbook records stored in the database." endpoint="/logbooks" />} />
          <Route path="/student/evaluations" element={<PortalResourcePage eyebrow="Student" title="Evaluations" description="Review your live clinical evaluations." endpoint="/evaluations" />} />
          <Route path="/student/finance/fees" element={<PortalResourcePage eyebrow="Student" title="Training Fees" description="Review fee records and payment obligations returned by the live finance service." endpoint="/finance?type=FEE" />} />
          <Route path="/student/finance/payments" element={<PortalResourcePage eyebrow="Student" title="Payments" description="Review payment records associated with your clinical training applications." endpoint="/finance?type=PAYMENT" />} />
          <Route path="/student/finance/history" element={<PortalResourcePage eyebrow="Student" title="Payment History" description="Review the live payment history available to your account." endpoint="/finance" />} />
          <Route path="/student/documents" element={<PortalResourcePage eyebrow="Student" title="My Documents" description="Upload and review documents required for application and placement clearance." endpoint="/documents" />} />
          <Route path="/student/certificates" element={<PortalResourcePage eyebrow="Student" title="Certificates" description="Review your issued certificates stored in the database." endpoint="/certificates" />} />
          <Route path="/student/notifications" element={<PortalResourcePage eyebrow="Student" title="Notifications" description="Review account and placement updates delivered by the AIMN notification service." endpoint="/notifications" />} />
          <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/dashboard" element={<PortalRedirect />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
