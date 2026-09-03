/**
 * Centralized Navigation Configuration
 * Defines all navigation items for each AZAAM role
 * Supports role-based visibility, collapsible sections, and active route matching
 */

import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  UserCheck,
  FileText,
  Building,
  CheckSquare,
  BookOpen,
  Award,
  ShieldCheck,
  History,
  Bell,
  Settings,
  LogOut,
  Briefcase,
  DollarSign,
  FileCheck2,
  Plane,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { UserRole } from '../types/frontend';

export interface NavigationItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
  permission?: string;
  children?: NavigationItem[];
  badge?: string | number;
}

export interface NavigationSection {
  title?: string;
  items: NavigationItem[];
  collapsible?: boolean;
}

export interface PortalConfig {
  portalTitle: string;
  portalSubtitle?: string;
  roles: UserRole[];
  sections: NavigationSection[];
}

/**
 * SUPER_ADMIN Portal: AZAAM ADMIN
 * Full platform management access
 */
const SUPER_ADMIN_NAVIGATION: NavigationSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      {
        label: 'Dashboard',
        path: '/admin/dashboard',
        icon: LayoutDashboard,
        roles: [UserRole.SUPER_ADMIN],
      },
    ],
  },
  {
    title: 'PLATFORM MANAGEMENT',
    items: [
      {
        label: 'Users',
        path: '/admin/users',
        icon: Users,
        roles: [UserRole.SUPER_ADMIN],
      },
      {
        label: 'Universities',
        path: '/admin/universities',
        icon: GraduationCap,
        roles: [UserRole.SUPER_ADMIN],
      },
      {
        label: 'Hospitals & Organizations',
        path: '/admin/organizations',
        icon: Building2,
        roles: [UserRole.SUPER_ADMIN],
      },
      {
        label: 'Clinical Supervisors',
        path: '/admin/supervisors',
        icon: UserCheck,
        roles: [UserRole.SUPER_ADMIN],
      },
    ],
  },
  {
    title: 'TRAINING OPERATIONS',
    items: [
      {
        label: 'Applications',
        path: '/admin/applications',
        icon: FileText,
        roles: [UserRole.SUPER_ADMIN],
      },
      {
        label: 'Placements',
        path: '/admin/placements',
        icon: Building,
        roles: [UserRole.SUPER_ADMIN],
      },
      {
        label: 'Clinical Attachments',
        path: '/admin/clinical-attachments',
        icon: Briefcase,
        roles: [UserRole.SUPER_ADMIN],
      },
      {
        label: 'Attendance',
        path: '/admin/attendance',
        icon: CheckSquare,
        roles: [UserRole.SUPER_ADMIN],
      },
      {
        label: 'Logbooks',
        path: '/admin/logbooks',
        icon: BookOpen,
        roles: [UserRole.SUPER_ADMIN],
      },
      {
        label: 'Evaluations',
        path: '/admin/evaluations',
        icon: Award,
        roles: [UserRole.SUPER_ADMIN],
      },
    ],
  },
  {
    title: 'FINANCE',
    items: [
      {
        label: 'Fees & Invoices',
        path: '/admin/finance/fees',
        icon: DollarSign,
        roles: [UserRole.SUPER_ADMIN],
      },
      {
        label: 'Payments',
        path: '/admin/finance/payments',
        icon: TrendingUp,
        roles: [UserRole.SUPER_ADMIN],
      },
      {
        label: 'Transactions',
        path: '/admin/finance/transactions',
        icon: DollarSign,
        roles: [UserRole.SUPER_ADMIN],
      },
      {
        label: 'Settlements',
        path: '/admin/finance/settlements',
        icon: TrendingUp,
        roles: [UserRole.SUPER_ADMIN],
      },
      {
        label: 'Refunds',
        path: '/admin/finance/refunds',
        icon: DollarSign,
        roles: [UserRole.SUPER_ADMIN],
      },
    ],
  },
  {
    title: 'DOCUMENTS & CERTIFICATION',
    items: [
      {
        label: 'Documents',
        path: '/admin/documents',
        icon: FileText,
        roles: [UserRole.SUPER_ADMIN],
      },
      {
        label: 'Certificates',
        path: '/admin/certificates',
        icon: ShieldCheck,
        roles: [UserRole.SUPER_ADMIN],
      },
    ],
  },
  {
    title: 'COMMUNICATION',
    items: [
      {
        label: 'Notifications',
        path: '/admin/notifications',
        icon: Bell,
        roles: [UserRole.SUPER_ADMIN],
      },
    ],
  },
  {
    title: 'REPORTS',
    items: [
      {
        label: 'Operational Reports',
        path: '/admin/reports/operational',
        icon: BarChart3,
        roles: [UserRole.SUPER_ADMIN],
      },
      {
        label: 'Training Reports',
        path: '/admin/reports/training',
        icon: BarChart3,
        roles: [UserRole.SUPER_ADMIN],
      },
      {
        label: 'University Reports',
        path: '/admin/reports/university',
        icon: BarChart3,
        roles: [UserRole.SUPER_ADMIN],
      },
      {
        label: 'Organization Reports',
        path: '/admin/reports/organization',
        icon: BarChart3,
        roles: [UserRole.SUPER_ADMIN],
      },
      {
        label: 'Financial Reports',
        path: '/admin/reports/financial',
        icon: BarChart3,
        roles: [UserRole.SUPER_ADMIN],
      },
    ],
  },
  {
    title: 'SECURITY',
    items: [
      {
        label: 'Audit Logs',
        path: '/admin/audit-logs',
        icon: History,
        roles: [UserRole.SUPER_ADMIN],
      },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      {
        label: 'Settings',
        path: '/admin/settings',
        icon: Settings,
        roles: [UserRole.SUPER_ADMIN],
      },
    ],
  },
];

