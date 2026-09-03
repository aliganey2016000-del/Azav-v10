import { AuditLog } from '../models/AuditLog.js';

export interface LogEventParams {
  actorId: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditQueryFilter {
  page?: number;
  limit?: number;
  actorId?: string;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export class AuditService {
  static async logEvent(params: LogEventParams) {
    try {
      const log = new AuditLog({
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        metadata: params.metadata || {},
        ipAddress: params.ipAddress || '',
        userAgent: params.userAgent || '',
      });
      await log.save();
      return log;
    } catch (err) {
      console.error('[AuditService] Failed to record audit log:', err);
      return null;
    }
  }

  static async getLogs(filter: AuditQueryFilter) {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 20));
    const skip = (page - 1) * limit;

    const query: any = {};

    if (filter.actorId) {
      query.actorId = filter.actorId;
    }
    if (filter.action) {
      query.action = filter.action;
    }
    if (filter.entityType) {
      query.entityType = filter.entityType;
    }

    if (filter.search) {
      const searchRegex = new RegExp(filter.search, 'i');
      query.$or = [
        { actorEmail: searchRegex },
        { action: searchRegex },
        { entityType: searchRegex },
      ];
    }

    if (filter.startDate || filter.endDate) {
      query.createdAt = {};
      if (filter.startDate) {
        query.createdAt.$gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        query.createdAt.$lte = new Date(filter.endDate);
      }
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actorId', 'firstName lastName email roles')
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}
