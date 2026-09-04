import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AuthUser, UserRole } from '../types/index.js';
import { User } from '../models/User.js';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication token is required',
      },
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      sub: string;
      email: string;
      roles: UserRole[];
      universityId?: string | null;
      organizationId?: string | null;
      studentId?: string | null;
    };

    let user: any = null;
    try {
      user = await User.findById(decoded.sub).select(
        'email roles status universityId organizationId studentId'
      );
    } catch {
      // Database not reachable, fallback to in-memory store
    }

    if (!user) {
      const { memoryUsers } = await import('../services/memoryStore.js');
      user = memoryUsers.find(
        (u) => u._id === decoded.sub || u.id === decoded.sub || u.email.toLowerCase() === decoded.email.toLowerCase()
      );
    }

    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Authentication token is no longer valid' },
      });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_INACTIVE', message: 'This account is not active. Please contact support.' },
      });
      return;
    }

    req.user = {
      userId: (user._id || user.id).toString(),
      email: user.email,
      roles: user.roles,
      universityId: user.universityId ? (user.universityId._id || user.universityId).toString() : null,
      organizationId: user.organizationId ? (user.organizationId._id || user.organizationId).toString() : null,
      studentId: user.studentId ? (user.studentId._id || user.studentId).toString() : null,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired authentication token',
      },
    });
  }
}
