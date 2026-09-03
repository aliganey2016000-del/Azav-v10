import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ApplicationService } from '../services/application.service.js';
import { UserRole } from '../types/index.js';

export class ApplicationController {
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
        return;
      }

      const application = await ApplicationService.createApplication(req.user.userId, req.body);
      res.status(201).json({
        success: true,
        data: { application },
      });
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

      const queryFilters: any = {};

      // Tenant isolation
      if (req.user.roles.includes(UserRole.STUDENT) || req.user.roles.includes(UserRole.INDEPENDENT_APPLICANT)) {
        if (req.user.studentId) {
          queryFilters.studentId = req.user.studentId;
        }
      } else if (req.user.roles.includes(UserRole.UNIVERSITY_ADMIN) || req.user.roles.includes(UserRole.UNIVERSITY_STAFF)) {
        if (req.user.universityId) {
          queryFilters.universityId = req.user.universityId;
        }
      }

      const applications = await ApplicationService.getApplications(queryFilters);
      res.status(200).json({
        success: true,
        data: { applications },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = await ApplicationService.getApplicationById(id);
      res.status(200).json({
        success: true,
        data,
      });
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
      res.status(200).json({
        success: true,
        data: { application },
      });
    } catch (error) {
      next(error);
    }
  }
}
