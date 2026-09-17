import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from './auth.js';

function rejectWeakPassword(res: Response, message: string): void {
  res.status(400).json({
    success: false,
    error: {
      code: 'WEAK_PASSWORD',
      message,
    },
  });
}

export function validateInstitutionInitialAdminPassword(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  if (!req.body?.initialAdminEmail) {
    next();
    return;
  }

  const password = req.body?.initialAdminPassword;
  if (typeof password !== 'string' || password.length < 12) {
    rejectWeakPassword(res, 'Initial administrator password must be at least 12 characters.');
    return;
  }

  next();
}

export function validateAdminPasswordReset(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const password = req.body?.newPassword;
  if (typeof password !== 'string' || password.length < 12) {
    rejectWeakPassword(res, 'New password must be at least 12 characters.');
    return;
  }

  next();
}
