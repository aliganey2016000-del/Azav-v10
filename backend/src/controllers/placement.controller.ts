import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { PlacementService } from '../services/placement.service.js';
import { UserRole } from '../types/index.js';

export class PlacementController {
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
        return;
      }

      const { applicationId, studentId, organizationId, departmentId, supervisorId, startDate, endDate } = req.body;

      if (!applicationId || !studentId || !organizationId || !startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'applicationId, studentId, organizationId, startDate, endDate are required' },
        });
        return;
      }

      const result = await PlacementService.createPlacement(req.user.userId, {
        applicationId,
        studentId,
        organizationId,
        departmentId,
        supervisorId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });

      res.status(201).json({
        success: true,
        data: result,
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
      if (req.user.roles.includes(UserRole.STUDENT) || req.user.roles.includes(UserRole.INDEPENDENT_APPLICANT)) {
        if (req.user.studentId) queryFilters.studentId = req.user.studentId;
      } else if (req.user.roles.includes(UserRole.ORGANIZATION_ADMIN) || req.user.roles.includes(UserRole.ORGANIZATION_STAFF)) {
        if (req.user.organizationId) queryFilters.organizationId = req.user.organizationId;
      }

      const placements = await PlacementService.getPlacements(queryFilters);
      res.status(200).json({
        success: true,
        data: { placements },
      });
    } catch (error) {
      next(error);
    }
  }
}
