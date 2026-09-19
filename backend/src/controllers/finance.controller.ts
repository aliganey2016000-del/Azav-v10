import mongoose from 'mongoose';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Payment, FinanceRecordStatus, FinanceRecordType, FinancePayerType } from '../models/Payment.js';
import { FeeRule } from '../models/FeeRule.js';
import { User } from '../models/User.js';
import { University } from '../models/University.js';
import { Organization } from '../models/Organization.js';
import { AuditLog } from '../models/Notification.js';
import { UserRole } from '../types/index.js';
import { deriveInvoiceStatus, isFinanceStatusAllowed } from '../services/financeRules.js';

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

const nextInvoiceNumber = () =>
  'INV-' +
  new Date().toISOString().slice(0, 10).replace(/-/g, '') +
  '-' +
  Date.now().toString().slice(-6);

const nextReference = (type: FinanceRecordType) =>
  type.slice(0, 3) + '-' + Date.now().toString().slice(-10);

const positiveAmount = (value: unknown) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
};

const PAYER_TYPES: FinancePayerType[] = ['UNIVERSITY', 'STUDENT', 'ORGANIZATION'];

const normalizeInvoiceLineItems = async (
  rawItems: any[],
  payerType: FinancePayerType,
  universityId?: string
) => {
  const items = Array.isArray(rawItems) ? rawItems : [];
  if (!items.length) return [];

  const normalized: any[] = [];
  let currency = '';

  for (const item of items) {
    const feeRuleId = String(item?.feeRuleId || '');
    const quantity = positiveAmount(item?.quantity ?? 1);

    if (!mongoose.Types.ObjectId.isValid(feeRuleId) || !quantity) {
      const err: any = new Error('Each invoice service requires a valid pricing rule and quantity');
      err.statusCode = 400;
      err.code = 'INVALID_INVOICE_LINE';
      throw err;
    }

    const rule = await FeeRule.findOne({ _id: feeRuleId, status: 'ACTIVE' }).lean();
    if (!rule) {
      const err: any = new Error('One of the selected service pricing rules is unavailable');
      err.statusCode = 400;
      err.code = 'FEE_RULE_UNAVAILABLE';
      throw err;
    }

    if (rule.defaultPayer !== payerType) {
      const err: any = new Error('Selected service pricing rule does not apply to this payer');
      err.statusCode = 400;
      err.code = 'FEE_RULE_PAYER_MISMATCH';
      throw err;
    }

    if (
      rule.scope === 'UNIVERSITY' &&
      (!universityId || String(rule.universityId || '') !== universityId)
    ) {
      const err: any = new Error('Selected university-specific pricing rule does not apply to this university');
      err.statusCode = 400;
      err.code = 'FEE_RULE_SCOPE_MISMATCH';
      throw err;
    }

    if (rule.scope === 'GLOBAL' && universityId) {
      const specific = await FeeRule.findOne({
        serviceCode: rule.serviceCode,
        scope: 'UNIVERSITY',
        universityId: new mongoose.Types.ObjectId(universityId),
        defaultPayer: payerType,
        status: 'ACTIVE',
      }).lean();

      if (specific) {
        const err: any = new Error(
          'A university-specific price exists for ' + rule.serviceName + '. Use the university-specific rule.'
        );
        err.statusCode = 400;
        err.code = 'UNIVERSITY_PRICE_OVERRIDE_REQUIRED';
        throw err;
      }
    }

    if (currency && currency !== rule.currency) {
      const err: any = new Error('All services on one invoice must use the same currency');
      err.statusCode = 400;
      err.code = 'MIXED_INVOICE_CURRENCY';
      throw err;
    }
    currency = rule.currency;

    normalized.push({
      feeRuleId: rule._id,
      serviceCode: rule.serviceCode,
      serviceName: rule.serviceName,
      category: rule.category,
      billingBasis: rule.billingBasis,
      quantity,
      unitPrice: rule.amount,
      amount: Number((rule.amount * quantity).toFixed(2)),
      notes: String(item?.notes || '').trim() || undefined,
    });
  }

  return normalized;
};

