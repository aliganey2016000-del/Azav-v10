import { UserRole, PlacementStatus } from '../types/index.js';

export interface MemoryUser {
  _id: string;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roles: UserRole[];
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  universityId?: any;
  organizationId?: any;
  studentId?: any;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryUniversity {
  _id: string;
  id: string;
  name: string;
  officialName?: string;
  shortName: string;
  abbreviation?: string;
  code: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  notes?: string;
  accreditationNumber?: string;
  accreditationStatus?: string;
  capacity: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  studentsCount?: number;
  applicationsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryOrganization {
  _id: string;
  id: string;
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
  state?: string;
  country?: string;
  postalCode?: string;
  notes?: string;
  capacity: number;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  occupiedSlots?: number;
  availableSlots?: number;
  utilizationPercentage?: number;
  departments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MemorySupervisor {
  _id: string;
  id: string;
  userId: any;
  organizationId: any;
  department: string;
  specialty: string;
  licenseNumber: string;
  qualification: string;
  status: 'ACTIVE' | 'INACTIVE';
  verified: boolean;
  activeAttachmentsCount: number;
  totalTraineesSupervised: number;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryAuditLog {
  _id: string;
  id: string;
  actorId?: any;
  actorEmail?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// Initial Seed Universities
export const memoryUniversities: MemoryUniversity[] = [
  {
    _id: 'seed-uni-harvard-01',
    id: 'seed-uni-harvard-01',
    name: 'Harvard Medical School',
    officialName: 'Harvard University - Faculty of Medicine',
    shortName: 'HMS',
    code: 'HMS-001',
    email: 'admin@hms.harvard.edu',
    phone: '+1 617-432-1000',
    website: 'https://hms.harvard.edu',
    address: '25 Shattuck Street',
    city: 'Boston',
    country: 'United States',
    accreditationNumber: 'LCME-US-9821',
    accreditationStatus: 'ACCREDITED',
    capacity: 150,
    status: 'ACTIVE',
    studentsCount: 42,
    applicationsCount: 28,
    createdAt: new Date('2025-01-10').toISOString(),
    updatedAt: new Date('2025-01-10').toISOString(),
  },
  {
    _id: 'seed-uni-oxford-02',
    id: 'seed-uni-oxford-02',
    name: 'Oxford University Medical Sciences',
    officialName: 'University of Oxford Medical Sciences Division',
    shortName: 'OXF',
    code: 'OXF-002',
    email: 'admissions@medsci.ox.ac.uk',
    phone: '+44 1865 270000',
    website: 'https://medsci.ox.ac.uk',
    address: 'John Radcliffe Hospital',
    city: 'Oxford',
    country: 'United Kingdom',
    accreditationNumber: 'GMC-UK-4412',
    accreditationStatus: 'ACCREDITED',
    capacity: 120,
    status: 'ACTIVE',
    studentsCount: 35,
    applicationsCount: 19,
    createdAt: new Date('2025-02-15').toISOString(),
    updatedAt: new Date('2025-02-15').toISOString(),
  },
  {
    _id: 'seed-uni-nairobi-03',
    id: 'seed-uni-nairobi-03',
    name: 'University of Nairobi Faculty of Health Sciences',
    officialName: 'University of Nairobi College of Health Sciences',
    shortName: 'UON',
    code: 'UON-003',
    email: 'fhs@uonbi.ac.ke',
    phone: '+254 20 4910000',
    website: 'https://healthsciences.uonbi.ac.ke',
    address: 'Kenyatta National Hospital Campus',
    city: 'Nairobi',
    country: 'Kenya',
    accreditationNumber: 'KMPDC-KE-012',
    accreditationStatus: 'ACCREDITED',
    capacity: 200,
    status: 'ACTIVE',
    studentsCount: 68,
    applicationsCount: 52,
    createdAt: new Date('2025-03-01').toISOString(),
    updatedAt: new Date('2025-03-01').toISOString(),
  },
];

// Initial Seed Organizations
export const memoryOrganizations: MemoryOrganization[] = [
  {
    _id: 'seed-org-mgh-01',
    id: 'seed-org-mgh-01',
    name: 'Massachusetts General Hospital',
    legalName: 'The General Hospital Corporation',
    type: 'Tertiary Academic Medical Center',
    registrationNumber: 'HOSP-MA-00182',
    accreditationNumber: 'JCAHO-99412',
    accreditationStatus: 'GOLD_ACCREDITED',
    contactEmail: 'attachments@massgeneral.org',
    contactPhone: '+1 617-726-2000',
    website: 'https://massgeneral.org',
    address: '55 Fruit Street',
    city: 'Boston',
    country: 'United States',
    capacity: 40,
    occupiedSlots: 26,
    availableSlots: 14,
    utilizationPercentage: 65,
    description: 'World-renowned teaching hospital affiliated with Harvard Medical School.',
    status: 'ACTIVE',
    departments: ['General Surgery', 'Internal Medicine', 'Cardiology', 'Pediatrics', 'Trauma & Emergency'],
    createdAt: new Date('2025-01-12').toISOString(),
    updatedAt: new Date('2025-01-12').toISOString(),
  },
  {
    _id: 'seed-org-knh-02',
    id: 'seed-org-knh-02',
    name: 'Kenyatta National Referral & Teaching Hospital',
    legalName: 'Kenyatta National Hospital Board',
    type: 'National Referral Hospital',
    registrationNumber: 'KNH-GOV-001',
    accreditationNumber: 'KMPDC-REF-001',
    accreditationStatus: 'ACCREDITED',
    contactEmail: 'clinicaltraining@knh.or.ke',
    contactPhone: '+254 20 2726300',
    website: 'https://knh.or.ke',
    address: 'Hospital Road, Upper Hill',
    city: 'Nairobi',
    country: 'Kenya',
    capacity: 60,
    occupiedSlots: 45,
    availableSlots: 15,
    utilizationPercentage: 75,
    description: 'Premier clinical teaching and referral hospital in East and Central Africa.',
    status: 'ACTIVE',
    departments: ['Obstetrics & Gynecology', 'Orthopedics', 'Pediatrics', 'Critical Care', 'Pathology'],
    createdAt: new Date('2025-02-01').toISOString(),
    updatedAt: new Date('2025-02-01').toISOString(),
  },
];

// Initial Seed Users
export const memoryUsers: MemoryUser[] = [
  {
    _id: 'seed-super-admin-01',
    id: 'seed-super-admin-01',
    firstName: 'Global',
    lastName: 'SuperAdmin',
    email: 'admin@azaammedics.org',
    phone: '+1 800-555-0199',
    roles: [UserRole.SUPER_ADMIN],
    status: 'ACTIVE',
    createdAt: new Date('2025-01-01').toISOString(),
    updatedAt: new Date('2025-01-01').toISOString(),
  },
  {
    _id: 'seed-staff-01',
    id: 'seed-staff-01',
    firstName: 'Azaam',
    lastName: 'StaffOfficer',
    email: 'staff@azaammedics.org',
    phone: '+1 800-555-0188',
    roles: [UserRole.AZAAM_STAFF],
    status: 'ACTIVE',
    createdAt: new Date('2025-01-05').toISOString(),
    updatedAt: new Date('2025-01-05').toISOString(),
  },
  {
    _id: 'seed-uni-admin-01',
    id: 'seed-uni-admin-01',
    firstName: 'Harvard',
    lastName: 'DeanOfMedicine',
    email: 'admin@hms.harvard.edu',
    phone: '+1 617-432-1100',
    roles: [UserRole.UNIVERSITY_ADMIN],
    universityId: { _id: 'seed-uni-harvard-01', name: 'Harvard Medical School', shortName: 'HMS' },
    status: 'ACTIVE',
    createdAt: new Date('2025-01-10').toISOString(),
    updatedAt: new Date('2025-01-10').toISOString(),
  },
  {
    _id: 'seed-org-admin-01',
    id: 'seed-org-admin-01',
    firstName: 'MassGen',
    lastName: 'TrainingDirector',
    email: 'admin@massgeneral.org',
    phone: '+1 617-726-2100',
    roles: [UserRole.ORGANIZATION_ADMIN],
    organizationId: { _id: 'seed-org-mgh-01', name: 'Massachusetts General Hospital', type: 'Tertiary Academic Medical Center' },
    status: 'ACTIVE',
    createdAt: new Date('2025-01-12').toISOString(),
    updatedAt: new Date('2025-01-12').toISOString(),
  },
  {
    _id: 'seed-supervisor-01',
    id: 'seed-supervisor-01',
    firstName: 'Dr. Sarah',
    lastName: 'Jenkins',
    email: 'sjenkins@massgeneral.org',
    phone: '+1 617-726-4433',
    roles: [UserRole.CLINICAL_SUPERVISOR],
    organizationId: { _id: 'seed-org-mgh-01', name: 'Massachusetts General Hospital', type: 'Tertiary Academic Medical Center' },
    status: 'ACTIVE',
    createdAt: new Date('2025-01-15').toISOString(),
    updatedAt: new Date('2025-01-15').toISOString(),
  },
  {
    _id: 'seed-student-01',
    id: 'seed-student-01',
    firstName: 'John',
    lastName: 'Kiprotich',
    email: 'student.harvard@azaammedics.org',
    phone: '+1 617-555-4321',
    roles: [UserRole.STUDENT],
    universityId: { _id: 'seed-uni-harvard-01', name: 'Harvard Medical School', shortName: 'HMS' },
    status: 'ACTIVE',
    createdAt: new Date('2025-02-01').toISOString(),
    updatedAt: new Date('2025-02-01').toISOString(),
  },
  {
    _id: 'seed-ind-student-01',
    id: 'seed-ind-student-01',
    firstName: 'Dr. Amina',
    lastName: 'Hassan',
    email: 'independent.student@azaammedics.org',
    phone: '+254 711 234567',
    roles: [UserRole.INDEPENDENT_APPLICANT],
    status: 'ACTIVE',
    createdAt: new Date('2025-02-10').toISOString(),
    updatedAt: new Date('2025-02-10').toISOString(),
  },
];

// Initial Seed Supervisors
export const memorySupervisors: MemorySupervisor[] = [
  {
    _id: 'seed-supervisor-profile-01',
    id: 'seed-supervisor-profile-01',
    userId: {
      _id: 'seed-supervisor-01',
      firstName: 'Dr. Sarah',
      lastName: 'Jenkins',
      email: 'sjenkins@massgeneral.org',
      phone: '+1 617-726-4433',
    },
    organizationId: {
      _id: 'seed-org-mgh-01',
      name: 'Massachusetts General Hospital',
    },
    department: 'General Surgery & Trauma',
    specialty: 'Trauma Surgery',
    licenseNumber: 'MD-MA-489921',
    qualification: 'MD, FACS, Board Certified Surgeon',
    status: 'ACTIVE',
    verified: true,
    activeAttachmentsCount: 4,
    totalTraineesSupervised: 28,
    createdAt: new Date('2025-01-15').toISOString(),
    updatedAt: new Date('2025-01-15').toISOString(),
  },
];

// Initial Seed Audit Logs
export const memoryAuditLogs: MemoryAuditLog[] = [
  {
    _id: 'seed-audit-01',
    id: 'seed-audit-01',
    actorId: {
      _id: 'seed-super-admin-01',
      firstName: 'Global',
      lastName: 'SuperAdmin',
      email: 'admin@azaammedics.org',
      roles: [UserRole.SUPER_ADMIN],
    },
    actorEmail: 'admin@azaammedics.org',
    action: 'SYSTEM_BOOT',
    entityType: 'System',
    entityId: 'azaam-platform',
    metadata: { environment: 'production-ready', mode: 'High-Availability' },
    ipAddress: '127.0.0.1',
    userAgent: 'AZAAM Cloud Runner',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: 'seed-audit-02',
    id: 'seed-audit-02',
    actorId: {
      _id: 'seed-super-admin-01',
      firstName: 'Global',
      lastName: 'SuperAdmin',
      email: 'admin@azaammedics.org',
      roles: [UserRole.SUPER_ADMIN],
    },
    actorEmail: 'admin@azaammedics.org',
    action: 'USER_LOGIN',
    entityType: 'User',
    entityId: 'seed-super-admin-01',
    metadata: { role: 'SUPER_ADMIN' },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 Chrome/122.0',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
];
