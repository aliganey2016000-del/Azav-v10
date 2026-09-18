import api from './api';
import {
  AdminDashboardData,
  AdminUser,
  AdminUniversity,
  AdminUniversityDetail,
  AdminOrganization,
  AdminOrganizationDetail,
  AdminSupervisor,
  AdminStudent,
  AdminStudentJourney,
  AdminJourneyStage,
  AuditLogItem,
  PaginationMeta,
  JourneyChatData,
} from '../types/admin.types';

export class AdminApiService {
  // Dashboard — database/API only
  static async getDashboard(): Promise<AdminDashboardData> {
    const res = await api.get('/admin/dashboard');
    return res.data.data;
  }

  // Users — database/API only
  static async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    universityId?: string;
    organizationId?: string;
  }): Promise<{ users: AdminUser[]; pagination: PaginationMeta }> {
    const res = await api.get('/admin/users', { params });
    const users: AdminUser[] = Array.isArray(res.data?.data) ? res.data.data : [];
    return {
      users,
      pagination: res.data?.pagination || {
        page: params.page || 1,
        limit: params.limit || 20,
        total: users.length,
        totalPages: Math.ceil(users.length / (params.limit || 20)) || 1,
      },
    };
  }

  static async getUserById(id: string): Promise<AdminUser> {
    const res = await api.get(`/admin/users/${id}`);
    return res.data.data;
  }

  static async createUser(userData: any): Promise<AdminUser> {
    const res = await api.post('/admin/users', userData);
    return res.data.data;
  }

  static async updateUser(id: string, userData: any): Promise<AdminUser> {
    const res = await api.patch(`/admin/users/${id}`, userData);
    return res.data.data;
  }

  static async updateUserStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<{ id: string; status: string }> {
    const res = await api.patch(`/admin/users/${id}/status`, { status });
    return res.data.data;
  }

  static async resetUserPassword(id: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await api.post(`/admin/users/${id}/reset-password`, { newPassword });
    return res.data.data;
  }

  // Universities — database/API only
  static async getUniversities(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<{ universities: AdminUniversity[]; pagination: PaginationMeta }> {
    const res = await api.get('/admin/universities', { params });
    const universities: AdminUniversity[] = Array.isArray(res.data?.data) ? res.data.data : [];
    return {
      universities,
      pagination: res.data?.pagination || {
        page: params.page || 1,
        limit: params.limit || 20,
        total: universities.length,
        totalPages: Math.ceil(universities.length / (params.limit || 20)) || 1,
      },
    };
  }

  static async getUniversityById(id: string): Promise<AdminUniversityDetail> {
    const res = await api.get(`/admin/universities/${id}`);
    return res.data.data;
  }

  static async createUniversity(data: any): Promise<AdminUniversity> {
    const res = await api.post('/admin/universities', data);
    return res.data.data;
  }

  static async updateUniversity(id: string, data: any): Promise<AdminUniversity> {
    const res = await api.patch(`/admin/universities/${id}`, data);
    return res.data.data;
  }

  static async updateUniversityStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED' | any
  ): Promise<AdminUniversity> {
    const res = await api.patch(`/admin/universities/${id}/status`, { status });
    return res.data.data;
  }

  // Organizations — database/API only
  static async getOrganizations(params: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: string;
  }): Promise<{ organizations: AdminOrganization[]; pagination: PaginationMeta }> {
    const res = await api.get('/admin/organizations', { params });
    const organizations: AdminOrganization[] = Array.isArray(res.data?.data) ? res.data.data : [];
    return {
      organizations,
      pagination: res.data?.pagination || {
        page: params.page || 1,
        limit: params.limit || 20,
        total: organizations.length,
        totalPages: Math.ceil(organizations.length / (params.limit || 20)) || 1,
      },
    };
  }

  static async getOrganizationById(id: string): Promise<AdminOrganizationDetail> {
    const res = await api.get(`/admin/organizations/${id}`);
    return res.data.data;
  }

  static async createOrganization(data: any): Promise<AdminOrganization> {
    const res = await api.post('/admin/organizations', data);
    return res.data.data;
  }

  static async updateOrganization(id: string, data: any): Promise<AdminOrganization> {
    const res = await api.patch(`/admin/organizations/${id}`, data);
    return res.data.data;
  }

  static async updateOrganizationStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED' | any
  ): Promise<AdminOrganization> {
    const res = await api.patch(`/admin/organizations/${id}/status`, { status });
    return res.data.data;
  }

  // Supervisors — database/API only
  static async getSupervisors(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    organizationId?: string;
  }): Promise<{ supervisors: AdminSupervisor[]; pagination: PaginationMeta }> {
    const res = await api.get('/admin/supervisors', { params });
    const supervisors: AdminSupervisor[] = Array.isArray(res.data?.data) ? res.data.data : [];
    return {
      supervisors,
      pagination: res.data?.pagination || {
        page: params.page || 1,
        limit: params.limit || 20,
        total: supervisors.length,
        totalPages: Math.ceil(supervisors.length / (params.limit || 20)) || 1,
      },
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

  // Audit logs — database/API only
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
    const res = await api.get('/admin/audit-logs', { params });
    const logs: AuditLogItem[] = Array.isArray(res.data?.data) ? res.data.data : [];
    return {
      logs,
      pagination: res.data?.pagination || {
        page: params.page || 1,
        limit: params.limit || 20,
        total: logs.length,
        totalPages: Math.ceil(logs.length / (params.limit || 20)) || 1,
      },
    };
  }

  // Students & Complete Journey Management
  static async getStudents(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    universityId?: string;
    hospitalId?: string;
    visaStatus?: string;
    completionStatus?: string;
  }): Promise<{ students: AdminStudent[]; pagination: PaginationMeta }> {
    const res = await api.get('/admin/students', { params });
    const students: AdminStudent[] = Array.isArray(res.data?.data) ? res.data.data : [];
    return {
      students,
      pagination: res.data?.pagination || {
        page: params.page || 1,
        limit: params.limit || 20,
        total: students.length,
        totalPages: Math.ceil(students.length / (params.limit || 20)) || 1,
      },
    };
  }

  static async getStudentById(id: string): Promise<AdminStudentJourney> {
    const res = await api.get(`/admin/students/${id}`);
    const student: AdminStudent = res.data.data;

    return {
      student,
      timeline: [],
      documents: [],
      financials: {
        studentFeeDue: student.totalFees || 0,
        studentFeePaid: student.paidFees || 0,
        currency: 'USD',
        status:
          student.paymentStatus === 'PAID'
            ? 'PAID'
            : student.paymentStatus === 'PARTIAL'
              ? 'PARTIAL'
              : 'PENDING',
        invoiceNumber: '',
        receipts: [],
      },
      attendanceLog: [],
      logbookEntries: [],
      evaluation: {
        clinicalKnowledge: 0,
        practicalSkills: 0,
        professionalism: 0,
        patientCare: 0,
        overallGrade: student.evaluationGrade || '',
        supervisorRemarks: '',
        completedAt: '',
      },
    };
  }

  static async updateStudentJourney(
    id: string,
    updates: Partial<AdminStudent>
  ): Promise<AdminStudent> {
    const res = await api.patch(`/admin/students/${id}`, updates);
    return res.data.data;
  }

  static async nominateStudent(input: {
    fullName: string;
    studentNumber: string;
    email: string;
    password: string;
    phone?: string;
    program?: string;
    specialty?: string;
    academicLevel?: string;
    durationWeeks?: number;
  }): Promise<AdminStudent> {
    const res = await api.post('/admin/students', input);
    return res.data.data;
  }

  static async updateNomination(id: string, input: Partial<{
    fullName: string;
    studentNumber: string;
    email: string;
    phone?: string;
    program?: string;
    specialty?: string;
    academicLevel?: string;
    durationWeeks?: number;
  }>): Promise<AdminStudent> {
    const res = await api.patch(`/admin/students/${id}`, input);
    return res.data.data;
  }

  static async uploadStudentDocument(studentId: string, file: { originalName: string; mimeType: string; base64Data: string; type?: string }): Promise<any> {
    const res = await api.post('/documents/upload', {
      originalName: file.originalName,
      mimeType: file.mimeType,
      base64Data: file.base64Data,
      type: file.type || 'APPLICATION_SUPPORTING_DOC',
      studentId,
    });
    return res.data.data.document;
  }

  static async getStudentDocuments(studentId: string): Promise<any[]> {
    const res = await api.get('/documents', { params: { studentId, limit: 100 } });
    return res.data.data.documents || [];
  }

  static async downloadDocument(documentId: string, fileName: string): Promise<void> {
    const res = await api.get(`/documents/${documentId}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = window.document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    window.document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  static async getStudentAzaamJourney(id: string): Promise<AdminJourneyStage[]> {
    const res = await api.get(`/admin/students/${id}/journey`);
    return res.data.data.stages;
  }

  static async actOnJourneyStage(
    id: string,
    stageKey: string,
    action: 'APPROVE' | 'REQUEST_CORRECTION' | 'REJECT',
    reason?: string
  ): Promise<AdminJourneyStage[]> {
    const res = await api.post(`/admin/students/${id}/journey/${stageKey}/action`, { action, reason });
    return res.data.data.stages;
  }

  static async updateJourneyStage(
    id: string,
    stageKey: string,
    documentIds: string[],
    comment?: string
  ): Promise<AdminJourneyStage[]> {
    const res = await api.post(`/admin/students/${id}/journey/${stageKey}/update`, {
      documentIds,
      comment,
    });
    return res.data.data.stages;
  }

  static async confirmHospitalPlacement(
    id: string,
    input: {
      organizationId: string;
      departmentId?: string;
      supervisorId?: string;
      startDate: string;
      endDate: string;
      documentIds: string[];
      comment?: string;
    }
  ): Promise<AdminJourneyStage[]> {
    const res = await api.post(`/admin/students/${id}/journey/PLACEMENT/confirm`, input);
    return res.data.data.stages;
  }

  static async getOrganizationDepartments(organizationId: string): Promise<any[]> {
    const res = await api.get(`/organizations/${organizationId}/departments`);
    return res.data.data.departments || [];
  }

  static async getOrganizationSupervisors(organizationId: string): Promise<any[]> {
    const res = await api.get(`/organizations/${organizationId}/supervisors`);
    return res.data.data.supervisors || [];
  }

  static async addJourneyComment(
    id: string,
    stageKey: string,
    message: string
  ): Promise<AdminJourneyStage[]> {
    const res = await api.post(`/admin/students/${id}/journey/${stageKey}/comment`, { message });
    return res.data.data.stages;
  }

  static async getJourneyChat(id: string): Promise<JourneyChatData> {
    const res = await api.get(`/admin/students/${id}/chat`);
    return res.data.data;
  }

  static async markJourneyChatRead(id: string): Promise<JourneyChatData> {
    const res = await api.post(`/admin/students/${id}/chat/read`);
    return res.data.data;
  }
}
