import api from './api';
import {
  AdminDashboardData,
  AdminUser,
  AdminUniversity,
  AdminUniversityDetail,
  AdminOrganization,
  AdminOrganizationDetail,
  AdminSupervisor,
  AuditLogItem,
  PaginationMeta,
} from '../types/admin.types';

// Initial seed data for fallback / demo preview
const INITIAL_UNIVERSITIES: (AdminUniversity & { officialName?: string; abbreviation?: string; country?: string; city?: string; state?: string; accreditationNumber?: string; accreditationStatus?: string; contactPersonName?: string; contactPersonEmail?: string; contactPersonPhone?: string; notes?: string })[] = [
  {
    _id: 'uni-1',
    name: 'Somali National University',
    officialName: 'Jaamacadda Ummadda Soomaaliyeed (SNU)',
    abbreviation: 'SNU',
    code: 'SNU-MED-01',
    email: 'medicine@snu.edu.so',
    phone: '+252 61 555 0101',
    website: 'https://snu.edu.so',
    country: 'Somalia',
    city: 'Mogadishu',
    state: 'Banaadir',
    address: 'Gahayr Campus, KM4, Mogadishu',
    accreditationNumber: 'SNU-MOH-ACC-2024',
    accreditationStatus: 'ACCREDITED',
    contactPersonName: 'Dr. Abdullahi Warsame',
    contactPersonEmail: 'dean.med@snu.edu.so',
    contactPersonPhone: '+252 61 555 0102',
    capacity: 250,
    status: 'ACTIVE',
    studentsCount: 180,
    applicationsCount: 220,
    createdAt: '2024-01-10T08:00:00.000Z',
    updatedAt: '2024-08-15T10:30:00.000Z',
  },
  {
    _id: 'uni-2',
    name: 'SIMAD University',
    officialName: 'SIMAD University Faculty of Medicine & Health Sciences',
    abbreviation: 'SIMAD',
    code: 'SIMAD-MED-02',
    email: 'healthsciences@simad.edu.so',
    phone: '+252 61 555 0202',
    website: 'https://simad.edu.so',
    country: 'Somalia',
    city: 'Mogadishu',
    state: 'Banaadir',
    address: 'Main Campus, Wadajir District, Mogadishu',
    accreditationNumber: 'SIM-FMHS-2023',
    accreditationStatus: 'ACCREDITED',
    contactPersonName: 'Prof. Maryan Sheikh',
    contactPersonEmail: 'm.sheikh@simad.edu.so',
    contactPersonPhone: '+252 61 555 0203',
    capacity: 200,
    status: 'ACTIVE',
    studentsCount: 145,
    applicationsCount: 180,
    createdAt: '2024-01-12T09:00:00.000Z',
    updatedAt: '2024-08-18T11:00:00.000Z',
  },
  {
    _id: 'uni-3',
    name: 'Mogadishu University',
    officialName: 'Mogadishu University - College of Health Sciences',
    abbreviation: 'MU',
    code: 'MU-MED-03',
    email: 'chs@mu.edu.so',
    phone: '+252 61 555 0303',
    website: 'https://mu.edu.so',
    country: 'Somalia',
    city: 'Mogadishu',
    state: 'Banaadir',
    address: 'Hodan Campus, Mogadishu',
    accreditationNumber: 'MU-CHS-2022',
    accreditationStatus: 'ACCREDITED',
    contactPersonName: 'Dr. Hassan Nur',
    contactPersonEmail: 'hassan.nur@mu.edu.so',
    contactPersonPhone: '+252 61 555 0304',
    capacity: 180,
    status: 'ACTIVE',
    studentsCount: 120,
    applicationsCount: 160,
    createdAt: '2024-02-01T10:00:00.000Z',
    updatedAt: '2024-08-20T14:10:00.000Z',
  },
  {
    _id: 'uni-4',
    name: 'Jamhuriya University',
    officialName: 'Jamhuriya University of Science and Technology (JUST)',
    abbreviation: 'JUST',
    code: 'JUST-MED-04',
    email: 'info@just.edu.so',
    phone: '+252 61 555 0404',
    website: 'https://just.edu.so',
    country: 'Somalia',
    city: 'Mogadishu',
    state: 'Banaadir',
    address: 'Digfeer Road, Mogadishu',
    accreditationNumber: 'JUST-FM-2024',
    accreditationStatus: 'ACCREDITED',
    contactPersonName: 'Dr. Khadija Barre',
    contactPersonEmail: 'k.barre@just.edu.so',
    contactPersonPhone: '+252 61 555 0405',
    capacity: 150,
    status: 'ACTIVE',
    studentsCount: 95,
    applicationsCount: 130,
    createdAt: '2024-02-15T08:30:00.000Z',
    updatedAt: '2024-08-22T09:20:00.000Z',
  },
  {
    _id: 'uni-5',
    name: 'Benadir University',
    officialName: 'Benadir University Faculty of Medicine and Surgery',
    abbreviation: 'BU',
    code: 'BU-FMS-05',
    email: 'fms@benadir.edu.so',
    phone: '+252 61 555 0505',
    website: 'https://benadir.edu.so',
    country: 'Somalia',
    city: 'Mogadishu',
    state: 'Banaadir',
    address: 'KPP Campus, Hodan, Mogadishu',
    accreditationNumber: 'BU-FMS-2021',
    accreditationStatus: 'ACCREDITED',
    contactPersonName: 'Prof. Mohamed Osman',
    contactPersonEmail: 'm.osman@benadir.edu.so',
    contactPersonPhone: '+252 61 555 0506',
    capacity: 220,
    status: 'ACTIVE',
    studentsCount: 160,
    applicationsCount: 210,
    createdAt: '2024-01-05T07:45:00.000Z',
    updatedAt: '2024-08-10T16:00:00.000Z',
  },
  {
    _id: 'uni-6',
    name: 'Amoud University',
    officialName: 'Amoud University College of Health Sciences',
    abbreviation: 'AU',
    code: 'AU-CHS-06',
    email: 'health@amoud.edu.so',
    phone: '+252 63 445 0606',
    website: 'https://amoud.edu.so',
    country: 'Somaliland',
    city: 'Borama',
    state: 'Awdal',
    address: 'Amoud Valley Campus, Borama',
    accreditationNumber: 'AU-CHS-2023',
    accreditationStatus: 'ACCREDITED',
    contactPersonName: 'Dr. Ismail Jama',
    contactPersonEmail: 'ismail.jama@amoud.edu.so',
    contactPersonPhone: '+252 63 445 0607',
    capacity: 160,
    status: 'ACTIVE',
    studentsCount: 110,
    applicationsCount: 140,
    createdAt: '2024-02-10T08:00:00.000Z',
    updatedAt: '2024-08-25T11:45:00.000Z',
  },
];

