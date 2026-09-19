import mongoose from 'mongoose';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Payment, FinanceRecordStatus, FinanceRecordType } from '../models/Payment.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/Notification.js';
import { UserRole } from '../types/index.js';

const GLOBAL_FINANCE_ROLES = [UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF];
const FINANCE_TYPES: FinanceRecordType[] = ['FEE', 'PAYMENT', 'REFUND', 'SETTLEMENT'];
const FINANCE_STATUSES: FinanceRecordStatus[] = [
  'PENDING',
  'PAID',
  'PARTIAL',
  'OVERDUE',
  'REFUNDED',
  'CANCELLED',
];

const isGlobalFinanceUser = (req: AuthenticatedRequest) =>
  Boolean(req.user?.roles.some((role) => GLOBAL_FINANCE_ROLES.includes(role)));

const parseDate = (value: unknown) => {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

const escapeRegex = (value: string) => value.replace(/[.*+?^$()|[\]\\]/g, '\\$&');

const defaultStatusForType = (type: FinanceRecordType): FinanceRecordStatus =>
  type === 'FEE' ? 'PENDING' : type === 'REFUND' ? 'REFUNDED' : 'PAID';

const nextInvoiceNumber = () =>
  'INV-' +
  new Date().toISOString().slice(0, 10).replace(/-/g, '') +
  '-' +
  Date.now().toString().slice(-6);

const nextReference = (type: FinanceRecordType) =>
  type.slice(0, 3) + '-' + Date.now().toString().slice(-10);

export class FinanceController {
  private static async scopedFilter(req: AuthenticatedRequest) {
    if (!req.user) return { _id: null };

    if (isGlobalFinanceUser(req)) return {};

    const roles = req.user.roles;

    if (roles.includes(UserRole.UNIVERSITY_ADMIN) || roles.includes(UserRole.UNIVERSITY_STAFF)) {
      if (!req.user.universityId) return { _id: null };
      const users = await User.find({ universityId: req.user.universityId }).select('_id').lean();
      return { userId: { $in: users.map((user) => user._id) } };
    }

    if (roles.includes(UserRole.ORGANIZATION_ADMIN) || roles.includes(UserRole.ORGANIZATION_STAFF)) {
      if (!req.user.organizationId) return { _id: null };
      const users = await User.find({ organizationId: req.user.organizationId }).select('_id').lean();
      return {
        $or: [
          { userId: { $in: users.map((user) => user._id) } },
          { organizationId: req.user.organizationId },
        ],
      };
    }

    return { userId: req.user.userId };
  }

  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter: any = await FinanceController.scopedFilter(req);

      const type = String(req.query.type || '').toUpperCase();
      const status = String(req.query.status || '').toUpperCase();
      const search = String(req.query.search || '').trim();

      if (type && FINANCE_TYPES.includes(type as FinanceRecordType)) filter.type = type;
      if (status && FINANCE_STATUSES.includes(status as FinanceRecordStatus)) filter.status = status;

      if (search) {
        const regex = new RegExp(escapeRegex(search), 'i');
        const matchingUsers = isGlobalFinanceUser(req)
          ? await User.find({
              $or: [
                { firstName: regex },
                { lastName: regex },
                { email: regex },
              ],
            })
              .select('_id')
              .limit(100)
              .lean()
          : [];

        const searchClause = {
          $or: [
            { invoiceNumber: regex },
            { reference: regex },
            { description: regex },
            { userId: { $in: matchingUsers.map((user) => user._id) } },
          ],
        };

        if (filter.$or) {
          filter.$and = [{ $or: filter.$or }, searchClause];
          delete filter.$or;
        } else {
          Object.assign(filter, searchClause);
        }
      }

      const records = await Payment.find(filter)
        .populate('userId', 'firstName lastName email phone universityId organizationId')
        .populate('applicationId', 'status programmeText specialtyText')
        .populate('organizationId', 'name code city country')
        .populate('originalPaymentId', 'invoiceNumber reference amount type')
        .sort({ createdAt: -1 })
        .lean();

      res.json({ success: true, data: records });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !isGlobalFinanceUser(req)) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Finance management requires AZAAM finance access' },
        });
        return;
      }

      const type = String(req.body?.type || '').toUpperCase() as FinanceRecordType;
      const status = String(req.body?.status || defaultStatusForType(type)).toUpperCase() as FinanceRecordStatus;
      const userId = String(req.body?.userId || '');
      const amount = Number(req.body?.amount);
      const description = String(req.body?.description || '').trim();

      if (!FINANCE_TYPES.includes(type)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_TYPE', message: 'Invalid finance record type' },
        });
        return;
      }

      if (type !== 'SETTLEMENT' && !mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_USER', message: 'A valid account is required' },
        });
        return;
      }

      const organizationId = String(req.body?.organizationId || '');
      if (type === 'SETTLEMENT' && !mongoose.Types.ObjectId.isValid(organizationId)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_ORGANIZATION', message: 'A beneficiary organization is required for settlements' },
        });
        return;
      }

      if (!description) {
        res.status(400).json({
          success: false,
          error: { code: 'DESCRIPTION_REQUIRED', message: 'Description is required' },
        });
        return;
      }

      if (!Number.isFinite(amount) || amount < 0) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_AMOUNT', message: 'Amount must be zero or greater' },
        });
        return;
      }

      if (!FINANCE_STATUSES.includes(status)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: 'Invalid finance status' },
        });
        return;
      }

      const record = await Payment.create({
        userId: type === 'SETTLEMENT' && !userId ? null : userId,
        applicationId: req.body?.applicationId || null,
        organizationId: organizationId || null,
        originalPaymentId: req.body?.originalPaymentId || null,
        invoiceNumber:
          type === 'FEE'
            ? String(req.body?.invoiceNumber || '').trim() || nextInvoiceNumber()
            : String(req.body?.invoiceNumber || '').trim() || undefined,
        type,
        description,
        amount,
        currency: String(req.body?.currency || 'USD').toUpperCase(),
        status,
        dueDate: parseDate(req.body?.dueDate),
        paidAt: parseDate(req.body?.paidAt) || (type !== 'FEE' ? new Date() : null),
        reference:
          String(req.body?.reference || '').trim() || (type !== 'FEE' ? nextReference(type) : undefined),
        paymentMethod: req.body?.paymentMethod || undefined,
        notes: String(req.body?.notes || '').trim() || undefined,
        createdBy: req.user.userId,
      });

      await AuditLog.create({
        actorUserId: req.user.userId,
        action: 'finance.record.create',
        entityType: 'Payment',
        entityId: record._id,
        after: {
          type: record.type,
          amount: record.amount,
          currency: record.currency,
          status: record.status,
          userId: record.userId,
          invoiceNumber: record.invoiceNumber,
          reference: record.reference,
        },
      });

      const populated = await Payment.findById(record._id)
        .populate('userId', 'firstName lastName email phone universityId organizationId')
        .populate('organizationId', 'name code city country')
        .populate('originalPaymentId', 'invoiceNumber reference amount type')
        .lean();

      res.status(201).json({ success: true, data: populated });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !isGlobalFinanceUser(req)) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Finance management requires AZAAM finance access' },
        });
        return;
      }

      const record = await Payment.findById(req.params.id);
      if (!record) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Finance record not found' },
        });
        return;
      }

      const before = record.toObject();

      if (req.body?.description !== undefined) {
        record.description = String(req.body.description || '').trim();
      }

      if (req.body?.amount !== undefined) {
        const amount = Number(req.body.amount);
        if (!Number.isFinite(amount) || amount < 0) {
          res.status(400).json({
            success: false,
            error: { code: 'INVALID_AMOUNT', message: 'Amount must be zero or greater' },
          });
          return;
        }
        record.amount = amount;
      }

      if (req.body?.currency !== undefined) {
        record.currency = String(req.body.currency || 'USD').toUpperCase();
      }

      if (req.body?.status !== undefined) {
        const nextStatus = String(req.body.status).toUpperCase() as FinanceRecordStatus;
        if (!FINANCE_STATUSES.includes(nextStatus)) {
          res.status(400).json({
            success: false,
            error: { code: 'INVALID_STATUS', message: 'Invalid finance status' },
          });
          return;
        }
        record.status = nextStatus;
      }

      if (req.body?.invoiceNumber !== undefined) {
        record.invoiceNumber = String(req.body.invoiceNumber || '').trim() || undefined;
      }
      if (req.body?.reference !== undefined) {
        record.reference = String(req.body.reference || '').trim() || undefined;
      }
      if (req.body?.paymentMethod !== undefined) {
        record.paymentMethod = req.body.paymentMethod || undefined;
      }
      if (req.body?.notes !== undefined) {
        record.notes = String(req.body.notes || '').trim() || undefined;
      }
      if (req.body?.dueDate !== undefined) record.dueDate = parseDate(req.body.dueDate);
      if (req.body?.paidAt !== undefined) record.paidAt = parseDate(req.body.paidAt);
      if (req.body?.organizationId !== undefined) {
        record.organizationId = req.body.organizationId || null;
      }

      await record.save();

      await AuditLog.create({
        actorUserId: req.user.userId,
        action: 'finance.record.update',
        entityType: 'Payment',
        entityId: record._id,
        before,
        after: record.toObject(),
      });

      const populated = await Payment.findById(record._id)
        .populate('userId', 'firstName lastName email phone universityId organizationId')
        .populate('organizationId', 'name code city country')
        .populate('originalPaymentId', 'invoiceNumber reference amount type')
        .lean();

      res.json({ success: true, data: populated });
    } catch (error) {
      next(error);
    }
  }

  static async remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.roles.includes(UserRole.SUPER_ADMIN)) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Only Super Admin can permanently delete finance records' },
        });
        return;
      }

      const record = await Payment.findById(req.params.id);
      if (!record) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Finance record not found' },
        });
        return;
      }

      const before = record.toObject();
      await Payment.deleteOne({ _id: record._id });

      await AuditLog.create({
        actorUserId: req.user.userId,
        action: 'finance.record.delete',
        entityType: 'Payment',
        entityId: record._id,
        before,
      });

      res.json({ success: true, data: { deleted: true } });
    } catch (error) {
      next(error);
    }
  }

  static async refund(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !isGlobalFinanceUser(req)) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Finance management requires AZAAM finance access' },
        });
        return;
      }

      const original = await Payment.findById(req.params.id);
      if (!original) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Original payment record not found' },
        });
        return;
      }

      if (original.type !== 'PAYMENT' || !original.userId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REFUND_SOURCE',
            message: 'Refunds must be created from an original user payment record',
          },
        });
        return;
      }

      const existingRefunds = await Payment.aggregate([
        { $match: { originalPaymentId: original._id, type: 'REFUND' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const refundedSoFar = Number(existingRefunds[0]?.total || 0);
      const refundableBalance = Math.max(0, original.amount - refundedSoFar);

      const amount = Number(req.body?.amount ?? refundableBalance);
      if (!Number.isFinite(amount) || amount <= 0 || amount > refundableBalance) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REFUND_AMOUNT',
            message: 'Refund amount must be greater than zero and cannot exceed the remaining refundable balance',
          },
        });
        return;
      }

      const refund = await Payment.create({
        userId: original.userId,
        applicationId: original.applicationId || null,
        organizationId: original.organizationId || null,
        originalPaymentId: original._id,
        type: 'REFUND',
        description: String(req.body?.description || 'Refund for ' + original.description).trim(),
        amount,
        currency: original.currency,
        status: 'REFUNDED',
        paidAt: new Date(),
        reference: String(req.body?.reference || '').trim() || nextReference('REFUND'),
        paymentMethod: req.body?.paymentMethod || original.paymentMethod,
        notes: String(req.body?.notes || '').trim() || undefined,
        createdBy: req.user.userId,
      });

      if (refundedSoFar + amount >= original.amount) {
        original.status = 'REFUNDED';
        await original.save();
      }

      await AuditLog.create({
        actorUserId: req.user.userId,
        action: 'finance.refund.create',
        entityType: 'Payment',
        entityId: refund._id,
        after: {
          originalPaymentId: original._id,
          amount,
          currency: original.currency,
          userId: original.userId,
        },
      });

      const populated = await Payment.findById(refund._id)
        .populate('userId', 'firstName lastName email phone universityId organizationId')
        .populate('organizationId', 'name code city country')
        .populate('originalPaymentId', 'invoiceNumber reference amount type')
        .lean();

      res.status(201).json({ success: true, data: populated });
    } catch (error) {
      next(error);
    }
  }
}
