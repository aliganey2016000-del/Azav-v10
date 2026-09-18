import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { PlacementService } from '../services/placement.service.js';
import { Student } from '../models/Student.js';
import { ClinicalSupervisor } from '../models/ClinicalSupervisor.js';
import { PlacementStatus, UserRole } from '../types/index.js';

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

      if (req.user.roles.includes(UserRole.ORGANIZATION_ADMIN)) {
        if (!req.user.organizationId || req.user.organizationId.toString() !== organizationId.toString()) {
          res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN_TENANT', message: 'Organization administrators can only create placements for their own organization.' },
          });
          return;
        }
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

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
        return;
      }

      const { organizationId, departmentId, supervisorId, startDate, endDate } = req.body;

      const placement = await PlacementService.updatePlacement(req.user.userId, req.params.id, {
        organizationId,
        departmentId,
        supervisorId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      res.status(200).json({
        success: true,
        data: { placement },
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

      const { status } = req.body;
      if (!status || !Object.values(PlacementStatus).includes(status as PlacementStatus)) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'A valid placement status is required' },
        });
        return;
      }

      const placement = await PlacementService.updatePlacementStatus(
        req.user.userId,
        req.params.id,
        status as PlacementStatus
      );

      res.status(200).json({
        success: true,
        data: { placement },
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
      const isGlobalAdmin = req.user.roles.includes(UserRole.SUPER_ADMIN) || req.user.roles.includes(UserRole.AZAAM_STAFF);

      if (!isGlobalAdmin) {
        if (req.user.roles.includes(UserRole.STUDENT) || req.user.roles.includes(UserRole.INDEPENDENT_APPLICANT)) {
          if (!req.user.studentId) {
            queryFilters._id = null;
          } else {
            queryFilters.studentId = req.user.studentId;
          }
        } else if (req.user.roles.includes(UserRole.ORGANIZATION_ADMIN) || req.user.roles.includes(UserRole.ORGANIZATION_STAFF)) {
          if (!req.user.organizationId) {
            queryFilters._id = null;
          } else {
            queryFilters.organizationId = req.user.organizationId;
          }
        } else if (req.user.roles.includes(UserRole.UNIVERSITY_ADMIN) || req.user.roles.includes(UserRole.UNIVERSITY_STAFF)) {
          if (!req.user.universityId) {
            queryFilters._id = null;
          } else {
            const students = await Student.find({ universityId: req.user.universityId }).select('_id');
            queryFilters.studentId = { $in: students.map((student) => student._id) };
          }
        } else if (req.user.roles.includes(UserRole.CLINICAL_SUPERVISOR)) {
          const supervisor = await ClinicalSupervisor.findOne({ userId: req.user.userId }).select('_id');
          if (!supervisor) {
            queryFilters._id = null;
          } else {
            queryFilters.supervisorId = supervisor._id;
          }
        } else {
          queryFilters._id = null;
        }
      }

      if (isGlobalAdmin) {
        await PlacementService.reconcileJourneyPlacements();
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
