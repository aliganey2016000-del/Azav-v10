import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { Department } from '../models/Department.js';
import { ClinicalSupervisor } from '../models/ClinicalSupervisor.js';
import { Placement } from '../models/Placement.js';
import { AuditService } from '../services/audit.service.js';
import { PlacementStatus, UserRole } from '../types/index.js';

const SYSTEM_ROLES = [UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF];

const isSystemManager = (roles: UserRole[]) =>
  roles.some((role) => SYSTEM_ROLES.includes(role));

const safeRegex = (value: string) =>
  value.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&');

export class SupervisorManagementController {
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
        return;
      }

      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const skip = (page - 1) * limit;
      const search = String(req.query.search || '').trim();
      const status = String(req.query.status || '').trim();
      const requestedOrganizationId = String(req.query.organizationId || '').trim();
      const departmentId = String(req.query.departmentId || '').trim();

      const query: any = {};

      if (
        req.user.roles.includes(UserRole.ORGANIZATION_ADMIN) ||
        req.user.roles.includes(UserRole.ORGANIZATION_STAFF)
      ) {
        if (!req.user.organizationId) {
          res.status(403).json({
            success: false,
            error: { code: 'ORGANIZATION_SCOPE_REQUIRED', message: 'This account is not linked to a healthcare organization.' },
          });
          return;
        }
        query.organizationId = new mongoose.Types.ObjectId(req.user.organizationId);
      } else if (requestedOrganizationId) {
        if (!mongoose.Types.ObjectId.isValid(requestedOrganizationId)) {
          res.status(400).json({ success: false, error: { code: 'INVALID_ORGANIZATION', message: 'Invalid hospital filter.' } });
          return;
        }
        query.organizationId = new mongoose.Types.ObjectId(requestedOrganizationId);
      }

      if (departmentId) {
        if (!mongoose.Types.ObjectId.isValid(departmentId)) {
          res.status(400).json({ success: false, error: { code: 'INVALID_DEPARTMENT', message: 'Invalid department filter.' } });
          return;
        }
        query.departmentId = new mongoose.Types.ObjectId(departmentId);
      }

      if (status === 'ACTIVE' || status === 'INACTIVE') {
        query.status = status;
      }

      if (search) {
        const rx = new RegExp(safeRegex(search), 'i');
        const matchingUsers = await User.find({
          $or: [{ firstName: rx }, { lastName: rx }, { email: rx }, { phone: rx }],
        }).select('_id');

        query.$or = [
          { userId: { $in: matchingUsers.map((user) => user._id) } },
          { licenseNumber: rx },
          { qualification: rx },
        ];
      }

      const summaryQuery = { ...query };
      delete (summaryQuery as any).status;

      const [supervisors, total, summaryTotal, activeCount, departmentIds, summarySupervisors] = await Promise.all([
        ClinicalSupervisor.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('userId', 'firstName lastName email phone status avatar')
          .populate('organizationId', 'name type contactEmail')
          .populate('departmentId', 'name code')
          .lean(),
        ClinicalSupervisor.countDocuments(query),
        ClinicalSupervisor.countDocuments(summaryQuery),
        ClinicalSupervisor.countDocuments({ ...summaryQuery, status: 'ACTIVE' }),
        ClinicalSupervisor.distinct('departmentId', summaryQuery),
        ClinicalSupervisor.find(summaryQuery).select('_id').lean(),
      ]);

      const enriched = await Promise.all(
        supervisors.map(async (supervisor: any) => ({
          ...supervisor,
          assignedTraineesCount: await Placement.countDocuments({
            supervisorId: supervisor._id,
            status: { $in: [PlacementStatus.CONFIRMED, PlacementStatus.ACTIVE] },
          }),
        }))
      );

      const assignedStudents = await Placement.countDocuments({
        supervisorId: { $in: summarySupervisors.map((supervisor: any) => supervisor._id) },
        status: { $in: [PlacementStatus.CONFIRMED, PlacementStatus.ACTIVE] },
      });

      res.status(200).json({
        success: true,
        data: enriched,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
        stats: {
          total: summaryTotal,
          active: activeCount,
          departments: departmentIds.filter(Boolean).length,
          assignedStudents,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message || 'Unable to load supervisors.' },
      });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
        return;
      }

      const canCreate =
        isSystemManager(req.user.roles) ||
        req.user.roles.includes(UserRole.ORGANIZATION_ADMIN);

      if (!canCreate) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You are not allowed to create clinical supervisors.' },
        });
        return;
      }

      const firstName = String(req.body.firstName || '').trim();
      const lastName = String(req.body.lastName || '').trim();
      const email = String(req.body.email || '').trim().toLowerCase();
      const phone = String(req.body.phone || '').trim();
      const password = String(req.body.password || '');
      const qualification = String(req.body.qualification || '').trim();
      const licenseNumber = String(req.body.licenseNumber || '').trim();
      const status = req.body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const yearsOfExperience = Math.max(0, Math.min(70, Number(req.body.yearsOfExperience) || 0));

      let organizationId = String(req.body.organizationId || '').trim();
      const departmentId = String(req.body.departmentId || '').trim();

      if (req.user.roles.includes(UserRole.ORGANIZATION_ADMIN)) {
        organizationId = req.user.organizationId || '';
      }

      if (!firstName || !lastName || !email || !organizationId || !departmentId || !password) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'First name, last name, email, hospital, department, and password are required.',
          },
        });
        return;
      }

      if (password.length < 12) {
        res.status(400).json({
          success: false,
          error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 12 characters.' },
        });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(organizationId) || !mongoose.Types.ObjectId.isValid(departmentId)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_REFERENCE', message: 'Invalid hospital or department.' },
        });
        return;
      }

      const [organization, department, existingUser] = await Promise.all([
        Organization.findById(organizationId).select('_id name status'),
        Department.findOne({ _id: departmentId, organizationId, status: 'ACTIVE' }).select('_id name'),
        User.findOne({ email }).select('_id'),
      ]);

      if (!organization) {
        res.status(404).json({ success: false, error: { code: 'ORGANIZATION_NOT_FOUND', message: 'Hospital not found.' } });
        return;
      }

      if (!department) {
        res.status(400).json({
          success: false,
          error: { code: 'DEPARTMENT_MISMATCH', message: 'Selected department does not belong to this hospital.' },
        });
        return;
      }

      if (existingUser) {
        res.status(409).json({
          success: false,
          error: { code: 'EMAIL_EXISTS', message: 'A user with this email already exists.' },
        });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        passwordHash,
        roles: [UserRole.CLINICAL_SUPERVISOR],
        status,
        organizationId,
      });

      try {
        const supervisor = await ClinicalSupervisor.create({
          userId: user._id,
          organizationId,
          departmentId,
          qualification: qualification || 'Clinical Supervisor',
          licenseNumber: licenseNumber || undefined,
          yearsOfExperience,
          verified: true,
          status,
        });

        await AuditService.logEvent({
          actorId: req.user.userId,
          actorEmail: req.user.email,
          action: 'CLINICAL_SUPERVISOR_CREATED',
          entityType: 'ClinicalSupervisor',
          entityId: supervisor._id.toString(),
          metadata: {
            email,
            organizationId,
            departmentId,
            status,
          },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });

        const populated = await ClinicalSupervisor.findById(supervisor._id)
          .populate('userId', 'firstName lastName email phone status avatar')
          .populate('organizationId', 'name type contactEmail')
          .populate('departmentId', 'name code')
          .lean();

        res.status(201).json({ success: true, data: populated });
      } catch (error) {
        await User.deleteOne({ _id: user._id });
        throw error;
      }
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: error.message || 'Unable to create supervisor.' },
      });
    }
  }
}
