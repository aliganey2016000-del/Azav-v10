export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminStats {
  students: number;
  applications: number;
  placements: number;
  universities: number;
  organizations: number;
  supervisors: number;
  attachments: number;
  certificates: number;
}

export interface OrganizationCapacityItem {
  _id: string;
  name: string;
  type: string;
  capacity: number;
  occupied: number;
  available: number;
  utilization: number;
  status: string;
}

export interface AdminDashboardData {
  stats: AdminStats;
  recentApplications: any[];
  recentUsers: any[];
  recentActivity: any[];
  organizationCapacity: OrganizationCapacityItem[];
}

export interface AdminUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roles: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  universityId?: { _id: string; name: string; shortName?: string; code?: string } | null;
  organizationId?: { _id: string; name: string; type?: string } | null;
  studentId?: { _id: string; studentNumber?: string; programme?: string } | null;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUniversity {
  _id: string;
  name: string;
  officialName?: string;
  code: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  accreditationNumber?: string;
  accreditationStatus?: string;
  capacity: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  studentsCount?: number;
  applicationsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUniversityDetail {
  university: AdminUniversity;
  stats: {
    studentsCount: number;
    applicationsCount: number;
    activePlacementsCount: number;
  };
  administrators: AdminUser[];
  recentApplications: any[];
}

export interface AdminOrganization {
  _id: string;
  name: string;
  legalName?: string;
  type: string;
  registrationNumber?: string;
  accreditationNumber?: string;
  accreditationStatus?: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  capacity: number;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  occupiedSlots?: number;
  availableSlots?: number;
  utilizationPercentage?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrganizationDetail {
  organization: AdminOrganization;
  capacityStats: {
    capacity: number;
    occupiedSlots: number;
    availableSlots: number;
    utilizationPercentage: number;
  };
  supervisors: any[];
  staff: AdminUser[];
  activePlacements: any[];
}

export interface AdminSupervisor {
  _id: string;
  userId: AdminUser;
  organizationId: AdminOrganization;
  departmentId?: { _id: string; name: string } | null;
  licenseNumber?: string;
  qualification?: string;
  yearsOfExperience?: number;
  verified: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  assignedTraineesCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogItem {
  _id: string;
  actorId: { _id: string; firstName: string; lastName: string; email: string; roles: string[] };
  actorEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AdminStudent {
  _id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: string;
  nationality?: string;
  passportNumber?: string;
  university: { _id: string; name: string; code?: string };
  studyYear: string;
  specialty: string;
  status: 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'INACTIVE';
  applicationStatus: 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED';
  nominationDate?: string;
  documentsCount?: number;
  documentsVerified?: boolean;
  paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING' | 'WAIVED';
  totalFees?: number;
  paidFees?: number;
  visaStatus: 'NOT_REQUIRED' | 'APPLIED' | 'EMBASSY_PROCESSING' | 'GRANTED' | 'REJECTED';
  visaReference?: string;
  residenceStatus: 'NOT_REQUIRED' | 'COORDINATING' | 'CONFIRMED' | 'CHECKED_IN';
  residenceAddress?: string;
  hospitalPlacement: { _id?: string; name: string; department?: string; cityCountry?: string };
  assignedSupervisor?: { name: string; title: string; email?: string; phone?: string };
  rotationSchedule?: string;
  startDate: string;
  endDate: string;
  durationWeeks: number;
  attendancePercent: number;
  attendanceDays: { attended: number; total: number };
  logbookSigned: number;
  logbookRequired: number;
  evaluationScore: number | null;
  evaluationGrade: string | null;
  evaluationStatus: 'PENDING' | 'MID_TERM_COMPLETED' | 'FINAL_COMPLETED';
  completionStatus: 'IN_PROGRESS' | 'SATISFACTORY' | 'DISTINCTION' | 'INCOMPLETE';
  certificateIssued: boolean;
  certificateCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStudentJourney {
  student: AdminStudent;
  timeline: {
    stage: string;
    title: string;
    description: string;
    status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'FLAGGED';
    date?: string;
    actor?: string;
  }[];
  documents: {
    name: string;
    type: string;
    uploadedAt: string;
    status: 'VERIFIED' | 'PENDING' | 'REJECTED';
    url?: string;
  }[];
  financials: {
    studentFeeDue: number;
    studentFeePaid: number;
    currency: string;
    status: 'PAID' | 'PARTIAL' | 'PENDING';
    invoiceNumber: string;
    receipts: { date: string; amount: number; reference: string }[];
  };
  attendanceLog: {
    date: string;
    department: string;
    supervisor: string;
    status: 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE';
    hours: number;
  }[];
  logbookEntries: {
    date: string;
    procedure: string;
    category: string;
    role: 'PERFORMED' | 'ASSISTED' | 'OBSERVED';
    supervisorStatus: 'APPROVED' | 'PENDING' | 'REVISION_REQUESTED';
  }[];
  evaluation: {
    clinicalKnowledge: number;
    practicalSkills: number;
    professionalism: number;
    patientCare: number;
    overallGrade: string;
    supervisorRemarks: string;
    completedAt?: string;
  };
}