/**
 * AZAAM_STAFF Portal: AZAAM OPERATIONS
 * Operations and coordination access
 */
const AZAAM_STAFF_NAVIGATION: NavigationSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      {
        label: 'Dashboard',
        path: '/admin/dashboard',
        icon: LayoutDashboard,
        roles: [UserRole.AZAAM_STAFF],
      },
    ],
  },
  {
    title: 'INSTITUTIONS',
    items: [
      {
        label: 'Universities',
        path: '/admin/universities',
        icon: GraduationCap,
        roles: [UserRole.AZAAM_STAFF],
      },
      {
        label: 'Hospitals & Organizations',
        path: '/admin/organizations',
        icon: Building2,
        roles: [UserRole.AZAAM_STAFF],
      },
    ],
  },
  {
    title: 'PEOPLE',
    items: [
      {
        label: 'Students',
        path: '/admin/students',
        icon: Users,
        roles: [UserRole.AZAAM_STAFF],
      },
      {
        label: 'Clinical Supervisors',
        path: '/admin/supervisors',
        icon: UserCheck,
        roles: [UserRole.AZAAM_STAFF],
      },
    ],
  },
  {
    title: 'TRAINING OPERATIONS',
    items: [
      {
        label: 'Applications',
        path: '/admin/applications',
        icon: FileText,
        roles: [UserRole.AZAAM_STAFF],
      },
      {
        label: 'Placements',
        path: '/admin/placements',
        icon: Building,
        roles: [UserRole.AZAAM_STAFF],
      },
      {
        label: 'Clinical Attachments',
        path: '/admin/clinical-attachments',
        icon: Briefcase,
        roles: [UserRole.AZAAM_STAFF],
      },
      {
        label: 'Attendance',
        path: '/admin/attendance',
        icon: CheckSquare,
        roles: [UserRole.AZAAM_STAFF],
      },
      {
        label: 'Logbooks',
        path: '/admin/logbooks',
        icon: BookOpen,
        roles: [UserRole.AZAAM_STAFF],
      },
      {
        label: 'Evaluations',
        path: '/admin/evaluations',
        icon: Award,
        roles: [UserRole.AZAAM_STAFF],
      },
    ],
  },
  {
    title: 'FINANCE',
    items: [
      {
        label: 'Fees & Invoices',
        path: '/admin/finance/fees',
        icon: DollarSign,
        roles: [UserRole.AZAAM_STAFF],
      },
      {
        label: 'Payments',
        path: '/admin/finance/payments',
        icon: TrendingUp,
        roles: [UserRole.AZAAM_STAFF],
      },
      {
        label: 'Transactions',
        path: '/admin/finance/transactions',
        icon: DollarSign,
        roles: [UserRole.AZAAM_STAFF],
      },
      {
        label: 'Settlements',
        path: '/admin/finance/settlements',
        icon: TrendingUp,
        roles: [UserRole.AZAAM_STAFF],
      },
    ],
  },
  {
    title: 'DOCUMENTS & CERTIFICATION',
    items: [
      {
        label: 'Documents',
        path: '/admin/documents',
        icon: FileText,
        roles: [UserRole.AZAAM_STAFF],
      },
      {
        label: 'Certificates',
        path: '/admin/certificates',
        icon: ShieldCheck,
        roles: [UserRole.AZAAM_STAFF],
      },
    ],
  },
  {
    title: 'COMMUNICATION',
    items: [
      {
        label: 'Notifications',
        path: '/admin/notifications',
        icon: Bell,
        roles: [UserRole.AZAAM_STAFF],
      },
    ],
  },
  {
    title: 'REPORTS',
    items: [
      {
        label: 'Operational Reports',
        path: '/admin/reports/operational',
        icon: BarChart3,
        roles: [UserRole.AZAAM_STAFF],
      },
      {
        label: 'Training Reports',
        path: '/admin/reports/training',
        icon: BarChart3,
        roles: [UserRole.AZAAM_STAFF],
      },
      {
        label: 'Financial Reports',
        path: '/admin/reports/financial',
        icon: BarChart3,
        roles: [UserRole.AZAAM_STAFF],
      },
    ],
  },
  {
    title: 'SECURITY',
    items: [
      {
        label: 'Audit Logs',
        path: '/admin/audit-logs',
        icon: History,
        roles: [UserRole.AZAAM_STAFF],
      },
    ],
  },
];

