import { Placement } from '../models/Placement.js';
import { ClinicalAttachment } from '../models/Placement.js';
import { Organization } from '../models/Organization.js';
import { ClinicalSupervisor } from '../models/ClinicalSupervisor.js';
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
    // 1. Check Organization capacity backend-side
    const organization = await Organization.findById(data.organizationId);
    if (!organization) {
      const err: any = new Error('Healthcare Organization not found');
      err.statusCode = 404;
      throw err;
    }

    const activePlacementsCount = await Placement.countDocuments({
      organizationId: data.organizationId,
      status: { $in: [PlacementStatus.CONFIRMED, PlacementStatus.ACTIVE] },
    });

    if (activePlacementsCount >= organization.capacity) {
      const err: any = new Error(
        `Organization placement capacity reached (${activePlacementsCount}/${organization.capacity}). Cannot accept additional placements.`
      );
      err.statusCode = 400;
      err.code = 'CAPACITY_EXCEEDED';
      throw err;
    }

    // 2. Protect against overlapping student rotations
    const overlappingPlacements = await Placement.findOne({
      studentId: data.studentId,
      status: { $in: [PlacementStatus.PENDING, PlacementStatus.CONFIRMED, PlacementStatus.ACTIVE] },
      $or: [
        { startDate: { $lte: data.endDate }, endDate: { $gte: data.startDate } },
      ],
    });

    if (overlappingPlacements) {
      const err: any = new Error('Student already has an active or pending clinical placement scheduled for this date range.');
      err.statusCode = 400;
      err.code = 'ROTATION_OVERLAP';
      throw err;
    }

    // 3. CRITICAL RULE: Supervisor assigned MUST belong to the same organization hosting that placement
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

    // Auto-create ClinicalAttachment record
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

    // Update Application Status
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
