import { Attendance } from '../models/Attendance.js';
import { ClinicalAttachment } from '../models/Placement.js';
import { AuditLog } from '../models/Notification.js';
import { AttendanceStatus } from '../types/index.js';

export class AttendanceService {
  static async recordAttendance(actorUserId: string, data: {
    attachmentId: string;
    studentId: string;
    date: Date | string;
    status: AttendanceStatus;
    checkIn?: string;
    checkOut?: string;
    notes?: string;
  }) {
    const attachment = await ClinicalAttachment.findById(data.attachmentId);
    if (!attachment) {
      const err: any = new Error('Clinical attachment record not found');
      err.statusCode = 404;
      throw err;
    }

    const attendanceDate = new Date(data.date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    // Duplicate prevention check
    const existing = await Attendance.findOne({
      attachmentId: data.attachmentId,
      date: attendanceDate,
    });

    if (existing) {
      const err: any = new Error(`Attendance for this attachment has already been recorded on ${attendanceDate.toISOString().split('T')[0]}`);
      err.statusCode = 409;
      err.code = 'DUPLICATE_ATTENDANCE';
      throw err;
    }

    const attendance = new Attendance({
      attachmentId: data.attachmentId,
      studentId: data.studentId,
      date: attendanceDate,
      status: data.status,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      notes: data.notes,
      recordedBy: actorUserId,
    });

    await attendance.save();

    await AuditLog.create({
      actorUserId,
      action: 'attendance.record',
      entityType: 'Attendance',
      entityId: attendance._id,
      after: { attachmentId: data.attachmentId, status: data.status, date: attendanceDate },
    });

    return attendance;
  }

  static async getAttendanceLogs(attachmentId: string) {
    return Attendance.find({ attachmentId }).sort({ date: -1 });
  }
}
