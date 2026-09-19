import mongoose from 'mongoose';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { TrainingBatch } from '../models/TrainingBatch.js';
import { University } from '../models/University.js';
import { Application } from '../models/Application.js';
import { AuditLog } from '../models/Notification.js';

const normalizeBatchNumber = (value: unknown) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

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
      const universityId = String(req.query.universityId || '');
      const filter: any = {};

      if (universityId) {
        if (!mongoose.Types.ObjectId.isValid(universityId)) {
          res.status(400).json({
            success: false,
            error: { code: 'INVALID_UNIVERSITY', message: 'University is invalid' },
          });
          return;
        }
        filter.universityId = new mongoose.Types.ObjectId(universityId);
      }

      const batches = await TrainingBatch.find(filter)
        .populate('universityId', 'name code')
        .sort({ status: 1, createdAt: -1 })
        .lean();

      const ids = batches.map((batch) => batch._id);
      const counts = ids.length
        ? await Application.aggregate([
            { $match: { batchId: { $in: ids } } },
            { $group: { _id: '$batchId', students: { $sum: 1 } } },
          ])
        : [];

      const countMap = new Map(counts.map((item: any) => [String(item._id), Number(item.students || 0)]));

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

      const universityId = String(req.body?.universityId || '');
      if (!mongoose.Types.ObjectId.isValid(universityId)) {
        res.status(400).json({
          success: false,
          error: { code: 'UNIVERSITY_REQUIRED', message: 'Select a valid university for this batch' },
        });
        return;
      }

      const university = await University.findById(universityId).select('_id name code status').lean();
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

      const name = String(req.body?.name || '').trim() || `Batch ${batchNumber}`;

      const batch = await TrainingBatch.create({
        universityId,
        batchNumber,
        name,
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
        after: {
          universityId,
          batchNumber,
          name,
          status: batch.status,
        },
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
            message: 'This batch number already exists for the selected university',
          },
        });
        return;
      }
      next(error);
    }
  }
}
