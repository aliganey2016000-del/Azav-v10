import mongoose from 'mongoose';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Payment, FinanceRecordStatus, FinanceRecordType, FinancePayerType } from '../models/Payment.js';
import { FeeRule } from '../models/FeeRule.js';
import { User } from '../models/User.js';
import { University } from '../models/University.js';
import { TrainingBatch } from '../models/TrainingBatch.js';
import { Application } from '../models/Application.js';
import { Organization } from '../models/Organization.js';
import { Placement } from '../models/Placement.js';
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
  universityId?: string,
  batchStudentCount?: number
) => {
  const items = Array.isArray(rawItems) ? rawItems : [];
  if (!items.length) return [];

  const normalized: any[] = [];
  let currency = '';

  for (const item of items) {
    const feeRuleId = String(item?.feeRuleId || '');

    if (!mongoose.Types.ObjectId.isValid(feeRuleId)) {
      const err: any = new Error('Each invoice service requires a valid pricing rule');
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

    const quantity =
      payerType === 'UNIVERSITY' &&
      rule.billingBasis === 'PER_STUDENT' &&
      Number(batchStudentCount || 0) > 0
        ? Number(batchStudentCount)
        : positiveAmount(item?.quantity ?? 1);

    if (!quantity) {
      const err: any = new Error('Each invoice service requires a valid quantity');
      err.statusCode = 400;
      err.code = 'INVALID_INVOICE_LINE_QUANTITY';
      throw err;
    }

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
    .populate('batchId', 'batchNumber name intakeDate status universityId')
    .populate('applicationId', 'status programmeText specialtyText')
    .populate('organizationId', 'name code city country')
    .populate('invoiceId', 'invoiceNumber amount currency status description dueDate userId universityId batchId payerType')
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
    const invoiceIdSet = new Set<string>();

    records.forEach((record) => {
      if (record.type === 'FEE' && record._id) {
        invoiceIdSet.add(String(record._id));
      }

      const linkedInvoiceId =
        typeof record.invoiceId === 'object' && record.invoiceId
          ? String(record.invoiceId._id || record.invoiceId.id || '')
          : String(record.invoiceId || '');

      if (linkedInvoiceId && mongoose.Types.ObjectId.isValid(linkedInvoiceId)) {
        invoiceIdSet.add(linkedInvoiceId);
      }
    });

    const invoiceIds = Array.from(invoiceIdSet).map(
      (id) => new mongoose.Types.ObjectId(id)
    );

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
      if (record.type === 'FEE') {
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
      }

      if (record.type === 'PAYMENT' || record.type === 'REFUND') {
        const linkedInvoice =
          typeof record.invoiceId === 'object' && record.invoiceId
            ? record.invoiceId
            : null;
        const linkedInvoiceId = linkedInvoice
          ? String(linkedInvoice._id || linkedInvoice.id || '')
          : String(record.invoiceId || '');

        if (!linkedInvoiceId || !mongoose.Types.ObjectId.isValid(linkedInvoiceId)) {
          return record;
        }

        const grossPaid = payments.get(linkedInvoiceId) || 0;
        const refundedAmount = refunds.get(linkedInvoiceId) || 0;
        const invoicePaidAmount = Math.max(0, grossPaid - refundedAmount);
        const invoiceAmount = Number(linkedInvoice?.amount || 0);
        const invoiceBalance = Math.max(0, invoiceAmount - invoicePaidAmount);

        return {
          ...record,
          invoiceAmount,
          invoicePaidAmount,
          invoiceRefundedAmount: refundedAmount,
          invoiceBalance,
        };
      }

      return record;
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
        .populate('batchId', 'batchNumber name intakeDate status universityId')
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

  static async settlementContext(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !isGlobalFinanceUser(req)) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Finance management requires AZAAM finance access' },
        });
        return;
      }

      const batchId = String(req.query.batchId || '');
      const invoiceId = String(req.query.invoiceId || '');
      const requestedUniversityId = String(req.query.universityId || '');

      if (!mongoose.Types.ObjectId.isValid(batchId)) {
        res.status(400).json({
          success: false,
          error: { code: 'BATCH_REQUIRED', message: 'Select a valid batch' },
        });
        return;
      }

      const batch = await TrainingBatch.findById(batchId).lean();
      if (!batch) {
        res.status(404).json({
          success: false,
          error: { code: 'BATCH_NOT_FOUND', message: 'Training batch not found' },
        });
        return;
      }

      const universityId = String(batch.universityId || '');
      if (
        requestedUniversityId &&
        requestedUniversityId !== universityId
      ) {
        res.status(400).json({
          success: false,
          error: { code: 'BATCH_UNIVERSITY_MISMATCH', message: 'The selected batch does not belong to this university' },
        });
        return;
      }

      const university = await University.findById(universityId)
        .select('_id name code')
        .lean();

      const rawInvoices = await Payment.find({
        type: 'FEE',
        universityId: batch.universityId,
        batchId: batch._id,
        status: { $ne: 'CANCELLED' },
      })
        .sort({ createdAt: -1 })
        .lean();

      const invoices = await FinanceController.decorateInvoiceBalances(rawInvoices);

      let selectedInvoice: any = null;
      if (invoiceId) {
        if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
          res.status(400).json({
            success: false,
            error: { code: 'INVALID_INVOICE', message: 'Select a valid batch invoice' },
          });
          return;
        }

        selectedInvoice = invoices.find((invoice: any) => String(invoice._id) === invoiceId) || null;
        if (!selectedInvoice) {
          res.status(400).json({
            success: false,
            error: { code: 'INVOICE_BATCH_MISMATCH', message: 'The selected invoice does not belong to this batch' },
          });
          return;
        }
      }

      const applications = await Application.find({ batchId: batch._id })
        .select('_id studentId')
        .lean();
      const applicationIds = applications.map((application) => application._id);
      const batchStudentIds = Array.from(
        new Set(applications.map((application) => String(application.studentId)).filter(Boolean))
      );

      const placements = applicationIds.length
        ? await Placement.find({
            applicationId: { $in: applicationIds },
            status: { $ne: 'CANCELLED' },
          })
            .populate('organizationId', 'name code city country')
            .populate({
              path: 'studentId',
              populate: { path: 'userId', select: 'firstName lastName email' },
            })
            .lean()
        : [];

      const hospitalMap = new Map<string, any>();

      placements.forEach((placement: any) => {
        const organization = placement.organizationId;
        const organizationId = String(organization?._id || organization || '');
        const studentId = String(placement.studentId?._id || placement.studentId || '');
        if (!organizationId || !studentId) return;

        if (!hospitalMap.has(organizationId)) {
          hospitalMap.set(organizationId, {
            organizationId,
            name: organization?.name || 'Hospital / Organization',
            code: organization?.code || '',
            city: organization?.city || '',
            studentIds: new Set<string>(),
            students: [],
          });
        }

        const hospital = hospitalMap.get(organizationId);
        if (!hospital.studentIds.has(studentId)) {
          hospital.studentIds.add(studentId);
          const user = placement.studentId?.userId;
          hospital.students.push({
            studentId,
            name:
              [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
              user?.email ||
              'Student',
            email: user?.email || '',
          });
        }
      });

      const settlementFilter: any = {
        type: 'SETTLEMENT',
        batchId: batch._id,
        status: { $ne: 'CANCELLED' },
      };
      if (selectedInvoice?._id) settlementFilter.invoiceId = selectedInvoice._id;

      const existingSettlements = await Payment.find(settlementFilter)
        .select('_id invoiceId organizationId amount currency status reference settlementStudentCount')
        .lean();

      const settlementByOrganization = new Map<string, any>();
      existingSettlements.forEach((settlement: any) => {
        const key = String(settlement.organizationId || '');
        if (!key) return;
        const existing = settlementByOrganization.get(key);
        if (!existing) {
          settlementByOrganization.set(key, {
            amount: Number(settlement.amount || 0),
            count: 1,
            latest: settlement,
          });
        } else {
          existing.amount += Number(settlement.amount || 0);
          existing.count += 1;
          existing.latest = settlement;
        }
      });

      const totalBatchStudents = batchStudentIds.length;
      const hospitals = Array.from(hospitalMap.values())
        .map((hospital: any) => {
          const studentIds = Array.from(hospital.studentIds) as string[];
          const existing = settlementByOrganization.get(hospital.organizationId);
          const suggestedAmount =
            selectedInvoice && totalBatchStudents > 0
              ? Math.round(
                  (Number(selectedInvoice.amount || 0) * studentIds.length / totalBatchStudents) * 100
                ) / 100
              : 0;

          return {
            organizationId: hospital.organizationId,
            name: hospital.name,
            code: hospital.code,
            city: hospital.city,
            studentCount: studentIds.length,
            students: hospital.students,
            suggestedAmount,
            alreadySettled: Boolean(existing),
            settledAmount: Number(existing?.amount || 0),
            existingSettlement: existing?.latest || null,
          };
        })
        .sort((a: any, b: any) => String(a.name).localeCompare(String(b.name)));

      const totalSettledForInvoice = selectedInvoice
        ? existingSettlements.reduce(
            (sum: number, settlement: any) => sum + Number(settlement.amount || 0),
            0
          )
        : 0;

      res.json({
        success: true,
        data: {
          university: university || { _id: batch.universityId },
          batch: {
            ...batch,
            studentsCount: totalBatchStudents,
          },
          invoices,
          selectedInvoice,
          hospitals,
          totalSettledForInvoice,
          remainingInvoiceSettlementCapacity: selectedInvoice
            ? Math.max(0, Number(selectedInvoice.amount || 0) - totalSettledForInvoice)
            : 0,
        },
      });
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

      if (type !== 'FEE' && !amount) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_AMOUNT', message: 'Amount must be greater than zero' },
        });
        return;
      }

      if (type !== 'FEE' && !description) {
        res.status(400).json({
          success: false,
          error: { code: 'DESCRIPTION_REQUIRED', message: 'Description is required' },
        });
        return;
      }

      if (type === 'FEE') {
        const payerType = String(
          req.body?.payerType ||
            (req.body?.universityId ? 'UNIVERSITY' : req.body?.organizationId ? 'ORGANIZATION' : 'STUDENT')
        ).toUpperCase() as FinancePayerType;

        if (!PAYER_TYPES.includes(payerType)) {
          res.status(400).json({
            success: false,
            error: { code: 'INVALID_PAYER', message: 'Select a valid invoice payer' },
          });
          return;
        }

        const userId = String(req.body?.userId || '');
        const universityId = String(req.body?.universityId || '');
        const organizationId = String(req.body?.organizationId || '');

        if (payerType === 'STUDENT') {
          if (!mongoose.Types.ObjectId.isValid(userId)) {
            res.status(400).json({
              success: false,
              error: { code: 'INVALID_USER', message: 'Select a valid student/account for this invoice' },
            });
            return;
          }

          const account = await User.findById(userId).select('_id universityId').lean();
          if (!account) {
            res.status(404).json({
              success: false,
              error: { code: 'USER_NOT_FOUND', message: 'Invoice account not found' },
            });
            return;
          }
        }

        if (payerType === 'UNIVERSITY') {
          if (!mongoose.Types.ObjectId.isValid(universityId)) {
            res.status(400).json({
              success: false,
              error: { code: 'INVALID_UNIVERSITY', message: 'Select a university to bill' },
            });
            return;
          }

          const university = await University.findById(universityId).select('_id status').lean();
          if (!university) {
            res.status(404).json({
              success: false,
              error: { code: 'UNIVERSITY_NOT_FOUND', message: 'University not found' },
            });
            return;
          }
        }

        let batch: any = null;
        let batchStudentCount = 0;
        const batchId = String(req.body?.batchId || '');

        if (payerType === 'UNIVERSITY') {
          if (!mongoose.Types.ObjectId.isValid(batchId)) {
            res.status(400).json({
              success: false,
              error: {
                code: 'BATCH_REQUIRED',
                message: 'Select the university batch before choosing services and creating the invoice',
              },
            });
            return;
          }

          batch = await TrainingBatch.findOne({
            _id: batchId,
            universityId: new mongoose.Types.ObjectId(universityId),
          }).lean();

          if (!batch) {
            res.status(400).json({
              success: false,
              error: {
                code: 'INVALID_BATCH',
                message: 'The selected batch does not belong to this university',
              },
            });
            return;
          }

          const batchStudents = await Application.distinct('studentId', {
            batchId: batch._id,
            studentId: { $ne: null },
          });
          batchStudentCount = batchStudents.length;

          if (batchStudentCount <= 0) {
            res.status(400).json({
              success: false,
              error: {
                code: 'EMPTY_BATCH',
                message: 'This batch has no approved students to bill',
              },
            });
            return;
          }
        }

        if (payerType === 'ORGANIZATION') {
          if (!mongoose.Types.ObjectId.isValid(organizationId)) {
            res.status(400).json({
              success: false,
              error: { code: 'INVALID_ORGANIZATION', message: 'Select an organization to bill' },
            });
            return;
          }

          const organization = await Organization.findById(organizationId).select('_id status').lean();
          if (!organization) {
            res.status(404).json({
              success: false,
              error: { code: 'ORGANIZATION_NOT_FOUND', message: 'Organization not found' },
            });
            return;
          }
        }

        const lineItems = await normalizeInvoiceLineItems(
          req.body?.lineItems,
          payerType,
          payerType === 'UNIVERSITY' ? universityId : undefined,
          payerType === 'UNIVERSITY' ? batchStudentCount : undefined
        );

        if (payerType === 'UNIVERSITY' && batch?._id && lineItems.length) {
          const selectedRuleIds = lineItems
            .map((item) => item.feeRuleId)
            .filter(Boolean);

          const duplicateInvoice = await Payment.findOne({
            type: 'FEE',
            universityId: new mongoose.Types.ObjectId(universityId),
            batchId: batch._id,
            status: { $ne: 'CANCELLED' },
            'lineItems.feeRuleId': { $in: selectedRuleIds },
          })
            .select('invoiceNumber lineItems')
            .lean();

          if (duplicateInvoice) {
            const duplicateRuleIds = new Set(
              (duplicateInvoice.lineItems || [])
                .map((item: any) => String(item.feeRuleId || ''))
                .filter(Boolean)
            );
            const duplicateServices = lineItems
              .filter((item) => duplicateRuleIds.has(String(item.feeRuleId || '')))
              .map((item) => item.serviceName)
              .join(', ');

            res.status(409).json({
              success: false,
              error: {
                code: 'BATCH_SERVICE_ALREADY_INVOICED',
                message:
                  'This batch has already been invoiced for: ' +
                  (duplicateServices || 'one or more selected services') +
                  (duplicateInvoice.invoiceNumber
                    ? ' (' + duplicateInvoice.invoiceNumber + ')'
                    : ''),
              },
            });
            return;
          }
        }

        const calculatedAmount = lineItems.length
          ? Number(lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2))
          : amount;

        if (!calculatedAmount || calculatedAmount <= 0) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_INVOICE_AMOUNT',
              message: 'Add at least one priced service or enter a valid invoice amount',
            },
          });
          return;
        }

        const invoiceCurrency = lineItems.length
          ? String(
              (
                await FeeRule.findById(lineItems[0].feeRuleId)
                  .select('currency')
                  .lean()
              )?.currency || req.body?.currency || 'USD'
            ).toUpperCase()
          : String(req.body?.currency || 'USD').toUpperCase();

        const invoiceDescription =
          description ||
          (payerType === 'UNIVERSITY' && batch
            ? batch.batchNumber + ' · ' + lineItems.map((item) => item.serviceName).join(', ')
            : lineItems.map((item) => item.serviceName).join(', ')) ||
          'AZAAM services';

        const dueDate = parseDate(req.body?.dueDate);
        const status = deriveInvoiceStatus({ amount: calculatedAmount, netPaid: 0, dueDate });

        const record = await Payment.create({
          userId: payerType === 'STUDENT' ? userId : null,
          universityId: payerType === 'UNIVERSITY' ? universityId : null,
          batchId: payerType === 'UNIVERSITY' ? batch?._id || null : null,
          payerType,
          applicationId: req.body?.applicationId || null,
          organizationId: payerType === 'ORGANIZATION' ? organizationId : req.body?.organizationId || null,
          invoiceNumber: String(req.body?.invoiceNumber || '').trim() || nextInvoiceNumber(),
          type,
          description: invoiceDescription,
          amount: calculatedAmount,
          currency: invoiceCurrency,
          lineItems,
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
          after: {
            ...record.toObject(),
            pricingSource: lineItems.length ? 'FEE_RULES' : 'MANUAL',
          },
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

        if (!invoice.userId && !invoice.universityId && !invoice.organizationId) {
          res.status(400).json({
            success: false,
            error: { code: 'INVOICE_PAYER_MISSING', message: 'The selected invoice has no billing payer' },
          });
          return;
        }

        const suppliedUserId = String(req.body?.userId || '');
        if (invoice.userId && suppliedUserId && suppliedUserId !== String(invoice.userId)) {
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
          userId: invoice.userId || null,
          universityId: invoice.universityId || null,
          batchId: invoice.batchId || null,
          payerType: invoice.payerType || (invoice.universityId ? 'UNIVERSITY' : invoice.organizationId ? 'ORGANIZATION' : 'STUDENT'),
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
            universityId: invoice.universityId,
            payerType: invoice.payerType,
            reference: record.reference,
          },
        });

        res.status(201).json({ success: true, data: await populateFinanceRecord(record._id) });
        return;
      }

      const organizationId = String(req.body?.organizationId || '');
      const universityId = String(req.body?.universityId || '');
      const batchId = String(req.body?.batchId || '');
      const invoiceId = String(req.body?.invoiceId || '');

      if (!mongoose.Types.ObjectId.isValid(organizationId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ORGANIZATION',
            message: 'Select the hospital or beneficiary organization for this settlement',
          },
        });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(universityId)) {
        res.status(400).json({
          success: false,
          error: { code: 'UNIVERSITY_REQUIRED', message: 'Select the university for this settlement' },
        });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(batchId)) {
        res.status(400).json({
          success: false,
          error: { code: 'BATCH_REQUIRED', message: 'Select the batch for this settlement' },
        });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVOICE_REQUIRED', message: 'Select the batch invoice for this settlement' },
        });
        return;
      }

      const [organization, batch, invoice] = await Promise.all([
        Organization.findById(organizationId).select('_id name').lean(),
        TrainingBatch.findById(batchId).select('_id universityId batchNumber name').lean(),
        Payment.findOne({
          _id: invoiceId,
          type: 'FEE',
          status: { $ne: 'CANCELLED' },
        }).lean(),
      ]);

      if (!organization) {
        res.status(404).json({
          success: false,
          error: { code: 'ORGANIZATION_NOT_FOUND', message: 'The selected hospital or organization was not found' },
        });
        return;
      }

      if (!batch || String(batch.universityId) !== universityId) {
        res.status(400).json({
          success: false,
          error: { code: 'BATCH_UNIVERSITY_MISMATCH', message: 'The selected batch does not belong to this university' },
        });
        return;
      }

      if (
        !invoice ||
        String(invoice.universityId || '') !== universityId ||
        String(invoice.batchId || '') !== batchId
      ) {
        res.status(400).json({
          success: false,
          error: { code: 'INVOICE_BATCH_MISMATCH', message: 'The selected invoice does not belong to this university batch' },
        });
        return;
      }

      const applications = await Application.find({ batchId: batch._id })
        .select('_id studentId')
        .lean();
      const applicationIds = applications.map((application) => application._id);

      const placements = applicationIds.length
        ? await Placement.find({
            applicationId: { $in: applicationIds },
            organizationId,
            status: { $ne: 'CANCELLED' },
          })
            .select('studentId')
            .lean()
        : [];

      const settlementStudentIds = Array.from(
        new Set(placements.map((placement: any) => String(placement.studentId)).filter(Boolean))
      );

      if (!settlementStudentIds.length) {
        res.status(400).json({
          success: false,
          error: {
            code: 'NO_BATCH_STUDENTS_AT_HOSPITAL',
            message: 'This hospital has no students from the selected batch',
          },
        });
        return;
      }

      const existingSettlement = await Payment.findOne({
        type: 'SETTLEMENT',
        universityId,
        batchId,
        invoiceId,
        organizationId,
        status: { $ne: 'CANCELLED' },
      })
        .select('_id reference status')
        .lean();

      if (existingSettlement) {
        res.status(409).json({
          success: false,
          error: {
            code: 'SETTLEMENT_ALREADY_EXISTS',
            message: 'This batch has already been settled once for the selected hospital and invoice',
          },
        });
        return;
      }

      const settlementCurrency = String(req.body?.currency || invoice.currency || 'USD').toUpperCase();
      if (settlementCurrency !== String(invoice.currency || 'USD').toUpperCase()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'SETTLEMENT_CURRENCY_MISMATCH',
            message: 'Settlement currency must match the selected invoice currency',
          },
        });
        return;
      }

      const settlementTotals = await Payment.aggregate([
        {
          $match: {
            invoiceId: invoice._id,
            type: 'SETTLEMENT',
            status: { $ne: 'CANCELLED' },
          },
        },
        { $group: { _id: '$invoiceId', total: { $sum: '$amount' } } },
      ]);

      const alreadySettled = Number(settlementTotals[0]?.total || 0);
      if (alreadySettled + Number(amount) > Number(invoice.amount || 0) + 0.000001) {
        res.status(400).json({
          success: false,
          error: {
            code: 'SETTLEMENT_EXCEEDS_INVOICE',
            message: 'Total settlements cannot exceed the selected invoice amount',
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
        universityId,
        batchId,
        payerType: 'ORGANIZATION',
        organizationId,
        invoiceId,
        settlementStudentCount: settlementStudentIds.length,
        settlementStudentIds,
        type: 'SETTLEMENT',
        description,
        amount,
        currency: settlementCurrency,
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
        after: {
          ...record.toObject(),
          universityId,
          batchId,
          invoiceId,
          organizationId,
          settlementStudentCount: settlementStudentIds.length,
        },
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
        const contextualSettlement = Boolean(
          record.universityId && record.batchId && record.invoiceId
        );

        if (
          contextualSettlement &&
          (req.body?.universityId !== undefined ||
            req.body?.batchId !== undefined ||
            req.body?.invoiceId !== undefined ||
            req.body?.organizationId !== undefined)
        ) {
          res.status(400).json({
            success: false,
            error: {
              code: 'SETTLEMENT_CONTEXT_LOCKED',
              message: 'University, batch, invoice and hospital are locked after a settlement is created; void and recreate it to change the context',
            },
          });
          return;
        }

        if (req.body?.amount !== undefined) {
          const amount = positiveAmount(req.body.amount);
          if (!amount) {
            res.status(400).json({
              success: false,
              error: { code: 'INVALID_AMOUNT', message: 'Amount must be greater than zero' },
            });
            return;
          }

          if (contextualSettlement && record.invoiceId) {
            const invoice = await Payment.findOne({
              _id: record.invoiceId,
              type: 'FEE',
              status: { $ne: 'CANCELLED' },
            }).lean();

            if (!invoice) {
              res.status(400).json({
                success: false,
                error: { code: 'INVALID_INVOICE', message: 'The linked batch invoice is unavailable' },
              });
              return;
            }

            const otherTotals = await Payment.aggregate([
              {
                $match: {
                  _id: { $ne: record._id },
                  invoiceId: record.invoiceId,
                  type: 'SETTLEMENT',
                  status: { $ne: 'CANCELLED' },
                },
              },
              { $group: { _id: '$invoiceId', total: { $sum: '$amount' } } },
            ]);

            const otherSettled = Number(otherTotals[0]?.total || 0);
            if (otherSettled + amount > Number(invoice.amount || 0) + 0.000001) {
              res.status(400).json({
                success: false,
                error: {
                  code: 'SETTLEMENT_EXCEEDS_INVOICE',
                  message: 'Total settlements cannot exceed the selected invoice amount',
                },
              });
              return;
            }
          }

          record.amount = amount;
        }

        if (req.body?.currency !== undefined) {
          const currency = String(req.body.currency || record.currency).toUpperCase();

          if (contextualSettlement && record.invoiceId) {
            const invoice = await Payment.findById(record.invoiceId).select('currency').lean();
            if (invoice && currency !== String(invoice.currency || 'USD').toUpperCase()) {
              res.status(400).json({
                success: false,
                error: {
                  code: 'SETTLEMENT_CURRENCY_MISMATCH',
                  message: 'Settlement currency must match the linked invoice currency',
                },
              });
              return;
            }
          }

          record.currency = currency;
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

        if (!contextualSettlement && req.body?.organizationId !== undefined) {
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
        userId: original.userId || null,
        universityId: original.universityId || null,
        payerType: original.payerType || (original.universityId ? 'UNIVERSITY' : original.organizationId ? 'ORGANIZATION' : 'STUDENT'),
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
