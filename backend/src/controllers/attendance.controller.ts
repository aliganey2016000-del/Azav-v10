import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { AttendanceService } from '../services/attendance.service.js';

export class AttendanceController {
  static async record(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
        return;
      }

      const { attachmentId, studentId, date, status, checkIn, checkOut, notes } = req.body;
      if (!attachmentId || !studentId || !date || !status) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'attachmentId, studentId, date, status are required' },
        });
        return;
      }

      const attendance = await AttendanceService.recordAttendance(req.user.userId, {
        attachmentId,
        studentId,
        date,
        status,
        checkIn,
        checkOut,
        notes,
      });

      res.status(201).json({
        success: true,
        data: { attendance },
      });
    } catch (error) {
      next(error);
    }
  }

  static async listByAttachment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { attachmentId } = req.params;
      const attendanceLogs = await AttendanceService.getAttendanceLogs(attachmentId);
      res.status(200).json({
        success: true,
        data: { attendanceLogs },
      });
    } catch (error) {
      next(error);
    }
  }
}