/**
 * UNIVERSITY_ADMIN Portal: UNIVERSITY PORTAL
 * University administration - student and academic monitoring only
 * NO hospital/organization administrative access
 */
const UNIVERSITY_ADMIN_NAVIGATION: NavigationSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      {
        label: 'Dashboard',
        path: '/university/dashboard',
        icon: LayoutDashboard,
        roles: [UserRole.UNIVERSITY_ADMIN],
      },
    ],
  },
  {
    title: 'STUDENTS',
    items: [
      {
        label: 'Nominate Student',
        path: '/university/nominate-student',
        icon: UserCheck,
        roles: [UserRole.UNIVERSITY_ADMIN],
      },
      {
        label: 'Students',
        path: '/university/students',
        icon: Users,
        roles: [UserRole.UNIVERSITY_ADMIN],
      },
      {
        label: 'Student Status',
        path: '/university/student-status',
        icon: FileCheck2,
        roles: [UserRole.UNIVERSITY_ADMIN],
      },
    ],
  },
  {
    title: 'TRAINING MONITORING',
    items: [
      {
        label: 'Clinical Attachments',
        path: '/university/clinical-attachments',
        icon: Briefcase,
        roles: [UserRole.UNIVERSITY_ADMIN],
      },
      {
        label: 'Attendance',
        path: '/university/attendance',
        icon: CheckSquare,
        roles: [UserRole.UNIVERSITY_ADMIN],
      },
      {
        label: 'Logsheet / Logbook',
        path: '/university/logbook',
        icon: BookOpen,
        roles: [UserRole.UNIVERSITY_ADMIN],
      },
      {
        label: 'Evaluation & Grade',
        path: '/university/evaluations',
        icon: Award,
        roles: [UserRole.UNIVERSITY_ADMIN],
      },
    ],
  },
  {
    title: 'FINANCE',
    items: [
      {
        label: 'Fees & Invoices',
        path: '/university/finance/fees',
        icon: DollarSign,
        roles: [UserRole.UNIVERSITY_ADMIN],
      },
      {
        label: 'Payments',
        path: '/university/finance/payments',
        icon: TrendingUp,
        roles: [UserRole.UNIVERSITY_ADMIN],
      },
      {
        label: 'Payment History',
        path: '/university/finance/history',
        icon: History,
        roles: [UserRole.UNIVERSITY_ADMIN],
      },
    ],
  },
  {
    title: 'DOCUMENTS',
    items: [
      {
        label: 'Student Documents',
        path: '/university/documents',
        icon: FileText,
        roles: [UserRole.UNIVERSITY_ADMIN],
      },
      {
        label: 'Certificates',
        path: '/university/certificates',
        icon: ShieldCheck,
        roles: [UserRole.UNIVERSITY_ADMIN],
      },
    ],
  },
  {
    title: 'UNIVERSITY',
    items: [
      {
        label: 'University Profile',
        path: '/university/profile',
        icon: Building,
        roles: [UserRole.UNIVERSITY_ADMIN],
      },
      {
        label: 'University Staff',
        path: '/university/staff',
        icon: Users,
        roles: [UserRole.UNIVERSITY_ADMIN],
      },
    ],
  },
  {
    title: 'REPORTS',
    items: [
      {
        label: 'Student Report',
        path: '/university/reports/students',
        icon: BarChart3,
        roles: [UserRole.UNIVERSITY_ADMIN],
      },
      {
        label: 'Training Report',
        path: '/university/reports/training',
        icon: BarChart3,
        roles: [UserRole.UNIVERSITY_ADMIN],
      },
      {
        label: 'Financial Report',
        path: '/university/reports/financial',
        icon: BarChart3,
        roles: [UserRole.UNIVERSITY_ADMIN],
      },
    ],
  },
  {
    title: 'COMMUNICATION',
    items: [
      {
        label: 'Notifications',
        path: '/university/notifications',
        icon: Bell,
        roles: [UserRole.UNIVERSITY_ADMIN],
      },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      {
        label: 'Profile',
        path: '/university/profile',
        icon: Building,
        roles: [UserRole.UNIVERSITY_ADMIN],
      },
      {
        label: 'Settings',
        path: '/university/settings',
        icon: Settings,
        roles: [UserRole.UNIVERSITY_ADMIN],
      },
      {
        label: 'Logout',
        path: '/login',
        icon: LogOut,
        roles: [UserRole.UNIVERSITY_ADMIN],
      },
    ],
  },
];

