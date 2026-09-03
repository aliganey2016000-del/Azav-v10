import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { LogbookService } from '../services/logbook.service.js';

export class LogbookController {
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
