import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { AdminService } from '../services/admin.service.js';
import { AuditService } from '../services/audit.service.js';
import { UserRole } from '../types/index.js';

export class AdminController {
  // Dashboard
  static async getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'User not authenticated' } });
        return;
      }
      const data = await AdminService.getDashboard(req.user);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }

  // Users
  static async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'User not authenticated' } });
        return;
      }
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = req.query.search as string;
      const role = req.query.role as string;
      const status = req.query.status as string;
      const universityId = req.query.universityId as string;
      const organizationId = req.query.organizationId as string;

      const result = await AdminService.getUsers(
        { page, limit, search, role, status, universityId, organizationId },
        req.user
      );

      res.json({
        success: true,
        data: result.users,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }

  static async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'User not authenticated' } });
        return;
      }
      const user = await AdminService.getUserById(req.params.id, req.user);
      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: error.message } });
    }
  }

  static async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'User not authenticated' } });
        return;
      }
      const newUser = await AdminService.createUser(req.body, req.user, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.status(201).json({ success: true, data: newUser });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: error.message } });
    }
  }

  static async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'User not authenticated' } });
        return;
      }
      const updatedUser = await AdminService.updateUser(req.params.id, req.body, req.user, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.json({ success: true, data: updatedUser });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: error.message } });
    }
  }

  static async updateUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'User not authenticated' } });
        return;
      }
      const { status } = req.body;
      if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
        res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Status must be ACTIVE or INACTIVE' } });
        return;
      }
      const result = await AdminService.updateUserStatus(req.params.id, status, req.user, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: error.message } });
    }
  }

  static async resetUserPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'User not authenticated' } });
        return;
      }
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Password must be at least 6 characters' } });
        return;
      }
      const result = await AdminService.resetUserPassword(req.params.id, newPassword, req.user, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: error.message } });
    }
  }

  // Universities
  static async getUniversities(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'User not authenticated' } });
        return;
      }

      // Tenant isolation: University admin/staff can only view their own university
      const isUniversityUser = req.user.roles.includes(UserRole.UNIVERSITY_ADMIN) || req.user.roles.includes(UserRole.UNIVERSITY_STAFF);
      const isOrgUser = req.user.roles.includes(UserRole.ORGANIZATION_ADMIN) || req.user.roles.includes(UserRole.ORGANIZATION_STAFF);

      if (isOrgUser && !req.user.roles.includes(UserRole.SUPER_ADMIN) && !req.user.roles.includes(UserRole.AZAAM_STAFF)) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Hospital staff cannot view university registers' } });
        return;
      }

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      let search = req.query.search as string;
      let status = req.query.status as string;

      if (isUniversityUser && req.user.universityId) {
        // Enforce listing only their own university
        const uniData = await AdminService.getUniversityById(req.user.universityId);
        res.json({
          success: true,
          data: [uniData.university],
          pagination: { page: 1, limit: 1, total: 1, totalPages: 1 }
        });
        return;
      }

      const result = await AdminService.getUniversities({ page, limit, search, status });
      res.json({ success: true, data: result.universities, pagination: result.pagination });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }

  static async getUniversityById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'User not authenticated' } });
        return;
      }

      const isUniversityUser = req.user.roles.includes(UserRole.UNIVERSITY_ADMIN) || req.user.roles.includes(UserRole.UNIVERSITY_STAFF);
      if (isUniversityUser && req.user.universityId && req.params.id !== req.user.universityId) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Unauthorized tenant access to this university' } });
        return;
      }

      const isOrgUser = req.user.roles.includes(UserRole.ORGANIZATION_ADMIN) || req.user.roles.includes(UserRole.ORGANIZATION_STAFF);
      if (isOrgUser && !req.user.roles.includes(UserRole.SUPER_ADMIN) && !req.user.roles.includes(UserRole.AZAAM_STAFF)) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Hospital staff cannot view university details' } });
        return;
      }

      const data = await AdminService.getUniversityById(req.params.id);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: error.message } });
    }
  }

  static async createUniversity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) return;
      if (!req.user.roles.includes(UserRole.SUPER_ADMIN) && !req.user.roles.includes(UserRole.AZAAM_STAFF)) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only AZAAM system administrators can register new universities' } });
        return;
      }
      const uni = await AdminService.createUniversity(req.body, req.user, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.status(201).json({ success: true, data: uni });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: error.message } });
    }
  }

  static async updateUniversity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) return;

      const isUniversityUser = req.user.roles.includes(UserRole.UNIVERSITY_ADMIN) || req.user.roles.includes(UserRole.UNIVERSITY_STAFF);
      if (isUniversityUser && req.user.universityId && req.params.id !== req.user.universityId) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You are not authorized to modify other universities' } });
        return;
      }

      const uni = await AdminService.updateUniversity(req.params.id, req.body, req.user, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.json({ success: true, data: uni });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: error.message } });
    }
  }

  static async updateUniversityStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) return;
      if (!req.user.roles.includes(UserRole.SUPER_ADMIN) && !req.user.roles.includes(UserRole.AZAAM_STAFF)) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only AZAAM system administrators can change university statuses' } });
        return;
      }
      const { status } = req.body;
      const uni = await AdminService.updateUniversityStatus(req.params.id, status, req.user, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.json({ success: true, data: uni });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: error.message } });
    }
  }

  // Organizations
  static async getOrganizations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'User not authenticated' } });
        return;
      }

      const isUniversityUser = req.user.roles.includes(UserRole.UNIVERSITY_ADMIN) || req.user.roles.includes(UserRole.UNIVERSITY_STAFF);
      const isOrgUser = req.user.roles.includes(UserRole.ORGANIZATION_ADMIN) || req.user.roles.includes(UserRole.ORGANIZATION_STAFF);

      if (isUniversityUser && !req.user.roles.includes(UserRole.SUPER_ADMIN) && !req.user.roles.includes(UserRole.AZAAM_STAFF)) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'University staff cannot view clinical organization registers' } });
        return;
      }

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = req.query.search as string;
      const type = req.query.type as string;
      const status = req.query.status as string;

      if (isOrgUser && req.user.organizationId) {
        // Enforce listing only their own organization
        const orgData = await AdminService.getOrganizationById(req.user.organizationId);
        res.json({
          success: true,
          data: [orgData.organization],
          pagination: { page: 1, limit: 1, total: 1, totalPages: 1 }
        });
        return;
      }

      const result = await AdminService.getOrganizations({ page, limit, search, type, status });
      res.json({ success: true, data: result.organizations, pagination: result.pagination });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }

  static async getOrganizationById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'User not authenticated' } });
        return;
      }

      const isOrgUser = req.user.roles.includes(UserRole.ORGANIZATION_ADMIN) || req.user.roles.includes(UserRole.ORGANIZATION_STAFF);
      if (isOrgUser && req.user.organizationId && req.params.id !== req.user.organizationId) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Unauthorized tenant access to this clinical organization' } });
        return;
      }

      const isUniversityUser = req.user.roles.includes(UserRole.UNIVERSITY_ADMIN) || req.user.roles.includes(UserRole.UNIVERSITY_STAFF);
      if (isUniversityUser && !req.user.roles.includes(UserRole.SUPER_ADMIN) && !req.user.roles.includes(UserRole.AZAAM_STAFF)) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'University staff cannot view clinical organization details' } });
        return;
      }

      const data = await AdminService.getOrganizationById(req.params.id);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: error.message } });
    }
  }

  static async createOrganization(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) return;
      if (!req.user.roles.includes(UserRole.SUPER_ADMIN) && !req.user.roles.includes(UserRole.AZAAM_STAFF)) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only AZAAM system administrators can register new healthcare facilities' } });
        return;
      }
      const org = await AdminService.createOrganization(req.body, req.user, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.status(201).json({ success: true, data: org });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: error.message } });
    }
  }

  static async updateOrganization(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) return;

      const isOrgUser = req.user.roles.includes(UserRole.ORGANIZATION_ADMIN) || req.user.roles.includes(UserRole.ORGANIZATION_STAFF);
      if (isOrgUser && req.user.organizationId && req.params.id !== req.user.organizationId) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You are not authorized to modify other healthcare organizations' } });
        return;
      }

      const org = await AdminService.updateOrganization(req.params.id, req.body, req.user, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.json({ success: true, data: org });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: error.message } });
    }
  }

  static async updateOrganizationStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) return;
      if (!req.user.roles.includes(UserRole.SUPER_ADMIN) && !req.user.roles.includes(UserRole.AZAAM_STAFF)) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only AZAAM system administrators can change healthcare organization statuses' } });
        return;
      }
      const { status } = req.body;
      const org = await AdminService.updateOrganizationStatus(req.params.id, status, req.user, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.json({ success: true, data: org });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: error.message } });
    }
  }

  // Supervisors
  static async getSupervisors(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) return;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = req.query.search as string;
      const status = req.query.status as string;
      const organizationId = req.query.organizationId as string;

      const result = await AdminService.getSupervisors({ page, limit, search, status, organizationId }, req.user);
      res.json({ success: true, data: result.supervisors, pagination: result.pagination });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }

  static async getSupervisorById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data = await AdminService.getSupervisorById(req.params.id);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: error.message } });
    }
  }

  static async updateSupervisorStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) return;
      const { status } = req.body;
      const sup = await AdminService.updateSupervisorStatus(req.params.id, status, req.user, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.json({ success: true, data: sup });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: error.message } });
    }
  }

  // Audit Logs
  static async getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = req.query.search as string;
      const actorId = req.query.actorId as string;
      const action = req.query.action as string;
      const entityType = req.query.entityType as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      const result = await AuditService.getLogs({
        page,
        limit,
        search,
        actorId,
        action,
        entityType,
        startDate,
        endDate,
      });

      res.json({ success: true, data: result.logs, pagination: result.pagination });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }

  // Specific activation/suspension/archival routes as requested
  static async activateUniversity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) return;
      if (!req.user.roles.includes(UserRole.SUPER_ADMIN) && !req.user.roles.includes(UserRole.AZAAM_STAFF)) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only AZAAM system administrators can change university statuses' } });
        return;
      }
      const uni = await AdminService.updateUniversityStatus(req.params.id, 'ACTIVE', req.user, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.json({ success: true, data: uni });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: error.message } });
    }
  }

  static async suspendUniversity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) return;
      if (!req.user.roles.includes(UserRole.SUPER_ADMIN) && !req.user.roles.includes(UserRole.AZAAM_STAFF)) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only AZAAM system administrators can change university statuses' } });
        return;
      }
      const uni = await AdminService.updateUniversityStatus(req.params.id, 'SUSPENDED', req.user, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.json({ success: true, data: uni });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: error.message } });
    }
  }

  static async archiveUniversity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) return;
      if (!req.user.roles.includes(UserRole.SUPER_ADMIN) && !req.user.roles.includes(UserRole.AZAAM_STAFF)) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only AZAAM system administrators can change university statuses' } });
        return;
      }
      const uni = await AdminService.updateUniversityStatus(req.params.id, 'ARCHIVED', req.user, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.json({ success: true, data: uni });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: error.message } });
    }
  }

  static async activateOrganization(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) return;
      if (!req.user.roles.includes(UserRole.SUPER_ADMIN) && !req.user.roles.includes(UserRole.AZAAM_STAFF)) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only AZAAM system administrators can change healthcare organization statuses' } });
        return;
      }
      const org = await AdminService.updateOrganizationStatus(req.params.id, 'ACTIVE', req.user, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.json({ success: true, data: org });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: error.message } });
    }
  }

  static async suspendOrganization(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) return;
      if (!req.user.roles.includes(UserRole.SUPER_ADMIN) && !req.user.roles.includes(UserRole.AZAAM_STAFF)) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only AZAAM system administrators can change healthcare organization statuses' } });
        return;
      }
      const org = await AdminService.updateOrganizationStatus(req.params.id, 'SUSPENDED', req.user, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.json({ success: true, data: org });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: error.message } });
    }
  }

  static async archiveOrganization(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) return;
      if (!req.user.roles.includes(UserRole.SUPER_ADMIN) && !req.user.roles.includes(UserRole.AZAAM_STAFF)) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only AZAAM system administrators can change healthcare organization statuses' } });
        return;
      }
      const org = await AdminService.updateOrganizationStatus(req.params.id, 'ARCHIVED', req.user, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.json({ success: true, data: org });
    } catch (error: any) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: error.message } });
    }
  }
}
