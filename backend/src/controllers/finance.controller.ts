import { Request, Response } from 'express';
import { Payment } from '../models/Payment.js';
import { UserRole } from '../types/index.js';

export interface FinanceAuthUser {
  userId: string;
  roles: UserRole[];
  universityId?: string | null;
  organizationId?: string | null;
}

export interface FinanceListFilters {
  direction?: string;
  status?: string;
  type?: string;
  page?: string;
  limit?: string;
}

const getAuthUser = (req: Request) => (req as any).user as FinanceAuthUser;

const isSystemFinanceRole = (roles: UserRole[]) =>
  roles.includes(UserRole.SUPER_ADMIN) || roles.includes(UserRole.AZAAM_STAFF);

const isUniversityRole = (roles: UserRole[]) =>
  roles.includes(UserRole.UNIVERSITY_ADMIN) || roles.includes(UserRole.UNIVERSITY_STAFF);

const isOrganizationRole = (roles: UserRole[]) =>
  roles.includes(UserRole.ORGANIZATION_ADMIN) || roles.includes(UserRole.ORGANIZATION_STAFF);

export function buildFinanceQuery(authUser: FinanceAuthUser, filters: FinanceListFilters = {}) {
  const roles = Array.isArray(authUser.roles) ? authUser.roles : [];
  const pageNumber = Math.max(1, Number.parseInt(filters.page || '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(filters.limit || '25', 10) || 25));
  const query: Record<string, any> = {};

  if (isSystemFinanceRole(roles)) {
    // System finance roles can review both inbound university/student payments and outbound settlements.
  } else if (isUniversityRole(roles)) {
    if (!authUser.universityId) {
      return {
        forbidden: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'University context is required.',
        },
        query,
        pageNumber,
        pageSize,
      };
    }
    query.universityId = authUser.universityId;
    // University users may see inbound university/student payments, never settlement records.
    query.direction = 'INBOUND';
    query.counterpartyType = { $in: ['UNIVERSITY', 'STUDENT'] };
  } else if (isOrganizationRole(roles)) {
    if (!authUser.organizationId) {
      return {
        forbidden: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Organization context is required.',
        },
        query,
        pageNumber,
        pageSize,
      };
    }
    query.organizationId = authUser.organizationId;
    // Organization users only see outbound AZAAM -> organization settlements.
    query.direction = 'OUTBOUND';
    query.counterpartyType = 'ORGANIZATION';
  } else {
    // Students/applicants can only see their own inbound payment records.
    query.userId = authUser.userId;
    query.direction = 'INBOUND';
  }

  if (filters.direction && isSystemFinanceRole(roles) && ['INBOUND', 'OUTBOUND'].includes(filters.direction)) {
    query.direction = filters.direction;
  }
  if (filters.status) query.status = filters.status;
  if (filters.type) query.type = filters.type;

  return { query, pageNumber, pageSize };
}

export class FinanceController {
  static async list(req: Request, res: Response) {
    const authUser = getAuthUser(req);
    const filters = req.query as FinanceListFilters;
    const { query, pageNumber, pageSize, forbidden } = buildFinanceQuery(authUser, filters);

    if (forbidden) {
      return res.status(403).json({ success: false, error: forbidden });
    }

    const [records, total] = await Promise.all([
      Payment.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .populate('userId', 'firstName lastName email')
        .populate('universityId', 'name shortName code')
        .populate('organizationId', 'name type')
        .populate('applicationId', 'applicationNumber status')
        .lean(),
      Payment.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: records,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    });
  }

  static async overview(req: Request, res: Response) {
    const authUser = getAuthUser(req);
    const roles = Array.isArray(authUser.roles) ? authUser.roles : [];
    if (!isSystemFinanceRole(roles)) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Finance overview is restricted to AZAAM finance roles.' } });
    }

    const [inbound, outbound] = await Promise.all([
      Payment.aggregate([
        { $match: { direction: 'INBOUND', status: { $in: ['PAID', 'PARTIAL'] } } },
        { $group: { _id: '$currency', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: { direction: 'OUTBOUND', status: { $in: ['PAID', 'PARTIAL'] } } },
        { $group: { _id: '$currency', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        inbound,
        outbound,
        separation: {
          inboundDescription: 'University/student payments received by AZAAM',
          outboundDescription: 'AZAAM settlements paid to hospitals/organizations',
        },
      },
    });
  }
}