/**
 * UNIVERSITY_STAFF Portal: UNIVERSITY PORTAL
 * University staff - limited administrative actions
 */
const UNIVERSITY_STAFF_NAVIGATION: NavigationSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      {
        label: 'Dashboard',
        path: '/university/dashboard',
        icon: LayoutDashboard,
        roles: [UserRole.UNIVERSITY_STAFF],
      },
    ],
  },
  {
    title: 'STUDENTS',
    items: [
      {
        label: 'Nominate Student',
        path: '/university/nominate-student',
        icon: UserCheck,
        roles: [UserRole.UNIVERSITY_STAFF],
      },
      {
        label: 'Students',
        path: '/university/students',
        icon: Users,
        roles: [UserRole.UNIVERSITY_STAFF],
      },
      {
        label: 'Student Status',
        path: '/university/student-status',
        icon: FileCheck2,
        roles: [UserRole.UNIVERSITY_STAFF],
      },
    ],
  },
  {
    title: 'TRAINING MONITORING',
    items: [
      {
        label: 'Clinical Attachments',
        path: '/university/clinical-attachments',
        icon: Briefcase,
        roles: [UserRole.UNIVERSITY_STAFF],
      },
      {
        label: 'Attendance',
        path: '/university/attendance',
        icon: CheckSquare,
        roles: [UserRole.UNIVERSITY_STAFF],
      },
      {
        label: 'Logsheet / Logbook',
        path: '/university/logbook',
        icon: BookOpen,
        roles: [UserRole.UNIVERSITY_STAFF],
      },
      {
        label: 'Evaluation & Grade',
        path: '/university/evaluations',
        icon: Award,
        roles: [UserRole.UNIVERSITY_STAFF],
      },
    ],
  },
  {
    title: 'FINANCE',
    items: [
      {
        label: 'Fees & Invoices',
        path: '/university/finance/fees',
        icon: DollarSign,
        roles: [UserRole.UNIVERSITY_STAFF],
      },
      {
        label: 'Payments',
        path: '/university/finance/payments',
        icon: TrendingUp,
        roles: [UserRole.UNIVERSITY_STAFF],
      },
      {
        label: 'Payment History',
        path: '/university/finance/history',
        icon: History,
        roles: [UserRole.UNIVERSITY_STAFF],
      },
    ],
  },
  {
    title: 'DOCUMENTS',
    items: [
      {
        label: 'Student Documents',
        path: '/university/documents',
        icon: FileText,
        roles: [UserRole.UNIVERSITY_STAFF],
      },
      {
        label: 'Certificates',
        path: '/university/certificates',
        icon: ShieldCheck,
        roles: [UserRole.UNIVERSITY_STAFF],
      },
    ],
  },
  {
    title: 'COMMUNICATION',
    items: [
      {
        label: 'Notifications',
        path: '/university/notifications',
        icon: Bell,
        roles: [UserRole.UNIVERSITY_STAFF],
      },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      {
        label: 'Profile',
        path: '/university/profile',
        icon: Building,
        roles: [UserRole.UNIVERSITY_STAFF],
      },
      {
        label: 'Settings',
        path: '/university/settings',
        icon: Settings,
        roles: [UserRole.UNIVERSITY_STAFF],
      },
      {
        label: 'Logout',
        path: '/login',
        icon: LogOut,
        roles: [UserRole.UNIVERSITY_STAFF],
      },
    ],
  },
];

