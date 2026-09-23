import { Request, Response, NextFunction } from 'express';
import { University } from '../models/University.js';
import { Organization } from '../models/Organization.js';
import { ClinicalSupervisor } from '../models/ClinicalSupervisor.js';
import { Department } from '../models/Department.js';
import { UniversityMou } from '../models/UniversityMou.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';

export class UniversityController {
  static async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const universities = await University.find({ status: 'ACTIVE' }).sort({ name: 1 });
      res.status(200).json({ success: true, data: { universities } });
    } catch (error) {
      next(error);
    }
  }

  static async getCurrentMou(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
        return;
      }

      const universityId =
        req.user.universityId ||
        (req.user.roles.includes(UserRole.SUPER_ADMIN) || req.user.roles.includes(UserRole.AZAAM_STAFF)
          ? (req.query.universityId as string | undefined)
          : undefined);

      if (!universityId) {
        res.status(400).json({
          success: false,
          error: { code: 'UNIVERSITY_REQUIRED', message: 'A university scope is required to load the MoU.' },
        });
        return;
      }

      const mou = await UniversityMou.findOne({ universityId }).populate('universityId', 'name code');
      res.status(200).json({ success: true, data: { items: mou ? [mou] : [] } });
    } catch (error) {
      next(error);
    }
  }

  static async upsertCurrentMou(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
        return;
      }

      const universityId =
        req.user.universityId ||
        (req.user.roles.includes(UserRole.SUPER_ADMIN) || req.user.roles.includes(UserRole.AZAAM_STAFF)
          ? req.body.universityId
          : undefined);

      if (!universityId) {
        res.status(400).json({
          success: false,
          error: { code: 'UNIVERSITY_REQUIRED', message: 'A university scope is required to save the MoU.' },
        });
        return;
      }

      const allowed = [
        'mouNumber',
        'representative',
        'representativeTitle',
        'signedAt',
        'status',
        'validityStart',
        'validityEnd',
        'annualQuota',
        'notes',
      ];
      const updates: any = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }

      if (!updates.mouNumber) {
        const existing = await UniversityMou.findOne({ universityId }).select('mouNumber');
        if (!existing) {
          res.status(400).json({
            success: false,
            error: { code: 'MOU_NUMBER_REQUIRED', message: 'MoU number is required for the first save.' },
          });
          return;
        }
      }

      const mou = await UniversityMou.findOneAndUpdate(
        { universityId },
        { $set: updates, $setOnInsert: { universityId } },
        { upsert: true, new: true, runValidators: true }
      ).populate('universityId', 'name code');

      res.status(200).json({ success: true, data: { mou } });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, code, email, phone, address, website, capacity } = req.body;
      const university = new University({ name, code, email, phone, address, website, capacity: capacity || 100 });
      await university.save();
      res.status(201).json({ success: true, data: { university } });
    } catch (error) {
      next(error);
    }
  }
}

export class OrganizationController {
  static async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizations = await Organization.find({ status: 'ACTIVE' }).sort({ name: 1 });
      res.status(200).json({ success: true, data: { organizations } });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, type, registrationNumber, contactEmail, contactPhone, address, capacity, description } = req.body;
      const organization = new Organization({
        name,
        type,
        registrationNumber,
        contactEmail,
        contactPhone,
        address,
        capacity: capacity || 20,
        description,
      });
      await organization.save();
      res.status(201).json({ success: true, data: { organization } });
    } catch (error) {
      next(error);
    }
  }

  static async listDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { organizationId } = req.params;
      const departments = await Department.find({ organizationId, status: 'ACTIVE' });
      res.status(200).json({ success: true, data: { departments } });
    } catch (error) {
      next(error);
    }
  }

  static async listSupervisors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { organizationId } = req.params;
      const supervisors = await ClinicalSupervisor.find({ organizationId, status: 'ACTIVE' })
        .populate('userId', 'firstName lastName email phone')
        .populate('departmentId', 'name code');
      res.status(200).json({ success: true, data: { supervisors } });
    } catch (error) {
      next(error);
    }
  }
}
