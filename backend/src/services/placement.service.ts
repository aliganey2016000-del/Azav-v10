import { Placement } from '../models/Placement.js';
import { ClinicalAttachment } from '../models/Placement.js';
import { Organization } from '../models/Organization.js';
import { Department } from '../models/Department.js';
import { ClinicalSupervisor } from '../models/ClinicalSupervisor.js';
import { Application } from '../models/Application.js';
import { Student } from '../models/Student.js';
import { ApplicationService } from './application.service.js';
import { AuditLog } from '../models/Notification.js';
import { PlacementStatus, ClinicalAttachmentStatus, ApplicationStatus } from '../types/index.js';

export class PlacementService {
  static async createPlacement(actorUserId: string, data: {
    applicationId: string;
    studentId: string;
    organizationId: string;
    departmentId?: string;
    supervisorId?: string;
    startDate: Date;
    endDate: Date;
  }) {
    if (data.endDate < data.startDate) {
      const err: any = new Error('endDate must be on or after startDate');
      err.statusCode = 400;
      err.code = 'INVALID_DATE_RANGE';
      throw err;
    }

    const [application, student, organization] = await Promise.all([
      Application.findById(data.applicationId),
      Student.findById(data.studentId),
      Organization.findById(data.organizationId),
    ]);

    if (!application) {
      const err: any = new Error('Application not found');
      err.statusCode = 404;
      throw err;
    }
    if (!student) {
      const err: any = new Error('Student not found');
      err.statusCode = 404;
      throw err;
    }
    if (!organization) {
      const err: any = new Error('Healthcare Organization not found');
      err.statusCode = 404;
      throw err;
    }

    // The placement must be created for the same student represented by the application.
    if (application.studentId.toString() !== data.studentId.toString()) {
      const err: any = new Error('Application and placement student do not match');
      err.statusCode = 400;
      err.code = 'APPLICATION_STUDENT_MISMATCH';
      throw err;
    }

    // A placement can only be created after the application is approved/placement-ready.
    const placementReadyStatuses = [
      ApplicationStatus.APPROVED,
      ApplicationStatus.PLACEMENT_PENDING,
      ApplicationStatus.PLACED,
      ApplicationStatus.SUPERVISOR_ASSIGNED,
    ];
    if (!placementReadyStatuses.includes(application.status)) {
      const err: any = new Error(`Application status ${application.status} is not eligible for placement`);
      err.statusCode = 400;
      err.code = 'APPLICATION_NOT_PLACEMENT_READY';
      throw err;
    }

    // A university-backed student must remain attached to the same university application.
    if (application.universityId && student.universityId && application.universityId.toString() !== student.universityId.toString()) {
      const err: any = new Error('Application university does not match the student university');
      err.statusCode = 400;
      err.code = 'APPLICATION_UNIVERSITY_MISMATCH';
      throw err;
    }

    // Department, when supplied, must belong to the selected healthcare organization.
    if (data.departmentId) {
      const department = await Department.findById(data.departmentId);
      if (!department) {
        const err: any = new Error('Department not found');
        err.statusCode = 404;
        throw err;
      }
      if (department.organizationId.toString() !== data.organizationId.toString()) {
        const err: any = new Error('Department does not belong to the healthcare organization hosting this placement');
        err.statusCode = 400;
        err.code = 'DEPARTMENT_ORGANIZATION_MISMATCH';
        throw err;
      }
      if (department.status !== 'ACTIVE') {
        const err: any = new Error('Department is not active');
        err.statusCode = 400;
        err.code = 'DEPARTMENT_INACTIVE';
        throw err;
      }
    }

    // Capacity is checked for the requested rotation window, not against all historical placements.
    const overlappingOrganizationPlacements = await Placement.countDocuments({
      organizationId: data.organizationId,
      status: { $in: [PlacementStatus.CONFIRMED, PlacementStatus.ACTIVE] },
      startDate: { $lte: data.endDate },
      endDate: { $gte: data.startDate },
    });

    if (overlappingOrganizationPlacements >= organization.capacity) {
      const err: any = new Error(
        `Organization placement capacity reached for this rotation window (${overlappingOrganizationPlacements}/${organization.capacity}).`
      );
      err.statusCode = 400;
      err.code = 'CAPACITY_EXCEEDED';
      throw err;
    }

    const overlappingPlacements = await Placement.findOne({
      studentId: data.studentId,
      status: { $in: [PlacementStatus.PENDING, PlacementStatus.CONFIRMED, PlacementStatus.ACTIVE] },
      startDate: { $lte: data.endDate },
      endDate: { $gte: data.startDate },
    });

    if (overlappingPlacements) {
      const err: any = new Error('Student already has an active or pending clinical placement scheduled for this date range.');
      err.statusCode = 400;
      err.code = 'ROTATION_OVERLAP';
      throw err;
    }

    if (data.supervisorId) {
      const supervisor = await ClinicalSupervisor.findById(data.supervisorId);
      if (!supervisor) {
        const err: any = new Error('Clinical supervisor not found');
        err.statusCode = 404;
        throw err;
      }
      if (supervisor.organizationId.toString() !== data.organizationId.toString()) {
        const err: any = new Error('Clinical supervisor does not belong to the healthcare organization hosting this placement.');
        err.statusCode = 400;
        err.code = 'SUPERVISOR_ORGANIZATION_MISMATCH';
        throw err;
      }
      if (supervisor.status !== 'ACTIVE' || !supervisor.verified) {
        const err: any = new Error('Clinical supervisor is not active and verified');
        err.statusCode = 400;
        err.code = 'SUPERVISOR_NOT_ELIGIBLE';
        throw err;
      }
      if (data.departmentId && supervisor.departmentId && supervisor.departmentId.toString() !== data.departmentId.toString()) {
        const err: any = new Error('Clinical supervisor does not belong to the selected department');
        err.statusCode = 400;
        err.code = 'SUPERVISOR_DEPARTMENT_MISMATCH';
        throw err;
      }
    }

    const placement = new Placement({
      applicationId: data.applicationId,
      studentId: data.studentId,
      organizationId: data.organizationId,
      departmentId: data.departmentId || null,
      supervisorId: data.supervisorId || null,
      startDate: data.startDate,
      endDate: data.endDate,
      status: PlacementStatus.CONFIRMED,
      createdBy: actorUserId,
    });

    await placement.save();

    const attachment = new ClinicalAttachment({
      placementId: placement._id,
      studentId: data.studentId,
      organizationId: data.organizationId,
      departmentId: data.departmentId || null,
      supervisorId: data.supervisorId || null,
      startDate: data.startDate,
      endDate: data.endDate,
      status: ClinicalAttachmentStatus.NOT_STARTED,
    });

    await attachment.save();

    const nextAppStatus = data.supervisorId ? ApplicationStatus.SUPERVISOR_ASSIGNED : ApplicationStatus.PLACED;
    await ApplicationService.updateStatus(data.applicationId, nextAppStatus, actorUserId, 'Placement created');

    await AuditLog.create({
      actorUserId,
      action: 'placement.create',
      entityType: 'Placement',
      entityId: placement._id,
      after: { organizationId: data.organizationId, studentId: data.studentId },
    });

    return { placement, attachment };
  }

  static async getPlacements(filters: any) {
    return Placement.find(filters)
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'firstName lastName email' } })
      .populate('organizationId')
      .populate('departmentId')
      .populate({ path: 'supervisorId', populate: { path: 'userId', select: 'firstName lastName email' } })
      .sort({ startDate: -1 });
  }
}