/**
 * ORGANIZATION_ADMIN Portal: HEALTHCARE ORGANIZATION
 * Hospital/Organization administration - NO university access
 */
const ORGANIZATION_ADMIN_NAVIGATION: NavigationSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      {
        label: 'Dashboard',
        path: '/organization/dashboard',
        icon: LayoutDashboard,
        roles: [UserRole.ORGANIZATION_ADMIN],
      },
    ],
  },
  {
    title: 'CLINICAL OPERATIONS',
    items: [
      {
        label: 'Placements',
        path: '/organization/placements',
        icon: Building,
        roles: [UserRole.ORGANIZATION_ADMIN],
      },
      {
        label: 'Clinical Attachments',
        path: '/organization/clinical-attachments',
        icon: Briefcase,
        roles: [UserRole.ORGANIZATION_ADMIN],
      },
      {
        label: 'Departments',
        path: '/organization/departments',
        icon: Building2,
        roles: [UserRole.ORGANIZATION_ADMIN],
      },
      {
        label: 'Capacity',
        path: '/organization/capacity',
        icon: TrendingUp,
        roles: [UserRole.ORGANIZATION_ADMIN],
      },
    ],
  },
  {
    title: 'TRAINEES',
    items: [
      {
        label: 'Assigned Trainees',
        path: '/organization/trainees',
        icon: Users,
        roles: [UserRole.ORGANIZATION_ADMIN],
      },
      {
        label: 'Attendance',
        path: '/organization/attendance',
        icon: CheckSquare,
        roles: [UserRole.ORGANIZATION_ADMIN],
      },
      {
        label: 'Logbooks',
        path: '/organization/logbooks',
        icon: BookOpen,
        roles: [UserRole.ORGANIZATION_ADMIN],
      },
      {
        label: 'Evaluations',
        path: '/organization/evaluations',
        icon: Award,
        roles: [UserRole.ORGANIZATION_ADMIN],
      },
    ],
  },
  {
    title: 'CLINICAL STAFF',
    items: [
      {
        label: 'Clinical Supervisors',
        path: '/organization/supervisors',
        icon: UserCheck,
        roles: [UserRole.ORGANIZATION_ADMIN],
      },
      {
        label: 'Organization Staff',
        path: '/organization/staff',
        icon: Users,
        roles: [UserRole.ORGANIZATION_ADMIN],
      },
    ],
  },
  {
    title: 'FINANCE',
    items: [
      {
        label: 'Placement Fees',
        path: '/organization/finance/fees',
        icon: DollarSign,
        roles: [UserRole.ORGANIZATION_ADMIN],
      },
      {
        label: 'Payment History',
        path: '/organization/finance/history',
        icon: History,
        roles: [UserRole.ORGANIZATION_ADMIN],
      },
      {
        label: 'Settlement History',
        path: '/organization/finance/settlements',
        icon: TrendingUp,
        roles: [UserRole.ORGANIZATION_ADMIN],
      },
    ],
  },
  {
    title: 'DOCUMENTS & CERTIFICATES',
    items: [
      {
        label: 'Documents',
        path: '/organization/documents',
        icon: FileText,
        roles: [UserRole.ORGANIZATION_ADMIN],
      },
      {
        label: 'Certificates',
        path: '/organization/certificates',
        icon: ShieldCheck,
        roles: [UserRole.ORGANIZATION_ADMIN],
      },
    ],
  },
  {
    title: 'ORGANIZATION',
    items: [
      {
        label: 'Organization Profile',
        path: '/organization/profile',
        icon: Building,
        roles: [UserRole.ORGANIZATION_ADMIN],
      },
    ],
  },
  {
    title: 'REPORTS',
    items: [
      {
        label: 'Placement Reports',
        path: '/organization/reports/placements',
        icon: BarChart3,
        roles: [UserRole.ORGANIZATION_ADMIN],
      },
      {
        label: 'Capacity Reports',
        path: '/organization/reports/capacity',
        icon: BarChart3,
        roles: [UserRole.ORGANIZATION_ADMIN],
      },
      {
        label: 'Training Reports',
        path: '/organization/reports/training',
        icon: BarChart3,
        roles: [UserRole.ORGANIZATION_ADMIN],
      },
      {
        label: 'Financial Reports',
        path: '/organization/reports/financial',
        icon: BarChart3,
        roles: [UserRole.ORGANIZATION_ADMIN],
      },
    ],
  },
  {
    title: 'COMMUNICATION',
    items: [
      {
        label: 'Notifications',
        path: '/organization/notifications',
        icon: Bell,
        roles: [UserRole.ORGANIZATION_ADMIN],
      },
    ],
  },
];

