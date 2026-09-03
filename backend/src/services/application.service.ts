import { Application, ApplicationStatusHistory } from '../models/Application.js';
import { Student } from '../models/Student.js';
import { AuditLog } from '../models/Notification.js';
import { ApplicationStatus, ApplicantType } from '../types/index.js';

export class ApplicationService {
  static async createApplication(studentUserId: string, data: {
    programmeId?: string;
    specialtyId?: string;
    preferredStartDate?: Date;
    preferredEndDate?: Date;
  }) {
    const student = await Student.findOne({ userId: studentUserId });
    if (!student) {
      const err: any = new Error('Student record not found for user');
      err.statusCode = 404;
      throw err;
    }

    const application = new Application({
      studentId: student._id,
      universityId: student.applicantType === ApplicantType.INDEPENDENT ? null : student.universityId,
      applicantType: student.applicantType,
      programmeId: data.programmeId || student.programmeId,
      specialtyId: data.specialtyId || student.specialtyId,
      preferredStartDate: data.preferredStartDate,
      preferredEndDate: data.preferredEndDate,
      status: ApplicationStatus.SUBMITTED,
      submissionDate: new Date(),
    });

    await application.save();

    await ApplicationStatusHistory.create({
      applicationId: application._id,
      fromStatus: ApplicationStatus.DRAFT,
      toStatus: ApplicationStatus.SUBMITTED,
      changedBy: studentUserId,
      reason: 'Application submitted by student',
    });

    await AuditLog.create({
      actorUserId: studentUserId,
      action: 'application.create',
      entityType: 'Application',
      entityId: application._id,
      after: { status: application.status, applicantType: application.applicantType },
    });

    return application;
  }

  static async updateStatus(
    applicationId: string,
    newStatus: ApplicationStatus,
    actorUserId: string,
    reason?: string
  ) {
    const application = await Application.findById(applicationId);
    if (!application) {
      const err: any = new Error('Application not found');
      err.statusCode = 404;
      throw err;
    }

    const previousStatus = application.status;
    application.status = newStatus;
    application.reviewedBy = actorUserId as any;
    application.reviewedAt = new Date();

    if (newStatus === ApplicationStatus.REJECTED && reason) {
      application.rejectionReason = reason;
    }

    await application.save();

    await ApplicationStatusHistory.create({
      applicationId: application._id,
      fromStatus: previousStatus,
      toStatus: newStatus,
      changedBy: actorUserId,
      reason: reason || `Status updated to ${newStatus}`,
    });

    await AuditLog.create({
      actorUserId,
      action: `application.${newStatus.toLowerCase()}`,
      entityType: 'Application',
      entityId: application._id,
      before: { status: previousStatus },
      after: { status: newStatus },
    });

    return application;
  }

  static async getApplications(filters: any) {
    return Application.find(filters)
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'firstName lastName email phone' } })
      .populate('universityId')
      .populate('programmeId')
      .populate('specialtyId')
      .sort({ createdAt: -1 });
  }

  static async getApplicationById(id: string) {
    const application = await Application.findById(id)
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'firstName lastName email phone' } })
      .populate('universityId')
      .populate('programmeId')
      .populate('specialtyId');

    if (!application) {
      const err: any = new Error('Application not found');
      err.statusCode = 404;
      throw err;
    }

    const history = await ApplicationStatusHistory.find({ applicationId: id })
      .populate('changedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return { application, history };
  }
}