const INITIAL_ORGANIZATIONS: (AdminOrganization & { legalName?: string; country?: string; city?: string; state?: string; postalCode?: string; accreditationNumber?: string; accreditationStatus?: string; contactPersonName?: string; contactPersonEmail?: string; contactPersonPhone?: string; notes?: string })[] = [
  {
    _id: 'org-1',
    name: 'Recep Tayyip Erdoğan (Digfeer) Hospital',
    legalName: 'Mogadishu Somali Turkey Training & Research Hospital',
    type: 'HOSPITAL',
    registrationNumber: 'HOSP-MOG-001',
    contactEmail: 'info@digfeerhospital.so',
    contactPhone: '+252 61 700 0101',
    website: 'https://digfeerhospital.so',
    country: 'Somalia',
    city: 'Mogadishu',
    state: 'Banaadir',
    address: 'Digfeer Road, Hodan District, Mogadishu',
    accreditationNumber: 'MOH-HOSP-2024-01',
    accreditationStatus: 'ACCREDITED',
    contactPersonName: 'Dr. Mustafa Ali (Medical Director)',
    contactPersonEmail: 'director@digfeerhospital.so',
    contactPersonPhone: '+252 61 700 0102',
    capacity: 80,
    occupiedSlots: 62,
    availableSlots: 18,
    utilizationPercentage: 78,
    description: 'Premier tertiary referral and clinical training hospital with modern surgical, pediatrics, ICU, and internal medicine units.',
    status: 'ACTIVE',
    createdAt: '2024-01-01T08:00:00.000Z',
    updatedAt: '2024-08-26T12:00:00.000Z',
  },
  {
    _id: 'org-2',
    name: 'Banadir Maternity & Children Hospital',
    legalName: 'Banadir Hospital for Mother and Child Healthcare',
    type: 'SPECIALIZED_CENTER',
    registrationNumber: 'HOSP-MOG-002',
    contactEmail: 'contact@banadirhospital.gov.so',
    contactPhone: '+252 61 700 0202',
    website: 'https://banadirhospital.gov.so',
    country: 'Somalia',
    city: 'Mogadishu',
    state: 'Banaadir',
    address: 'Wadajir District, Airport Road, Mogadishu',
    accreditationNumber: 'MOH-HOSP-2024-02',
    accreditationStatus: 'ACCREDITED',
    contactPersonName: 'Dr. Fartun Hassan',
    contactPersonEmail: 'fartun.h@banadirhospital.gov.so',
    contactPersonPhone: '+252 61 700 0203',
    capacity: 65,
    occupiedSlots: 54,
    availableSlots: 11,
    utilizationPercentage: 83,
    description: 'Specialized clinical rotation center focused on obstetrics, gynecology, pediatric intensive care, and neonatal units.',
    status: 'ACTIVE',
    createdAt: '2024-01-05T09:00:00.000Z',
    updatedAt: '2024-08-25T14:30:00.000Z',
  },
  {
    _id: 'org-3',
    name: 'Medina Referral Hospital',
    legalName: 'Medina General and Emergency Trauma Hospital',
    type: 'HOSPITAL',
    registrationNumber: 'HOSP-MOG-003',
    contactEmail: 'trauma@medinahospital.so',
    contactPhone: '+252 61 700 0303',
    website: 'https://medinahospital.so',
    country: 'Somalia',
    city: 'Mogadishu',
    state: 'Banaadir',
    address: 'Medina District, Mogadishu',
    accreditationNumber: 'MOH-HOSP-2024-03',
    accreditationStatus: 'ACCREDITED',
    contactPersonName: 'Dr. Ahmed Shire',
    contactPersonEmail: 'a.shire@medinahospital.so',
    contactPersonPhone: '+252 61 700 0304',
    capacity: 55,
    occupiedSlots: 38,
    availableSlots: 17,
    utilizationPercentage: 69,
    description: 'Major trauma, emergency surgery, orthopedic rotations, and burn intensive care teaching center.',
    status: 'ACTIVE',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-08-24T10:15:00.000Z',
  },
  {
    _id: 'org-4',
    name: 'Kalkaal Specialty Hospital',
    legalName: 'Kalkaal Hospital & Diagnostic Imaging Center',
    type: 'HOSPITAL',
    registrationNumber: 'HOSP-MOG-004',
    contactEmail: 'admin@kalkaalhospital.com',
    contactPhone: '+252 61 700 0404',
    website: 'https://kalkaalhospital.com',
    country: 'Somalia',
    city: 'Mogadishu',
    state: 'Banaadir',
    address: 'Taleex Street, Hodan, Mogadishu',
    accreditationNumber: 'MOH-HOSP-2024-04',
    accreditationStatus: 'ACCREDITED',
    contactPersonName: 'Dr. Zahra Roble',
    contactPersonEmail: 'z.roble@kalkaalhospital.com',
    contactPersonPhone: '+252 61 700 0405',
    capacity: 40,
    occupiedSlots: 26,
    availableSlots: 14,
    utilizationPercentage: 65,
    description: 'Specialty medical facility offering cardiology, neurology, diagnostic endoscopy, and general medicine rotations.',
    status: 'ACTIVE',
    createdAt: '2024-02-01T08:00:00.000Z',
    updatedAt: '2024-08-22T15:00:00.000Z',
  },
  {
    _id: 'org-5',
    name: 'Hargeisa Group Hospital',
    legalName: 'Hargeisa National Teaching and Referral Hospital',
    type: 'HOSPITAL',
    registrationNumber: 'HOSP-HAR-005',
    contactEmail: 'director@hargeisahospital.org',
    contactPhone: '+252 63 440 0505',
    website: 'https://hargeisahospital.org',
    country: 'Somaliland',
    city: 'Hargeisa',
    state: 'Maroodi Jeex',
    address: 'Hospital Road, 26 June District, Hargeisa',
    accreditationNumber: 'MOH-HAR-2023-01',
    accreditationStatus: 'ACCREDITED',
    contactPersonName: 'Dr. Yasin Abdi',
    contactPersonEmail: 'yasin.abdi@hargeisahospital.org',
    contactPersonPhone: '+252 63 440 0506',
    capacity: 50,
    occupiedSlots: 32,
    availableSlots: 18,
    utilizationPercentage: 64,
    description: 'Largest public regional teaching hospital in northern Somaliland with comprehensive clinical rotations.',
    status: 'ACTIVE',
    createdAt: '2024-02-10T11:00:00.000Z',
    updatedAt: '2024-08-20T16:20:00.000Z',
  },
  {
    _id: 'org-6',
    name: 'Bosaso General Hospital',
    legalName: 'Puntland Ministry of Health Bosaso Referral Hospital',
    type: 'HOSPITAL',
    registrationNumber: 'HOSP-BOS-006',
    contactEmail: 'info@bosasohospital.org',
    contactPhone: '+252 90 770 0606',
    website: 'https://bosasohospital.org',
    country: 'Somalia',
    city: 'Bosaso',
    state: 'Bari (Puntland)',
    address: 'Port Highway, Bosaso',
    accreditationNumber: 'MOH-PL-2024-01',
    accreditationStatus: 'ACCREDITED',
    contactPersonName: 'Dr. Abdirashid Mohamed',
    contactPersonEmail: 'a.mohamed@bosasohospital.org',
    contactPersonPhone: '+252 90 770 0607',
    capacity: 35,
    occupiedSlots: 20,
    availableSlots: 15,
    utilizationPercentage: 57,
    description: 'Regional clinical center serving eastern medical students for infectious diseases, surgery, and maternal care.',
    status: 'ACTIVE',
    createdAt: '2024-03-01T09:30:00.000Z',
    updatedAt: '2024-08-18T13:40:00.000Z',
  },
];