/**
 * ORGANIZATION_STAFF Portal: HEALTHCARE ORGANIZATION
 * Organization staff - limited operations
 */
const ORGANIZATION_STAFF_NAVIGATION: NavigationSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      {
        label: 'Dashboard',
        path: '/organization/dashboard',
        icon: LayoutDashboard,
        roles: [UserRole.ORGANIZATION_STAFF],
      },
    ],
  },
  {
    title: 'CLINICAL OPERATIONS',
    items: [
      {
        label: 'Placements',
        path: '/organization/placements',
        icon: Building,
        roles: [UserRole.ORGANIZATION_STAFF],
      },
      {
        label: 'Clinical Attachments',
        path: '/organization/clinical-attachments',
        icon: Briefcase,
        roles: [UserRole.ORGANIZATION_STAFF],
      },
      {
        label: 'Departments',
        path: '/organization/departments',
        icon: Building2,
        roles: [UserRole.ORGANIZATION_STAFF],
      },
    ],
  },
  {
    title: 'TRAINEES',
    items: [
      {
        label: 'Assigned Trainees',
        path: '/organization/trainees',
        icon: Users,
        roles: [UserRole.ORGANIZATION_STAFF],
      },
      {
        label: 'Attendance',
        path: '/organization/attendance',
        icon: CheckSquare,
        roles: [UserRole.ORGANIZATION_STAFF],
      },
      {
        label: 'Logbooks',
        path: '/organization/logbooks',
        icon: BookOpen,
        roles: [UserRole.ORGANIZATION_STAFF],
      },
      {
        label: 'Evaluations',
        path: '/organization/evaluations',
        icon: Award,
        roles: [UserRole.ORGANIZATION_STAFF],
      },
    ],
  },
  {
    title: 'CLINICAL STAFF',
    items: [
      {
        label: 'Clinical Supervisors',
        path: '/organization/supervisors',
        icon: UserCheck,
        roles: [UserRole.ORGANIZATION_STAFF],
      },
    ],
  },
  {
    title: 'DOCUMENTS',
    items: [
      {
        label: 'Documents',
        path: '/organization/documents',
        icon: FileText,
        roles: [UserRole.ORGANIZATION_STAFF],
      },
    ],
  },
  {
    title: 'CERTIFICATES',
    items: [
      {
        label: 'Certificates',
        path: '/organization/certificates',
        icon: ShieldCheck,
        roles: [UserRole.ORGANIZATION_STAFF],
      },
    ],
  },
  {
    title: 'REPORTS',
    items: [
      {
        label: 'Placement Reports',
        path: '/organization/reports/placements',
        icon: BarChart3,
        roles: [UserRole.ORGANIZATION_STAFF],
      },
      {
        label: 'Training Reports',
        path: '/organization/reports/training',
        icon: BarChart3,
        roles: [UserRole.ORGANIZATION_STAFF],
      },
    ],
  },
  {
    title: 'COMMUNICATION',
    items: [
      {
        label: 'Notifications',
        path: '/organization/notifications',
        icon: Bell,
        roles: [UserRole.ORGANIZATION_STAFF],
      },
    ],
  },
];

/**
 * CLINICAL_SUPERVISOR Portal: CLINICAL SUPERVISOR
 * Supervisor workspace - assigned trainees and evaluations only
 */
