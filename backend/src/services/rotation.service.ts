import { ClinicalRotation } from '../models/ClinicalRotation.js';
import { Placement } from '../models/Placement.js';
import { Department } from '../models/Department.js';
import { ClinicalSupervisor } from '../models/ClinicalSupervisor.js';
import { AuditLog } from '../models/Notification.js';

type RotationInput = {
  title: string;
  departmentId?: string | null;
  supervisorId?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  notes?: string;
};

const dayStart = (value: Date | string) => {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

export class RotationService {
  static async refreshStatuses(filter: any = {}) {
    const rotations = await ClinicalRotation.find({ ...filter, status: { $ne: 'CANCELLED' } }).select(
      '_id startDate endDate status'
    );
    const today = dayStart(new Date());

    for (const rotation of rotations) {
      const start = dayStart(rotation.startDate);
      const end = dayStart(rotation.endDate);
      const nextStatus =
        today < start ? 'UPCOMING' :
        today > end ? 'COMPLETED' :
        'ACTIVE';

      if (rotation.status !== nextStatus) {
        rotation.status = nextStatus;
        await rotation.save();
      }
    }
  }

  static async createPlan(
    actorUserId: string,
    placementId: string,
    rotations: RotationInput[],
    replaceExisting = false
  ) {
    const placement = await Placement.findById(placementId);
    if (!placement) {
      const err: any = new Error('Placement not found');
      err.statusCode = 404;
      err.code = 'PLACEMENT_NOT_FOUND';
      throw err;
    }

    if (!Array.isArray(rotations) || rotations.length === 0) {
      const err: any = new Error('At least one rotation is required');
      err.statusCode = 400;
      err.code = 'ROTATIONS_REQUIRED';
      throw err;
    }

    if (rotations.length > 30) {
      const err: any = new Error('A rotation plan cannot contain more than 30 rotations');
      err.statusCode = 400;
      err.code = 'ROTATION_LIMIT_EXCEEDED';
      throw err;
    }

    const placementStart = dayStart(placement.startDate);
    const placementEnd = dayStart(placement.endDate);

    const normalized = rotations
      .map((item, index) => ({
        ...item,
        title: String(item.title || '').trim(),
        startDate: dayStart(item.startDate),
        endDate: dayStart(item.endDate),
        originalIndex: index,
      }))
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    for (let index = 0; index < normalized.length; index += 1) {
      const item = normalized[index];

      if (!item.title) {
        const err: any = new Error(`Rotation ${index + 1} requires a title`);
        err.statusCode = 400;
        err.code = 'ROTATION_TITLE_REQUIRED';
        throw err;
      }

      if (Number.isNaN(item.startDate.getTime()) || Number.isNaN(item.endDate.getTime())) {
        const err: any = new Error(`Rotation ${item.title} has an invalid date`);
        err.statusCode = 400;
        err.code = 'INVALID_ROTATION_DATE';
        throw err;
      }

      if (item.endDate < item.startDate) {
        const err: any = new Error(`Rotation ${item.title} end date must be on or after start date`);
        err.statusCode = 400;
        err.code = 'INVALID_ROTATION_DATE_RANGE';
        throw err;
      }

      if (item.startDate < placementStart || item.endDate > placementEnd) {
        const err: any = new Error(`Rotation ${item.title} must stay within the placement date range`);
        err.statusCode = 400;
        err.code = 'ROTATION_OUTSIDE_PLACEMENT';
        throw err;
      }

      const previous = normalized[index - 1];
      if (previous && item.startDate <= previous.endDate) {
        const err: any = new Error(`Rotation ${item.title} overlaps with ${previous.title}`);
        err.statusCode = 400;
        err.code = 'ROTATION_OVERLAP';
        throw err;
      }

      if (item.departmentId) {
        const department = await Department.findOne({
          _id: item.departmentId,
          organizationId: placement.organizationId,
          status: 'ACTIVE',
        });
        if (!department) {
          const err: any = new Error(`Department for rotation ${item.title} does not belong to the placement hospital`);
          err.statusCode = 400;
          err.code = 'ROTATION_DEPARTMENT_MISMATCH';
          throw err;
        }
      }

      if (item.supervisorId) {
        const supervisor = await ClinicalSupervisor.findOne({
          _id: item.supervisorId,
          organizationId: placement.organizationId,
          status: 'ACTIVE',
        });
        if (!supervisor) {
          const err: any = new Error(`Supervisor for rotation ${item.title} does not belong to the placement hospital`);
          err.statusCode = 400;
          err.code = 'ROTATION_SUPERVISOR_MISMATCH';
          throw err;
        }
      }
    }

    const existingCount = await ClinicalRotation.countDocuments({ placementId });
    if (existingCount > 0 && !replaceExisting) {
      const err: any = new Error('This placement already has a rotation plan. Use replaceExisting to rebuild it.');
      err.statusCode = 409;
      err.code = 'ROTATION_PLAN_EXISTS';
      throw err;
    }

    if (replaceExisting) {
      await ClinicalRotation.deleteMany({ placementId });
    }

    const docs = normalized.map((item, index) => ({
      placementId: placement._id,
      studentId: placement.studentId,
      organizationId: placement.organizationId,
      departmentId: item.departmentId || null,
      supervisorId: item.supervisorId || null,
      title: item.title,
      sequence: index + 1,
      startDate: item.startDate,
      endDate: item.endDate,
      status: 'UPCOMING' as const,
      notes: item.notes,
      createdBy: actorUserId,
    }));

    const created = await ClinicalRotation.insertMany(docs);

    await AuditLog.create({
      actorUserId,
      action: replaceExisting ? 'rotation.plan.replace' : 'rotation.plan.create',
      entityType: 'Placement',
      entityId: placement._id,
      after: {
        placementId: placement._id,
        studentId: placement.studentId,
        rotations: created.map((rotation) => ({
          rotationId: rotation._id,
          title: rotation.title,
          sequence: rotation.sequence,
          startDate: rotation.startDate,
          endDate: rotation.endDate,
        })),
      },
    });

    await this.refreshStatuses({ placementId });
    return this.getRotations({ placementId });
  }

  static async getRotations(filter: any = {}) {
    await this.refreshStatuses(filter);

    return ClinicalRotation.find(filter)
      .populate({
        path: 'studentId',
        populate: [
          { path: 'userId', select: 'firstName lastName email' },
          { path: 'universityId', select: 'name code' },
          { path: 'programmeId', select: 'name code' },
        ],
      })
      .populate({
        path: 'placementId',
        populate: [
          { path: 'organizationId', select: 'name city country' },
          { path: 'departmentId', select: 'name code' },
          { path: 'supervisorId', populate: { path: 'userId', select: 'firstName lastName email' } },
        ],
      })
      .populate('organizationId', 'name city country')
      .populate('departmentId', 'name code')
      .populate({ path: 'supervisorId', populate: { path: 'userId', select: 'firstName lastName email' } })
      .sort({ studentId: 1, placementId: 1, sequence: 1 });
  }

  static async deletePlan(actorUserId: string, placementId: string) {
    const result = await ClinicalRotation.deleteMany({ placementId });
    await AuditLog.create({
      actorUserId,
      action: 'rotation.plan.delete',
      entityType: 'Placement',
      entityId: placementId,
      after: { deletedCount: result.deletedCount },
    });
    return result.deletedCount;
  }
}
