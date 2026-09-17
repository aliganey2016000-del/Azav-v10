import bcrypt from 'bcryptjs';
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { AuditService } from '../services/audit.service.js';
import { UserRole } from '../types/index.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function updateOrganizationAdminAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'User not authenticated' } });
      return;
    }

    const { id: organizationId, userId } = req.params;
    const { firstName, lastName, email, status, newPassword } = req.body || {};

    const target = await User.findOne({
      _id: userId,
      organizationId,
      roles: UserRole.ORGANIZATION_ADMIN,
    });

    if (!target) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Hospital admin account not found for this facility' } });
      return;
    }

    if (typeof email === 'string') {
      const normalizedEmail = email.trim().toLowerCase();
      if (!EMAIL_RE.test(normalizedEmail)) {
        res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Enter a valid login email address' } });
        return;
      }
      const duplicate = await User.findOne({ email: normalizedEmail, _id: { $ne: target._id } }).lean();
      if (duplicate) {
        res.status(409).json({ success: false, error: { code: 'EMAIL_IN_USE', message: 'Another user already uses this email address' } });
        return;
      }
      target.email = normalizedEmail;
    }

    if (typeof firstName === 'string' && firstName.trim()) target.firstName = firstName.trim();
    if (typeof lastName === 'string' && lastName.trim()) target.lastName = lastName.trim();
    if (status === 'ACTIVE' || status === 'INACTIVE') target.status = status;

    if (newPassword !== undefined && newPassword !== '') {
      if (typeof newPassword !== 'string' || newPassword.length < 12) {
        res.status(400).json({ success: false, error: { code: 'WEAK_PASSWORD', message: 'New password must be at least 12 characters' } });
        return;
      }
      target.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await target.save();

    await AuditService.logEvent({
      actorId: req.user.userId,
      actorEmail: req.user.email,
      action: newPassword ? 'ORGANIZATION_ADMIN_CREDENTIALS_UPDATED' : 'ORGANIZATION_ADMIN_UPDATED',
      entityType: 'User',
      entityId: target._id.toString(),
      metadata: {
        organizationId,
        updatedFields: [
          typeof firstName === 'string' ? 'firstName' : null,
          typeof lastName === 'string' ? 'lastName' : null,
          typeof email === 'string' ? 'email' : null,
          status ? 'status' : null,
          newPassword ? 'password' : null,
        ].filter(Boolean),
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const sanitized = target.toObject() as any;
    delete sanitized.passwordHash;
    res.json({ success: true, data: sanitized });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: error?.message || 'Failed to update hospital admin account' } });
  }
}