const CLINICAL_SUPERVISOR_NAVIGATION: NavigationSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      {
        label: 'Dashboard',
        path: '/supervisor/dashboard',
        icon: LayoutDashboard,
        roles: [UserRole.CLINICAL_SUPERVISOR],
      },
    ],
  },
  {
    title: 'MY TRAINEES',
    items: [
      {
        label: 'Assigned Trainees',
        path: '/supervisor/trainees',
        icon: Users,
        roles: [UserRole.CLINICAL_SUPERVISOR],
      },
      {
        label: 'Clinical Attachments',
        path: '/supervisor/clinical-attachments',
        icon: Briefcase,
        roles: [UserRole.CLINICAL_SUPERVISOR],
      },
    ],
  },
  {
    title: 'CLINICAL TRAINING',
    items: [
      {
        label: 'Attendance',
        path: '/supervisor/attendance',
        icon: CheckSquare,
        roles: [UserRole.CLINICAL_SUPERVISOR],
      },
      {
        label: 'Logbook Review',
        path: '/supervisor/logbooks',
        icon: BookOpen,
        roles: [UserRole.CLINICAL_SUPERVISOR],
      },
      {
        label: 'Evaluations',
        path: '/supervisor/evaluations',
        icon: Award,
        roles: [UserRole.CLINICAL_SUPERVISOR],
      },
    ],
  },
  {
    title: 'DOCUMENTS',
    items: [
      {
        label: 'Trainee Documents',
        path: '/supervisor/documents',
        icon: FileText,
        roles: [UserRole.CLINICAL_SUPERVISOR],
      },
    ],
  },
  {
    title: 'CERTIFICATES',
    items: [
      {
        label: 'Trainee Certificates',
        path: '/supervisor/certificates',
        icon: ShieldCheck,
        roles: [UserRole.CLINICAL_SUPERVISOR],
      },
    ],
  },
  {
    title: 'COMMUNICATION',
    items: [
      {
        label: 'Notifications',
        path: '/supervisor/notifications',
        icon: Bell,
        roles: [UserRole.CLINICAL_SUPERVISOR],
      },
    ],
  },
];

/**
 * STUDENT & INDEPENDENT_APPLICANT Portal: STUDENT PORTAL
 * Student personal training records and progress tracking
 */
const STUDENT_NAVIGATION: NavigationSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      {
        label: 'Dashboard',
        path: '/student/dashboard',
        icon: LayoutDashboard,
        roles: [UserRole.STUDENT, UserRole.INDEPENDENT_APPLICANT],
      },
    ],
  },
  {
    title: 'MY APPLICATION',
    items: [
      {
        label: 'Applications',
        path: '/student/applications',
        icon: FileText,
        roles: [UserRole.STUDENT, UserRole.INDEPENDENT_APPLICANT],
      },
      {
        label: 'Application Status',
        path: '/student/application-status',
        icon: FileCheck2,
        roles: [UserRole.STUDENT, UserRole.INDEPENDENT_APPLICANT],
      },
    ],
  },
  {
    title: 'MY TRAINING',
    items: [
      {
        label: 'Clinical Attachment',
        path: '/student/clinical-attachment',
        icon: Briefcase,
        roles: [UserRole.STUDENT, UserRole.INDEPENDENT_APPLICANT],
      },
      {
        label: 'Attendance',
        path: '/student/attendance',
        icon: CheckSquare,
        roles: [UserRole.STUDENT, UserRole.INDEPENDENT_APPLICANT],
      },
      {
        label: 'Logbook',
        path: '/student/logbook',
        icon: BookOpen,
        roles: [UserRole.STUDENT, UserRole.INDEPENDENT_APPLICANT],
      },
      {
        label: 'Evaluations',
        path: '/student/evaluations',
        icon: Award,
        roles: [UserRole.STUDENT, UserRole.INDEPENDENT_APPLICANT],
      },
    ],
  },
  {
    title: 'FINANCE',
    items: [
      {
        label: 'Fees & Invoices',
        path: '/student/finance/fees',
        icon: DollarSign,
        roles: [UserRole.STUDENT, UserRole.INDEPENDENT_APPLICANT],
      },
      {
        label: 'Payments',
        path: '/student/finance/payments',
        icon: TrendingUp,
        roles: [UserRole.STUDENT, UserRole.INDEPENDENT_APPLICANT],
      },
      {
        label: 'Payment History',
        path: '/student/finance/history',
        icon: History,
        roles: [UserRole.STUDENT, UserRole.INDEPENDENT_APPLICANT],
      },
    ],
  },
  {
    title: 'DOCUMENTS',
    items: [
      {
        label: 'My Documents',
        path: '/student/documents',
        icon: FileText,
        roles: [UserRole.STUDENT, UserRole.INDEPENDENT_APPLICANT],
      },
    ],
  },
  {
    title: 'CERTIFICATES',
    items: [
      {
        label: 'My Certificates',
        path: '/student/certificates',
        icon: ShieldCheck,
        roles: [UserRole.STUDENT, UserRole.INDEPENDENT_APPLICANT],
      },
    ],
  },
  {
    title: 'COMMUNICATION',
    items: [
      {
        label: 'Notifications',
        path: '/student/notifications',
        icon: Bell,
        roles: [UserRole.STUDENT, UserRole.INDEPENDENT_APPLICANT],
      },
    ],
  },
];

