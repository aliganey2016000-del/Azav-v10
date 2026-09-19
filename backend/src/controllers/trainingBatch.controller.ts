import mongoose from 'mongoose';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { TrainingBatch } from '../models/TrainingBatch.js';
import { University } from '../models/University.js';
import { Application } from '../models/Application.js';
import { AuditLog } from '../models/Notification.js';
import { UserRole } from '../types/index.js';

const isUniversityActor = (roles: UserRole[]) =>
  roles.includes(UserRole.UNIVERSITY_ADMIN) || roles.includes(UserRole.UNIVERSITY_STAFF);

const normalizeBatchNumber = (value: unknown) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

const parseDate = (value: unknown): Date | null => {
  if (!value) return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const resolveUniversityId = (req: AuthenticatedRequest): string => {
  if (!req.user) return '';
  if (isUniversityActor(req.user.roles)) return String(req.user.universityId || '');
  return String(req.body?.universityId || req.query?.universityId || '');
};

const generateBatchNumber = async (universityId: string, universityCode?: string) => {
  const prefix = normalizeBatchNumber(universityCode || 'BATCH') || 'BATCH';
  const year = new Date().getUTCFullYear();
  let sequence = (await TrainingBatch.countDocuments({ universityId })) + 1;

  while (sequence < 10000) {
    const candidate = `${prefix}-${year}-${String(sequence).padStart(3, '0')}`;
    const exists = await TrainingBatch.exists({ universityId, batchNumber: candidate });
    if (!exists) return candidate;
    sequence += 1;
  }

  return `${prefix}-${year}-${Date.now().toString().slice(-6)}`;
};

export class TrainingBatchController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHENTICATED', message: 'User not authenticated' },
        });
        return;
      }

      const universityId = resolveUniversityId(req);
      if (!mongoose.Types.ObjectId.isValid(universityId)) {
        res.status(400).json({
          success: false,
          error: { code: 'UNIVERSITY_REQUIRED', message: 'A valid university is required' },
        });
        return;
      }

      const batches = await TrainingBatch.find({ universityId })
        .populate('universityId', 'name code')
        .sort({ status: 1, intakeDate: -1, createdAt: -1 })
        .lean();

      const ids = batches.map((batch) => batch._id);
      const counts = ids.length
        ? await Application.aggregate([
            { $match: { batchId: { $in: ids } } },
            { $group: { _id: '$batchId', students: { $sum: 1 } } },
          ])
        : [];

      const countMap = new Map(
        counts.map((item: any) => [String(item._id), Number(item.students || 0)])
      );

      res.json({
        success: true,
        data: batches.map((batch: any) => ({
          ...batch,
          studentsCount: countMap.get(String(batch._id)) || 0,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHENTICATED', message: 'User not authenticated' },
        });
        return;
      }

      const universityId = resolveUniversityId(req);
      if (!mongoose.Types.ObjectId.isValid(universityId)) {
        res.status(400).json({
          success: false,
          error: { code: 'UNIVERSITY_REQUIRED', message: 'A valid university is required' },
        });
        return;
      }

      const university = await University.findById(universityId).select('_id name code').lean();
      if (!university) {
        res.status(404).json({
          success: false,
          error: { code: 'UNIVERSITY_NOT_FOUND', message: 'University not found' },
        });
        return;
      }

      let batchNumber = normalizeBatchNumber(req.body?.batchNumber);
      if (!batchNumber) {
        batchNumber = await generateBatchNumber(universityId, university.code);
      }

      const intakeDate = parseDate(req.body?.intakeDate);
      const name =
        String(req.body?.name || '').trim() ||
        `${university.code || university.name} Intake ${batchNumber}`;

      const batch = await TrainingBatch.create({
        universityId,
        batchNumber,
        name,
        intakeDate,
        status: 'OPEN',
        createdBy: req.user.userId,
      });

      await AuditLog.create({
        actorUserId: req.user.userId,
        actorId: req.user.userId,
        actorEmail: req.user.email,
        action: 'training_batch.create',
        entityType: 'TrainingBatch',
        entityId: batch._id,
        after: { universityId, batchNumber, name, intakeDate, status: batch.status },
      });

      const populated = await TrainingBatch.findById(batch._id)
        .populate('universityId', 'name code')
        .lean();

      res.status(201).json({
        success: true,
        data: { ...populated, studentsCount: 0 },
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        res.status(409).json({
          success: false,
          error: {
            code: 'BATCH_NUMBER_EXISTS',
            message: 'This Batch No already exists for your university',
          },
        });
        return;
      }
      next(error);
    }
  }
}
