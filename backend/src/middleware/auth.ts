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

    const user = await User.findById(decoded.sub).select(
      'email roles status universityId organizationId studentId'
    );

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

    // Use current database authorization state rather than stale role/scope claims from the JWT.
    req.user = {
      userId: user._id.toString(),
      email: user.email,
      roles: user.roles,
      universityId: user.universityId ? user.universityId.toString() : null,
      organizationId: user.organizationId ? user.organizationId.toString() : null,
      studentId: user.studentId ? user.studentId.toString() : null,
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
