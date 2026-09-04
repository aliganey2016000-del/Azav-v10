import { Request, Response } from 'express';
import { Payment } from '../models/Payment.js';
import { UserRole } from '../types/index.js';

const getAuthUser = (req: Request) => (req as any).user as {
  userId: string;
  roles: UserRole[];
  universityId?: string | null;
  organizationId?: string | null;
};

const isSystemFinanceRole = (roles: UserRole[]) =>
  roles.includes(UserRole.SUPER_ADMIN) || roles.includes(UserRole.AZAAM_STAFF);

const isUniversityRole = (roles: UserRole[]) =>
  roles.includes(UserRole.UNIVERSITY_ADMIN) || roles.includes(UserRole.UNIVERSITY_STAFF);

const isOrganizationRole = (roles: UserRole[]) =>
  roles.includes(UserRole.ORGANIZATION_ADMIN) || roles.includes(UserRole.ORGANIZATION_STAFF);

export class FinanceController {
  static async list(req: Request, res: Response) {
    const authUser = getAuthUser(req);
    const { direction, status, type, page = '1', limit = '25' } = req.query as Record<string, string>;
    const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 25));
    const query: Record<string, any> = {};

    if (isSystemFinanceRole(authUser.roles)) {
      // System finance roles can review both inbound university/student payments and outbound settlements.
    } else if (isUniversityRole(authUser.roles)) {
      if (!authUser.universityId) {
        return res.status(403).json({ success: false, error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'University context is required.' } });
      }
      query.universityId = authUser.universityId;
      // University users may see their payments to AZAAM, never hospital settlement records.
      query.direction = 'INBOUND';
      query.counterpartyType = { $in: ['UNIVERSITY', 'STUDENT'] };
    } else if (isOrganizationRole(authUser.roles)) {
      if (!authUser.organizationId) {
        return res.status(403).json({ success: false, error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Organization context is required.' } });
      }
      query.organizationId = authUser.organizationId;
      // Organization users only see AZAAM -> organization settlement records.
      query.direction = 'OUTBOUND';
      query.counterpartyType = 'ORGANIZATION';
    } else {
      // Students/applicants can only see their own inbound payment records.
      query.userId = authUser.userId;
      query.direction = 'INBOUND';
    }

    if (direction && isSystemFinanceRole(authUser.roles) && ['INBOUND', 'OUTBOUND'].includes(direction)) {
      query.direction = direction;
    }
    if (status) query.status = status;
    if (type) query.type = type;

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
    if (!isSystemFinanceRole(authUser.roles)) {
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