const populateFinanceRecord = (id: mongoose.Types.ObjectId | string) =>
  Payment.findById(id)
    .populate('userId', 'firstName lastName email phone universityId organizationId')
    .populate('universityId', 'name code city country email phone')
    .populate('applicationId', 'status programmeText specialtyText')
    .populate('organizationId', 'name code city country')
    .populate('invoiceId', 'invoiceNumber amount currency status description dueDate userId universityId payerType')
    .populate('originalPaymentId', 'invoiceId invoiceNumber reference amount type status')
    .lean();

export class FinanceController {
  private static async scopedFilter(req: AuthenticatedRequest) {
    if (!req.user) return { _id: null };

    if (isGlobalFinanceUser(req)) return {};

    const roles = req.user.roles;

    if (roles.includes(UserRole.UNIVERSITY_ADMIN) || roles.includes(UserRole.UNIVERSITY_STAFF)) {
      if (!req.user.universityId) return { _id: null };
      const users = await User.find({ universityId: req.user.universityId }).select('_id').lean();
      return {
        $or: [
          { universityId: req.user.universityId },
          { userId: { $in: users.map((user) => user._id) } },
        ],
      };
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

  private static async invoiceFinancials(invoiceId: mongoose.Types.ObjectId | string) {
    const objectId =
      typeof invoiceId === 'string' ? new mongoose.Types.ObjectId(invoiceId) : invoiceId;

    const [paymentTotals, refundTotals] = await Promise.all([
      Payment.aggregate([
        {
          $match: {
            invoiceId: objectId,
            type: 'PAYMENT',
            status: { $ne: 'CANCELLED' },
          },
        },
        { $group: { _id: '$invoiceId', total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        {
          $match: {
            invoiceId: objectId,
            type: 'REFUND',
            status: { $ne: 'CANCELLED' },
          },
        },
        { $group: { _id: '$invoiceId', total: { $sum: '$amount' } } },
      ]),
    ]);

    const grossPaid = Number(paymentTotals[0]?.total || 0);
    const refunded = Number(refundTotals[0]?.total || 0);
    const netPaid = Math.max(0, grossPaid - refunded);

    return { grossPaid, refunded, netPaid };
  }

  private static async refreshInvoice(invoiceId?: mongoose.Types.ObjectId | string | null) {
    if (!invoiceId) return;

    const invoice = await Payment.findOne({ _id: invoiceId, type: 'FEE' });
    if (!invoice || invoice.status === 'CANCELLED') return;

    const { netPaid } = await FinanceController.invoiceFinancials(invoice._id);
    const nextStatus = deriveInvoiceStatus({
      amount: invoice.amount,
      netPaid,
      dueDate: invoice.dueDate,
      currentStatus: invoice.status,
    });

    if (invoice.status !== nextStatus) {
      invoice.status = nextStatus;
      await invoice.save();
    }
  }

  private static async decorateInvoiceBalances(records: any[]) {
    const invoiceIds = records
      .filter((record) => record.type === 'FEE')
      .map((record) => record._id as mongoose.Types.ObjectId);

    if (!invoiceIds.length) return records;

    const [paymentTotals, refundTotals] = await Promise.all([
      Payment.aggregate([
        {
          $match: {
            invoiceId: { $in: invoiceIds },
            type: 'PAYMENT',
            status: { $ne: 'CANCELLED' },
          },
        },
        { $group: { _id: '$invoiceId', total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        {
          $match: {
            invoiceId: { $in: invoiceIds },
            type: 'REFUND',
            status: { $ne: 'CANCELLED' },
          },
        },
        { $group: { _id: '$invoiceId', total: { $sum: '$amount' } } },
      ]),
    ]);

    const payments = new Map(paymentTotals.map((item) => [String(item._id), Number(item.total || 0)]));
    const refunds = new Map(refundTotals.map((item) => [String(item._id), Number(item.total || 0)]));

    return records.map((record) => {
      if (record.type !== 'FEE') return record;
      const id = String(record._id);
      const grossPaid = payments.get(id) || 0;
      const refundedAmount = refunds.get(id) || 0;
      const paidAmount = Math.max(0, grossPaid - refundedAmount);
      return {
        ...record,
        paidAmount,
        refundedAmount,
        balance: Math.max(0, Number(record.amount || 0) - paidAmount),
      };
    });
  }

  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await Payment.updateMany(
        {
          type: 'FEE',
          status: 'PENDING',
          dueDate: { $ne: null, $lt: new Date() },
        },
        { $set: { status: 'OVERDUE' } }
      );

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
              $or: [{ firstName: regex }, { lastName: regex }, { email: regex }],
            })
              .select('_id')
              .limit(250)
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
        .populate('universityId', 'name code city country email phone')
        .populate('applicationId', 'status programmeText specialtyText')
        .populate('organizationId', 'name code city country')
        .populate('invoiceId', 'invoiceNumber amount currency status description dueDate userId universityId payerType')
        .populate('originalPaymentId', 'invoiceId invoiceNumber reference amount type status')
        .sort({ createdAt: -1 })
        .lean();

      const decorated = await FinanceController.decorateInvoiceBalances(records);
      res.json({ success: true, data: decorated });
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
      const amount = positiveAmount(req.body?.amount);
      const description = String(req.body?.description || '').trim();

      if (!FINANCE_TYPES.includes(type)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_TYPE', message: 'Invalid finance record type' },
        });
        return;
      }

      if (type === 'REFUND') {
        res.status(400).json({
          success: false,
          error: {
            code: 'REFUND_REQUIRES_PAYMENT',
            message: 'Refunds must be created from the original payment record',
          },
        });
        return;
      }

      if (!amount) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_AMOUNT', message: 'Amount must be greater than zero' },
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

      if (type === 'FEE') {
        const userId = String(req.body?.userId || '');
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          res.status(400).json({
            success: false,
            error: { code: 'INVALID_USER', message: 'A valid account is required for an invoice' },
          });
          return;
        }

        const dueDate = parseDate(req.body?.dueDate);
        const status = deriveInvoiceStatus({ amount, netPaid: 0, dueDate });

        const record = await Payment.create({
          userId,
          applicationId: req.body?.applicationId || null,
          organizationId: req.body?.organizationId || null,
          invoiceNumber: String(req.body?.invoiceNumber || '').trim() || nextInvoiceNumber(),
          type,
          description,
          amount,
          currency: String(req.body?.currency || 'USD').toUpperCase(),
          status,
          dueDate,
          notes: String(req.body?.notes || '').trim() || undefined,
          createdBy: req.user.userId,
        });

        await AuditLog.create({
          actorUserId: req.user.userId,
          action: 'finance.invoice.create',
          entityType: 'Payment',
          entityId: record._id,
          after: record.toObject(),
        });

        res.status(201).json({ success: true, data: await populateFinanceRecord(record._id) });
        return;
      }

      if (type === 'PAYMENT') {
        const invoiceId = String(req.body?.invoiceId || '');
        if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
          res.status(400).json({
            success: false,
            error: { code: 'INVOICE_REQUIRED', message: 'Select a valid invoice for this payment' },
          });
          return;
        }

        const invoice = await Payment.findOne({ _id: invoiceId, type: 'FEE' });
        if (!invoice || invoice.status === 'CANCELLED') {
          res.status(400).json({
            success: false,
            error: { code: 'INVALID_INVOICE', message: 'The selected invoice is unavailable' },
          });
          return;
        }

        if (!invoice.userId) {
          res.status(400).json({
            success: false,
            error: { code: 'INVOICE_ACCOUNT_MISSING', message: 'The selected invoice has no account' },
          });
          return;
        }

        const suppliedUserId = String(req.body?.userId || '');
        if (suppliedUserId && suppliedUserId !== String(invoice.userId)) {
          res.status(400).json({
            success: false,
            error: { code: 'PAYMENT_ACCOUNT_MISMATCH', message: 'Payment account must match the invoice account' },
          });
          return;
        }

        const suppliedCurrency = String(req.body?.currency || invoice.currency).toUpperCase();
        if (suppliedCurrency !== invoice.currency) {
          res.status(400).json({
            success: false,
            error: { code: 'PAYMENT_CURRENCY_MISMATCH', message: 'Payment currency must match the invoice currency' },
          });
          return;
        }

        const { netPaid } = await FinanceController.invoiceFinancials(invoice._id);
        const balance = Math.max(0, invoice.amount - netPaid);
        if (amount > balance + 0.000001) {
          res.status(400).json({
            success: false,
            error: {
              code: 'PAYMENT_EXCEEDS_BALANCE',
              message: 'Payment cannot exceed the remaining invoice balance',
            },
          });
          return;
        }

        const record = await Payment.create({
          userId: invoice.userId,
          applicationId: invoice.applicationId || null,
          organizationId: invoice.organizationId || null,
          invoiceId: invoice._id,
          type,
          description,
          amount,
          currency: invoice.currency,
          status: 'PAID',
          paidAt: parseDate(req.body?.paidAt) || new Date(),
          reference: String(req.body?.reference || '').trim() || nextReference(type),
          paymentMethod: req.body?.paymentMethod || undefined,
          notes: String(req.body?.notes || '').trim() || undefined,
          createdBy: req.user.userId,
        });

        await FinanceController.refreshInvoice(invoice._id);

        await AuditLog.create({
          actorUserId: req.user.userId,
          action: 'finance.payment.create',
          entityType: 'Payment',
          entityId: record._id,
          after: {
            invoiceId: invoice._id,
            amount,
            currency: invoice.currency,
            userId: invoice.userId,
            reference: record.reference,
          },
        });

        res.status(201).json({ success: true, data: await populateFinanceRecord(record._id) });
        return;
      }

