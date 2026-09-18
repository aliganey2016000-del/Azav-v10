import { Placement } from '../models/Placement.js';
import { ClinicalAttachment } from '../models/Placement.js';
import { Application } from '../models/Application.js';
import { Organization } from '../models/Organization.js';
import { ClinicalSupervisor } from '../models/ClinicalSupervisor.js';
import { ApplicationService } from './application.service.js';
import { AuditLog } from '../models/Notification.js';
import { JourneyMilestone, JourneyStageKey, JourneyStageStatus } from '../models/JourneyMilestone.js';
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
    const application = await Application.findById(data.applicationId).select('studentId');
    if (!application) {
      const err: any = new Error('Application not found');
      err.statusCode = 404;
      err.code = 'APPLICATION_NOT_FOUND';
      throw err;
    }

    if (application.studentId.toString() !== data.studentId.toString()) {
      const err: any = new Error('Placement student does not match the student on the application.');
      err.statusCode = 400;
      err.code = 'APPLICATION_STUDENT_MISMATCH';
      throw err;
    }

    if (data.endDate < data.startDate) {
      const err: any = new Error('endDate must be on or after startDate');
      err.statusCode = 400;
      err.code = 'INVALID_DATE_RANGE';
      throw err;
    }

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

    const overlappingPlacements = await Placement.findOne({
      studentId: data.studentId,
      status: { $in: [PlacementStatus.PENDING, PlacementStatus.CONFIRMED, PlacementStatus.ACTIVE] },
      $or: [{ startDate: { $lte: data.endDate }, endDate: { $gte: data.startDate } }],
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

  static async updatePlacement(actorUserId: string, placementId: string, data: {
    organizationId?: string;
    departmentId?: string | null;
    supervisorId?: string | null;
    startDate?: Date;
    endDate?: Date;
  }) {
    const placement = await Placement.findById(placementId);
    if (!placement) {
      const err: any = new Error('Placement not found');
      err.statusCode = 404;
      err.code = 'PLACEMENT_NOT_FOUND';
      throw err;
    }

    const organizationId = data.organizationId || placement.organizationId.toString();
    const startDate = data.startDate || placement.startDate;
    const endDate = data.endDate || placement.endDate;

    if (endDate < startDate) {
      const err: any = new Error('endDate must be on or after startDate');
      err.statusCode = 400;
      err.code = 'INVALID_DATE_RANGE';
      throw err;
    }

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      const err: any = new Error('Healthcare Organization not found');
      err.statusCode = 404;
      throw err;
    }

    if ([PlacementStatus.CONFIRMED, PlacementStatus.ACTIVE].includes(placement.status)) {
      const occupiedSlots = await Placement.countDocuments({
        _id: { $ne: placement._id },
        organizationId,
        status: { $in: [PlacementStatus.CONFIRMED, PlacementStatus.ACTIVE] },
      });

      if (occupiedSlots >= organization.capacity) {
        const err: any = new Error(
          `Organization placement capacity reached (${occupiedSlots}/${organization.capacity}). Cannot move this placement to the selected hospital.`
        );
        err.statusCode = 400;
        err.code = 'CAPACITY_EXCEEDED';
        throw err;
      }
    }

    const overlappingPlacement = await Placement.findOne({
      _id: { $ne: placement._id },
      studentId: placement.studentId,
      status: { $in: [PlacementStatus.PENDING, PlacementStatus.CONFIRMED, PlacementStatus.ACTIVE] },
      $or: [{ startDate: { $lte: endDate }, endDate: { $gte: startDate } }],
    });

    if (overlappingPlacement) {
      const err: any = new Error('Student already has another active or pending placement in this date range.');
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

      if (supervisor.organizationId.toString() !== organizationId.toString()) {
        const err: any = new Error('Clinical supervisor does not belong to the healthcare organization hosting this placement.');
        err.statusCode = 400;
        err.code = 'SUPERVISOR_ORGANIZATION_MISMATCH';
        throw err;
      }
    }

    const before = {
      organizationId: placement.organizationId,
      departmentId: placement.departmentId,
      supervisorId: placement.supervisorId,
      startDate: placement.startDate,
      endDate: placement.endDate,
    };

    placement.organizationId = organizationId as any;
    placement.departmentId = data.departmentId === undefined ? placement.departmentId : (data.departmentId || null) as any;
    placement.supervisorId = data.supervisorId === undefined ? placement.supervisorId : (data.supervisorId || null) as any;
    placement.startDate = startDate;
    placement.endDate = endDate;
    await placement.save();

    await ClinicalAttachment.findOneAndUpdate(
      { placementId: placement._id },
      {
        $set: {
          organizationId: placement.organizationId,
          departmentId: placement.departmentId,
          supervisorId: placement.supervisorId,
          startDate: placement.startDate,
          endDate: placement.endDate,
        },
      },
      { runValidators: true }
    );

    if (data.supervisorId !== undefined) {
      const nextAppStatus = placement.supervisorId
        ? ApplicationStatus.SUPERVISOR_ASSIGNED
        : ApplicationStatus.PLACED;
      await ApplicationService.updateStatus(
        placement.applicationId.toString(),
        nextAppStatus,
        actorUserId,
        'Placement assignment updated'
      );
    }

    await AuditLog.create({
      actorUserId,
      action: 'placement.update',
      entityType: 'Placement',
      entityId: placement._id,
      before,
      after: {
        organizationId: placement.organizationId,
        departmentId: placement.departmentId,
        supervisorId: placement.supervisorId,
        startDate: placement.startDate,
        endDate: placement.endDate,
      },
    });

    const [updated] = await this.getPlacements({ _id: placement._id });
    return updated;
  }

  static async updatePlacementStatus(actorUserId: string, placementId: string, status: PlacementStatus) {
    const placement = await Placement.findById(placementId);
    if (!placement) {
      const err: any = new Error('Placement not found');
      err.statusCode = 404;
      err.code = 'PLACEMENT_NOT_FOUND';
      throw err;
    }

    if (!Object.values(PlacementStatus).includes(status)) {
      const err: any = new Error('Invalid placement status');
      err.statusCode = 400;
      err.code = 'INVALID_PLACEMENT_STATUS';
      throw err;
    }

    const previousStatus = placement.status;
    placement.status = status;
    await placement.save();

    const attachmentStatus =
      status === PlacementStatus.ACTIVE
        ? ClinicalAttachmentStatus.IN_PROGRESS
        : status === PlacementStatus.COMPLETED
          ? ClinicalAttachmentStatus.COMPLETED
          : status === PlacementStatus.CANCELLED
            ? ClinicalAttachmentStatus.CANCELLED
            : ClinicalAttachmentStatus.NOT_STARTED;

    await ClinicalAttachment.findOneAndUpdate(
      { placementId: placement._id },
      { $set: { status: attachmentStatus } }
    );

    if (status === PlacementStatus.ACTIVE) {
      await ApplicationService.updateStatus(
        placement.applicationId.toString(),
        ApplicationStatus.ACTIVE,
        actorUserId,
        'Placement started'
      );
    } else if (status === PlacementStatus.COMPLETED) {
      await ApplicationService.updateStatus(
        placement.applicationId.toString(),
        ApplicationStatus.COMPLETED,
        actorUserId,
        'Placement completed'
      );
    }

    await AuditLog.create({
      actorUserId,
      action: 'placement.status.update',
      entityType: 'Placement',
      entityId: placement._id,
      before: { status: previousStatus },
      after: { status },
    });

    const [updated] = await this.getPlacements({ _id: placement._id });
    return updated;
  }

  static async reconcileJourneyPlacements() {
    const completedPlacementStages = await JourneyMilestone.find({
      stageKey: JourneyStageKey.PLACEMENT,
      status: JourneyStageStatus.COMPLETED,
    }).select('_id studentId');

    for (const milestone of completedPlacementStages) {
      const audit: any = await AuditLog.findOne({
        action: 'journey.placement_confirm',
        entityType: 'JourneyMilestone',
        entityId: milestone._id,
      })
        .sort({ createdAt: -1 })
        .lean();

      const after: any = audit?.after;
      if (!after) continue;

      const organizationId = after.organizationId ? String(after.organizationId) : '';
      const startDate = after.startDate ? new Date(after.startDate) : null;
      const endDate = after.endDate ? new Date(after.endDate) : null;

      if (
        !organizationId ||
        !startDate ||
        !endDate ||
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime())
      ) {
        continue;
      }

      if (after.placementId) {
        const existingById = await Placement.exists({ _id: after.placementId });
        if (existingById) continue;
      }

      const existingPlacement = await Placement.findOne({
        studentId: milestone.studentId,
        organizationId,
        startDate,
        endDate,
      }).select('_id');

      if (existingPlacement) continue;

      const application: any = await Application.findOne({
        studentId: milestone.studentId,
      })
        .sort({ createdAt: -1 })
        .select('_id');

      const createdBy = audit.actorUserId || audit.actorId;
      if (!application || !createdBy) continue;

      let placement: any;
      try {
        placement = await Placement.create({
          ...(after.placementId ? { _id: after.placementId } : {}),
          applicationId: application._id,
          studentId: milestone.studentId,
          organizationId,
          departmentId: after.departmentId || null,
          supervisorId: after.supervisorId || null,
          startDate,
          endDate,
          status: PlacementStatus.CONFIRMED,
          createdBy,
        });
      } catch (error: any) {
        if (error?.code === 11000 && after.placementId) {
          placement = await Placement.findById(after.placementId);
        } else {
          throw error;
        }
      }

      if (!placement) continue;

      await ClinicalAttachment.findOneAndUpdate(
        { placementId: placement._id },
        {
          $setOnInsert: {
            placementId: placement._id,
            studentId: milestone.studentId,
            organizationId,
            departmentId: after.departmentId || null,
            supervisorId: after.supervisorId || null,
            startDate,
            endDate,
            status: ClinicalAttachmentStatus.NOT_STARTED,
          },
        },
        { upsert: true, new: true, runValidators: true }
      );

      await AuditLog.create({
        actorUserId: createdBy,
        actorId: createdBy,
        action: 'placement.reconciled_from_journey',
        entityType: 'Placement',
        entityId: placement._id,
        after: {
          studentId: milestone.studentId,
          organizationId,
          journeyMilestoneId: milestone._id,
        },
      });
    }
  }

  static async getPlacements(filters: any) {
    return Placement.find(filters)
      .populate({
        path: 'studentId',
        populate: [
          { path: 'userId', select: 'firstName lastName email' },
          { path: 'universityId', select: 'name code' },
          { path: 'programmeId', select: 'name code' },
        ],
      })
      .populate({
        path: 'applicationId',
        populate: [
          { path: 'universityId', select: 'name code' },
          { path: 'programmeId', select: 'name code' },
        ],
      })
      .populate('organizationId')
      .populate('departmentId')
      .populate({ path: 'supervisorId', populate: { path: 'userId', select: 'firstName lastName email' } })
      .sort({ startDate: -1 });
  }
}
