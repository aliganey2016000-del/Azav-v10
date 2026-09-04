import { AuditLog } from '../models/AuditLog.js';
import { isDatabaseConnected } from '../config/database.js';
import { memoryAuditLogs } from './memoryStore.js';

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
    const memLog = {
      _id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      id: `audit-${Date.now()}`,
      actorId: {
        _id: params.actorId,
        email: params.actorEmail,
        firstName: params.actorEmail.split('@')[0],
        lastName: 'Admin',
      },
      actorEmail: params.actorEmail,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId || undefined,
      metadata: params.metadata || {},
      ipAddress: params.ipAddress || '',
      userAgent: params.userAgent || '',
      createdAt: new Date().toISOString(),
    };
    memoryAuditLogs.unshift(memLog);

    if (!isDatabaseConnected()) {
      return memLog;
    }

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
      console.error('[AuditService] Failed to record audit log to DB:', err);
      return memLog;
    }
  }

  static async getLogs(filter: AuditQueryFilter) {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 20));
    const skip = (page - 1) * limit;

    if (!isDatabaseConnected()) {
      let logs = [...memoryAuditLogs];
      if (filter.action) logs = logs.filter((l) => l.action === filter.action);
      if (filter.entityType) logs = logs.filter((l) => l.entityType === filter.entityType);
      if (filter.search) {
        const s = filter.search.toLowerCase();
        logs = logs.filter(
          (l) =>
            (l.actorEmail && l.actorEmail.toLowerCase().includes(s)) ||
            (l.action && l.action.toLowerCase().includes(s)) ||
            (l.entityType && l.entityType.toLowerCase().includes(s))
        );
      }
      const total = logs.length;
      return {
        logs: logs.slice(skip, skip + limit),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }

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
