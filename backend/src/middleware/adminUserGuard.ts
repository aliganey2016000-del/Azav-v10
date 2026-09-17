import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { User } from '../models/User.js';
import { UserRole } from '../types/index.js';
import { isDatabaseConnected } from '../config/database.js';
import { memoryUsers } from '../services/memoryStore.js';

const SYSTEM_ADMIN_ROLES = new Set<UserRole>([UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF]);
const UNIVERSITY_MANAGED_ROLES = new Set<UserRole>([UserRole.UNIVERSITY_STAFF, UserRole.STUDENT]);
const ORGANIZATION_MANAGED_ROLES = new Set<UserRole>([UserRole.ORGANIZATION_STAFF, UserRole.CLINICAL_SUPERVISOR]);
const ALL_ROLES = new Set<UserRole>(Object.values(UserRole));

function isSystemAdmin(roles: UserRole[]): boolean {
  return roles.some((role) => SYSTEM_ADMIN_ROLES.has(role));
}

function idString(value: any): string | null {
  if (!value) return null;
  return (value._id || value).toString();
}

function sendForbidden(res: Response, message: string): void {
  res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message } });
}

export async function validateManagedUserCreate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const actor = req.user;
  if (!actor) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'User not authenticated' } });
    return;
  }

  const password = req.body?.password;
  if (typeof password !== 'string' || password.length < 12) {
    res.status(400).json({
      success: false,
      error: { code: 'WEAK_PASSWORD', message: 'A password of at least 12 characters is required when creating a user.' },
    });
    return;
  }

  const requestedRoles: UserRole[] = Array.isArray(req.body?.roles) && req.body.roles.length > 0
    ? req.body.roles
    : [UserRole.STUDENT];

  if (requestedRoles.some((role) => !ALL_ROLES.has(role))) {
    res.status(400).json({ success: false, error: { code: 'INVALID_ROLE', message: 'One or more requested roles are invalid.' } });
    return;
  }

  if (isSystemAdmin(actor.roles)) {
    if (requestedRoles.includes(UserRole.INDEPENDENT_APPLICANT)) {
      req.body.universityId = null;
      req.body.organizationId = null;
    }
    next();
    return;
  }

  if (actor.roles.includes(UserRole.UNIVERSITY_ADMIN)) {
    if (!actor.universityId) {
      sendForbidden(res, 'University admin account is not linked to a university tenant.');
      return;
    }
    if (requestedRoles.some((role) => !UNIVERSITY_MANAGED_ROLES.has(role))) {
      sendForbidden(res, 'University admins may only create university staff or student accounts.');
      return;
    }
    if (req.body.universityId && req.body.universityId.toString() !== actor.universityId) {
      sendForbidden(res, 'Cannot create a user in another university tenant.');
      return;
    }
    if (req.body.organizationId) {
      sendForbidden(res, 'University admins cannot assign organization tenancy.');
      return;
    }
    req.body.universityId = actor.universityId;
    req.body.organizationId = null;
    next();
    return;
  }

  if (actor.roles.includes(UserRole.ORGANIZATION_ADMIN)) {
    if (!actor.organizationId) {
      sendForbidden(res, 'Organization admin account is not linked to an organization tenant.');
      return;
    }
    if (requestedRoles.some((role) => !ORGANIZATION_MANAGED_ROLES.has(role))) {
      sendForbidden(res, 'Organization admins may only create organization staff or clinical supervisor accounts.');
      return;
    }
    if (req.body.organizationId && req.body.organizationId.toString() !== actor.organizationId) {
      sendForbidden(res, 'Cannot create a user in another organization tenant.');
      return;
    }
    if (req.body.universityId) {
      sendForbidden(res, 'Organization admins cannot assign university tenancy.');
      return;
    }
    req.body.organizationId = actor.organizationId;
    req.body.universityId = null;
    next();
    return;
  }

  sendForbidden(res, 'This account is not authorized to create managed users.');
}

export async function authorizeManagedUserTarget(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const actor = req.user;
  if (!actor) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'User not authenticated' } });
    return;
  }

  if (isSystemAdmin(actor.roles)) {
    next();
    return;
  }

  let target: any = null;
  if (isDatabaseConnected()) {
    target = await User.findById(req.params.id).select('roles universityId organizationId').lean();
  } else {
    target = memoryUsers.find((user) => user._id === req.params.id || user.id === req.params.id) || null;
  }

  if (!target) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    return;
  }

  const targetRoles: UserRole[] = target.roles || [];

  if (actor.roles.includes(UserRole.UNIVERSITY_ADMIN)) {
    if (!actor.universityId || idString(target.universityId) !== actor.universityId) {
      sendForbidden(res, 'Cannot access a user outside your university tenant.');
      return;
    }
    if (targetRoles.some((role) => !UNIVERSITY_MANAGED_ROLES.has(role))) {
      sendForbidden(res, 'University admins cannot manage privileged or non-university accounts.');
      return;
    }
    if (req.method !== 'GET' && (req.body?.roles !== undefined || req.body?.universityId !== undefined || req.body?.organizationId !== undefined)) {
      sendForbidden(res, 'University admins cannot change user roles or tenant assignments.');
      return;
    }
    next();
    return;
  }

  if (actor.roles.includes(UserRole.ORGANIZATION_ADMIN)) {
    if (!actor.organizationId || idString(target.organizationId) !== actor.organizationId) {
      sendForbidden(res, 'Cannot access a user outside your organization tenant.');
      return;
    }
    if (targetRoles.some((role) => !ORGANIZATION_MANAGED_ROLES.has(role))) {
      sendForbidden(res, 'Organization admins cannot manage privileged or non-organization accounts.');
      return;
    }
    if (req.method !== 'GET' && (req.body?.roles !== undefined || req.body?.universityId !== undefined || req.body?.organizationId !== undefined)) {
      sendForbidden(res, 'Organization admins cannot change user roles or tenant assignments.');
      return;
    }
    next();
    return;
  }

  sendForbidden(res, 'This account is not authorized to manage users.');
}