/**
 * Portal Configurations
 * Maps roles to their portal configurations
 */
export const PORTAL_CONFIGS: Record<UserRole, PortalConfig> = {
  [UserRole.SUPER_ADMIN]: {
    portalTitle: 'AZAAM ADMIN',
    portalSubtitle: 'Global Platform Management',
    roles: [UserRole.SUPER_ADMIN],
    sections: SUPER_ADMIN_NAVIGATION,
  },
  [UserRole.AZAAM_STAFF]: {
    portalTitle: 'AZAAM OPERATIONS',
    portalSubtitle: 'Training Coordination',
    roles: [UserRole.AZAAM_STAFF],
    sections: AZAAM_STAFF_NAVIGATION,
  },
  [UserRole.UNIVERSITY_ADMIN]: {
    portalTitle: 'UNIVERSITY PORTAL',
    roles: [UserRole.UNIVERSITY_ADMIN],
    sections: UNIVERSITY_ADMIN_NAVIGATION,
  },
  [UserRole.UNIVERSITY_STAFF]: {
    portalTitle: 'UNIVERSITY PORTAL',
    roles: [UserRole.UNIVERSITY_STAFF],
    sections: UNIVERSITY_STAFF_NAVIGATION,
  },
  [UserRole.ORGANIZATION_ADMIN]: {
    portalTitle: 'HEALTHCARE ORGANIZATION',
    roles: [UserRole.ORGANIZATION_ADMIN],
    sections: ORGANIZATION_ADMIN_NAVIGATION,
  },
  [UserRole.ORGANIZATION_STAFF]: {
    portalTitle: 'HEALTHCARE ORGANIZATION',
    roles: [UserRole.ORGANIZATION_STAFF],
    sections: ORGANIZATION_STAFF_NAVIGATION,
  },
  [UserRole.CLINICAL_SUPERVISOR]: {
    portalTitle: 'CLINICAL SUPERVISOR',
    roles: [UserRole.CLINICAL_SUPERVISOR],
    sections: CLINICAL_SUPERVISOR_NAVIGATION,
  },
  [UserRole.STUDENT]: {
    portalTitle: 'STUDENT PORTAL',
    roles: [UserRole.STUDENT],
    sections: STUDENT_NAVIGATION,
  },
  [UserRole.INDEPENDENT_APPLICANT]: {
    portalTitle: 'STUDENT PORTAL',
    roles: [UserRole.INDEPENDENT_APPLICANT],
    sections: STUDENT_NAVIGATION,
  },
};

/**
 * Get portal configuration for a given role
 */
export function getPortalConfig(role: UserRole): PortalConfig {
  return PORTAL_CONFIGS[role] || PORTAL_CONFIGS[UserRole.STUDENT];
}

/**
 * Get all navigation items for a role (flattened)
 */
export function getNavItemsForRole(role: UserRole): NavigationItem[] {
  const config = getPortalConfig(role);
  return config.sections.flatMap((section) => section.items);
}

/**
 * Check if a user role is allowed to access a path
 */
export function canAccessPath(role: UserRole, path: string): boolean {
  const items = getNavItemsForRole(role);
  return items.some(
    (item) => item.path === path || path.startsWith(item.path + '/')
  );
}

/**
 * Get the canonical portal root for a role
 */
export function getPortalRoot(role: UserRole): string {
  switch (role) {
    case UserRole.SUPER_ADMIN:
    case UserRole.AZAAM_STAFF:
      return '/admin';
    case UserRole.UNIVERSITY_ADMIN:
    case UserRole.UNIVERSITY_STAFF:
      return '/university';
    case UserRole.ORGANIZATION_ADMIN:
    case UserRole.ORGANIZATION_STAFF:
      return '/organization';
    case UserRole.CLINICAL_SUPERVISOR:
      return '/supervisor';
    case UserRole.STUDENT:
    case UserRole.INDEPENDENT_APPLICANT:
      return '/student';
    default:
      return '/student';
  }
}
