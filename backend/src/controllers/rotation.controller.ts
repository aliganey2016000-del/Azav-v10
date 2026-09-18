import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { RotationService } from '../services/rotation.service.js';
import { Student } from '../models/Student.js';
import { ClinicalSupervisor } from '../models/ClinicalSupervisor.js';
import { UserRole } from '../types/index.js';

export class RotationController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
        return;
      }

      const filter: any = {};
      const roles = req.user.roles;
      const global =
        roles.includes(UserRole.SUPER_ADMIN) ||
        roles.includes(UserRole.AZAAM_STAFF);

      if (!global) {
        if (roles.includes(UserRole.STUDENT) || roles.includes(UserRole.INDEPENDENT_APPLICANT)) {
          filter.studentId = req.user.studentId || null;
        } else if (roles.includes(UserRole.UNIVERSITY_ADMIN) || roles.includes(UserRole.UNIVERSITY_STAFF)) {
          const students = req.user.universityId
            ? await Student.find({ universityId: req.user.universityId }).select('_id')
            : [];
          filter.studentId = { $in: students.map((student) => student._id) };
        } else if (roles.includes(UserRole.ORGANIZATION_ADMIN) || roles.includes(UserRole.ORGANIZATION_STAFF)) {
          filter.organizationId = req.user.organizationId || null;
        } else if (roles.includes(UserRole.CLINICAL_SUPERVISOR)) {
          const supervisor = await ClinicalSupervisor.findOne({ userId: req.user.userId }).select('_id');
          filter.supervisorId = supervisor?._id || null;
        } else {
          filter._id = null;
        }
      }

      if (req.query.placementId) {
        filter.placementId = String(req.query.placementId);
      }

      const rotations = await RotationService.getRotations(filter);
      res.status(200).json({ success: true, data: { rotations } });
    } catch (error) {
      next(error);
    }
  }

  static async createPlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
        return;
      }

      const { placementId, rotations, replaceExisting } = req.body;
      if (!placementId || !Array.isArray(rotations)) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'placementId and rotations are required' },
        });
        return;
      }

      const result = await RotationService.createPlan(
        req.user.userId,
        placementId,
        rotations,
        Boolean(replaceExisting)
      );

      res.status(201).json({ success: true, data: { rotations: result } });
    } catch (error) {
      next(error);
    }
  }

  static async deletePlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
        return;
      }

      const deletedCount = await RotationService.deletePlan(req.user.userId, req.params.placementId);
      res.status(200).json({ success: true, data: { deletedCount } });
    } catch (error) {
      next(error);
    }
  }
}
