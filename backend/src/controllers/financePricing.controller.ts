import mongoose from 'mongoose';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import {
  FeeRule,
  FeeBillingBasis,
  FeePayerType,
  FeeRuleScope,
  FeeServiceCategory,
} from '../models/FeeRule.js';
import { University } from '../models/University.js';
import { AuditLog } from '../models/Notification.js';
import { UserRole } from '../types/index.js';

const ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF];

const CATEGORIES: FeeServiceCategory[] = [
  'PLACEMENT',
  'VISA',
  'TRANSPORTATION',
  'RESIDENCE',
  'AIRPORT_PICKUP',
  'INSURANCE',
  'DOCUMENT_PROCESSING',
  'CERTIFICATION',
  'OTHER',
];

const BILLING_BASES: FeeBillingBasis[] = [
  'PER_STUDENT',
  'PER_PLACEMENT',
  'PER_MONTH',
  'PER_TRIP',
  'ONE_TIME',
];

const PAYERS: FeePayerType[] = ['UNIVERSITY', 'STUDENT', 'ORGANIZATION'];
const SCOPES: FeeRuleScope[] = ['GLOBAL', 'UNIVERSITY'];

const hasFinanceAdminAccess = (req: AuthenticatedRequest) =>
  Boolean(req.user?.roles.some((role) => ADMIN_ROLES.includes(role)));

const positiveAmount = (value: unknown) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
};

const parseDate = (value: unknown) => {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeCode = (value: unknown) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);

