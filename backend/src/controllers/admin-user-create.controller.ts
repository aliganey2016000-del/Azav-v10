import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { Response } from 'express';
import { User } from '../models/User.js';
import { Student } from '../models/Student.js';
import { ClinicalSupervisor } from '../models/ClinicalSupervisor.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { UserRole, ApplicantType } from '../types/index.js';
import { AuditService } from '../services/audit.service.js';

const SYSTEM_ROLES = new Set<UserRole>([
  UserRole.SUPER_ADMIN,
  UserRole.AZAAM_STAFF,
  UserRole.UNIVERSITY_ADMIN,
  UserRole.UNIVERSITY_STAFF,
  UserRole.ORGANIZATION_ADMIN,
  UserRole.ORGANIZATION_STAFF,
  UserRole.CLINICAL_SUPERVISOR,
  UserRole.STUDENT,
  UserRole.INDEPENDENT_APPLICANT,
]);

const toObjectId = (value: unknown, field: string): mongoose.Types.ObjectId | null => {
  if (value === undefined || value === null || value === '') return null;
  if (!mongoose.isValidObjectId(value)) {
    throw new Error(`${field} is invalid`);
  }
  return new mongoose.Types.ObjectId(String(value));
};

export async function createAdminUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'User not authenticated' } });
    return;
  }

  const body = req.body ?? {};
  const firstName = String(body.firstName ?? '').trim();
  const lastName = String(body.lastName ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '').trim();
  const roles = Array.isArray(body.roles) && body.roles.length ? body.roles : [UserRole.STUDENT];
  const role = roles[0] as UserRole;

  if (!firstName || !lastName) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'First name and last name are required.' } });
    return;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'A valid email address is required.' } });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 8 characters.' } });
    return;
  }
  if (roles.length !== 1 || !SYSTEM_ROLES.has(role)) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'A single valid user role is required.' } });
    return;
  }

  let universityId: mongoose.Types.ObjectId | null = toObjectId(body.universityId, 'University');
  let organizationId: mongoose.Types.ObjectId | null = toObjectId(body.organizationId, 'Organization');

  const isUniversityRole = [UserRole.UNIVERSITY_ADMIN, UserRole.UNIVERSITY_STAFF, UserRole.STUDENT].includes(role);
  const isOrganizationRole = [UserRole.ORGANIZATION_ADMIN, UserRole.ORGANIZATION_STAFF, UserRole.CLINICAL_SUPERVISOR].includes(role);

  if (req.user.roles.includes(UserRole.UNIVERSITY_ADMIN)) {
    if (!req.user.universityId) {
      res.status(403).json({ success: false, error: { code: 'TENANT_NOT_CONFIGURED', message: 'Your account is not linked to a university.' } });
      return;
    }
    if ([UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF, UserRole.ORGANIZATION_ADMIN, UserRole.ORGANIZATION_STAFF].includes(role)) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'University administrators cannot create this role.' } });
      return;
    }
    universityId = toObjectId(req.user.universityId, 'University');
    organizationId = null;
  }

  if (req.user.roles.includes(UserRole.ORGANIZATION_ADMIN)) {
    if (!req.user.organizationId) {
      res.status(403).json({ success: false, error: { code: 'TENANT_NOT_CONFIGURED', message: 'Your account is not linked to an organization.' } });
      return;
    }
    if ([UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF, UserRole.UNIVERSITY_ADMIN, UserRole.UNIVERSITY_STAFF].includes(role)) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Organization administrators cannot create this role.' } });
      return;
    }
    organizationId = toObjectId(req.user.organizationId, 'Organization');
    universityId = null;
  }

  if (isUniversityRole && !universityId && role !== UserRole.INDEPENDENT_APPLICANT) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'University is required for this role.' } });
    return;
  }
  if (isOrganizationRole && !organizationId) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Organization is required for this role.' } });
    return;
  }
  if (role === UserRole.INDEPENDENT_APPLICANT) {
    universityId = null;
    organizationId = null;
  }

  const existing = await User.findOne({ email }).select('_id');
  if (existing) {
    res.status(409).json({ success: false, error: { code: 'EMAIL_EXISTS', message: 'A user with this email already exists.' } });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  let createdUser: InstanceType<typeof User> | null = null;
  let createdStudent: InstanceType<typeof Student> | null = null;

  try {
    createdUser = await User.create({
      firstName,
      lastName,
      email,
      phone: body.phone ? String(body.phone).trim() : undefined,
      passwordHash,
      roles: [role],
      status: body.status && ['ACTIVE', 'INACTIVE', 'PENDING'].includes(body.status) ? body.status : 'ACTIVE',
      universityId,
      organizationId,
    });

    if (role === UserRole.STUDENT || role === UserRole.INDEPENDENT_APPLICANT) {
      createdStudent = await Student.create({
        userId: createdUser._id,
        universityId,
        applicantType: role === UserRole.INDEPENDENT_APPLICANT ? ApplicantType.INDEPENDENT : ApplicantType.UNIVERSITY,
        phone: body.phone ? String(body.phone).trim() : undefined,
        status: 'ACTIVE',
      });
      createdUser.studentId = createdStudent._id;
      await createdUser.save();
    }

    if (role === UserRole.CLINICAL_SUPERVISOR) {
      await ClinicalSupervisor.findOneAndUpdate(
        { userId: createdUser._id },
        {
          userId: createdUser._id,
          organizationId,
          departmentId: toObjectId(body.departmentId, 'Department'),
          specialty: body.qualification ? String(body.qualification).trim() : undefined,
          qualification: body.qualification ? String(body.qualification).trim() : undefined,
          licenseNumber: body.licenseNumber ? String(body.licenseNumber).trim() : undefined,
          status: 'ACTIVE',
          verified: false,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    await AuditService.logEvent({
      actorId: req.user.userId,
      actorEmail: req.user.email,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: createdUser._id.toString(),
      metadata: { email, roles: [role], universityId, organizationId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const responseUser = await User.findById(createdUser._id)
      .populate('universityId', 'name shortName code')
      .populate('organizationId', 'name type')
      .populate('studentId', 'studentNumber programme')
      .lean();

    if (!responseUser) {
      throw new Error('User was created but could not be reloaded.');
    }

    const { passwordHash: _, ...safeUser } = responseUser as any;
    res.status(201).json({ success: true, data: safeUser });
  } catch (error: any) {
    if (createdStudent?._id) {
      await Student.deleteOne({ _id: createdStudent._id }).catch(() => undefined);
    }
    if (createdUser?._id) {
      await User.deleteOne({ _id: createdUser._id }).catch(() => undefined);
    }

    if (error?.code === 11000) {
      res.status(409).json({ success: false, error: { code: 'DUPLICATE_RESOURCE', message: 'A user with this email or linked profile already exists.' } });
      return;
    }

    console.error('[AdminUserCreate] Failed to create user:', error);
    res.status(400).json({ success: false, error: { code: 'USER_CREATE_FAILED', message: error?.message || 'Unable to create user.' } });
  }
}
