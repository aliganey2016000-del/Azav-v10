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