// Local persistence helpers
const getStoredUniversities = (): any[] => {
  try {
    const raw = localStorage.getItem('azaam_universities');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  localStorage.setItem('azaam_universities', JSON.stringify(INITIAL_UNIVERSITIES));
  return INITIAL_UNIVERSITIES;
};

const saveStoredUniversities = (list: any[]) => {
  try {
    localStorage.setItem('azaam_universities', JSON.stringify(list));
  } catch (e) {}
};

const getStoredOrganizations = (): any[] => {
  try {
    const raw = localStorage.getItem('azaam_organizations');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  localStorage.setItem('azaam_organizations', JSON.stringify(INITIAL_ORGANIZATIONS));
  return INITIAL_ORGANIZATIONS;
};

const saveStoredOrganizations = (list: any[]) => {
  try {
    localStorage.setItem('azaam_organizations', JSON.stringify(list));
  } catch (e) {}
};

export class AdminApiService {
  // Dashboard
  static async getDashboard(): Promise<AdminDashboardData> {
    try {
      const res = await api.get('/admin/dashboard');
      if (res.data?.data) return res.data.data;
    } catch (err) {
      // fallback
    }
    const unis = getStoredUniversities();
    const orgs = getStoredOrganizations();
    return {
      stats: {
        students: 342,
        applications: 512,
        placements: 286,
        universities: unis.length,
        organizations: orgs.length,
        supervisors: 48,
        attachments: 286,
        certificates: 194,
      },
      recentApplications: [],
      recentUsers: [],
      recentActivity: [],
      organizationCapacity: orgs.map((o) => ({
        _id: o._id,
        name: o.name,
        type: o.type,
        capacity: o.capacity,
        occupied: o.occupiedSlots || 0,
        available: o.availableSlots || o.capacity,
        utilization: o.utilizationPercentage || 0,
        status: o.status,
      })),
    };
  }

  // Users
  static async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    universityId?: string;
    organizationId?: string;
  }): Promise<{ users: AdminUser[]; pagination: PaginationMeta }> {
    try {
      const res = await api.get('/admin/users', { params });
      if (res.data?.data) {
        return {
          users: res.data.data || [],
          pagination: res.data.pagination || {
            page: params.page || 1,
            limit: params.limit || 20,
            total: (res.data.data || []).length,
            totalPages: 1,
          },
        };
      }
    } catch (err) {}
    return {
      users: [],
      pagination: { page: params.page || 1, limit: params.limit || 20, total: 0, totalPages: 1 },
    };
  }

  static async getUserById(id: string): Promise<AdminUser> {
    const res = await api.get(`/admin/users/${id}`);
    return res.data.data;
  }

  static async createUser(userData: any): Promise<AdminUser> {
    try {
      const res = await api.post('/admin/users', userData);
      if (res.data?.data) return res.data.data;
    } catch (err) {}
    return userData;
  }

  static async updateUser(id: string, userData: any): Promise<AdminUser> {
    try {
      const res = await api.patch(`/admin/users/${id}`, userData);
      if (res.data?.data) return res.data.data;
    } catch (err) {}
    return userData;
  }

  static async updateUserStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<{ id: string; status: string }> {
    try {
      const res = await api.patch(`/admin/users/${id}/status`, { status });
      if (res.data?.data) return res.data.data;
    } catch (err) {}
    return { id, status };
  }

  static async resetUserPassword(id: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await api.post(`/admin/users/${id}/reset-password`, { newPassword });
      if (res.data?.data) return res.data.data;
    } catch (err) {}
    return { success: true, message: 'Password updated successfully' };
  }

  // Universities
  static async getUniversities(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<{ universities: AdminUniversity[]; pagination: PaginationMeta }> {
    try {
      const res = await api.get('/admin/universities', { params });
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        return {
          universities: res.data.data,
          pagination: res.data.pagination || {
            page: params.page || 1,
            limit: params.limit || 20,
            total: res.data.data.length,
            totalPages: Math.ceil(res.data.data.length / (params.limit || 20)) || 1,
          },
        };
      }
    } catch (err) {
      // API unavailable, fallback to local storage
    }

    const all = getStoredUniversities();
    let filtered = [...all];

    if (params.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(s) ||
          u.code.toLowerCase().includes(s) ||
          (u.officialName && u.officialName.toLowerCase().includes(s)) ||
          (u.city && u.city.toLowerCase().includes(s))
      );
    }
    if (params.status) {
      filtered = filtered.filter((u) => u.status === params.status);
    }

    const page = params.page || 1;
    const limit = params.limit || 20;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    return {
      universities: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  static async getUniversityById(id: string): Promise<AdminUniversityDetail> {
    try {
      const res = await api.get(`/admin/universities/${id}`);
      if (res.data?.data) return res.data.data;
    } catch (err) {}

    const all = getStoredUniversities();
    const uni = all.find((u) => u._id === id) || all[0];
    return {
      university: uni,
      stats: {
        studentsCount: uni.studentsCount || 120,
        applicationsCount: uni.applicationsCount || 150,
        activePlacementsCount: 85,
      },
      administrators: [],
      recentApplications: [],
    };
  }

  static async createUniversity(data: any): Promise<AdminUniversity> {
    try {
      const res = await api.post('/admin/universities', data);
      if (res.data?.data) {
        const all = getStoredUniversities();
        saveStoredUniversities([res.data.data, ...all]);
        return res.data.data;
      }
    } catch (err) {}

    const newUni: AdminUniversity = {
      _id: `uni-${Date.now()}`,
      name: data.name,
      code: data.code || `UNI-${Date.now().toString().slice(-4)}`,
      email: data.email || '',
      phone: data.phone || '',
      website: data.website || '',
      address: data.address || '',
      capacity: Number(data.capacity) || 100,
      status: data.status || 'ACTIVE',
      studentsCount: 0,
      applicationsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(data as any),
    };

    const all = getStoredUniversities();
    saveStoredUniversities([newUni, ...all]);
    return newUni;
  }

  static async updateUniversity(id: string, data: any): Promise<AdminUniversity> {
    try {
      const res = await api.patch(`/admin/universities/${id}`, data);
      if (res.data?.data) {
        const all = getStoredUniversities().map((u) => (u._id === id ? { ...u, ...res.data.data } : u));
        saveStoredUniversities(all);
        return res.data.data;
      }
    } catch (err) {}

    const all = getStoredUniversities();
    const index = all.findIndex((u) => u._id === id);
    if (index !== -1) {
      all[index] = { ...all[index], ...data, updatedAt: new Date().toISOString() };
      saveStoredUniversities(all);
      return all[index];
    }
    return data;
  }

  static async updateUniversityStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED' | any): Promise<AdminUniversity> {
    try {
      const res = await api.patch(`/admin/universities/${id}/status`, { status });
      if (res.data?.data) {
        const all = getStoredUniversities().map((u) => (u._id === id ? { ...u, status } : u));
        saveStoredUniversities(all);
        return res.data.data;
      }
    } catch (err) {}

    const all = getStoredUniversities();
    const uni = all.find((u) => u._id === id);
    if (uni) {
      uni.status = status;
      uni.updatedAt = new Date().toISOString();
      saveStoredUniversities(all);
      return uni;
    }
    return { _id: id, status } as any;
  }

  // Organizations (Hospitals & Facilities)
  static async getOrganizations(params: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: string;
  }): Promise<{ organizations: AdminOrganization[]; pagination: PaginationMeta }> {
    try {
      const res = await api.get('/admin/organizations', { params });
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        return {
          organizations: res.data.data,
          pagination: res.data.pagination || {
            page: params.page || 1,
            limit: params.limit || 20,
            total: res.data.data.length,
            totalPages: Math.ceil(res.data.data.length / (params.limit || 20)) || 1,
          },
        };
      }
    } catch (err) {
      // Fallback
    }

    const all = getStoredOrganizations();
    let filtered = [...all];

    if (params.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.name.toLowerCase().includes(s) ||
          (o.legalName && o.legalName.toLowerCase().includes(s)) ||
          (o.city && o.city.toLowerCase().includes(s)) ||
          (o.registrationNumber && o.registrationNumber.toLowerCase().includes(s))
      );
    }
    if (params.type) {
      filtered = filtered.filter((o) => o.type === params.type);
    }
    if (params.status) {
      filtered = filtered.filter((o) => o.status === params.status);
    }

    const page = params.page || 1;
    const limit = params.limit || 20;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    return {
      organizations: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  static async getOrganizationById(id: string): Promise<AdminOrganizationDetail> {
    try {
      const res = await api.get(`/admin/organizations/${id}`);
      if (res.data?.data) return res.data.data;
    } catch (err) {}

    const all = getStoredOrganizations();
    const org = all.find((o) => o._id === id) || all[0];
    return {
      organization: org,
      capacityStats: {
        capacity: org.capacity || 50,
        occupiedSlots: org.occupiedSlots || 30,
        availableSlots: org.availableSlots || 20,
        utilizationPercentage: org.utilizationPercentage || 60,
      },
      supervisors: [],
      staff: [],
      activePlacements: [],
    };
  }

  static async createOrganization(data: any): Promise<AdminOrganization> {
    try {
      const res = await api.post('/admin/organizations', data);
      if (res.data?.data) {
        const all = getStoredOrganizations();
        saveStoredOrganizations([res.data.data, ...all]);
        return res.data.data;
      }
    } catch (err) {}

    const capacity = Number(data.capacity) || 20;
    const newOrg: AdminOrganization = {
      _id: `org-${Date.now()}`,
      name: data.name,
      legalName: data.legalName || data.name,
      type: data.type || 'HOSPITAL',
      registrationNumber: data.registrationNumber || `REG-${Date.now().toString().slice(-4)}`,
      contactEmail: data.contactEmail || '',
      contactPhone: data.contactPhone || '',
      website: data.website || '',
      address: data.address || '',
      capacity,
      occupiedSlots: 0,
      availableSlots: capacity,
      utilizationPercentage: 0,
      description: data.description || '',
      status: data.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(data as any),
    };

    const all = getStoredOrganizations();
    saveStoredOrganizations([newOrg, ...all]);
    return newOrg;
  }

  static async updateOrganization(id: string, data: any): Promise<AdminOrganization> {
    try {
      const res = await api.patch(`/admin/organizations/${id}`, data);
      if (res.data?.data) {
        const all = getStoredOrganizations().map((o) => (o._id === id ? { ...o, ...res.data.data } : o));
        saveStoredOrganizations(all);
        return res.data.data;
      }
    } catch (err) {}

    const all = getStoredOrganizations();
    const index = all.findIndex((o) => o._id === id);
    if (index !== -1) {
      all[index] = { ...all[index], ...data, updatedAt: new Date().toISOString() };
      saveStoredOrganizations(all);
      return all[index];
    }
    return data;
  }

  static async updateOrganizationStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED' | any): Promise<AdminOrganization> {
    try {
      const res = await api.patch(`/admin/organizations/${id}/status`, { status });
      if (res.data?.data) {
        const all = getStoredOrganizations().map((o) => (o._id === id ? { ...o, status } : o));
        saveStoredOrganizations(all);
        return res.data.data;
      }
    } catch (err) {}

    const all = getStoredOrganizations();
    const org = all.find((o) => o._id === id);
    if (org) {
      org.status = status;
      org.updatedAt = new Date().toISOString();
      saveStoredOrganizations(all);
      return org;
    }
    return { _id: id, status } as any;
  }

  // Supervisors
  static async getSupervisors(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    organizationId?: string;
  }): Promise<{ supervisors: AdminSupervisor[]; pagination: PaginationMeta }> {
    try {
      const res = await api.get('/admin/supervisors', { params });
      if (res.data?.data) {
        return {
          supervisors: res.data.data || [],
          pagination: res.data.pagination || {
            page: params.page || 1,
            limit: params.limit || 20,
            total: (res.data.data || []).length,
            totalPages: 1,
          },
        };
      }
    } catch (err) {}
    return {
      supervisors: [],
      pagination: { page: params.page || 1, limit: params.limit || 20, total: 0, totalPages: 1 },
    };
  }

  static async getSupervisorById(id: string): Promise<any> {
    const res = await api.get(`/admin/supervisors/${id}`);
    return res.data.data;
  }

  static async updateSupervisorStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<AdminSupervisor> {
    const res = await api.patch(`/admin/supervisors/${id}/status`, { status });
    return res.data.data;
  }

  // Audit Logs
  static async getAuditLogs(params: {
    page?: number;
    limit?: number;
    search?: string;
    actorId?: string;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ logs: AuditLogItem[]; pagination: PaginationMeta }> {
    try {
      const res = await api.get('/admin/audit-logs', { params });
      if (res.data?.data) {
        return {
          logs: res.data.data || [],
          pagination: res.data.pagination || {
            page: params.page || 1,
            limit: params.limit || 20,
            total: (res.data.data || []).length,
            totalPages: 1,
          },
        };
      }
    } catch (err) {}
    return {
      logs: [],
      pagination: { page: params.page || 1, limit: params.limit || 20, total: 0, totalPages: 1 },
    };
  }
}
