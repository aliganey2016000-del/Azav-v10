import { LogbookEntry } from '../models/LogbookEntry.js';
import { ClinicalAttachment } from '../models/Placement.js';
import { AuditLog } from '../models/Notification.js';
import { LogbookStatus } from '../types/index.js';

export class LogbookService {
  static async createEntry(studentUserId: string, data: {
    attachmentId: string;
    studentId: string;
    supervisorId?: string;
    date: Date;
    clinicalActivity: string;
    procedure: string;
    description: string;
  }) {
    const attachment = await ClinicalAttachment.findById(data.attachmentId);
    if (!attachment) {
      const err: any = new Error('Clinical attachment record not found');
      err.statusCode = 404;
      throw err;
    }

    if (data.studentId.toString() !== attachment.studentId.toString()) {
      const err: any = new Error('Logbook student does not match the clinical attachment student.');
      err.statusCode = 400;
      err.code = 'STUDENT_ATTACHMENT_MISMATCH';
      throw err;
    }

    if (data.supervisorId && (!attachment.supervisorId || data.supervisorId.toString() !== attachment.supervisorId.toString())) {
      const err: any = new Error('Supervisor does not match the clinical attachment supervisor.');
      err.statusCode = 400;
      err.code = 'SUPERVISOR_ATTACHMENT_MISMATCH';
      throw err;
    }

    const entry = new LogbookEntry({
      attachmentId: data.attachmentId,
      studentId: attachment.studentId,
      supervisorId: attachment.supervisorId || undefined,
      date: new Date(data.date),
      clinicalActivity: data.clinicalActivity,
      procedure: data.procedure,
      description: data.description,
      status: LogbookStatus.SUBMITTED,
    });

    await entry.save();

    await AuditLog.create({
      actorUserId: studentUserId,
      action: 'logbook.create',
      entityType: 'LogbookEntry',
      entityId: entry._id,
    });

    return entry;
  }

  static async reviewEntry(
    supervisorUserId: string,
    entryId: string,
    status: LogbookStatus.APPROVED | LogbookStatus.REVISION_REQUESTED,
    comment?: string
  ) {
    const entry = await LogbookEntry.findById(entryId);
    if (!entry) {
      const err: any = new Error('Logbook entry not found');
      err.statusCode = 404;
      throw err;
    }

    entry.status = status;
    if (comment) {
      entry.supervisorComment = comment;
    }
    entry.reviewedAt = new Date();

    await entry.save();

    await AuditLog.create({
      actorUserId: supervisorUserId,
      action: `logbook.${status.toLowerCase()}`,
      entityType: 'LogbookEntry',
      entityId: entry._id,
      after: { status, supervisorComment: comment },
    });

    return entry;
  }

  static async getEntries(attachmentId: string) {
    return LogbookEntry.find({ attachmentId }).sort({ date: -1 });
  }
}
