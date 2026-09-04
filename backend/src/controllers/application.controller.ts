import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ApplicationService } from '../services/application.service.js';
import { UserRole } from '../types/index.js';

export interface ApplicationAuthUser {
  userId: string;
  roles: UserRole[];
  universityId?: string | null;
  studentId?: string | null;
}

export function buildApplicationListQuery(user: ApplicationAuthUser) {
  const roles = Array.isArray(user.roles) ? user.roles : [];

  if (roles.includes(UserRole.SUPER_ADMIN) || roles.includes(UserRole.AZAAM_STAFF)) {
    return { query: {} };
  }

  if (roles.includes(UserRole.STUDENT) || roles.includes(UserRole.INDEPENDENT_APPLICANT)) {
    if (!user.studentId) {
      return { query: {}, forbidden: { code: 'STUDENT_CONTEXT_REQUIRED', message: 'Student context is required.' } };
    }
    return { query: { studentId: user.studentId } };
  }

  if (roles.includes(UserRole.UNIVERSITY_ADMIN) || roles.includes(UserRole.UNIVERSITY_STAFF)) {
    if (!user.universityId) {
      return { query: {}, forbidden: { code: 'TENANT_CONTEXT_REQUIRED', message: 'University context is required.' } };
    }
    return { query: { universityId: user.universityId } };
  }

  return {
    query: {},
    forbidden: {
      code: 'FORBIDDEN_SCOPE',
      message: 'Your role does not have access to application records.',
    },
  };
}

export class ApplicationController {
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
        return;
      }

      const application = await ApplicationService.createApplication(req.user.userId, req.body);
      res.status(201).json({ success: true, data: { application } });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
        return;
      }

      const { query, forbidden } = buildApplicationListQuery(req.user);
      if (forbidden) {
        res.status(403).json({ success: false, error: forbidden });
        return;
      }

      const applications = await ApplicationService.getApplications(query);
      res.status(200).json({ success: true, data: { applications } });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = await ApplicationService.getApplicationById(id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
        return;
      }

      const { id } = req.params;
      const { status, reason } = req.body;
      if (!status) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Status is required' } });
        return;
      }

      const application = await ApplicationService.updateStatus(id, status, req.user.userId, reason);
      res.status(200).json({ success: true, data: { application } });
    } catch (error) {
      next(error);
    }
  }
}
