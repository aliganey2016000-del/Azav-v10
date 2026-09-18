import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { LogbookService } from '../services/logbook.service.js';
import { LogbookEntry } from '../models/LogbookEntry.js';
import { ClinicalAttachment } from '../models/Placement.js';
import { Student } from '../models/Student.js';
import { ClinicalSupervisor } from '../models/ClinicalSupervisor.js';
import { UserRole } from '../types/index.js';

export class LogbookController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
        return;
      }

      const filter: any = {};
      const roles = req.user.roles;
      const isGlobal = roles.includes(UserRole.SUPER_ADMIN) || roles.includes(UserRole.AZAAM_STAFF);

      if (!isGlobal) {
        if (roles.includes(UserRole.STUDENT) || roles.includes(UserRole.INDEPENDENT_APPLICANT)) {
          filter.studentId = req.user.studentId || null;
        } else if (roles.includes(UserRole.UNIVERSITY_ADMIN) || roles.includes(UserRole.UNIVERSITY_STAFF)) {
          const students = req.user.universityId
            ? await Student.find({ universityId: req.user.universityId }).select('_id')
            : [];
          filter.studentId = { $in: students.map((student) => student._id) };
        } else if (roles.includes(UserRole.ORGANIZATION_ADMIN) || roles.includes(UserRole.ORGANIZATION_STAFF)) {
          const attachments = req.user.organizationId
            ? await ClinicalAttachment.find({ organizationId: req.user.organizationId }).select('_id')
            : [];
          filter.attachmentId = { $in: attachments.map((attachment) => attachment._id) };
        } else if (roles.includes(UserRole.CLINICAL_SUPERVISOR)) {
          const supervisor = await ClinicalSupervisor.findOne({ userId: req.user.userId }).select('_id');
          const attachments = supervisor
            ? await ClinicalAttachment.find({ supervisorId: supervisor._id }).select('_id')
            : [];
          filter.attachmentId = { $in: attachments.map((attachment) => attachment._id) };
        } else {
          filter._id = null;
        }
      }

      const entries = await LogbookEntry.find(filter)
        .populate({ path: 'studentId', populate: { path: 'userId', select: 'firstName lastName email' } })
        .populate('supervisorId')
        .populate('attachmentId')
        .sort({ date: -1 })
        .limit(500);

      res.status(200).json({ success: true, data: { entries } });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
        return;
      }

      const { attachmentId, studentId, supervisorId, date, clinicalActivity, procedure, description } = req.body;
      if (!attachmentId || !studentId || !date || !clinicalActivity || !procedure || !description) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Required fields: attachmentId, studentId, date, clinicalActivity, procedure, description' },
        });
        return;
      }

      const entry = await LogbookService.createEntry(req.user.userId, {
        attachmentId,
        studentId,
        supervisorId,
        date,
        clinicalActivity,
        procedure,
        description,
      });

      res.status(201).json({
        success: true,
        data: { entry },
      });
    } catch (error) {
      next(error);
    }
  }

  static async review(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
        return;
      }

      const { id } = req.params;
      const { status, comment } = req.body;

      if (!status) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Review status is required' } });
        return;
      }

      const entry = await LogbookService.reviewEntry(req.user.userId, id, status, comment);
      res.status(200).json({
        success: true,
        data: { entry },
      });
    } catch (error) {
      next(error);
    }
  }

  static async listByAttachment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { attachmentId } = req.params;
      const entries = await LogbookService.getEntries(attachmentId);
      res.status(200).json({
        success: true,
        data: { entries },
      });
    } catch (error) {
      next(error);
    }
  }
}