export class FinancePricingController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter: any = {};
      const status = String(req.query.status || '').toUpperCase();
      const payer = String(req.query.payer || '').toUpperCase();
      const scope = String(req.query.scope || '').toUpperCase();
      const universityId = String(req.query.universityId || '');

      if (status && ['ACTIVE', 'INACTIVE'].includes(status)) filter.status = status;
      if (payer && PAYERS.includes(payer as FeePayerType)) filter.defaultPayer = payer;
      if (scope && SCOPES.includes(scope as FeeRuleScope)) filter.scope = scope;

      if (universityId && mongoose.Types.ObjectId.isValid(universityId)) {
        filter.$or = [
          { scope: 'GLOBAL' },
          { scope: 'UNIVERSITY', universityId: new mongoose.Types.ObjectId(universityId) },
        ];
      }

      const rules = await FeeRule.find(filter)
        .populate('universityId', 'name code status')
        .sort({ scope: -1, serviceName: 1 })
        .lean();

      res.json({ success: true, data: rules });
    } catch (error) {
      next(error);
    }
  }

  static async resolved(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const payer = String(req.query.payer || '').toUpperCase() as FeePayerType;
      const universityId = String(req.query.universityId || '');

      if (!PAYERS.includes(payer)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_PAYER', message: 'A valid payer type is required' },
        });
        return;
      }

      const now = new Date();
      // Effective dates are business dates, not timestamps. A rule with
      // effectiveTo=2026-09-19 must remain usable for the whole 19 Sep day.
      // Older records may store date-only values at 00:00 UTC, so compare the
      // end date against the start of today instead of the current timestamp.
      const startOfTodayUtc = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
      );
      const activeDateFilter = {
        status: 'ACTIVE',
        defaultPayer: payer,
        $and: [
          {
            $or: [
              { effectiveFrom: null },
              { effectiveFrom: { $exists: false } },
              { effectiveFrom: { $lte: now } },
            ],
          },
          {
            $or: [
              { effectiveTo: null },
              { effectiveTo: { $exists: false } },
              { effectiveTo: { $gte: startOfTodayUtc } },
            ],
          },
        ],
      };

      const globalRules = await FeeRule.find({
        ...activeDateFilter,
        scope: 'GLOBAL',
      }).lean();

      let universityRules: any[] = [];
      if (universityId && mongoose.Types.ObjectId.isValid(universityId)) {
        universityRules = await FeeRule.find({
          ...activeDateFilter,
          scope: 'UNIVERSITY',
          universityId: new mongoose.Types.ObjectId(universityId),
        })
          .populate('universityId', 'name code status')
          .lean();
      }

      const byCode = new Map<string, any>();
      globalRules.forEach((rule) => byCode.set(rule.serviceCode, rule));
      universityRules.forEach((rule) => byCode.set(rule.serviceCode, rule));

      const rules = Array.from(byCode.values()).sort((a, b) =>
        String(a.serviceName).localeCompare(String(b.serviceName))
      );

      res.json({ success: true, data: rules });
    } catch (error) {
      next(error);
    }
  }

  static async profile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const payer = String(req.query.payer || '').toUpperCase() as FeePayerType;
      const universityId = String(req.query.universityId || '');

      if (!PAYERS.includes(payer)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_PAYER', message: 'A valid payer type is required' },
        });
        return;
      }

      if (universityId && !mongoose.Types.ObjectId.isValid(universityId)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_UNIVERSITY', message: 'Selected university is invalid' },
        });
        return;
      }

      const now = new Date();
      const startOfTodayUtc = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
      );

      const activeDateFilter = {
        status: 'ACTIVE',
        defaultPayer: payer,
        $and: [
          {
            $or: [
              { effectiveFrom: null },
              { effectiveFrom: { $exists: false } },
              { effectiveFrom: { $lte: now } },
            ],
          },
          {
            $or: [
              { effectiveTo: null },
              { effectiveTo: { $exists: false } },
              { effectiveTo: { $gte: startOfTodayUtc } },
            ],
          },
        ],
      };

      const [globalRules, universityRules, university] = await Promise.all([
        FeeRule.find({ ...activeDateFilter, scope: 'GLOBAL' }).lean(),
        universityId
          ? FeeRule.find({
              ...activeDateFilter,
              scope: 'UNIVERSITY',
              universityId: new mongoose.Types.ObjectId(universityId),
            })
              .populate('universityId', 'name code status')
              .lean()
          : Promise.resolve([]),
        universityId
          ? University.findById(universityId).select('_id name code status').lean()
          : Promise.resolve(null),
      ]);

      const byCode = new Map<string, any>();
      globalRules.forEach((rule) => {
        byCode.set(String(rule.serviceCode), { ...rule, pricingSource: 'GLOBAL' });
      });
      universityRules.forEach((rule) => {
        byCode.set(String(rule.serviceCode), { ...rule, pricingSource: 'UNIVERSITY' });
      });

      const services = Array.from(byCode.values()).sort((a, b) =>
        String(a.serviceName || '').localeCompare(String(b.serviceName || ''))
      );

      const currencies = Array.from(
        new Set(services.map((rule) => String(rule.currency || 'USD').toUpperCase()))
      );

      res.json({
        success: true,
        data: {
          payerType: payer,
          university: university
            ? {
                _id: university._id,
                name: university.name,
                code: university.code,
                status: university.status,
              }
            : null,
          serviceCount: services.length,
          currency: currencies.length === 1 ? currencies[0] : null,
          currencies,
          mixedCurrency: currencies.length > 1,
          services,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !hasFinanceAdminAccess(req)) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Finance pricing access is required' },
        });
        return;
      }

      const serviceName = String(req.body?.serviceName || '').trim();
      const serviceCode = normalizeCode(req.body?.serviceCode || serviceName);
      const category = String(req.body?.category || '').toUpperCase() as FeeServiceCategory;
      const billingBasis = String(req.body?.billingBasis || '').toUpperCase() as FeeBillingBasis;
      const defaultPayer = String(req.body?.defaultPayer || '').toUpperCase() as FeePayerType;
      const scope = String(req.body?.scope || 'GLOBAL').toUpperCase() as FeeRuleScope;
      const amount = positiveAmount(req.body?.amount);
      const universityId = String(req.body?.universityId || '');

      if (!serviceName || !serviceCode) {
        res.status(400).json({
          success: false,
          error: { code: 'SERVICE_REQUIRED', message: 'Service name and code are required' },
        });
        return;
      }

      if (!CATEGORIES.includes(category) || !BILLING_BASES.includes(billingBasis)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_RULE', message: 'Select a valid category and billing basis' },
        });
        return;
      }

      if (!PAYERS.includes(defaultPayer) || !SCOPES.includes(scope)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_RULE', message: 'Select a valid payer and pricing scope' },
        });
        return;
      }

      if (!amount) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_AMOUNT', message: 'Service amount must be greater than zero' },
        });
        return;
      }

      let resolvedUniversityId: mongoose.Types.ObjectId | null = null;
      if (scope === 'UNIVERSITY') {
        if (!mongoose.Types.ObjectId.isValid(universityId)) {
          res.status(400).json({
            success: false,
            error: { code: 'UNIVERSITY_REQUIRED', message: 'Select a university for university-specific pricing' },
          });
          return;
        }

        const university = await University.findById(universityId).select('_id');
        if (!university) {
          res.status(404).json({
            success: false,
            error: { code: 'UNIVERSITY_NOT_FOUND', message: 'University not found' },
          });
          return;
        }
        resolvedUniversityId = university._id;
      }

      const rule = await FeeRule.create({
        serviceCode,
        serviceName,
        category,
        amount,
        currency: String(req.body?.currency || 'USD').toUpperCase(),
        billingBasis,
        defaultPayer,
        scope,
        universityId: resolvedUniversityId,
        effectiveFrom: parseDate(req.body?.effectiveFrom),
        effectiveTo: parseDate(req.body?.effectiveTo),
        status: String(req.body?.status || 'ACTIVE').toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
        notes: String(req.body?.notes || '').trim() || undefined,
        createdBy: req.user.userId,
      });

      await AuditLog.create({
        actorUserId: req.user.userId,
        action: 'finance.pricing.create',
        entityType: 'FeeRule',
        entityId: rule._id,
        after: rule.toObject(),
      });

      const populated = await FeeRule.findById(rule._id)
        .populate('universityId', 'name code status')
        .lean();

      res.status(201).json({ success: true, data: populated });
    } catch (error: any) {
      if (error?.code === 11000) {
        res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_FEE_RULE',
            message: 'A pricing rule already exists for this service, payer and scope',
          },
        });
        return;
      }
      next(error);
    }
  }

  static async bulkUniversity(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !hasFinanceAdminAccess(req)) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Finance pricing access is required' },
        });
        return;
      }

      const universityId = String(req.body?.universityId || '');
      if (!mongoose.Types.ObjectId.isValid(universityId)) {
        res.status(400).json({
          success: false,
          error: { code: 'UNIVERSITY_REQUIRED', message: 'Select a university for service pricing' },
        });
        return;
      }

      const university = await University.findById(universityId).select('_id name code status');
      if (!university) {
        res.status(404).json({
          success: false,
          error: { code: 'UNIVERSITY_NOT_FOUND', message: 'University not found' },
        });
        return;
      }

      const rawServices = Array.isArray(req.body?.services) ? req.body.services : [];
      if (!rawServices.length) {
        res.status(400).json({
          success: false,
          error: { code: 'SERVICES_REQUIRED', message: 'Add at least one service price' },
        });
        return;
      }

      const currency = String(req.body?.currency || 'USD').trim().toUpperCase().slice(0, 8) || 'USD';
      const effectiveFrom = parseDate(req.body?.effectiveFrom);
      const effectiveTo = parseDate(req.body?.effectiveTo);
      if (effectiveFrom && effectiveTo && effectiveTo.getTime() < effectiveFrom.getTime()) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_EFFECTIVE_DATES', message: 'Effective To cannot be before Effective From' },
        });
        return;
      }

      const status =
        String(req.body?.status || 'ACTIVE').toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const notes = String(req.body?.notes || '').trim() || undefined;
      const normalizedServices: Array<{
        serviceCode: string;
        serviceName: string;
        category: FeeServiceCategory;
        amount: number;
        billingBasis: FeeBillingBasis;
      }> = [];
      const seenCodes = new Set<string>();

      for (const raw of rawServices) {
        const serviceName = String(raw?.serviceName || '').trim();
        const serviceCode = normalizeCode(raw?.serviceCode || serviceName);
        const category = String(raw?.category || '').toUpperCase() as FeeServiceCategory;
        const billingBasis = String(raw?.billingBasis || '').toUpperCase() as FeeBillingBasis;
        const amount = positiveAmount(raw?.amount);

        if (!serviceName || !serviceCode) {
          res.status(400).json({
            success: false,
            error: { code: 'SERVICE_REQUIRED', message: 'Every service needs a valid name and code' },
          });
          return;
        }

        if (!CATEGORIES.includes(category) || !BILLING_BASES.includes(billingBasis)) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_RULE',
              message: `Select a valid category and billing basis for ${serviceName}`,
            },
          });
          return;
        }

        if (!amount) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_AMOUNT',
              message: `Enter an amount greater than zero for ${serviceName}`,
            },
          });
          return;
        }

        if (seenCodes.has(serviceCode)) {
          res.status(400).json({
            success: false,
            error: {
              code: 'DUPLICATE_SERVICE',
              message: `Service ${serviceCode} appears more than once in this price list`,
            },
          });
          return;
        }

        seenCodes.add(serviceCode);
        normalizedServices.push({
          serviceCode,
          serviceName,
          category,
          amount,
          billingBasis,
        });
      }

      const objectUniversityId = new mongoose.Types.ObjectId(universityId);
      const serviceCodes = normalizedServices.map((service) => service.serviceCode);
      const beforeRules = await FeeRule.find({
        scope: 'UNIVERSITY',
        universityId: objectUniversityId,
        defaultPayer: 'UNIVERSITY',
        serviceCode: { $in: serviceCodes },
      }).lean();

      await FeeRule.bulkWrite(
        normalizedServices.map((service) => ({
          updateOne: {
            filter: {
              serviceCode: service.serviceCode,
              scope: 'UNIVERSITY',
              universityId: objectUniversityId,
              defaultPayer: 'UNIVERSITY',
            },
            update: {
              $set: {
                serviceName: service.serviceName,
                category: service.category,
                amount: service.amount,
                currency,
                billingBasis: service.billingBasis,
                defaultPayer: 'UNIVERSITY',
                scope: 'UNIVERSITY',
                universityId: objectUniversityId,
                effectiveFrom,
                effectiveTo,
                status,
                notes,
                createdBy: req.user.userId,
              },
            },
            upsert: true,
          },
        })),
        { ordered: true }
      );

      const savedRules = await FeeRule.find({
        scope: 'UNIVERSITY',
        universityId: objectUniversityId,
        defaultPayer: 'UNIVERSITY',
        serviceCode: { $in: serviceCodes },
      })
        .populate('universityId', 'name code status')
        .sort({ serviceName: 1 })
        .lean();

      await AuditLog.create({
        actorUserId: req.user.userId,
        action: 'finance.pricing.bulk_university',
        entityType: 'University',
        entityId: university._id,
        metadata: {
          universityName: university.name,
          serviceCount: savedRules.length,
          serviceCodes,
        },
        before: { rules: beforeRules },
        after: { rules: savedRules },
      });

      res.json({
        success: true,
        data: {
          university,
          count: savedRules.length,
          rules: savedRules,
        },
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_FEE_RULE',
            message: 'One or more university service prices conflict with an existing rule',
          },
        });
        return;
      }
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !hasFinanceAdminAccess(req)) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Finance pricing access is required' },
        });
        return;
      }

      const rule = await FeeRule.findById(req.params.id);
      if (!rule) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Pricing rule not found' },
        });
        return;
      }

      const before = rule.toObject();

      if (req.body?.serviceName !== undefined) {
        const serviceName = String(req.body.serviceName || '').trim();
        if (!serviceName) {
          res.status(400).json({
            success: false,
            error: { code: 'SERVICE_REQUIRED', message: 'Service name is required' },
          });
          return;
        }
        rule.serviceName = serviceName;
      }

      if (req.body?.serviceCode !== undefined) {
        const serviceCode = normalizeCode(req.body.serviceCode);
        if (!serviceCode) {
          res.status(400).json({
            success: false,
            error: { code: 'SERVICE_CODE_REQUIRED', message: 'Service code is required' },
          });
          return;
        }
        rule.serviceCode = serviceCode;
      }

      if (req.body?.category !== undefined) {
        const category = String(req.body.category).toUpperCase() as FeeServiceCategory;
        if (!CATEGORIES.includes(category)) {
          res.status(400).json({
            success: false,
            error: { code: 'INVALID_CATEGORY', message: 'Invalid service category' },
          });
          return;
        }
        rule.category = category;
      }

      if (req.body?.billingBasis !== undefined) {
        const billingBasis = String(req.body.billingBasis).toUpperCase() as FeeBillingBasis;
        if (!BILLING_BASES.includes(billingBasis)) {
          res.status(400).json({
            success: false,
            error: { code: 'INVALID_BILLING_BASIS', message: 'Invalid billing basis' },
          });
          return;
        }
        rule.billingBasis = billingBasis;
      }

      if (req.body?.defaultPayer !== undefined) {
        const payer = String(req.body.defaultPayer).toUpperCase() as FeePayerType;
        if (!PAYERS.includes(payer)) {
          res.status(400).json({
            success: false,
            error: { code: 'INVALID_PAYER', message: 'Invalid payer type' },
          });
          return;
        }
        rule.defaultPayer = payer;
      }

      if (req.body?.amount !== undefined) {
        const amount = positiveAmount(req.body.amount);
        if (!amount) {
          res.status(400).json({
            success: false,
            error: { code: 'INVALID_AMOUNT', message: 'Service amount must be greater than zero' },
          });
          return;
        }
        rule.amount = amount;
      }

      if (req.body?.currency !== undefined) {
        rule.currency = String(req.body.currency || 'USD').toUpperCase();
      }

      if (req.body?.scope !== undefined) {
        const scope = String(req.body.scope).toUpperCase() as FeeRuleScope;
        if (!SCOPES.includes(scope)) {
          res.status(400).json({
            success: false,
            error: { code: 'INVALID_SCOPE', message: 'Invalid pricing scope' },
          });
          return;
        }
        rule.scope = scope;
      }

      if (rule.scope === 'UNIVERSITY') {
        const universityId = String(req.body?.universityId ?? rule.universityId ?? '');
        if (!mongoose.Types.ObjectId.isValid(universityId)) {
          res.status(400).json({
            success: false,
            error: { code: 'UNIVERSITY_REQUIRED', message: 'Select a university for university-specific pricing' },
          });
          return;
        }
        rule.universityId = new mongoose.Types.ObjectId(universityId);
      } else {
        rule.universityId = null;
      }

      if (req.body?.effectiveFrom !== undefined) rule.effectiveFrom = parseDate(req.body.effectiveFrom);
      if (req.body?.effectiveTo !== undefined) rule.effectiveTo = parseDate(req.body.effectiveTo);
      if (req.body?.status !== undefined) {
        rule.status = String(req.body.status).toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
      }
      if (req.body?.notes !== undefined) {
        rule.notes = String(req.body.notes || '').trim() || undefined;
      }

      await rule.save();

      await AuditLog.create({
        actorUserId: req.user.userId,
        action: 'finance.pricing.update',
        entityType: 'FeeRule',
        entityId: rule._id,
        before,
        after: rule.toObject(),
      });

      const populated = await FeeRule.findById(rule._id)
        .populate('universityId', 'name code status')
        .lean();

      res.json({ success: true, data: populated });
    } catch (error: any) {
      if (error?.code === 11000) {
        res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_FEE_RULE',
            message: 'A pricing rule already exists for this service, payer and scope',
          },
        });
        return;
      }
      next(error);
    }
  }

  static async toggleStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !hasFinanceAdminAccess(req)) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Finance pricing access is required' },
        });
        return;
      }

      const rule = await FeeRule.findById(req.params.id);
      if (!rule) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Pricing rule not found' },
        });
        return;
      }

      const before = rule.status;
      rule.status = String(req.body?.status).toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await rule.save();

      await AuditLog.create({
        actorUserId: req.user.userId,
        action: 'finance.pricing.status',
        entityType: 'FeeRule',
        entityId: rule._id,
        before: { status: before },
        after: { status: rule.status },
      });

      res.json({ success: true, data: await FeeRule.findById(rule._id).populate('universityId', 'name code').lean() });
    } catch (error) {
      next(error);
    }
  }
}