      const organizationId = String(req.body?.organizationId || '');
      if (!mongoose.Types.ObjectId.isValid(organizationId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ORGANIZATION',
            message: 'A beneficiary organization is required for settlements',
          },
        });
        return;
      }

      const requestedStatus = String(req.body?.status || 'PAID').toUpperCase() as FinanceRecordStatus;
      if (!isFinanceStatusAllowed('SETTLEMENT', requestedStatus)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: 'Invalid settlement status' },
        });
        return;
      }

      const record = await Payment.create({
        userId: null,
        organizationId,
        type: 'SETTLEMENT',
        description,
        amount,
        currency: String(req.body?.currency || 'USD').toUpperCase(),
        status: requestedStatus,
        paidAt: requestedStatus === 'PAID' ? parseDate(req.body?.paidAt) || new Date() : null,
        reference: String(req.body?.reference || '').trim() || nextReference('SETTLEMENT'),
        paymentMethod: req.body?.paymentMethod || undefined,
        notes: String(req.body?.notes || '').trim() || undefined,
        createdBy: req.user.userId,
      });

      await AuditLog.create({
        actorUserId: req.user.userId,
        action: 'finance.settlement.create',
        entityType: 'Payment',
        entityId: record._id,
        after: record.toObject(),
      });

      res.status(201).json({ success: true, data: await populateFinanceRecord(record._id) });
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

      if (record.status === 'CANCELLED') {
        res.status(400).json({
          success: false,
          error: { code: 'VOID_RECORD_IMMUTABLE', message: 'Cancelled finance records cannot be edited' },
        });
        return;
      }

      const before = record.toObject();

      if (req.body?.description !== undefined) {
        const description = String(req.body.description || '').trim();
        if (!description) {
          res.status(400).json({
            success: false,
            error: { code: 'DESCRIPTION_REQUIRED', message: 'Description is required' },
          });
          return;
        }
        record.description = description;
      }

      if (record.type === 'FEE') {
        const { netPaid, grossPaid, refunded } = await FinanceController.invoiceFinancials(record._id);

        if (req.body?.amount !== undefined) {
          const amount = positiveAmount(req.body.amount);
          if (!amount || amount + 0.000001 < netPaid) {
            res.status(400).json({
              success: false,
              error: {
                code: 'INVALID_INVOICE_AMOUNT',
                message: 'Invoice amount must be greater than zero and cannot be below the net amount already paid',
              },
            });
            return;
          }
          record.amount = amount;
        }

        if (req.body?.currency !== undefined) {
          const currency = String(req.body.currency || record.currency).toUpperCase();
          if ((grossPaid > 0 || refunded > 0) && currency !== record.currency) {
            res.status(400).json({
              success: false,
              error: {
                code: 'INVOICE_CURRENCY_LOCKED',
                message: 'Invoice currency cannot change after payment activity exists',
              },
            });
            return;
          }
          record.currency = currency;
        }

        if (req.body?.invoiceNumber !== undefined) {
          record.invoiceNumber = String(req.body.invoiceNumber || '').trim() || record.invoiceNumber;
        }
        if (req.body?.dueDate !== undefined) record.dueDate = parseDate(req.body.dueDate);
        if (req.body?.notes !== undefined) record.notes = String(req.body.notes || '').trim() || undefined;

        await record.save();
        await FinanceController.refreshInvoice(record._id);
      } else if (record.type === 'PAYMENT') {
        if (
          req.body?.amount !== undefined ||
          req.body?.currency !== undefined ||
          req.body?.invoiceId !== undefined ||
          req.body?.userId !== undefined
        ) {
          res.status(400).json({
            success: false,
            error: {
              code: 'PAYMENT_FINANCIAL_FIELDS_LOCKED',
              message: 'To correct payment amount, invoice, account or currency, void the payment and record a new one',
            },
          });
          return;
        }

        if (req.body?.reference !== undefined) {
          record.reference = String(req.body.reference || '').trim() || record.reference;
        }
        if (req.body?.paymentMethod !== undefined) record.paymentMethod = req.body.paymentMethod || undefined;
        if (req.body?.paidAt !== undefined) record.paidAt = parseDate(req.body.paidAt) || record.paidAt;
        if (req.body?.notes !== undefined) record.notes = String(req.body.notes || '').trim() || undefined;
        await record.save();
      } else if (record.type === 'REFUND') {
        if (req.body?.amount !== undefined || req.body?.currency !== undefined || req.body?.userId !== undefined) {
          res.status(400).json({
            success: false,
            error: {
              code: 'REFUND_FINANCIAL_FIELDS_LOCKED',
              message: 'Refund financial fields cannot be edited; void and recreate the refund if necessary',
            },
          });
          return;
        }

        if (req.body?.reference !== undefined) {
          record.reference = String(req.body.reference || '').trim() || record.reference;
        }
        if (req.body?.notes !== undefined) record.notes = String(req.body.notes || '').trim() || undefined;
        await record.save();
      } else {
        if (req.body?.amount !== undefined) {
          const amount = positiveAmount(req.body.amount);
          if (!amount) {
            res.status(400).json({
              success: false,
              error: { code: 'INVALID_AMOUNT', message: 'Amount must be greater than zero' },
            });
            return;
          }
          record.amount = amount;
        }

        if (req.body?.currency !== undefined) {
          record.currency = String(req.body.currency || record.currency).toUpperCase();
        }

        if (req.body?.status !== undefined) {
          const status = String(req.body.status).toUpperCase() as FinanceRecordStatus;
          if (!isFinanceStatusAllowed('SETTLEMENT', status) || status === 'CANCELLED') {
            res.status(400).json({
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Settlement status can be Pending or Paid; use Void / Cancel to cancel it',
              },
            });
            return;
          }
          record.status = status;
        }

        if (req.body?.organizationId !== undefined) {
          const organizationId = String(req.body.organizationId || '');
          if (!mongoose.Types.ObjectId.isValid(organizationId)) {
            res.status(400).json({
              success: false,
              error: { code: 'INVALID_ORGANIZATION', message: 'Select a valid beneficiary organization' },
            });
            return;
          }
          record.organizationId = new mongoose.Types.ObjectId(organizationId);
        }

        if (req.body?.reference !== undefined) {
          record.reference = String(req.body.reference || '').trim() || record.reference;
        }
        if (req.body?.paymentMethod !== undefined) record.paymentMethod = req.body.paymentMethod || undefined;
        if (req.body?.paidAt !== undefined) record.paidAt = parseDate(req.body.paidAt);
        if (req.body?.notes !== undefined) record.notes = String(req.body.notes || '').trim() || undefined;
        await record.save();
      }

      await AuditLog.create({
        actorUserId: req.user.userId,
        action: 'finance.record.update',
        entityType: 'Payment',
        entityId: record._id,
        before,
        after: record.toObject(),
      });

      res.json({ success: true, data: await populateFinanceRecord(record._id) });
    } catch (error) {
      next(error);
    }
  }

  static async voidRecord(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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

      if (record.status === 'CANCELLED') {
        res.json({ success: true, data: await populateFinanceRecord(record._id) });
        return;
      }

      const reason = String(req.body?.reason || '').trim();
      if (!reason) {
        res.status(400).json({
          success: false,
          error: { code: 'VOID_REASON_REQUIRED', message: 'A reason is required to void a finance record' },
        });
        return;
      }

      if (record.type === 'FEE') {
        const activePayments = await Payment.countDocuments({
          invoiceId: record._id,
          type: 'PAYMENT',
          status: { $ne: 'CANCELLED' },
        });
        if (activePayments > 0) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVOICE_HAS_PAYMENTS',
              message: 'Void linked payments before cancelling this invoice',
            },
          });
          return;
        }
      }

      if (record.type === 'PAYMENT') {
        const activeRefunds = await Payment.countDocuments({
          originalPaymentId: record._id,
          type: 'REFUND',
          status: { $ne: 'CANCELLED' },
        });
        if (activeRefunds > 0) {
          res.status(400).json({
            success: false,
            error: {
              code: 'PAYMENT_HAS_REFUNDS',
              message: 'Void linked refunds before cancelling this payment',
            },
          });
          return;
        }
      }

      const before = record.toObject();
      record.status = 'CANCELLED';
      record.voidReason = reason;
      record.voidedAt = new Date();
      record.voidedBy = new mongoose.Types.ObjectId(req.user.userId);
      await record.save();

      if (record.invoiceId) {
        await FinanceController.refreshInvoice(record.invoiceId);
      }

      await AuditLog.create({
        actorUserId: req.user.userId,
        action: 'finance.record.void',
        entityType: 'Payment',
        entityId: record._id,
        before,
        after: {
          status: record.status,
          voidReason: record.voidReason,
          voidedAt: record.voidedAt,
          voidedBy: record.voidedBy,
        },
      });

      res.json({ success: true, data: await populateFinanceRecord(record._id) });
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

      if (original.type !== 'PAYMENT' || !original.userId || original.status === 'CANCELLED') {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REFUND_SOURCE',
            message: 'Refunds must be created from an active original user payment record',
          },
        });
        return;
      }

      const existingRefunds = await Payment.aggregate([
        {
          $match: {
            originalPaymentId: original._id,
            type: 'REFUND',
            status: { $ne: 'CANCELLED' },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const refundedSoFar = Number(existingRefunds[0]?.total || 0);
      const refundableBalance = Math.max(0, original.amount - refundedSoFar);
      const amount = positiveAmount(req.body?.amount ?? refundableBalance);

      if (!amount || amount > refundableBalance + 0.000001) {
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
        invoiceId: original.invoiceId || null,
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

      original.status = refundedSoFar + amount >= original.amount ? 'REFUNDED' : 'PAID';
      await original.save();

      if (original.invoiceId) {
        await FinanceController.refreshInvoice(original.invoiceId);
      }

      await AuditLog.create({
        actorUserId: req.user.userId,
        action: 'finance.refund.create',
        entityType: 'Payment',
        entityId: refund._id,
        after: {
          originalPaymentId: original._id,
          invoiceId: original.invoiceId,
          amount,
          currency: original.currency,
          userId: original.userId,
        },
      });

      res.status(201).json({ success: true, data: await populateFinanceRecord(refund._id) });
    } catch (error) {
      next(error);
    }
  }
}
