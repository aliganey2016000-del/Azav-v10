import mongoose from 'mongoose';
import { ClinicalRotation } from '../models/ClinicalRotation.js';
import { RotationTemplate } from '../models/RotationTemplate.js';
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

export type RotationBatchItem = {
  title: string;
  departmentId: string;
  supervisorId?: string | null;
  durationDays: number;
  capacity?: number | null;
  notes?: string;
};

type TemplateInput = {
  name: string;
  organizationId: string;
  description?: string;
  items: RotationBatchItem[];
};

const dayStart = (value: Date | string) => {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const addDays = (value: Date, days: number) => {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
};

const sameDay = (a: Date | string, b: Date | string) =>
  dayStart(a).getTime() === dayStart(b).getTime();

const groupLabel = (index: number) => {
  let value = index;
  let label = '';
  do {
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);
  return label;
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

  private static async validateBatchItems(organizationId: string, items: RotationBatchItem[]) {
    if (!Array.isArray(items) || items.length === 0) {
      const err: any = new Error('At least one rotation is required');
      err.statusCode = 400;
      err.code = 'ROTATIONS_REQUIRED';
      throw err;
    }

    if (items.length > 30) {
      const err: any = new Error('A rotation plan cannot contain more than 30 rotations');
      err.statusCode = 400;
      err.code = 'ROTATION_LIMIT_EXCEEDED';
      throw err;
    }

    const normalized = items.map((item, index) => ({
      title: String(item.title || '').trim(),
      departmentId: String(item.departmentId || ''),
      supervisorId: item.supervisorId ? String(item.supervisorId) : null,
      durationDays: Math.floor(Number(item.durationDays)),
      capacity: item.capacity == null || item.capacity === ('' as any)
        ? null
        : Math.floor(Number(item.capacity)),
      notes: item.notes ? String(item.notes).trim() : undefined,
      index,
    }));

    for (const item of normalized) {
      if (!item.title) {
        const err: any = new Error(`Rotation ${item.index + 1} requires a title`);
        err.statusCode = 400;
        err.code = 'ROTATION_TITLE_REQUIRED';
        throw err;
      }

      if (!item.departmentId || !mongoose.Types.ObjectId.isValid(item.departmentId)) {
        const err: any = new Error(`Rotation ${item.title} requires a valid department`);
        err.statusCode = 400;
        err.code = 'ROTATION_DEPARTMENT_REQUIRED';
        throw err;
      }

      if (!Number.isFinite(item.durationDays) || item.durationDays < 1 || item.durationDays > 365) {
        const err: any = new Error(`Rotation ${item.title} duration must be between 1 and 365 days`);
        err.statusCode = 400;
        err.code = 'INVALID_ROTATION_DURATION';
        throw err;
      }

      if (item.capacity != null && (!Number.isFinite(item.capacity) || item.capacity < 1)) {
        const err: any = new Error(`Rotation ${item.title} capacity must be at least 1`);
        err.statusCode = 400;
        err.code = 'INVALID_ROTATION_CAPACITY';
        throw err;
      }

      const department = await Department.findOne({
        _id: item.departmentId,
        organizationId,
        status: 'ACTIVE',
      }).select('_id');

      if (!department) {
        const err: any = new Error(`Department for rotation ${item.title} does not belong to the selected hospital`);
        err.statusCode = 400;
        err.code = 'ROTATION_DEPARTMENT_MISMATCH';
        throw err;
      }

      if (item.supervisorId) {
        if (!mongoose.Types.ObjectId.isValid(item.supervisorId)) {
          const err: any = new Error(`Rotation ${item.title} has an invalid supervisor`);
          err.statusCode = 400;
          err.code = 'INVALID_ROTATION_SUPERVISOR';
          throw err;
        }

        const supervisor = await ClinicalSupervisor.findOne({
          _id: item.supervisorId,
          organizationId,
          status: 'ACTIVE',
        }).select('_id');

        if (!supervisor) {
          const err: any = new Error(`Supervisor for rotation ${item.title} does not belong to the selected hospital`);
          err.statusCode = 400;
          err.code = 'ROTATION_SUPERVISOR_MISMATCH';
          throw err;
        }
      }
    }

    return normalized;
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

  static async createBatchPlan(
    actorUserId: string,
    data: {
      placementIds: string[];
      items: RotationBatchItem[];
      groupCount?: number;
      replaceExisting?: boolean;
      templateId?: string | null;
    }
  ) {
    const placementIds = Array.from(new Set((data.placementIds || []).map(String).filter(Boolean)));
    if (placementIds.length === 0) {
      const err: any = new Error('Select at least one student placement');
      err.statusCode = 400;
      err.code = 'PLACEMENTS_REQUIRED';
      throw err;
    }

    if (placementIds.length > 1000) {
      const err: any = new Error('A batch cannot contain more than 1000 placements');
      err.statusCode = 400;
      err.code = 'BATCH_LIMIT_EXCEEDED';
      throw err;
    }

    const placements = await Placement.find({ _id: { $in: placementIds } }).sort({ studentId: 1 });
    if (placements.length !== placementIds.length) {
      const err: any = new Error('One or more selected placements could not be found');
      err.statusCode = 404;
      err.code = 'PLACEMENT_NOT_FOUND';
      throw err;
    }

    const organizationId = placements[0].organizationId.toString();
    const placementStart = placements[0].startDate;
    const placementEnd = placements[0].endDate;

    for (const placement of placements) {
      if (placement.organizationId.toString() !== organizationId) {
        const err: any = new Error('Batch rotation students must belong to the same hospital');
        err.statusCode = 400;
        err.code = 'BATCH_HOSPITAL_MISMATCH';
        throw err;
      }

      if (!sameDay(placement.startDate, placementStart) || !sameDay(placement.endDate, placementEnd)) {
        const err: any = new Error('Batch rotation students must share the same placement start and end dates');
        err.statusCode = 400;
        err.code = 'BATCH_PERIOD_MISMATCH';
        throw err;
      }
    }

    const items = await this.validateBatchItems(organizationId, data.items);
    const totalDays = items.reduce((sum, item) => sum + item.durationDays, 0);
    const availableDays =
      Math.floor((dayStart(placementEnd).getTime() - dayStart(placementStart).getTime()) / 86400000) + 1;

    if (totalDays > availableDays) {
      const err: any = new Error(
        `Rotation plan requires ${totalDays} day(s), but this placement period only has ${availableDays} day(s)`
      );
      err.statusCode = 400;
      err.code = 'ROTATION_OUTSIDE_PLACEMENT';
      throw err;
    }

    const requestedGroups = Math.floor(Number(data.groupCount || Math.min(items.length, placements.length)));
    const groupCount = Math.max(1, Math.min(requestedGroups, items.length, placements.length));

    const groups: typeof placements[] = Array.from({ length: groupCount }, () => []);
    placements.forEach((placement, index) => {
      groups[index % groupCount].push(placement);
    });

    const largestGroupSize = Math.max(...groups.map((group) => group.length));
    const restrictiveItem = items.find(
      (item) => item.capacity != null && largestGroupSize > Number(item.capacity)
    );
    if (restrictiveItem) {
      const err: any = new Error(
        `Largest group has ${largestGroupSize} student(s), exceeding ${restrictiveItem.title} capacity of ${restrictiveItem.capacity}. Increase group count or capacity.`
      );
      err.statusCode = 400;
      err.code = 'ROTATION_CAPACITY_EXCEEDED';
      throw err;
    }

    const existingCount = await ClinicalRotation.countDocuments({
      placementId: { $in: placementIds },
    });

    if (existingCount > 0 && !data.replaceExisting) {
      const err: any = new Error(
        `${existingCount} existing rotation record(s) were found for this batch. Enable replace existing plans to republish.`
      );
      err.statusCode = 409;
      err.code = 'BATCH_ROTATION_PLAN_EXISTS';
      throw err;
    }

    if (data.replaceExisting) {
      await ClinicalRotation.deleteMany({ placementId: { $in: placementIds } });
    }

    let templateObjectId: mongoose.Types.ObjectId | null = null;
    if (data.templateId) {
      if (!mongoose.Types.ObjectId.isValid(data.templateId)) {
        const err: any = new Error('Invalid rotation template');
        err.statusCode = 400;
        err.code = 'INVALID_TEMPLATE';
        throw err;
      }
      const template = await RotationTemplate.findOne({
        _id: data.templateId,
        organizationId,
      }).select('_id');
      if (!template) {
        const err: any = new Error('Rotation template does not belong to the selected hospital');
        err.statusCode = 400;
        err.code = 'TEMPLATE_HOSPITAL_MISMATCH';
        throw err;
      }
      templateObjectId = template._id as mongoose.Types.ObjectId;
    }

    const batchId = new mongoose.Types.ObjectId();
    const docs: any[] = [];

    groups.forEach((group, groupIndex) => {
      const groupCode = groupLabel(groupIndex);
      group.forEach((placement) => {
        let cursor = dayStart(placement.startDate);

        for (let sequence = 0; sequence < items.length; sequence += 1) {
          const item = items[(sequence + groupIndex) % items.length];
          const startDate = new Date(cursor);
          const endDate = addDays(startDate, item.durationDays - 1);

          docs.push({
            placementId: placement._id,
            studentId: placement.studentId,
            organizationId: placement.organizationId,
            departmentId: item.departmentId,
            supervisorId: item.supervisorId || null,
            title: item.title,
            sequence: sequence + 1,
            startDate,
            endDate,
            status: 'UPCOMING',
            notes: item.notes,
            batchId,
            groupCode,
            templateId: templateObjectId,
            createdBy: actorUserId,
          });

          cursor = addDays(endDate, 1);
        }
      });
    });

    await ClinicalRotation.insertMany(docs);

    await AuditLog.create({
      actorUserId,
      action: data.replaceExisting ? 'rotation.batch.replace' : 'rotation.batch.create',
      entityType: 'ClinicalRotationBatch',
      entityId: batchId,
      after: {
        batchId,
        organizationId,
        placementIds,
        studentCount: placements.length,
        groupCount,
        groupSizes: groups.map((group) => group.length),
        rotationCount: items.length,
        templateId: templateObjectId,
        totalDays,
      },
    });

    await this.refreshStatuses({ batchId });

    return {
      batchId: batchId.toString(),
      organizationId,
      studentCount: placements.length,
      groupCount,
      groupSizes: groups.map((group, index) => ({
        groupCode: groupLabel(index),
        studentCount: group.length,
      })),
      rotations: await this.getRotations({ batchId }),
    };
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
      .populate('templateId', 'name')
      .sort({ batchId: 1, groupCode: 1, studentId: 1, sequence: 1 });
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

  static async listTemplates(organizationId?: string) {
    const filter = organizationId ? { organizationId } : {};
    return RotationTemplate.find(filter)
      .populate('organizationId', 'name code')
      .populate('items.departmentId', 'name code')
      .populate({ path: 'items.supervisorId', populate: { path: 'userId', select: 'firstName lastName email' } })
      .sort({ updatedAt: -1 });
  }

  static async saveTemplate(actorUserId: string, data: TemplateInput, templateId?: string) {
    if (!data.name?.trim() || !data.organizationId) {
      const err: any = new Error('Template name and hospital are required');
      err.statusCode = 400;
      err.code = 'TEMPLATE_FIELDS_REQUIRED';
      throw err;
    }

    const items = await this.validateBatchItems(data.organizationId, data.items);

    const payload = {
      name: data.name.trim(),
      organizationId: data.organizationId,
      description: data.description?.trim() || undefined,
      items: items.map((item) => ({
        title: item.title,
        departmentId: item.departmentId,
        supervisorId: item.supervisorId || null,
        durationDays: item.durationDays,
        capacity: item.capacity,
        notes: item.notes,
      })),
      createdBy: actorUserId,
    };

    let template: any;
    if (templateId) {
      template = await RotationTemplate.findById(templateId);
      if (!template) {
        const err: any = new Error('Rotation template not found');
        err.statusCode = 404;
        err.code = 'TEMPLATE_NOT_FOUND';
        throw err;
      }
      template.name = payload.name;
      template.organizationId = payload.organizationId as any;
      template.description = payload.description;
      template.items = payload.items as any;
      await template.save();
    } else {
      template = await RotationTemplate.create(payload);
    }

    await AuditLog.create({
      actorUserId,
      action: templateId ? 'rotation.template.update' : 'rotation.template.create',
      entityType: 'RotationTemplate',
      entityId: template._id,
      after: {
        name: template.name,
        organizationId: template.organizationId,
        itemCount: template.items.length,
      },
    });

    const [populated] = await this.listTemplates(template.organizationId.toString());
    const exact = await RotationTemplate.findById(template._id)
      .populate('organizationId', 'name code')
      .populate('items.departmentId', 'name code')
      .populate({ path: 'items.supervisorId', populate: { path: 'userId', select: 'firstName lastName email' } });
    return exact || populated;
  }

  static async deleteTemplate(actorUserId: string, templateId: string) {
    const template = await RotationTemplate.findById(templateId);
    if (!template) {
      const err: any = new Error('Rotation template not found');
      err.statusCode = 404;
      err.code = 'TEMPLATE_NOT_FOUND';
      throw err;
    }

    await RotationTemplate.deleteOne({ _id: template._id });
    await AuditLog.create({
      actorUserId,
      action: 'rotation.template.delete',
      entityType: 'RotationTemplate',
      entityId: template._id,
      before: { name: template.name, organizationId: template.organizationId },
    });
  }
}
